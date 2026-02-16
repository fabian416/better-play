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
  // ===== PARTIDOS REALES (23-25 ENERO 2026) =====
  // ✅ Confirmado on-chain - 5 mercados únicos (market 26 cancelado)
  
  // 🏆 Jueves 23 de enero de 2026
  {
    id: "independiente-estudiantes-2026-01-23",
    marketId: 25, // ✅ Market único
    homeTeam: "Independiente",
    awayTeam: "Estudiantes",
    date: "2026-01-23",
    time: "21:30",
    betsCloseTime: "21:15",
    closeTimeUnix: 1769208300, // ✅ Thu Jan 23 2026 21:15:00 GMT-0300
    stadium: "Estadio Libertadores de América",
    homeOdds: 2.2,
    drawOdds: 3.1,
    awayOdds: 3.5,
    volume: "-",
    homeForm: ["W", "D", "W", "L", "W"],
    awayForm: ["D", "W", "L", "D", "W"],
    headToHead: "Últimos 5: Ind 2 - Emp 2 - Est 1",
    featured: true,
  },
  {
    id: "talleres-newells-2026-01-23",
    marketId: 27, // ✅ Market único
    homeTeam: "Talleres",
    awayTeam: "Newell's Old Boys",
    date: "2026-01-23",
    time: "23:30",
    betsCloseTime: "23:20",
    closeTimeUnix: 1769216400, // ✅ Thu Jan 23 2026 23:20:00 GMT-0300
    stadium: "Estadio Mario Alberto Kempes",
    homeOdds: 2.0,
    drawOdds: 3.0,
    awayOdds: 3.8,
    volume: "-",
    homeForm: ["W", "W", "D", "L", "W"],
    awayForm: ["D", "L", "W", "D", "D"],
    headToHead: "Clásico cordobés - Últimos 5: Tal 2 - Emp 2 - NOB 1",
    featured: true,
  },
  
  // 🏆 Viernes 24 de enero de 2026
  {
    id: "barracas-river-2026-01-24",
    marketId: 30, // ✅ Market único
    homeTeam: "Barracas Central",
    awayTeam: "River Plate",
    date: "2026-01-24",
    time: "17:15",
    betsCloseTime: "17:05",
    closeTimeUnix: 1769283900, // ✅ Fri Jan 24 2026 17:05:00 GMT-0300
    stadium: "Estadio Claudio Chiqui Tapia",
    homeOdds: 5.5,
    drawOdds: 3.5,
    awayOdds: 1.6,
    volume: "-",
    homeForm: ["L", "D", "L", "D", "L"],
    awayForm: ["W", "W", "W", "D", "W"],
    headToHead: "Últimos 5: Bar 0 - Emp 1 - Riv 4",
    featured: true,
  },
  {
    id: "gimnasia-racing-2026-01-24",
    marketId: 28, // ✅ Market único
    homeTeam: "Gimnasia La Plata",
    awayTeam: "Racing",
    date: "2026-01-24",
    time: "19:25",
    betsCloseTime: "19:15",
    closeTimeUnix: 1769292900, // ✅ Fri Jan 24 2026 19:15:00 GMT-0300
    stadium: "Estadio Juan Carmelo Zerillo",
    homeOdds: 3.2,
    drawOdds: 3.0,
    awayOdds: 2.3,
    volume: "-",
    homeForm: ["D", "L", "W", "D", "L"],
    awayForm: ["W", "W", "D", "W", "L"],
    headToHead: "Últimos 5: Gim 1 - Emp 2 - Rac 2",
    featured: false,
  },
  
  // 🏆 Sábado 25 de enero de 2026
  {
    id: "boca-riestra-2026-01-25",
    marketId: 29, // ✅ Market único
    homeTeam: "Boca Juniors",
    awayTeam: "Deportivo Riestra",
    date: "2026-01-25",
    time: "20:15",
    betsCloseTime: "20:05",
    closeTimeUnix: 1769375700, // ✅ Sat Jan 25 2026 20:05:00 GMT-0300
    stadium: "La Bombonera",
    homeOdds: 1.4,
    drawOdds: 4.0,
    awayOdds: 7.5,
    volume: "-",
    homeForm: ["W", "D", "W", "W", "D"],
    awayForm: ["L", "L", "D", "L", "D"],
    headToHead: "Primer enfrentamiento histórico",
    featured: true,
  },

  // ===== PARTIDOS DE PRUEBA ANTERIORES =====
  {
    id: "23",
    marketId: 23,
    homeTeam: "Fabi",
    awayTeam: "Lucho",
    date: "2025-12-23",
    time: "14:45",
    betsCloseTime: "17:15",
    closeTimeUnix: 1766520900,
    stadium: "Fútbol tenis (friendly)",
    homeOdds: 2.0,
    drawOdds: 3.0,
    awayOdds: 2.0,
    volume: "-",
    homeForm: [],
    awayForm: [],
    headToHead: "",
    featured: false,
  },
  {
    id: "24",
    marketId: 24,
    homeTeam: "Fabi",
    awayTeam: "Lucho",
    date: "2025-12-23",
    time: "19:00",
    betsCloseTime: "19:00",
    closeTimeUnix: 1766527200,
    stadium: "Fútbol tenis (friendly)",
    homeOdds: 2.0,
    drawOdds: 3.0,
    awayOdds: 2.0,
    volume: "-",
    homeForm: [],
    awayForm: [],
    headToHead: "",
    featured: false,
  },
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