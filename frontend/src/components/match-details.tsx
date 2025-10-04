// src/components/match-details.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "~~/components/ui/card"
import { Button } from "~~/components/ui/button"
import { Badge } from "~~/components/ui/badge"
import {
  ArrowLeft,
  Calendar,
  MapPin,
  TrendingUp,
  Users,
  Trophy,
  Target,
  Clock,
} from "lucide-react"
import { logoFor, abbrFor } from "~~/lib/team-logos"
import { useAccount, useReadContract, useWriteContract } from "wagmi"
import { parseUnits } from "viem"
import { BETTER_PLAY_ABI } from "~~/contracts/betterplay-abi"
import { ERC20_ABI } from "~~/contracts/erc20-abi"
import { BETTER_PLAY_ADDRESS, USDC_ADDRESS } from "~~/lib/constants"

interface Match {
  id: string
  homeTeam: string
  awayTeam: string
  date: string
  time: string
  stadium: string
  homeOdds: number
  drawOdds: number
  awayOdds: number
  volume: string
  homeForm: string[]
  awayForm: string[]
  headToHead: string
}

interface MatchDetailsProps {
  match: Match
}

type BetSelection = {
  type: "Local" | "Empate" | "Visitante"
  odds: number
}

const OUTCOME_INDEX: Record<BetSelection["type"], number> = {
  Local: 0,
  Empate: 1,
  Visitante: 2,
}

export function MatchDetails({ match }: MatchDetailsProps) {
  const { address } = useAccount()
  const location = useLocation()

  const [selectedBet, setSelectedBet] = useState<BetSelection | null>(null)
  const [betAmount, setBetAmount] = useState("")
  const [needsApproval, setNeedsApproval] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const marketId = useMemo(() => {
    const idNum = Number(match.id)
    return Number.isFinite(idNum) ? BigInt(idNum) : 0n
  }, [match.id])

  // Preselect outcome from URL if provided
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const o = params.get("outcome")
    if (o === "home") setSelectedBet({ type: "Local", odds: match.homeOdds })
    if (o === "draw") setSelectedBet({ type: "Empate", odds: match.drawOdds })
    if (o === "away") setSelectedBet({ type: "Visitante", odds: match.awayOdds })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const outcomeIndex = selectedBet ? OUTCOME_INDEX[selectedBet.type] : undefined

  // Read pools for info (optional display or future use)
  const { data: pools } = useReadContract({
    address: BETTER_PLAY_ADDRESS as `0x${string}`,
    abi: BETTER_PLAY_ABI,
    functionName: "pools",
    args: marketId ? [marketId] : undefined,
    query: { enabled: marketId !== 0n },
  }) as { data: readonly [bigint, bigint, bigint] | undefined }

  // Preview payout per 1e18
  const { data: per1e18 } = useReadContract({
    address: BETTER_PLAY_ADDRESS as `0x${string}`,
    abi: BETTER_PLAY_ABI,
    functionName: "previewPayoutPer1",
    args: marketId !== 0n && outcomeIndex !== undefined ? [marketId, outcomeIndex] : undefined,
    query: { enabled: marketId !== 0n && outcomeIndex !== undefined },
  }) as { data: bigint | undefined }

  // Read USDC decimals, allowance, and balance for user
  const { data: usdcDecimals } = useReadContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "decimals",
  }) as { data: number | undefined }

  const { data: allowance } = useReadContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address as `0x${string}`, BETTER_PLAY_ADDRESS as `0x${string}`] : undefined,
    query: { enabled: Boolean(address) },
  }) as { data: bigint | undefined }

  const { data: balance } = useReadContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: Boolean(address) },
  }) as { data: bigint | undefined }

  const { writeContractAsync } = useWriteContract()

  useEffect(() => {
    if (!betAmount || !usdcDecimals || allowance == null) {
      setNeedsApproval(false)
      return
    }
    try {
      const amt = parseUnits(betAmount || "0", usdcDecimals)
      setNeedsApproval(allowance < amt)
    } catch {
      setNeedsApproval(true)
    }
  }, [betAmount, usdcDecimals, allowance])

  const getFormColor = (result: string) => {
    switch (result) {
      case "W":
        return "bg-primary text-primary-foreground"
      case "D":
        return "bg-yellow-500 text-yellow-50"
      case "L":
        return "bg-destructive text-destructive-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const handleBetSelect = (type: BetSelection["type"], odds: number) => setSelectedBet({ type, odds })

  const potential = useMemo(() => {
    if (!selectedBet || !betAmount) return null
    if (!per1e18) return (parseFloat(betAmount || "0") * selectedBet.odds).toFixed(2)
    const multiplier = Number(per1e18) / 1e18
    const val = parseFloat(betAmount || "0") * multiplier
    return val.toFixed(2)
  }, [selectedBet, betAmount, per1e18])

  const onPlaceBet = async () => {
    if (!address) return
    if (!selectedBet || outcomeIndex === undefined) return
    if (!usdcDecimals) return
    const amt = parseUnits(betAmount || "0", usdcDecimals)
    if (amt === 0n) return

    setSubmitting(true)
    try {
      // Ensure approval
      if (allowance == null || allowance < amt) {
        await writeContractAsync({
          address: USDC_ADDRESS as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [BETTER_PLAY_ADDRESS as `0x${string}`, amt],
        })
      }
      // Place bet
      await writeContractAsync({
        address: BETTER_PLAY_ADDRESS as `0x${string}`,
        abi: BETTER_PLAY_ABI,
        functionName: "bet",
        args: [marketId, outcomeIndex, amt],
      })
      setBetAmount("")
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const isSelected = (type: BetSelection["type"]) => selectedBet?.type === type

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-3 sm:px-4">
      {/* Back button */}
      <Link to="/">
        <Button variant="ghost" className="mb-4 cursor-pointer">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a partidos
        </Button>
      </Link>

      {/* Main match card */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="pb-4 text-center">
          <div className="mb-3 flex items-center justify-between sm:mb-4">
            <Badge className="bg-primary text-primary-foreground">Liga Argentina</Badge>
            <div className="flex items-center text-muted-foreground">
              <TrendingUp className="mr-1 h-4 w-4" />
              <span className="font-semibold">{match.volume}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-8">
              <div className="text-center">
                <div className="mb-1 sm:mb-2 flex items-center justify-center gap-2">
                  <img
                    src={logoFor(match.homeTeam)}
                    alt={match.homeTeam}
                    title={match.homeTeam}
                    className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                  />
                  <span className="text-2xl sm:text-3xl font-bold text-foreground">{match.homeTeam}</span>
                </div>
                <div className="text-sm text-muted-foreground">Local</div>
              </div>

              <div className="text-center">
                <div className="mb-1 text-xl font-bold text-primary sm:mb-2 sm:text-2xl">VS</div>
                <div className="text-sm text-muted-foreground">
                  {match.date} • {match.time}
                </div>
              </div>

              <div className="text-center">
                <div className="mb-1 sm:mb-2 flex items-center justify-center gap-2">
                  <img
                    src={logoFor(match.awayTeam)}
                    alt={match.awayTeam}
                    title={match.awayTeam}
                    className="h-8 w-8 sm:h-10 sm:w-10 object-contain"
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                  />
                  <span className="text-2xl sm:text-3xl font-bold text-foreground">{match.awayTeam}</span>
                </div>
                <div className="text-sm text-muted-foreground">Visitante</div>
              </div>
            </div>

            <div className="flex items-center justify-center text-muted-foreground">
              <MapPin className="mr-2 h-4 w-4" />
              {match.stadium}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Betting options */}
          <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-4">
            <Button
              size="lg"
              variant={isSelected("Local") ? "default" : "outline"}
              className={`cursor-pointer flex h-auto flex-col p-4 sm:p-6 transition-all ${
                isSelected("Local")
                  ? ""
                  : "bg-transparent hover:bg-primary hover:text-primary-foreground"
              } border-2 hover:border-primary focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-[var(--ring)]`}
              onClick={() => handleBetSelect("Local", match.homeOdds)}
            >
              <Trophy className="mb-2 h-5 w-5 sm:h-6 sm:w-6" />
              <span className="mb-1 text-xs sm:text-sm">Gana {abbrFor(match.homeTeam)}</span>
              <span className="text-xl font-bold sm:text-2xl">{match.homeOdds}</span>
            </Button>

            <Button
              size="lg"
              variant={isSelected("Empate") ? "default" : "outline"}
              className={`cursor-pointer flex h-auto flex-col p-4 sm:p-6 transition-all ${
                isSelected("Empate")
                  ? ""
                  : "bg-transparent hover:bg-primary hover:text-primary-foreground"
              } border-2 hover:border-primary focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-[var(--ring)]`}
              onClick={() => handleBetSelect("Empate", match.drawOdds)}
            >
              <Users className="mb-2 h-5 w-5 sm:h-6 sm:w-6" />
              <span className="mb-1 text-xs sm:text-sm">Empate</span>
              <span className="text-xl font-bold sm:text-2xl">{match.drawOdds}</span>
            </Button>

            <Button
              size="lg"
              variant={isSelected("Visitante") ? "default" : "outline"}
              className={`cursor-pointer flex h-auto flex-col p-4 sm:p-6 transition-all ${
                isSelected("Visitante")
                  ? ""
                  : "bg-transparent hover:bg-primary hover:text-primary-foreground"
              } border-2 hover:border-primary focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-[var(--ring)]`}
              onClick={() => handleBetSelect("Visitante", match.awayOdds)}
            >
              <Target className="mb-2 h-5 w-5 sm:h-6 sm:w-6" />
              <span className="mb-1 text-xs sm:text-sm">Gana {abbrFor(match.awayTeam)}</span>
              <span className="text-xl font-bold sm:text-2xl">{match.awayOdds}</span>
            </Button>
          </div>

          {/* Bet slip */}
          {selectedBet && (
            <Card className="border-primary/30 bg-primary/10">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-semibold">Apuesta seleccionada:</span>
                  <Badge className="bg-primary text-primary-foreground">
                    {selectedBet.type} ({selectedBet.odds})
                  </Badge>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="number"
                    placeholder="Monto ($)"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    className="flex-1 rounded-md border border-border bg-background px-3 py-2"
                  />
                  <Button onClick={onPlaceBet} disabled={submitting || !address || !betAmount} className="bg-primary hover:bg-primary/90 sm:w-auto w-full">
                    {needsApproval ? (submitting ? "Aprobando..." : "Aprobar y Apostar") : (submitting ? "Apostando..." : "Apostar")}
                  </Button>
                </div>

                {potential && (
                  <div className="mt-2 text-sm text-muted-foreground" aria-live="polite">
                    Ganancia potencial: ${potential}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Team stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="mr-2 h-5 w-5 text-primary" />
              {match.homeTeam} - Forma Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex gap-2">
              {match.homeForm.map((result, index) => (
                <Badge
                  key={index}
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${getFormColor(
                    result,
                  )}`}
                >
                  {result}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Últimos 5 partidos (más reciente a la izquierda)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2 h-5 w-5 text-primary" />
              {match.awayTeam} - Forma Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex gap-2">
              {match.awayForm.map((result, index) => (
                <Badge
                  key={index}
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${getFormColor(
                    result,
                  )}`}
                >
                  {result}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Últimos 5 partidos (más reciente a la izquierda)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Head to head */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5 text-primary" />
            Historial Directo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">{match.headToHead}</p>
        </CardContent>
      </Card>

      {/* Match info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5 text-primary" />
            Información del Partido
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-muted/50 p-3 text-center sm:p-4">
              <Calendar className="mx-auto mb-2 h-6 w-6 text-primary" />
              <div className="font-semibold">Fecha</div>
              <div className="text-sm text-muted-foreground">{match.date}</div>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center sm:p-4">
              <Clock className="mx-auto mb-2 h-6 w-6 text-primary" />
              <div className="font-semibold">Hora</div>
              <div className="text-sm text-muted-foreground">{match.time}</div>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center sm:p-4">
              <MapPin className="mx-auto mb-2 h-6 w-6 text-primary" />
              <div className="font-semibold">Estadio</div>
              <div className="text-sm text-muted-foreground">{match.stadium}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}