// src/lib/team-logos.ts
const modules = import.meta.glob('../assets/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const logosByFile: Record<string, string> = {};
for (const path in modules) {
  const filename = path.split('/').pop()!.replace('.png', ''); // ej: "river-plate"
  logosByFile[filename] = modules[path];
}

export const slugTeam = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita tildes
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const logoFor = (teamName: string) => {
  const key = slugTeam(teamName);
  return logosByFile[key];
};