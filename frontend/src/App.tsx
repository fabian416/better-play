import { Header } from "@/components/header"
import { MatchesGrid } from "@/components/matches-grid"

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Próximos Partidos - Liga Argentina
          </h1>
          <p className="text-muted-foreground text-lg">
            Apuesta en los mejores partidos del fútbol argentino
          </p>
        </div>
        <MatchesGrid />
      </main>
    </div>
  )
}