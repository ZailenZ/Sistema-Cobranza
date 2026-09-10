import { Activity, CheckCircle2, Clock, Eye, Info } from "lucide-react";

import { PageHeader } from "../shared/PageHeader";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

// Monitor Batch Aplicativo — ESTRICTAMENTE SOLO LECTURA.
// No ejecuta ni fuerza procesos. Solo muestra el estado de los procesos internos
// automáticos. No forma parte del flujo operativo del usuario.

type ProcesoBatch = {
  codigo: string;
  nombre: string;
  descripcion: string;
  ultimaEjecucion: string;
  estado: "Completado" | "En ejecución" | "Programado";
  registros: string;
};

const PROCESOS: ProcesoBatch[] = [
  {
    codigo: "3.1.1.1",
    nombre: "Fabricación de tickets de gestión",
    descripcion: "Genera tickets de gestión de cobranza a partir de deudas vencidas y reglas de asignación.",
    ultimaEjecucion: "30/06/2026 02:00",
    estado: "Completado",
    registros: "84 tickets generados",
  },
  {
    codigo: "3.1.1.2",
    nombre: "Actualización de protocolos",
    descripcion: "Actualiza la secuencia y condiciones de los protocolos de gestión de cobranza vigentes.",
    ultimaEjecucion: "30/06/2026 02:20",
    estado: "Completado",
    registros: "12 protocolos actualizados",
  },
  {
    codigo: "3.1.2",
    nombre: "Generación de estadísticas",
    descripcion: "Consolida estadísticas de contactabilidad, efectividad, promesas de pago y recuperación de cartera.",
    ultimaEjecucion: "30/06/2026 03:30",
    estado: "En ejecución",
    registros: "18 de 24 sponsors",
  },
  {
    codigo: "3.1.2.6",
    nombre: "Pre-cálculo y generación de KPIs",
    descripcion: "Produce indicadores pre-calculados para las consultas gerenciales de cobranza.",
    ultimaEjecucion: "30/06/2026 03:45",
    estado: "Programado",
    registros: "Próxima corrida 01/07 03:45",
  },
];

const estadoBadge = (estado: ProcesoBatch["estado"]) => {
  if (estado === "En ejecución")
    return (
      <Badge variant="outline" className="gap-1 rounded-full">
        <Activity className="size-3" /> En ejecución
      </Badge>
    );
  if (estado === "Programado")
    return (
      <Badge variant="outline" className="gap-1 rounded-full text-muted-foreground">
        <Clock className="size-3" /> Programado
      </Badge>
    );
  return (
    <Badge variant="secondary" className="gap-1 rounded-full">
      <CheckCircle2 className="size-3" /> Completado
    </Badge>
  );
};

export function BatchMonitor() {
  return (
    <div className="min-h-full bg-background">
      <PageHeader
        title="Monitor Batch Aplicativo"
        subtitle="Vista de monitoreo de procesos internos automáticos. No forma parte del flujo operativo del usuario."
        actions={
          <Badge variant="outline" className="gap-1.5 rounded-full border-border/80 bg-muted/40 px-3 py-1 text-xs">
            <Eye className="size-3.5" />
            Solo lectura
          </Badge>
        }
      />

      <div className="space-y-6 p-6 lg:p-8">
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p>
            Los procesos Batch se ejecutan internamente de forma automática. Esta pantalla solo refleja su estado;
            no permite ejecutarlos, forzarlos ni modificarlos. Sus resultados se reflejan en la disponibilidad de
            tickets de gestión, reportes y consultas gerenciales.
          </p>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="text-lg font-semibold">Procesos internos</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border/60 p-0">
            {PROCESOS.map((proceso) => (
              <div key={proceso.codigo} className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                      {proceso.codigo}
                    </span>
                    <p className="text-sm font-semibold text-foreground">{proceso.nombre}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{proceso.descripcion}</p>
                </div>
                <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
                  {estadoBadge(proceso.estado)}
                  <p className="text-xs text-muted-foreground">Última ejecución: {proceso.ultimaEjecucion}</p>
                  <p className="text-xs text-muted-foreground">{proceso.registros}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
