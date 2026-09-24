import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader } from "../shared/PageHeader";
import { DataTable } from "../shared/DataTable";

// APL — Generación de estadísticas (solo consulta).
// Panel simple del proceso batch que consolida los contactos hechos por cada
// operador. Filtros y datos son de muestra: no recalculan nada.

const DEMANDA = [
  { dia: "12/06", IVR: 120, Whatsapp: 180, Correo: 90, SMS: 210 },
  { dia: "13/06", IVR: 95, Whatsapp: 160, Correo: 110, SMS: 240 },
  { dia: "14/06", IVR: 130, Whatsapp: 140, Correo: 80, SMS: 190 },
  { dia: "15/06", IVR: 150, Whatsapp: 200, Correo: 120, SMS: 260 },
  { dia: "16/06", IVR: 110, Whatsapp: 175, Correo: 95, SMS: 225 },
];

const CONTACTOS = [
  { id: 1, operador: "IVR", moroso: "Moroso 1", fecha: "12/06/2026", hora: "09:15", resultado: "Respondió" },
  { id: 2, operador: "SMS", moroso: "Moroso 2", fecha: "12/06/2026", hora: "09:30", resultado: "Acuerdo alcanzado" },
  { id: 3, operador: "Llamadas", moroso: "Moroso 3", fecha: "12/06/2026", hora: "09:45", resultado: "No respondió" },
  { id: 4, operador: "Correo", moroso: "Moroso 1", fecha: "12/06/2026", hora: "10:00", resultado: "No contactado" },
  { id: 5, operador: "SMS", moroso: "Moroso 4", fecha: "13/06/2026", hora: "10:30", resultado: "Respondió" },
  { id: 6, operador: "Llamadas", moroso: "Moroso 2", fecha: "13/06/2026", hora: "11:00", resultado: "Respondió" },
  { id: 7, operador: "IVR", moroso: "Moroso 5", fecha: "14/06/2026", hora: "12:00", resultado: "Acuerdo alcanzado" },
  { id: 8, operador: "Correo", moroso: "Moroso 6", fecha: "14/06/2026", hora: "13:00", resultado: "Respondió" },
];

const TOTALES = [
  { label: "Llamadas IVR", valor: 60 },
  { label: "Llamadas", valor: 40 },
  { label: "Correos", valor: 20 },
  { label: "SMS", valor: 55 },
];

const COLORES: Record<string, string> = {
  IVR: "#f59e0b",
  Whatsapp: "#06b6d4",
  Correo: "#10b981",
  SMS: "#ef4444",
};

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

export function GeneracionEstadisticas() {
  const [tipo, setTipo] = useState("Informe de operadores de hostigamiento");
  const [periodo, setPeriodo] = useState("Diario");

  return (
    <div className="min-h-full bg-background">
      <PageHeader
        title="Generación de estadísticas"
        subtitle="Consolidado de contactos por operador que produce el proceso batch. Solo consulta."
      />

      <div className="space-y-6 p-6 lg:p-8">
        {/* Programación del informe (demostrativa) */}
        <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border bg-card p-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Tipo de estadística
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option>Informe de operadores de hostigamiento</option>
              <option>Informe de contactabilidad por canal</option>
              <option>Informe de acuerdos alcanzados</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Periodo de ejecución
            </label>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option>Diario</option>
              <option>Semanal</option>
              <option>Mensual</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Rango de fechas
            </label>
            <div className="flex items-center gap-2">
              <input type="date" defaultValue="2026-06-12" className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground" />
              <span className="text-sm text-muted-foreground">a</span>
              <input type="date" defaultValue="2026-06-30" className="rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground" />
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Prototipo: los filtros son demostrativos; el informe que se muestra es de datos fijos de muestra.
        </p>

        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Demanda por operador y día</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={DEMANDA}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="dia" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
              <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Legend />
              {Object.keys(COLORES).map((k) => (
                <Bar key={k} dataKey={k} fill={COLORES[k]} radius={[4, 4, 0, 0]} isAnimationActive={false} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          {TOTALES.map((t) => (
            <div key={t.label} className="rounded-xl border border-border bg-card p-5">
              <p className="text-sm text-muted-foreground">Número de {t.label.toLowerCase()}</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{t.valor}</p>
            </div>
          ))}
        </div>

        <DataTable
          title="Detalle de contactos"
          searchPlaceholder="Buscar por operador o moroso..."
          columns={[
            { key: "operador", label: "Operador", sortable: true },
            { key: "moroso", label: "Moroso", sortable: true },
            { key: "fecha", label: "Fecha", sortable: true },
            { key: "hora", label: "Hora" },
            { key: "resultado", label: "Resultado de contacto" },
          ]}
          data={CONTACTOS}
        />
      </div>
    </div>
  );
}
