"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, TrendingUp } from "lucide-react"
import Link from "next/link"

// Mock data - in a real app this would come from an API
const matches = [
  {
    id: "1",
    homeTeam: "Boca Juniors",
    awayTeam: "River Plate",
    date: "2025-09-30",
    time: "20:00",
    stadium: "La Bombonera",
    homeOdds: 2.1,
    drawOdds: 3.2,
    awayOdds: 3.8,
    volume: "$2.1M",
    isLive: false,
    featured: true,
  },
  {
    id: "2",
    homeTeam: "Racing",
    awayTeam: "Independiente",
    date: "2025-10-01",
    time: "18:00",
    stadium: "El Cilindro",
    homeOdds: 1.8,
    drawOdds: 3.4,
    awayOdds: 4.2,
    volume: "$890K",
    isLive: false,
    featured: false,
  },
  {
    id: "3",
    homeTeam: "San Lorenzo",
    awayTeam: "Huracán",
    date: "2025-10-02",
    time: "16:00",
    stadium: "Nuevo Gasómetro",
    homeOdds: 2.5,
    drawOdds: 3.1,
    awayOdds: 2.9,
    volume: "$650K",
    isLive: false,
    featured: false,
  },
  {
    id: "4",
    homeTeam: "Estudiantes",
    awayTeam: "Gimnasia",
    date: "2025-10-03",
    time: "19:00",
    stadium: "Estadio UNO",
    homeOdds: 2.2,
    drawOdds: 3.0,
    awayOdds: 3.5,
    volume: "$420K",
    isLive: false,
    featured: false,
  },
  {
    id: "5",
    homeTeam: "Vélez",
    awayTeam: "Talleres",
    date: "2025-10-04",
    time: "21:00",
    stadium: "José Amalfitani",
    homeOdds: 1.9,
    drawOdds: 3.3,
    awayOdds: 4.1,
    volume: "$780K",
    isLive: false,
    featured: false,
  },
  {
    id: "6",
    homeTeam: "Lanús",
    awayTeam: "Banfield",
    date: "2025-10-05",
    time: "17:00",
    stadium: "La Fortaleza",
    homeOdds: 2.3,
    drawOdds: 3.1,
    awayOdds: 3.2,
    volume: "$310K",
    isLive: false,
    featured: false,
  },
]

export function MatchesGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {matches.map((match) => (
        <Link key={match.id} href={`/match/${match.id}`}>
          <Card
            className={`hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 hover:scale-[1.02] hover:-translate-y-1 ${
              match.featured ? "border-primary/30 bg-primary/5" : "border-border"
            }`}
          >
            <CardContent className="p-6">
              {/* Header with badges */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-2">
                  {match.featured && <Badge className="bg-primary text-primary-foreground">Destacado</Badge>}
                  {match.isLive && (
                    <Badge variant="destructive" className="animate-pulse">
                      EN VIVO
                    </Badge>
                  )}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  {match.volume}
                </div>
              </div>

              {/* Teams */}
              <div className="text-center mb-4">
                <div className="text-lg font-bold text-foreground mb-1">{match.homeTeam}</div>
                <div className="text-sm text-muted-foreground mb-1">vs</div>
                <div className="text-lg font-bold text-foreground">{match.awayTeam}</div>
              </div>

              {/* Match info */}
              <div className="space-y-2 mb-4 text-sm text-muted-foreground">
                <div className="flex items-center justify-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  {match.date} - {match.time}
                </div>
                <div className="flex items-center justify-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  {match.stadium}
                </div>
              </div>

              {/* Betting options */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  className="flex flex-col p-3 h-auto hover:bg-primary hover:text-primary-foreground transition-colors bg-transparent"
                >
                  <span className="text-xs mb-1">Local</span>
                  <span className="font-bold">{match.homeOdds}</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col p-3 h-auto hover:bg-primary hover:text-primary-foreground transition-colors bg-transparent"
                >
                  <span className="text-xs mb-1">Empate</span>
                  <span className="font-bold">{match.drawOdds}</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col p-3 h-auto hover:bg-primary hover:text-primary-foreground transition-colors bg-transparent"
                >
                  <span className="text-xs mb-1">Visitante</span>
                  <span className="font-bold">{match.awayOdds}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
