"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, TrendingUp } from "lucide-react"
import { Link } from "react-router-dom"
import { logoFor, abbrFor } from "@/lib/team-logos"
import { matches, type Match } from "@/data/matches"

// Forzar algunas abreviaturas específicas (cuando abbrFor no coincide con lo que queremos mostrar)
const ABBR_OVERRIDE: Record<string, string> = {
  Tigre: "CAT",
}

// -------- helpers --------
function impliedFromOdds(home: number, draw: number, away: number): { home: number; draw: number; away: number } {
  const invH = 1 / home
  const invD = 1 / draw
  const invA = 1 / away
  const sum = invH + invD + invA
  return {
    home: Math.round((invH / sum) * 100),
    draw: Math.round((invD / sum) * 100),
    away: Math.round((invA / sum) * 100),
  }
}


// -------- component --------
export function MatchesGrid() {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-3 sm:px-4 lg:px-6">
      <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {matches.map((match: Match) => {
          const probs = impliedFromOdds(match.homeOdds, match.drawOdds, match.awayOdds)
          const homeAbbr = (ABBR_OVERRIDE[match.homeTeam] ?? abbrFor(match.homeTeam)) || "HOME"
          const awayAbbr = (ABBR_OVERRIDE[match.awayTeam] ?? abbrFor(match.awayTeam)) || "AWAY"

          return (
            <Link key={match.id} to={`/match/${match.id}`} className="block h-full">
              <Card
                className={`
                  group flex h-full flex-col cursor-pointer rounded-2xl transition-all duration-300
                  border border-[var(--border)] sm:border-2
                  hover:-translate-y-[2px] hover:scale-[1.01]
                  hover:border-[var(--primary)] hover:shadow-xl
                  focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--ring)]
                  ${match.featured ? "border-[var(--primary)]/30 bg-[var(--primary)]/5" : ""}
                `}
              >
                <CardContent className="flex flex-1 flex-col p-3 sm:p-3 lg:p-4">
                  {/* Badges + volumen */}
                  <div className="mb-2.5 sm:mb-3.5 flex items-start justify-between">
                    <div className="flex gap-2">
                      {match.featured && (
                        <Badge className="bg-primary text-primary-foreground text-[10px] sm:text-xs">
                          Destacado
                        </Badge>
                      )}
                      {match.isLive && (
                        <Badge variant="destructive" className="animate-pulse text-[10px] sm:text-xs">
                          EN VIVO
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center text-[11px] sm:text-sm text-muted-foreground">
                      <TrendingUp className="mr-1 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      {match.volume}
                    </div>
                  </div>

                  {/* Línea 1: HOME */}
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <img
                        src={logoFor(match.homeTeam) || "/placeholder.svg"}
                        alt={match.homeTeam}
                        className="h-5 w-5 sm:h-6 sm:w-6 object-contain"
                        loading="lazy"
                      />
                      <span className="truncate text-[14px] sm:text-[15px] font-semibold text-foreground" title={match.homeTeam}>
                        {match.homeTeam}
                      </span>
                    </div>
                    <span className="shrink-0 text-[14px] sm:text-[16px] font-semibold tabular-nums">
                      {probs.home}%
                    </span>
                  </div>

                  {/* Línea 2: AWAY */}
                  <div className="mb-2.5 sm:mb-3 flex items-center justify-between">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <img
                        src={logoFor(match.awayTeam) || "/placeholder.svg"}
                        alt={match.awayTeam}
                        className="h-5 w-5 sm:h-6 sm:w-6 object-contain"
                        loading="lazy"
                      />
                      <span className="truncate text-[14px] sm:text-[15px] font-semibold text-foreground" title={match.awayTeam}>
                        {match.awayTeam}
                      </span>
                    </div>
                    <span className="shrink-0 text-[14px] sm:text-[16px] font-semibold tabular-nums">
                      {probs.away}%
                    </span>
                  </div>

                  {/* Meta info compacta */}
                  <div className="mb-2.5 sm:mb-3 space-y-1 text-[10.5px] sm:text-[11.5px] text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      {match.date} — {match.time}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      {match.stadium}
                    </div>
                  </div>

                  {/* Botonera: home y away anchos, draw angosto al medio */}
                  <div className="mt-auto grid grid-cols-5 gap-1.5 sm:gap-1.5">
                    <Button
                      asChild
                      variant="outline"
                      className="
                        col-span-2 h-9 sm:h-10 rounded-lg bg-transparent
                        border border-[var(--border)] sm:border
                        px-3 text-[11.5px] sm:text-[12.5px] font-semibold
                        hover:[background-color:color-mix(in_oklab,var(--primary)_45%,transparent)]
                        hover:text-[var(--primary-foreground)] hover:!border-[var(--primary)]
                        hover:!ring-1 hover:!ring-[var(--primary)]/40
                        focus-visible:!ring-2 focus-visible:!ring-[var(--ring)] focus-visible:!border-[var(--primary)]
                      "
                    >
                      <Link to={`/match/${match.id}?outcome=home`} className="flex w-full items-center justify-center">
                        <span className="tracking-wide">{homeAbbr}</span>
                      </Link>
                    </Button>

                    <Button
                      asChild
                      variant="outline"
                      className="
                        col-span-1 h-9 sm:h-10 rounded-lg bg-transparent
                        border border-[var(--border)] sm:border
                        px-2 text-[11.5px] sm:text-[12.5px] font-medium
                        hover:[background-color:color-mix(in_oklab,var(--primary)_30%,transparent)]
                        hover:!border-[var(--primary)]
                        focus-visible:!ring-2 focus-visible:!ring-[var(--ring)] focus-visible:!border-[var(--primary)]
                      "
                    >
                      <Link to={`/match/${match.id}?outcome=draw`} className="flex w-full items-center justify-center">
                        <span>DRAW</span>
                      </Link>
                    </Button>

                    <Button
                      asChild
                      variant="outline"
                      className="
                        col-span-2 h-9 sm:h-10 rounded-lg bg-transparent
                        border border-[var(--border)] sm:border
                        px-3 text-[11.5px] sm:text-[12.5px] font-semibold
                        hover:[background-color:color-mix(in_oklab,var(--primary)_45%,transparent)]
                        hover:text-[var(--primary-foreground)] hover:!border-[var(--primary)]
                        hover:!ring-1 hover:!ring-[var(--primary)]/40
                        focus-visible:!ring-2 focus-visible:!ring-[var(--ring)] focus-visible:!border-[var(--primary)]
                      "
                    >
                      <Link to={`/match/${match.id}?outcome=away`} className="flex w-full items-center justify-center">
                        <span className="tracking-wide">{awayAbbr}</span>
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}