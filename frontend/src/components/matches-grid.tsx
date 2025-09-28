"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, TrendingUp } from "lucide-react"
import { Link } from "react-router-dom"
import { logoFor } from "@/lib/team-logos"

// Mock data - in a real app this would come from an API
const matches = [
  // LUNES 29 SEP 2025
  {
    id: "1",
    homeTeam: "Barracas Central",
    awayTeam: "Belgrano",
    date: "2025-09-29",
    time: "15:30",
    stadium: "Claudio Tapia",
    homeOdds: 2.4,
    drawOdds: 3.1,
    awayOdds: 2.9,
    volume: "$95K",
    isLive: false,
    featured: false,
  },
  {
    id: "2",
    homeTeam: "Vélez Sarsfield",
    awayTeam: "Atlético Tucumán",
    date: "2025-09-29",
    time: "20:00",
    stadium: "José Amalfitani",
    homeOdds: 2.1,
    drawOdds: 3.2,
    awayOdds: 3.6,
    volume: "$120K",
    isLive: false,
    featured: false,
  },

  // MARTES 30 SEP 2025
  {
    id: "3",
    homeTeam: "Newell's Old Boys",
    awayTeam: "Estudiantes de La Plata",
    date: "2025-09-30",
    time: "19:00",
    stadium: "Coloso Marcelo Bielsa",
    homeOdds: 2.3,
    drawOdds: 3.0,
    awayOdds: 3.2,
    volume: "$140K",
    isLive: false,
    featured: false,
  },

  // VIERNES 3 OCT 2025
  {
    id: "4",
    homeTeam: "Tigre",
    awayTeam: "Defensa y Justicia",
    date: "2025-10-03",
    time: "19:00",
    stadium: "José Dellagiovanna",
    homeOdds: 2.8,
    drawOdds: 3.0,
    awayOdds: 2.6,
    volume: "$80K",
    isLive: false,
    featured: false,
  },
  {
    id: "5",
    homeTeam: "Argentinos Juniors",
    awayTeam: "Central Córdoba",
    date: "2025-10-03",
    time: "21:15",
    stadium: "Diego A. Maradona",
    homeOdds: 2.0,
    drawOdds: 3.2,
    awayOdds: 3.9,
    volume: "$90K",
    isLive: false,
    featured: false,
  },
  {
    id: "6",
    homeTeam: "Unión",
    awayTeam: "Aldosivi",
    date: "2025-10-03",
    time: "21:15",
    stadium: "15 de Abril",
    homeOdds: 2.2,
    drawOdds: 3.1,
    awayOdds: 3.4,
    volume: "$70K",
    isLive: false,
    featured: false,
  },

  // SÁBADO 4 OCT 2025
  {
    id: "7",
    homeTeam: "Sarmiento",
    awayTeam: "Gimnasia LP",
    date: "2025-10-04",
    time: "14:30",
    stadium: "Eva Perón",
    homeOdds: 2.7,
    drawOdds: 3.0,
    awayOdds: 2.7,
    volume: "$65K",
    isLive: false,
    featured: false,
  },
  {
    id: "8",
    homeTeam: "San Martín San Juan",
    awayTeam: "Instituto",
    date: "2025-10-04",
    time: "16:45",
    stadium: "Hilario Sánchez",
    homeOdds: 2.5,
    drawOdds: 3.0,
    awayOdds: 2.9,
    volume: "$60K",
    isLive: false,
    featured: false,
  },
  {
    id: "9",
    homeTeam: "Atlético Tucumán",
    awayTeam: "Platense",
    date: "2025-10-04",
    time: "19:00",
    stadium: "Monumental José Fierro",
    homeOdds: 2.1,
    drawOdds: 3.1,
    awayOdds: 3.7,
    volume: "$82K",
    isLive: false,
    featured: false,
  },
  {
    id: "10",
    homeTeam: "Huracán",
    awayTeam: "Banfield",
    date: "2025-10-04",
    time: "19:00",
    stadium: "Tomás A. Ducó",
    homeOdds: 2.3,
    drawOdds: 3.0,
    awayOdds: 3.3,
    volume: "$88K",
    isLive: false,
    featured: false,
  },
  {
    id: "11",
    homeTeam: "Lanús",
    awayTeam: "San Lorenzo",
    date: "2025-10-04",
    time: "21:15",
    stadium: "La Fortaleza",
    homeOdds: 2.6,
    drawOdds: 3.0,
    awayOdds: 2.8,
    volume: "$110K",
    isLive: false,
    featured: true,
  },

  // DOMINGO 5 OCT 2025
  {
    id: "12",
    homeTeam: "Godoy Cruz",
    awayTeam: "Independiente",
    date: "2025-10-05",
    time: "14:30",
    stadium: "Malvinas Argentinas",
    homeOdds: 2.4,
    drawOdds: 3.0,
    awayOdds: 3.0,
    volume: "$100K",
    isLive: false,
    featured: false,
  },
  {
    id: "13",
    homeTeam: "Estudiantes de La Plata",
    awayTeam: "Barracas Central",
    date: "2025-10-05",
    time: "16:30",
    stadium: "UNO Jorge Luis Hirschi",
    homeOdds: 1.9,
    drawOdds: 3.2,
    awayOdds: 4.2,
    volume: "$130K",
    isLive: false,
    featured: false,
  },
  {
    id: "14",
    homeTeam: "Talleres",
    awayTeam: "Belgrano",
    date: "2025-10-05",
    time: "16:45",
    stadium: "Mario A. Kempes",
    homeOdds: 2.2,
    drawOdds: 3.1,
    awayOdds: 3.3,
    volume: "$125K",
    isLive: false,
    featured: false,
  },
  {
    id: "15",
    homeTeam: "Boca Juniors",
    awayTeam: "Newell's Old Boys",
    date: "2025-10-05",
    time: "19:00",
    stadium: "La Bombonera",
    homeOdds: 2.0,
    drawOdds: 3.2,
    awayOdds: 3.9,
    volume: "$210K",
    isLive: false,
    featured: true,
  },
  {
    id: "16",
    homeTeam: "Rosario Central",
    awayTeam: "River Plate",
    date: "2025-10-05",
    time: "21:15",
    stadium: "Gigante de Arroyito",
    homeOdds: 3.6,
    drawOdds: 3.2,
    awayOdds: 2.1,
    volume: "$240K",
    isLive: false,
    featured: true,
  },
]

export function MatchesGrid() {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-3 sm:px-4 lg:px-6">
      <div
        className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {matches.map((match) => (
          <Link key={match.id} to={`/match/${match.id}`} className="block h-full">
            <Card
              className={`
                group flex min-h-[340px] h-full flex-col cursor-pointer transition-all duration-300
                border border-[var(--border)] sm:border-2
                hover:-translate-y-[2px] hover:scale-[1.01]
                hover:border-[var(--primary)] hover:shadow-xl
                focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--ring)]
                ${match.featured ? "border-[var(--primary)]/30 bg-[var(--primary)]/5" : ""}
              `}
            >
              {/* Hacemos el contenido una columna que rellena toda la altura */}
              <CardContent className="flex flex-1 flex-col p-3 sm:p-4 lg:p-6">
                {/* Header (reservamos altura) */}
                <div className="mb-3 sm:mb-4 flex items-start justify-between min-h-[26px] sm:min-h-[28px]">
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

                {/* Teams + logos (reservamos altura y evitamos saltos) */}
                <div className="mb-3 sm:mb-4 min-h-[32px] sm:min-h-[36px]">
                  <div className="flex items-center justify-center gap-2.5 sm:gap-3.5">
                    <img
                      src={logoFor(match.homeTeam) || "/placeholder.svg"}
                      alt={match.homeTeam}
                      className="h-6 w-6 sm:h-7 sm:w-7 object-contain"
                      loading="lazy"
                    />
                    <div
                      className="max-w-[40%] sm:max-w-[42%] text-[15px] sm:text-base font-semibold text-foreground truncate"
                      title={match.homeTeam}
                    >
                      {match.homeTeam}
                    </div>

                    <div className="mx-1.5 text-[12px] sm:text-sm text-muted-foreground">vs</div>

                    <div
                      className="max-w-[40%] sm:max-w-[42%] text-[15px] sm:text-base font-semibold text-foreground truncate"
                      title={match.awayTeam}
                    >
                      {match.awayTeam}
                    </div>
                    <img
                      src={logoFor(match.awayTeam) || "/placeholder.svg"}
                      alt={match.awayTeam}
                      className="h-6 w-6 sm:h-7 sm:w-7 object-contain"
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* Match info (reservamos altura) */}
                <div className="mb-3 sm:mb-4 space-y-1.5 sm:space-y-2 text-[12px] sm:text-sm text-muted-foreground min-h-[44px] sm:min-h-[50px]">
                  <div className="flex items-center justify-center">
                    <Calendar className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {match.date} - {match.time}
                  </div>
                  <div className="flex items-center justify-center">
                    <MapPin className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {match.stadium}
                  </div>
                </div>

                {/* Empuja la zona de cuotas al fondo para igualar alturas */}
                <div className="mt-auto grid grid-cols-3 gap-1.5 sm:gap-2">
                  {[
                    { label: "Local", odd: match.homeOdds, to: `home` },
                    { label: "Empate", odd: match.drawOdds, to: `draw` },
                    { label: "Visitante", odd: match.awayOdds, to: `away` },
                  ].map((o) => (
                    <Button
                      key={o.to}
                      variant="outline"
                      className="
                        flex h-auto flex-col bg-transparent rounded-xl
                        border border-[var(--border)] sm:border-2
                        px-2.5 py-2 sm:px-3 sm:py-3
                        text-[12px] sm:text-[13px]
                        transition-all duration-150
                        hover:[background-color:color-mix(in_oklab,var(--primary)_55%,transparent)]
                        hover:text-[var(--primary-foreground)]
                        hover:!border-[var(--primary)]
                        hover:!ring-1 hover:!ring-[var(--primary)]/40
                        focus-visible:outline-none focus-visible:!border-[var(--primary)] focus-visible:!ring-2 focus-visible:!ring-[var(--ring)]
                        active:scale-[0.99]
                      "
                      asChild
                    >
                      <Link to={`/match/${match.id}?outcome=${o.to}`}>
                        <span className="mb-0.5 sm:mb-1">{o.label}</span>
                        <span className="text-[14px] sm:text-base font-bold">{o.odd}</span>
                      </Link>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}