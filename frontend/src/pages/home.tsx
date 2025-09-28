import { Header } from "@/components/header"
import { MatchesGrid } from "@/components/matches-grid"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto w-full max-w-7xl px-4 py-8">
        {/* Top bar / section header */}
        <section aria-labelledby="home-heading" className="mb-8">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h1
                id="home-heading"
                className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl"
              >
                Próximos Partidos — Liga Argentina
              </h1>
              <p className="mt-1 text-sm text-muted-foreground md:text-base">
                Apuesta en los mejores partidos del fútbol argentino
              </p>
            </div>

            {/* Right side small stats / actions (optional placeholders) */}
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                1x2 • 90&apos;
              </span>
              <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                Mercados: <span className="font-semibold text-foreground">6</span>
              </span>
            </div>
          </div>
        </section>

        {/* Matches grid */}
        <section aria-label="Listado de partidos">
          <MatchesGrid />
        </section>
      </main>
    </div>
  )
}