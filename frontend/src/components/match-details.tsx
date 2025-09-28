import { useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, MapPin, TrendingUp, Users, Trophy, Target, Clock } from "lucide-react"

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

type BetChoiceType = "Local" | "Empate" | "Visitante"
type BetSelection = { type: BetChoiceType; odds: number } | null

export function MatchDetails({ match }: MatchDetailsProps) {
  const [selectedBet, setSelectedBet] = useState<BetSelection>(null)
  const [betAmount, setBetAmount] = useState("")

  const getFormColor = (result: string) => {
    switch (result) {
      case "W":
        return "bg-[var(--primary)] text-[var(--primary-foreground)]"
      case "D":
        return "bg-yellow-500 text-yellow-50"
      case "L":
        return "bg-destructive text-destructive-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const handleBetSelect = (type: BetChoiceType, odds: number) => {
    setSelectedBet({ type, odds })
  }

  const amountNum = Number.parseFloat(betAmount || "0")
  const potentialWin =
    selectedBet && amountNum > 0
      ? (amountNum * selectedBet.odds).toFixed(2)
      : null

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back button */}
      <Link to="/">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a partidos
        </Button>
      </Link>

      {/* Main match card */}
      <Card className="border-2 border-[var(--border)] focus-within:ring-2 focus-within:ring-[var(--ring)] focus-within:border-[var(--primary)]">
        <CardHeader className="pb-4 text-center">
          <div className="mb-4 flex items-center justify-between">
            <Badge className="bg-[var(--primary)] text-[var(--primary-foreground)]">Liga Argentina</Badge>
            <div className="flex items-center text-[var(--muted-foreground)]">
              <TrendingUp className="mr-1 h-4 w-4" />
              <span className="font-semibold">{match.volume}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-8">
              <div className="text-center">
                <div className="mb-2 text-3xl font-bold text-[var(--foreground)]">{match.homeTeam}</div>
                <div className="text-sm text-[var(--muted-foreground)]">Local</div>
              </div>

              <div className="text-center">
                <div className="mb-2 text-2xl font-bold text-[var(--primary)]">VS</div>
                <div className="text-sm text-[var(--muted-foreground)]">
                  {match.date} • {match.time}
                </div>
              </div>

              <div className="text-center">
                <div className="mb-2 text-3xl font-bold text-[var(--foreground)]">{match.awayTeam}</div>
                <div className="text-sm text-[var(--muted-foreground)]">Visitante</div>
              </div>
            </div>

            <div className="flex items-center justify-center text-[var(--muted-foreground)]">
              <MapPin className="mr-2 h-4 w-4" />
              {match.stadium}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Betting options */}
          <div className="mb-6 grid grid-cols-3 gap-4">
            <Button
              size="lg"
              aria-pressed={selectedBet?.type === "Local"}
              variant={selectedBet?.type === "Local" ? "default" : "outline"}
              className="flex h-auto flex-col p-6 border-2 transition-all
    hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)]
    hover:!border-[var(--primary)] hover:!ring-2 hover:!ring-[var(--ring)]
    focus-visible:outline-none focus-visible:!ring-2 focus-visible:!ring-[var(--ring)] focus-visible:!border-[var(--primary)]
    active:!border-[var(--primary)]"
              onClick={() => handleBetSelect("Local", match.homeOdds)}
            >
              <Trophy className="mb-2 h-5 w-5" />
              <span className="mb-1 text-sm">Gana {match.homeTeam}</span>
              <span className="text-2xl font-bold">{match.homeOdds}</span>
            </Button>

            <Button
              size="lg"
              aria-pressed={selectedBet?.type === "Empate"}
              variant={selectedBet?.type === "Empate" ? "default" : "outline"}
              className="flex h-auto flex-col p-6 border-2 transition-all
    hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)]
    hover:!border-[var(--primary)] hover:!ring-2 hover:!ring-[var(--ring)]
    focus-visible:outline-none focus-visible:!ring-2 focus-visible:!ring-[var(--ring)] focus-visible:!border-[var(--primary)]
    active:!border-[var(--primary)]"
              onClick={() => handleBetSelect("Empate", match.drawOdds)}
            >
              <Users className="mb-2 h-5 w-5" />
              <span className="mb-1 text-sm">Empate</span>
              <span className="text-2xl font-bold">{match.drawOdds}</span>
            </Button>

            <Button
              size="lg"
              aria-pressed={selectedBet?.type === "Visitante"}
              variant={selectedBet?.type === "Visitante" ? "default" : "outline"}
              className="flex h-auto flex-col p-6 border-2 transition-all
    hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)]
    hover:!border-[var(--primary)] hover:!ring-2 hover:!ring-[var(--ring)]
    focus-visible:outline-none focus-visible:!ring-2 focus-visible:!ring-[var(--ring)] focus-visible:!border-[var(--primary)]
    active:!border-[var(--primary)]"
              onClick={() => handleBetSelect("Visitante", match.awayOdds)}
            >
              <Target className="mb-2 h-5 w-5" />
              <span className="mb-1 text-sm">Gana {match.awayTeam}</span>
              <span className="text-2xl font-bold">{match.awayOdds}</span>
            </Button>
          </div>

          {/* Bet slip */}
          {selectedBet && (
            <Card className="border-[var(--primary)]/30 bg-[var(--primary)]/10">
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-semibold">Apuesta seleccionada:</span>
                  <Badge className="bg-[var(--primary)] text-[var(--primary-foreground)]">
                    {selectedBet.type} ({selectedBet.odds})
                  </Badge>
                </div>
                <div className="flex gap-3">
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="Monto ($)"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    className="flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2"
                  />
                  <Button className="bg-[var(--primary)] hover:bg-[var(--primary)]/90">Apostar</Button>
                </div>
                {potentialWin && (
                  <div className="mt-2 text-sm text-[var(--muted-foreground)]">
                    Ganancia potencial: ${potentialWin}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Team stats */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Home team form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="mr-2 h-5 w-5 text-[var(--primary)]" />
              {match.homeTeam} - Forma Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex gap-2">
              {match.homeForm.map((result, index) => (
                <Badge
                  key={index}
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${getFormColor(result)}`}
                >
                  {result}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              Últimos 5 partidos (más reciente a la izquierda)
            </p>
          </CardContent>
        </Card>

        {/* Away team form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2 h-5 w-5 text-[var(--primary)]" />
              {match.awayTeam} - Forma Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex gap-2">
              {match.awayForm.map((result, index) => (
                <Badge
                  key={index}
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${getFormColor(result)}`}
                >
                  {result}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">
              Últimos 5 partidos (más reciente a la izquierda)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Head to head */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5 text-[var(--primary)]" />
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
            <Clock className="mr-2 h-5 w-5 text-[var(--primary)]" />
            Información del Partido
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-[color-mix(in_oklch,var(--muted)_/_50%,transparent)] p-4 text-center">
              <Calendar className="mx-auto mb-2 h-6 w-6 text-[var(--primary)]" />
              <div className="font-semibold">Fecha</div>
              <div className="text-sm text-[var(--muted-foreground)]">{match.date}</div>
            </div>
            <div className="rounded-lg bg-[color-mix(in_oklch,var(--muted)_/_50%,transparent)] p-4 text-center">
              <Clock className="mx-auto mb-2 h-6 w-6 text-[var(--primary)]" />
              <div className="font-semibold">Hora</div>
              <div className="text-sm text-[var(--muted-foreground)]">{match.time}</div>
            </div>
            <div className="rounded-lg bg-[color-mix(in_oklch,var(--muted)_/_50%,transparent)] p-4 text-center">
              <MapPin className="mx-auto mb-2 h-6 w-6 text-[var(--primary)]" />
              <div className="font-semibold">Estadio</div>
              <div className="text-sm text-[var(--muted-foreground)]">{match.stadium}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}