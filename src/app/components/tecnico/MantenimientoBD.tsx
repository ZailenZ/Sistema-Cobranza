import { useState } from "react";
import { CheckCircle2, Database, Gauge, Wrench } from "lucide-react";

import { PageHeader } from "../shared/PageHeader";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

// Mantenimiento de Base de Datos — herramienta técnica/administrativa, fuera del
// flujo operativo. Agrupa procesos técnicos periódicos sobre la estructura física
// o lógica de la base de datos (reorganización, optimización de espacio).

type Tarea = {
  id: string;
  nombre: string;
  descripcion: string;
  ultimaEjecucion: string;
  estado: "OK" | "Pendiente";
};

const TAREAS_SEED: Tarea[] = [
  { id: "MNT-001", nombre: "Reorganización de la base de datos", descripcion: "Reordena internamente índices y tablas para prevenir degradación de performance.", ultimaEjecucion: "28/06/2026 01:30", estado: "OK" },
  { id: "MNT-002", nombre: "Optimización de espacio de almacenamiento", descripcion: "Compacta y reasigna espacio en tablas con fragmentación.", ultimaEjecucion: "28/06/2026 02:10", estado: "OK" },
];

export function MantenimientoBD() {
  const [tareas, setTareas] = useState<Tarea[]>(TAREAS_SEED);
  const [resultado, setResultado] = useState<string | null>(null);

  const ejecutar = (id: string) => {
    const ahora = new Date().toLocaleString("es-PE");
    setTareas((prev) => prev.map((t) => (t.id === id ? { ...t, ultimaEjecucion: ahora, estado: "OK" } : t)));
    const tarea = tareas.find((t) => t.id === id);
    setResultado(`${tarea?.nombre} ejecutada correctamente el ${ahora}.`);
  };

  return (
    <div className="min-h-full bg-background">
      <PageHeader
        title="Mantenimiento de base de datos"
        subtitle="Tareas técnicas periódicas sobre la estructura física y lógica de la BD. Fuera del flujo operativo."
      />

      <div className="space-y-6 p-6 lg:p-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard icon={Gauge} label="Fragmentación actual" value="4.2%" />
          <SummaryCard icon={Database} label="Tamaño de BD" value="6.8 GB" />
          <SummaryCard icon={Wrench} label="Última tarea ejecutada" value="28/06/2026" />
        </div>

        {resultado && (
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/25 p-4 text-sm text-foreground">
            <CheckCircle2 className="size-5" />
            {resultado}
          </div>
        )}

        <Card className="border-border bg-card">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="text-lg font-semibold">Tareas de mantenimiento</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border/60 p-0">
            {tareas.map((tarea) => (
              <div key={tarea.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-background">
                    <Wrench className="size-4 text-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{tarea.nombre}</p>
                    <p className="text-xs text-muted-foreground">{tarea.descripcion}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Última ejecución: {tarea.ultimaEjecucion}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="rounded-full">{tarea.estado}</Badge>
                  <Button size="sm" variant="outline" className="rounded-xl" onClick={() => ejecutar(tarea.id)}>
                    Ejecutar ahora
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }: { icon: typeof Database; label: string; value: string }) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="flex items-center gap-3 p-5">
        <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-background">
          <Icon className="size-4 text-foreground" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-xl font-semibold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
