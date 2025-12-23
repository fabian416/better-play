export type Match = {
  id: string                 // UI id
  marketId: number           // onchain id
  homeTeam: string
  awayTeam: string
  date: string               // kickoff date (AR)
  time: string               // kickoff time (AR)
  betsCloseTime?: string     // cierre apuestas (AR) para mostrar
  closeTimeUnix?: number     // cierre apuestas (unix) para gating real
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

// ⚠️ Importante: `time` es kickoff (para isLive).
// El cierre de apuestas va separado.
export const futbolMatches: Match[] = [
  // ✅ Nuevo: Fútbol tenis "tomorrow" (marketId 21)
  {
    id: "23",
    marketId: 23,
    homeTeam: "Fabi",
    awayTeam: "Lucho",
    date: "2025-12-23",
    time: "14:45",
    betsCloseTime: "14:45",
    closeTimeUnix: 1766511900, // ✅ on-chain
    stadium: "Fútbol tenis (friendly)",
    homeOdds: 2.0,
    drawOdds: 3.0,
    awayOdds: 2.0,
    volume: "-",
    homeForm: [],
    awayForm: [],
    headToHead: "",
    featured: true,
  }
]

const ARG_TZ_OFFSET = "-03:00"
const MATCH_DURATION_MINUTES = 120

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

// ✅ gating real para apuestas (usa onchain closeTime)
export function canBet(match: Match, now = new Date()) {
  if (!match.closeTimeUnix) return true
  const nowTs = Math.floor(now.getTime() / 1000)
  return nowTs < match.closeTimeUnix
}

export const matches: Match[] = futbolMatches.map((m) => withComputedStatus(m))

export function getMatchById(id: string, now = new Date()) {
  const m = futbolMatches.find((m) => m.id === id)
  return m ? withComputedStatus(m, now) : undefined
}

export function getMatches(now = new Date()) {
  return futbolMatches.map((m) => withComputedStatus(m, now))
}