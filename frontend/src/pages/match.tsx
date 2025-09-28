import { Navigate, useParams } from "react-router-dom"
import { Header } from "@/components/header"
import { MatchDetails } from "@/components/match-details"

// Mock data - en real vendrá de API/estado global
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
    homeForm: ["W", "W", "D", "W", "L"],
    awayForm: ["W", "L", "W", "W", "D"],
    headToHead: "Últimos 5: Boca 2 - 1 River - 2 Empates",
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
    homeForm: ["W", "W", "W", "D", "W"],
    awayForm: ["L", "D", "L", "W", "L"],
    headToHead: "Últimos 5: Racing 3 - 1 Independiente - 1 Empate",
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
    homeForm: ["D", "W", "L", "D", "W"],
    awayForm: ["W", "D", "W", "L", "D"],
    headToHead: "Últimos 5: San Lorenzo 2 - 2 Huracán - 1 Empate",
  },
]

export default function MatchPage() {
  const { id } = useParams<{ id: string }>()
  const match = matches.find((m) => m.id === id)

  // Si no existe, redirigimos al home (o muestra un 404 propio)
  if (!match) return <Navigate to="/" replace />

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <MatchDetails match={match} />
      </main>
    </div>
  )
}