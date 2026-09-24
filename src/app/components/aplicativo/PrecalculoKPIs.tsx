import { useState } from "react";
import { CheckCircle2, RefreshCw } from "lucide-react";

import { PageHeader } from "../shared/PageHeader";
import { DataTable } from "../shared/DataTable";

// APL — Pre-cálculo y generación de KPIs (solo consulta).
// El batch deja los KPIs ya calculados para que las consultas gerenciales no tengan
// que recalcularlos. Aquí solo se ve qué dejó listo y cuándo. Datos de muestra.

const KPIS = [
  { id: 1, codigo: "KPI-01", nombre: "Tasa de recuperación", periodo: "2026-07", valor: "58.5%", registros: 1240, estado: "Calculado" },
  { id: 2, codigo: "KPI-02", nombre: "Tasa de respuestas", periodo: "2026-07", valor: "32.4%", registros: 6487, estado: "Calculado" },
  { id: 3, codigo: "KPI-03", nombre: "Tiempo promedio de resolución", periodo: "2026-07", valor: "4.5 días", registros: 2102, estado: "Calculado" },
  { id: 4, codigo: "KPI-04", nombre: "Tasa de recuperación de pagos", periodo: "2026-07", valor: "60.1%", registros: 850, estado: "Calculado" },
  { id: 5, codigo: "KPI-05", nombre: "Costo promedio por gestión", periodo: "2026-07", valor: "S/ 7.20", registros: 6487, estado: "Calculado" },
  { id: 6, codigo: "KPI-06", nombre: "Efectividad por estrategia", periodo: "2026-07", valor: "11 estrategias", registros: 11, estado: "En cola" },
];

export function PrecalculoKPIs() {
  const [ejecutado, setEjecutado] = useState<string | null>(null);

  return (
    <div className="min-h-full bg-background">
      <PageHeader
        title="Pre-cálculo y generación de KPIs"
        subtitle="KPIs que el batch deja precalculados para las consultas gerenciales. Solo consulta."
      />

      <div className="space-y-6 p-6 lg:p-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <Resumen label="Última corrida" value="30/06/2026 03:10" />
          <Resumen label="KPIs precalculados" value={`${KPIS.filter((k) => k.estado === "Calculado").length} de ${KPIS.length}`} />
          <Resumen label="Periodo procesado" value="2026-07" />
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            El pre-cálculo corre solo, de madrugada. Desde aquí se puede forzar una corrida de prueba.
          </p>
          <button
            onClick={() => setEjecutado(`Completado. Pre-cálculo forzado el ${new Date().toLocaleString("es-PE")}.`)}
            className="ml-auto flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <RefreshCw className="size-4" />
            Forzar pre-cálculo
          </button>
        </div>

        {ejecutado && (
          <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <CheckCircle2 className="size-4 shrink-0" />
            {ejecutado}
          </p>
        )}

        <DataTable
          title="KPIs generados"
          searchPlaceholder="Buscar KPI..."
          columns={[
            { key: "codigo", label: "Código", sortable: true },
            { key: "nombre", label: "Indicador", sortable: true },
            { key: "periodo", label: "Periodo" },
            { key: "valor", label: "Valor calculado" },
            { key: "registros", label: "Registros procesados", sortable: true, render: (k: any) => k.registros.toLocaleString("es-PE") },
            {
              key: "estado", label: "Estado",
              render: (k: any) => (
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                  k.estado === "Calculado" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}>
                  {k.estado}
                </span>
              ),
            },
          ]}
          data={KPIS}
        />
      </div>
    </div>
  );
}

function Resumen({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
