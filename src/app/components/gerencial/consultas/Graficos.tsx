import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, LineChart as LineChartIcon, Table2 } from "lucide-react";

import { PageHeader } from "../../shared/PageHeader";

// Estadísticas gráficas del sistema. Los datos son de muestra (generados de forma
// determinista) y los filtros de tipo y rango de fecha son demostrativos: sirven
// para enseñar cómo se acotaría la consulta, pero no recalculan el gráfico.

type Indicador = "tipos" | "canales" | "respuestas";
type Vista = "tabla" | "linea" | "histograma";

const PERIODOS = ["Abr", "May", "Jun", "Jul", "Ago", "Set"];

/** PRNG determinista: misma semilla, misma serie en cada recarga. */
function serie(semilla: string, min: number, max: number) {
  let s = 0;
  for (const c of semilla) s = (s * 31 + c.charCodeAt(0)) % 2147483647;
  return PERIODOS.map(() => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return min + Math.round((s / 2147483648) * (max - min));
  });
}

function construirDatos(series: { nombre: string; valores: number[] }[]) {
  return PERIODOS.map((periodo, i) => {
    const fila: Record<string, string | number> = { periodo };
    for (const s of series) fila[s.nombre] = s.valores[i];
    return fila;
  });
}

const COLORES = ["var(--primary)", "#f59e0b", "#10b981", "#6366f1"];

const INDICADORES: Record<
  Indicador,
  { titulo: string; descripcion: string; unidad: string; opciones: string[]; etiquetaFiltro: string; series: { nombre: string; valores: number[] }[] }
> = {
  tipos: {
    titulo: "Tipos de cobranza realizadas",
    descripcion: "Cantidad de gestiones ejecutadas por cada tipo de cobranza.",
    unidad: "gestiones",
    etiquetaFiltro: "Tipo de cobranza",
    opciones: ["Todos", "Cobranza temprana", "Cobranza tardía", "Cobranza prejudicial", "Cobranza judicial"],
    series: [
      { nombre: "Temprana", valores: serie("temprana", 80, 220) },
      { nombre: "Tardía", valores: serie("tardia", 50, 160) },
      { nombre: "Prejudicial", valores: serie("prejudicial", 20, 90) },
      { nombre: "Judicial", valores: serie("judicial", 5, 40) },
    ],
  },
  canales: {
    titulo: "Canales de cobranza utilizados",
    descripcion: "Mensajes enviados por cada canal de contacto.",
    unidad: "mensajes",
    etiquetaFiltro: "Canal",
    opciones: ["Todos", "SMS", "Whatsapp", "Correo", "Llamada (IVR)"],
    series: [
      { nombre: "SMS", valores: serie("sms", 300, 900) },
      { nombre: "Whatsapp", valores: serie("wsp", 250, 800) },
      { nombre: "Correo", valores: serie("correo", 100, 400) },
      { nombre: "Llamada (IVR)", valores: serie("ivr", 60, 260) },
    ],
  },
  respuestas: {
    titulo: "Tasa de respuestas",
    descripcion: "Porcentaje de morosos que respondieron a la gestión enviada.",
    unidad: "%",
    etiquetaFiltro: "Tipo de respuesta",
    opciones: ["Todas", "Afirmativa", "Negativa", "Sin respuesta"],
    series: [
      { nombre: "Afirmativa", valores: serie("afirm", 18, 42) },
      { nombre: "Negativa", valores: serie("negat", 10, 28) },
      { nombre: "Sin respuesta", valores: serie("sinresp", 30, 60) },
    ],
  },
};

const VISTAS: { id: Vista; label: string; icon: typeof Table2 }[] = [
  { id: "tabla", label: "Tabla", icon: Table2 },
  { id: "linea", label: "Gráfico de línea", icon: LineChartIcon },
  { id: "histograma", label: "Histograma", icon: BarChart3 },
];

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    color: "var(--foreground)",
  },
  labelStyle: { color: "var(--foreground)", fontWeight: 600 as const },
  itemStyle: { color: "var(--foreground)", fontWeight: 500 as const },
};

export function Graficos() {
  const [indicador, setIndicador] = useState<Indicador>("tipos");
  const [vista, setVista] = useState<Vista>("histograma");
  const [opcion, setOpcion] = useState("Todos");

  const cfg = INDICADORES[indicador];
  const datos = useMemo(() => construirDatos(cfg.series), [cfg]);

  const cambiarIndicador = (id: Indicador) => {
    setIndicador(id);
    setOpcion(INDICADORES[id].opciones[0]);
  };

  return (
    <div className="min-h-full bg-background">
      <PageHeader
        title="Gráficos estadísticos"
        subtitle="Estadísticas del sistema con tres formas de verlas: tabla, línea e histograma"
      />

      <div className="space-y-6 p-6 lg:p-8">
        {/* 1. Elegir el indicador */}
        <div className="flex flex-wrap gap-3">
          {(Object.keys(INDICADORES) as Indicador[]).map((id, i) => (
            <button
              key={id}
              onClick={() => cambiarIndicador(id)}
              className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                indicador === id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Indicador {i + 1}
              </span>
              <p className="text-sm font-semibold">{INDICADORES[id].titulo}</p>
            </button>
          ))}
        </div>

        {/* 2. Filtros (demostrativos) + selector del tipo de gráfico */}
        <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-card p-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {cfg.etiquetaFiltro}
            </label>
            <select
              value={opcion}
              onChange={(e) => setOpcion(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {cfg.opciones.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Rango de fecha
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                defaultValue="2026-04-01"
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <span className="text-sm text-muted-foreground">a</span>
              <input
                type="date"
                defaultValue="2026-09-30"
                className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          <div className="ml-auto">
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Tipo de gráfico
            </label>
            <div className="flex gap-1 rounded-xl border border-border bg-background p-1">
              {VISTAS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVista(v.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    vista === v.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <v.icon className="size-4" />
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Prototipo: el tipo de gráfico sí cambia la vista. El {cfg.etiquetaFiltro.toLowerCase()} y el rango de fecha
          son demostrativos — muestran cómo se acotaría la consulta, pero los datos exhibidos son de muestra y fijos.
        </p>

        {/* 3. La vista elegida */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground">{cfg.titulo}</h3>
          <p className="mb-5 text-sm text-muted-foreground">
            {cfg.descripcion} Medido en {cfg.unidad}, entre abril y setiembre de 2026.
          </p>

          {vista === "tabla" && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-3 py-2 text-left font-semibold text-foreground">Periodo</th>
                    {cfg.series.map((s) => (
                      <th key={s.nombre} className="px-3 py-2 text-right font-semibold text-foreground">
                        {s.nombre}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-right font-semibold text-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.map((fila) => {
                    const total = cfg.series.reduce((sum, s) => sum + Number(fila[s.nombre]), 0);
                    return (
                      <tr key={String(fila.periodo)} className="border-b border-border/60 last:border-0">
                        <td className="px-3 py-2 font-medium text-foreground">{fila.periodo}</td>
                        {cfg.series.map((s) => (
                          <td key={s.nombre} className="px-3 py-2 text-right text-muted-foreground">
                            {Number(fila[s.nombre]).toLocaleString("es-PE")}
                            {cfg.unidad === "%" ? "%" : ""}
                          </td>
                        ))}
                        <td className="px-3 py-2 text-right font-semibold text-foreground">
                          {total.toLocaleString("es-PE")}
                          {cfg.unidad === "%" ? "%" : ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {vista === "linea" && (
            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={datos}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="periodo" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Legend />
                {cfg.series.map((s, i) => (
                  <Line
                    key={s.nombre}
                    type="monotone"
                    dataKey={s.nombre}
                    stroke={COLORES[i % COLORES.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}

          {vista === "histograma" && (
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={datos}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="periodo" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Legend />
                {cfg.series.map((s, i) => (
                  <Bar key={s.nombre} dataKey={s.nombre} fill={COLORES[i % COLORES.length]} radius={[6, 6, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
