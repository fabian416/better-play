// src/components/match-details.tsx
"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { logoFor, abbrFor } from "@/lib/team-logos"

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

export function MatchDetails({ match }: MatchDetailsProps) {
  const [selectedBet, setSelectedBet] = useState<BetSelection | null>(null)
  const [betAmount, setBetAmount] = useState("")

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

  const handleBetSelect = (type: BetSelection["type"], odds: number) =>
    setSelectedBet({ type, odds })

  const potential =
    selectedBet && betAmount
      ? (parseFloat(betAmount || "0") * selectedBet.odds).toFixed(2)
      : null

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
                  <Button className="bg-primary hover:bg-primary/90 sm:w-auto w-full">Apostar</Button>
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