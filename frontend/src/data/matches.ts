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
  // --- Week: Oct 6–12, 2025 (Liga Argentina) ---
  { id: "1", homeTeam: "Deportivo Riestra", awayTeam: "Vélez Sarsfield", date: "2025-10-06", time: "19:00", stadium: "Guillermo Laza", homeOdds: 3.1, drawOdds: 3.0, awayOdds: 2.3, volume: "$65K", homeForm: [], awayForm: [], headToHead: "", isLive: false, featured: false },
  { id: "2", homeTeam: "Racing Club", awayTeam: "Independiente Rivadavia", date: "2025-10-06", time: "21:00", stadium: "Presidente Perón (Cilindro de Avellaneda)", homeOdds: 1.7, drawOdds: 3.3, awayOdds: 5.0, volume: "$72K", homeForm: [], awayForm: [], headToHead: "", isLive: false, featured: true },

  { id: "3", homeTeam: "San Lorenzo", awayTeam: "San Martín San Juan", date: "2025-10-10", time: "14:30", stadium: "Nuevo Gasómetro", homeOdds: 1.9, drawOdds: 3.2, awayOdds: 4.3, volume: "$68K", homeForm: [], awayForm: [], headToHead: "", isLive: false, featured: false },
  { id: "4", homeTeam: "Defensa y Justicia", awayTeam: "Argentinos Juniors", date: "2025-10-10", time: "16:15", stadium: "Norberto Tomaghello", homeOdds: 2.6, drawOdds: 3.0, awayOdds: 2.8, volume: "$81K", homeForm: [], awayForm: [], headToHead: "", isLive: false, featured: false },
  { id: "5", homeTeam: "Central Córdoba", awayTeam: "Unión Santa Fe", date: "2025-10-10", time: "16:45", stadium: "Alfredo Terrera", homeOdds: 2.7, drawOdds: 3.0, awayOdds: 2.7, volume: "$54K", homeForm: [], awayForm: [], headToHead: "", isLive: false, featured: false },
  { id: "6", homeTeam: "Newell's Old Boys", awayTeam: "Tigre", date: "2025-10-10", time: "18:30", stadium: "Marcelo Bielsa", homeOdds: 2.2, drawOdds: 3.1, awayOdds: 3.4, volume: "$79K", homeForm: [], awayForm: [], headToHead: "", isLive: false, featured: false },

  { id: "7", homeTeam: "Barracas Central", awayTeam: "Boca Juniors", date: "2025-10-11", time: "14:30", stadium: "Claudio Chiqui Tapia", homeOdds: 5.4, drawOdds: 3.7, awayOdds: 1.6, volume: "$210K", homeForm: [], awayForm: [], headToHead: "", isLive: false, featured: true },
  { id: "8", homeTeam: "Gimnasia La Plata", awayTeam: "Talleres", date: "2025-10-11", time: "16:45", stadium: "Juan Carmelo Zerillo (El Bosque)", homeOdds: 2.9, drawOdds: 3.1, awayOdds: 2.5, volume: "$90K", homeForm: [], awayForm: [], headToHead: "", isLive: false, featured: false },
  { id: "9", homeTeam: "Banfield", awayTeam: "Racing Club", date: "2025-10-11", time: "19:00", stadium: "Florencio Solá", homeOdds: 3.0, drawOdds: 3.1, awayOdds: 2.4, volume: "$95K", homeForm: [], awayForm: [], headToHead: "", isLive: false, featured: false },
  { id: "10", homeTeam: "Belgrano", awayTeam: "Estudiantes", date: "2025-10-11", time: "21:15", stadium: "El Gigante de Alberdi", homeOdds: 2.8, drawOdds: 3.0, awayOdds: 2.6, volume: "$88K", homeForm: [], awayForm: [], headToHead: "", isLive: false, featured: false },
  { id: "11", homeTeam: "Vélez Sarsfield", awayTeam: "Rosario Central", date: "2025-10-11", time: "21:15", stadium: "José Amalfitani", homeOdds: 2.2, drawOdds: 3.1, awayOdds: 3.4, volume: "$120K", homeForm: [], awayForm: [], headToHead: "", isLive: false, featured: true },

  { id: "12", homeTeam: "Aldosivi", awayTeam: "Huracán", date: "2025-10-12", time: "14:30", stadium: "José María Minella", homeOdds: 2.9, drawOdds: 3.0, awayOdds: 2.6, volume: "$60K", homeForm: [], awayForm: [], headToHead: "", isLive: false, featured: false },
  { id: "13", homeTeam: "Independiente Rivadavia", awayTeam: "Godoy Cruz", date: "2025-10-12", time: "16:45", stadium: "Bautista Gargantini", homeOdds: 2.7, drawOdds: 3.0, awayOdds: 2.8, volume: "$73K", homeForm: [], awayForm: [], headToHead: "", isLive: false, featured: false },
  { id: "14", homeTeam: "Instituto", awayTeam: "Atlético Tucumán", date: "2025-10-12", time: "16:45", stadium: "Monumental Presidente Perón", homeOdds: 2.6, drawOdds: 3.0, awayOdds: 2.9, volume: "$66K", homeForm: [], awayForm: [], headToHead: "", isLive: false, featured: false },
  { id: "15", homeTeam: "River Plate", awayTeam: "Sarmiento", date: "2025-10-12", time: "19:15", stadium: "Más Monumental", homeOdds: 1.5, drawOdds: 3.8, awayOdds: 6.0, volume: "$260K", homeForm: [], awayForm: [], headToHead: "", isLive: false, featured: true },
  { id: "16", homeTeam: "Independiente", awayTeam: "Lanús", date: "2025-10-12", time: "21:15", stadium: "Estadio Libertadores de América", homeOdds: 2.5, drawOdds: 3.0, awayOdds: 2.9, volume: "$100K", homeForm: [], awayForm: [], headToHead: "", isLive: false, featured: false },
];
  
  export function getMatchById(id: string) {
    return matches.find((m) => m.id === id)
  }