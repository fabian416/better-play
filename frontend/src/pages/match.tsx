// src/pages/match.tsx
import { Navigate, useParams } from "react-router-dom"
import { Header } from "@/components/header"
import { MatchDetails } from "@/components/match-details"
import { getMatchById } from "@/data/matches"
import type { Match } from "@/data/matches"

export default function MatchPage() {
  // id puede venir undefined; tipamos como opcional
  const { id } = useParams<{ id?: string }>()
  const match: Match | undefined = id ? getMatchById(id) : undefined

  // Si no existe, redirigimos al home (o podrías renderizar un 404 propio)
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