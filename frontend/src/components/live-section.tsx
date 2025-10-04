import { Card, CardContent, CardHeader, CardTitle } from "~~/components/ui/card"
import { Button } from "~~/components/ui/button"

const matches = [
  {
    id: 1,
    homeTeam: "Boca Juniors",
    awayTeam: "River Plate",
    time: "15:30",
    date: "Hoy",
    odds: { home: 2.1, draw: 3.2, away: 2.8 },
  },
  {
    id: 2,
    homeTeam: "Racing Club",
    awayTeam: "Independiente",
    time: "18:00",
    date: "Hoy",
    odds: { home: 1.8, draw: 3.5, away: 3.1 },
  },
  {
    id: 3,
    homeTeam: "San Lorenzo",
    awayTeam: "Estudiantes",
    time: "20:30",
    date: "Hoy",
    odds: { home: 2.4, draw: 3.0, away: 2.6 },
  },
]

export function LiveMatchesSection() {
  return (
    <section id="matches" className="py-20 bg-card/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Partidos de Hoy</h2>
          <p className="mt-4 text-lg text-muted-foreground">Apuesta en los mejores partidos de la Liga Argentina</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {matches.map((match) => (
            <Card key={match.id} className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>{match.date}</span>
                  <span>{match.time}</span>
                </div>
                <CardTitle className="text-center">
                  <div className="space-y-2">
                    <div className="text-lg font-semibold">{match.homeTeam}</div>
                    <div className="text-sm text-muted-foreground">vs</div>
                    <div className="text-lg font-semibold">{match.awayTeam}</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    className="flex flex-col items-center py-4 hover:bg-primary hover:text-primary-foreground bg-transparent"
                  >
                    <span className="text-xs mb-1">Local</span>
                    <span className="font-bold">{match.odds.home}</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center py-4 hover:bg-primary hover:text-primary-foreground bg-transparent"
                  >
                    <span className="text-xs mb-1">Empate</span>
                    <span className="font-bold">{match.odds.draw}</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center py-4 hover:bg-primary hover:text-primary-foreground bg-transparent"
                  >
                    <span className="text-xs mb-1">Visitante</span>
                    <span className="font-bold">{match.odds.away}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
