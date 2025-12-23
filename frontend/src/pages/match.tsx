import { Navigate, useParams } from "react-router-dom"
import { useEffect, useMemo, useState } from "react"
import { Header } from "~~/components/header"
import MatchDetails from "~~/components/match-details"
import { getMatchById } from "~~/data/matches"
import type { Match } from "~~/data/matches"

export default function MatchPage() {
  const { id } = useParams<{ id?: string }>()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000) // cada 30s
    return () => clearInterval(t)
  }, [])

  const match: Match | undefined = useMemo(
    () => (id ? getMatchById(id, now) : undefined),
    [id, now],
  )

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
