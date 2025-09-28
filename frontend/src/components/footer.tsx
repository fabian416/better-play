import { Button } from "@/components/ui/button"

export function Footer() {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <h3 className="text-2xl font-bold text-primary mb-4">BetterPlay</h3>
            <p className="text-muted-foreground mb-6">
              La plataforma líder en apuestas deportivas de la Liga Argentina. Apuesta de forma segura y responsable.
            </p>
            <div className="flex space-x-4">
              <Button size="sm">Descargar App</Button>
              <Button variant="outline" size="sm">
                Contacto
              </Button>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Apuestas</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Partidos en Vivo
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Próximos Partidos
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Resultados
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Estadísticas
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Soporte</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Centro de Ayuda
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Términos y Condiciones
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Juego Responsable
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">
                  Contacto
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2025 BetterPlay. Todos los derechos reservados. Juega con responsabilidad.</p>
        </div>
      </div>
    </footer>
  )
}
