import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    title: "Sistema 1x2 Simple",
    description: "Apuesta fácil: Gana el local, Empate, o Gana el visitante. Sin complicaciones.",
    icon: "⚽",
  },
  {
    title: "Liga Argentina Completa",
    description: "Todos los partidos de la Primera División Argentina en tiempo real.",
    icon: "🏆",
  },
  {
    title: "Cuotas Competitivas",
    description: "Las mejores cuotas del mercado para maximizar tus ganancias.",
    icon: "💰",
  },
  {
    title: "Pagos Seguros",
    description: "Transacciones protegidas y retiros rápidos. Tu dinero está seguro.",
    icon: "🔒",
  },
  {
    title: "En Vivo",
    description: "Apuesta durante el partido con cuotas que se actualizan en tiempo real.",
    icon: "📱",
  },
  {
    title: "Estadísticas Completas",
    description: "Análisis detallado de equipos y jugadores para apostar con información.",
    icon: "📊",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">¿Por qué elegir BetterPlay?</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            La plataforma más confiable para apostar en fútbol argentino
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card key={index} className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="text-4xl mb-4">{feature.icon}</div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
