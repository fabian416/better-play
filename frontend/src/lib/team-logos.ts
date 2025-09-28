// src/lib/team-logos.ts
function toSlug(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // quita acentos
    .replace(/['’.]/g, "")          // quita apóstrofes/puntos
    .replace(/[^a-zA-Z0-9]+/g, "-") // espacios -> guiones
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

// Mapea variantes de nombres -> slug de archivo
const alias: Record<string, string> = {
  // Vélez
  "velez": "velez",
  "velez-sarsfield": "velez",
  "velez-sarsfield-fc": "velez",

  // Boca
  "boca": "boca-juniors",
  "boca-jrs": "boca-juniors",
  "boca-juniors": "boca-juniors",

  // River
  "river": "river-plate",
  "river-plate": "river-plate",

  // Independiente
  "independiente": "independiente",

  // San Lorenzo
  "san-lorenzo": "san-lorenzo",

  // Racing
  "racing": "racing-club",
  "racing-club": "racing-club",

  // Newell's
  "newells": "newells-old-boys",
  "newells-old-boys": "newells-old-boys",

  // Estudiantes
  "estudiantes": "estudiantes",
  "estudiantes-de-la-plata": "estudiantes",

  // Gimnasia
  "gimnasia": "gimnasia",
  "gimnasia-lp": "gimnasia",

  // Talleres
  "talleres": "talleres",
  "talleres-de-cordoba": "talleres",

  // Lanús
  "lanus": "lanus",

  // Huracán
  "huracan": "huracan",

  // Banfield
  "banfield": "banfield",

  // Rosario Central
  "rosario-central": "rosario-central",

  // Barracas Central
  "barracas-central": "barracas-central",

  // Belgrano
  "belgrano": "belgrano",

  // Atlético Tucumán
  "atletico-tucuman": "atletico-tucuman",
  "atlético-tucuman": "atletico-tucuman",

  // Defensa y Justicia
  "defensa-y-justicia": "defensa-y-justicia",
  "defensa": "defensa-y-justicia",

  // Unión
  "union": "union-sf",
  "union-santa-fe": "union-sf",

  // Aldosivi
  "aldosivi": "aldosivi",

  // Sarmiento
  "sarmiento": "sarmiento",

  // San Martín SJ
  "san-martin-san-juan": "san-martin-sj",
  "san-martin-sj": "san-martin-sj",

  // Instituto
  "instituto": "instituto",

  // Platense
  "platense": "platense",

  // Godoy Cruz
  "godoy-cruz": "godoy-cruz",

  // Argentinos Juniors
  "argentinos-juniors": "argentinos-juniors",

  // Central Córdoba
  "central-cordoba": "central-cordoba",
};

export function logoFor(teamName: string): string {
  const key = toSlug(teamName);
  const slug = alias[key] ?? key;
  // Archivos esperados en public/assets/teams/<slug>.png
  return `/assets/teams/${slug}.png`;
}

/* ---------------- Siglas (ABBR) en el mismo archivo ---------------- */

// Siglas “oficiales” por slug (ajústalas a gusto)
const ABBR: Record<string, string> = {
  "boca-juniors": "CABJ",
  "river-plate": "CARP",
  "independiente": "CAI",
  "racing-club": "RAC",
  "san-lorenzo": "CASLA",
  "velez": "VEL",
  "talleres": "TAL",
  "belgrano": "BEL",
  "banfield": "BAN",
  "lanus": "LAN",
  "estudiantes": "EdeLP",
  "gimnasia": "GELP",
  "newells-old-boys": "NOB",
  "rosario-central": "CARC",
  "atletico-tucuman": "CAT",
  "defensa-y-justicia": "DyJ",
  "union-sf": "USF",
  "aldosivi": "ALD",
  "sarmiento": "SAR",
  "san-martin-sj": "SMSJ",
  "instituto": "INS",
  "platense": "PLA",
  "godoy-cruz": "GOD",
  "barracas-central": "BC",
  "argentinos-juniors": "AAAJ",
  "central-cordoba": "CC",
  "Tigre": "TIG",
};

// Fallback si no hay entrada en ABBR
function autoAbbr(name: string) {
  const stop = new Set(["de", "del", "la", "las", "los", "y", "club", "atletico", "atlético"]);
  const parts = name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .split(/\s+/)
    .filter(w => !stop.has(w.toLowerCase()));
  const firsts = parts.map(w => w[0]?.toUpperCase() ?? "");
  return firsts.join("").slice(0, 4) || name.slice(0, 3).toUpperCase();
}

export function abbrFor(teamName: string) {
  const key = toSlug(teamName);
  const slug = alias[key] ?? key;
  return ABBR[slug] ?? autoAbbr(teamName);
}

// (opcional) exporta helpers para reusarlos en otros módulos
export { toSlug, alias };