import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background py-20 sm:py-32">
      <div className="absolute inset-0 bg-[url('/football-stadium-crowd.png')] bg-cover bg-center opacity-10" />
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8">
            <div className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
              <span className="mr-2">⚽</span>
              Liga Argentina en Vivo
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            <span className="text-balance">Apuestas Deportivas</span>
            <br />
            <span className="text-primary">Liga Argentina</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            La plataforma más confiable para apostar en partidos de la Liga Argentina. Sistema 1x2 simple y
            transparente. Gana, Empata o Pierde.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button size="lg" className="text-lg px-8 py-4">
              Comenzar a Apostar
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4 bg-transparent">
              Ver Partidos en Vivo
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
