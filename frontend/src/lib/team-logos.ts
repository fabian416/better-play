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