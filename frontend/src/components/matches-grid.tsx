// src/components/matches-grid.tsx
"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, TrendingUp } from "lucide-react"
import { Link } from "react-router-dom"

// Mock data - en un real vendrá de una API
const matches = [
  { id: "1", homeTeam: "Boca Juniors", awayTeam: "River Plate", date: "2025-09-30", time: "20:00", stadium: "La Bombonera", homeOdds: 2.1, drawOdds: 3.2, awayOdds: 3.8, volume: "$2.1M", isLive: false, featured: true },
  { id: "2", homeTeam: "Racing", awayTeam: "Independiente", date: "2025-10-01", time: "18:00", stadium: "El Cilindro", homeOdds: 1.8, drawOdds: 3.4, awayOdds: 4.2, volume: "$890K", isLive: false, featured: false },
  { id: "3", homeTeam: "San Lorenzo", awayTeam: "Huracán", date: "2025-10-02", time: "16:00", stadium: "Nuevo Gasómetro", homeOdds: 2.5, drawOdds: 3.1, awayOdds: 2.9, volume: "$650K", isLive: false, featured: false },
  { id: "4", homeTeam: "Estudiantes", awayTeam: "Gimnasia", date: "2025-10-03", time: "19:00", stadium: "Estadio UNO", homeOdds: 2.2, drawOdds: 3.0, awayOdds: 3.5, volume: "$420K", isLive: false, featured: false },
  { id: "5", homeTeam: "Vélez", awayTeam: "Talleres", date: "2025-10-04", time: "21:00", stadium: "José Amalfitani", homeOdds: 1.9, drawOdds: 3.3, awayOdds: 4.1, volume: "$780K", isLive: false, featured: false },
  { id: "6", homeTeam: "Lanús", awayTeam: "Banfield", date: "2025-10-05", time: "17:00", stadium: "La Fortaleza", homeOdds: 2.3, drawOdds: 3.1, awayOdds: 3.2, volume: "$310K", isLive: false, featured: false },
]

export function MatchesGrid() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {matches.map((match) => (
        <Link
          key={match.id}
          to={`/match/${match.id}`}
          className="group block focus:outline-none"
        >
          <Card
            className={`cursor-pointer border-2 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:border-primary/50 hover:shadow-xl
            ${match.featured ? "border-primary/30 bg-primary/5" : "border-border"}`}
          >
            <CardContent className="p-6">
              {/* Header with badges */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex gap-2">
                  {match.featured && (
                    <Badge className="bg-primary text-primary-foreground">Destacado</Badge>
                  )}
                  {match.isLive && (
                    <Badge variant="destructive" className="animate-pulse">EN VIVO</Badge>
                  )}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <TrendingUp className="mr-1 h-4 w-4" />
                  {match.volume}
                </div>
              </div>

              {/* Teams */}
              <div className="mb-4 text-center">
                <div className="mb-1 text-lg font-bold text-foreground">{match.homeTeam}</div>
                <div className="mb-1 text-sm text-muted-foreground">vs</div>
                <div className="text-lg font-bold text-foreground">{match.awayTeam}</div>
              </div>

              {/* Match info */}
              <div className="mb-4 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-center">
                  <Calendar className="mr-2 h-4 w-4" />
                  {match.date} - {match.time}
                </div>
                <div className="flex items-center justify-center">
                  <MapPin className="mr-2 h-4 w-4" />
                  {match.stadium}
                </div>
              </div>

              {/* Betting options */}
              <div
                className="grid grid-cols-3 gap-2"
                onClick={(e) => e.stopPropagation()} // evita que el click abra el link del Card
              >
                <Button
                  asChild
                  variant="outline"
                  className="flex h-auto flex-col bg-transparent p-3 transition-colors
                             hover:bg-primary hover:text-primary-foreground"
                >
                  <Link to={`/match/${match.id}?outcome=home`}>
                    <span className="mb-1 text-xs">Local</span>
                    <span className="font-bold">{match.homeOdds}</span>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="flex h-auto flex-col bg-transparent p-3 transition-colors
                             hover:bg-primary hover:text-primary-foreground"
                >
                  <Link to={`/match/${match.id}?outcome=draw`}>
                    <span className="mb-1 text-xs">Empate</span>
                    <span className="font-bold">{match.drawOdds}</span>
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="flex h-auto flex-col bg-transparent p-3 transition-colors
                             hover:bg-primary hover:text-primary-foreground"
                >
                  <Link to={`/match/${match.id}?outcome=away`}>
                    <span className="mb-1 text-xs">Visitante</span>
                    <span className="font-bold">{match.awayOdds}</span>
                  </Link>
                </Button>
              </div>

              {/* Secondary link */}
              <div
                className="mt-3 text-center text-xs text-muted-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <Link to={`/match/${match.id}`} className="underline hover:text-foreground/80">
                  Ver detalles del mercado
                </Link>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}