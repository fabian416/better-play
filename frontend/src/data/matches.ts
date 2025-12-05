export type Match = {
  id: string
  homeTeam: string
  awayTeam: string
  date: string
  time: string
  stadium: string
  homeOdds: number
  drawOdds: number
  awayOdds: number
  volume: string
  homeForm: string[]
  awayForm: string[]
  headToHead: string
  isLive?: boolean
  featured?: boolean
}

export const matches: Match[] = [
  {
    id: "17",
    homeTeam: "Boca Juniors",
    awayTeam: "Racing Club",
    date: "2025-12-07",
    time: "19:00",
    stadium: "Alberto José Armando (La Bombonera)",
    homeOdds: 2.2,
    drawOdds: 3.0,
    awayOdds: 3.1,
    volume: "$0",
    homeForm: [],
    awayForm: [],
    headToHead: "",
    isLive: false,
    featured: true,
  },
  {
    id: "18",
    homeTeam: "Gimnasia La Plata",
    awayTeam: "Estudiantes de La Plata",
    date: "2025-12-08",
    time: "17:00",
    stadium: "Juan Carmelo Zerillo (El Bosque)",
    homeOdds: 2.6,
    drawOdds: 2.9,
    awayOdds: 2.7,
    volume: "$0",
    homeForm: [],
    awayForm: [],
    headToHead: "",
    isLive: false,
    featured: false,
  },
]

export function getMatchById(id: string) {
  return matches.find((m) => m.id === id)
}