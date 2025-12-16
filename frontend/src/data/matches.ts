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
    isFinalized?: boolean
    featured?: boolean
  }
  
  export const futbolMatches: Match[] = [
    {
      id: "19",
      homeTeam: "Platense",
      awayTeam: "Estudiantes",
      date: "2025-12-20",
      time: "17:55",
      stadium: "Eva Perón",
      homeOdds: 2.7,
      drawOdds: 3.0,
      awayOdds: 2.7,
      volume: "$65K",
      homeForm: [],
      awayForm: [],
      headToHead: "",
      featured: true,
    },
  ]

const ARG_TZ_OFFSET = "-03:00"
const MATCH_DURATION_MINUTES = 120 // ajustá si querés 115/125/etc

function getStartAt(match: Pick<Match, "date" | "time">, tzOffset = ARG_TZ_OFFSET) {
  return new Date(`${match.date}T${match.time}:00${tzOffset}`)
}

function getEndAt(match: Pick<Match, "date" | "time">) {
  const start = getStartAt(match)
  return new Date(start.getTime() + MATCH_DURATION_MINUTES * 60 * 1000)
}

export function withComputedStatus(match: Match, now = new Date()): Match {
  const startAt = getStartAt(match)
  const endAt = getEndAt(match)

  const isLive = now >= startAt && now < endAt
  const isFinalized = now >= endAt

  return { ...match, isLive, isFinalized }
}

// 👉 si tu grilla importa `matches`, dejala ya “decorada”
export const matches: Match[] = futbolMatches.map((m) => withComputedStatus(m))

export function getMatchById(id: string, now = new Date()) {
  const m = futbolMatches.find((m) => m.id === id)
  return m ? withComputedStatus(m, now) : undefined
}

// (opcional) para recalcular en vivo con interval en UI
export function getMatches(now = new Date()) {
  return futbolMatches.map((m) => withComputedStatus(m, now))
}
