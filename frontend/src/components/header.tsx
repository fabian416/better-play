import { Button } from "@/components/ui/button"
import Link from "next/link"

export function Header() {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/">
                <h1 className="text-2xl font-bold text-primary cursor-pointer hover:text-primary/80 transition-colors">
                  BetterPlay
                </h1>
              </Link>
            </div>
            <nav className="hidden md:ml-10 md:flex md:space-x-8">
              <Link href="/" className="text-foreground hover:text-primary transition-colors">
                Partidos
              </Link>
              <span className="text-muted-foreground">Liga Argentina</span>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              Iniciar Sesión
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary/90">
              Registrarse
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
