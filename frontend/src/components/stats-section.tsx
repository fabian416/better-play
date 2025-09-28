export function StatsSection() {
    const stats = [
      { value: "50K+", label: "Usuarios Activos" },
      { value: "1M+", label: "Apuestas Realizadas" },
      { value: "98%", label: "Satisfacción" },
      { value: "24/7", label: "Soporte" },
    ]
  
    return (
      <section id="stats" className="py-20 bg-primary/5">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">Números que nos respaldan</h2>
          </div>
  
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }
  