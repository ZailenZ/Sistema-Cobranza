import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Building2, DollarSign, TrendingUp, Users } from "lucide-react";

import { PageHeader } from "../../shared/PageHeader";
import { KPICard } from "../../shared/KPICard";
import { DataTable } from "../../shared/DataTable";
import { getSponsors } from "../../../store/localDb";
import { seedAllIfEmpty } from "../../../store/seedAll";

const fmtSol = (n: number) => `S/ ${n.toLocaleString("es-PE")}`;

export function Sponsors() {
  seedAllIfEmpty();
  const [rubroFiltro, setRubroFiltro] = useState("");

  const sponsors = useMemo(() => getSponsors(), []);
  const rubros = useMemo(() => [...new Set(sponsors.map((s) => s.rubro))].sort(), [sponsors]);

  const filtered = useMemo(
    () => sponsors.filter((s) => !rubroFiltro || s.rubro === rubroFiltro),
    [sponsors, rubroFiltro],
  );

  const kpis = useMemo(() => {
    const n = filtered.length || 1;
    const sumAsignada = filtered.reduce((s, x) => s + x.carteraAsignada, 0);
    const sumRecuperada = filtered.reduce((s, x) => s + x.carteraRecuperada, 0);
    return {
      total: filtered.length,
      sumAsignada,
      sumRecuperada,
      tasa: sumAsignada > 0 ? (sumRecuperada / sumAsignada) * 100 : 0,
    };
  }, [filtered]);

  const chartData = filtered.map((s) => ({
    sponsor: s.razonSocial.length > 18 ? s.razonSocial.slice(0, 18) + "…" : s.razonSocial,
    Asignada: s.carteraAsignada,
    Recuperada: s.carteraRecuperada,
  }));

  return (
    <div className="min-h-full bg-background">
      <PageHeader
        title="Consulta de Sponsors"
        subtitle="Entidades/empresas que encargan cartera de cobranza y su avance de recuperación"
      />

      <div className="space-y-6 p-6 lg:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Filtrar por:</span>
          <select
            value={rubroFiltro}
            onChange={(e) => setRubroFiltro(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Todos los rubros</option>
            {rubros.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          {rubroFiltro && (
            <button
              onClick={() => setRubroFiltro("")}
              className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Limpiar filtros
            </button>
          )}
          <span className="ml-auto text-xs text-muted-foreground">{filtered.length} sponsor(s)</span>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KPICard title="Sponsors" value={kpis.total} icon={Building2} variant="secondary" />
          <KPICard title="Cartera Asignada" value={fmtSol(kpis.sumAsignada)} icon={DollarSign} variant="secondary" />
          <KPICard title="Cartera Recuperada" value={fmtSol(kpis.sumRecuperada)} icon={TrendingUp} variant="secondary" />
          <KPICard title="Tasa de Recuperación" value={`${kpis.tasa.toFixed(1)}%`} icon={Users} variant="secondary" />
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-foreground">Cartera asignada vs recuperada por sponsor</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="sponsor" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
              <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
              <Tooltip
                formatter={(v: number) => [fmtSol(Number(v)), ""]}
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  color: "var(--foreground)",
                }}
              />
              <Bar dataKey="Asignada" fill="#9ca3af" opacity={0.6} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Recuperada" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <DataTable
          title="Sponsors"
          searchPlaceholder="Buscar sponsor..."
          onExport={() => {}}
          columns={[
            { key: "codigo", label: "Código", sortable: true },
            { key: "razonSocial", label: "Razón Social", sortable: true },
            { key: "rubro", label: "Rubro" },
            { key: "contacto", label: "Contacto" },
            { key: "carteraAsignada", label: "Cartera Asignada", sortable: true, render: (i: any) => fmtSol(i.carteraAsignada) },
            { key: "carteraRecuperada", label: "Cartera Recuperada", sortable: true, render: (i: any) => fmtSol(i.carteraRecuperada) },
            {
              key: "tasa", label: "Tasa Recuperación",
              render: (i: any) => `${((i.carteraRecuperada / i.carteraAsignada) * 100).toFixed(1)}%`,
            },
            {
              key: "estado", label: "Estado",
              render: (i: any) => (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${i.estado === "Activo" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                  {i.estado}
                </span>
              ),
            },
          ]}
          data={filtered}
        />
      </div>
    </div>
  );
}
