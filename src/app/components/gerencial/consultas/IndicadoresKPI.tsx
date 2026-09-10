import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  AlertTriangle,
  BarChart2,
  DollarSign,
  PhoneCall,
  Percent,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

import { PageHeader } from "../../shared/PageHeader";
import { KPICard } from "../../shared/KPICard";

// Indicadores de Gestión de Cobranza — respaldados por la tabla COMP_KPI_COBRANZA,
// generada por el proceso batch de pre-cálculo de KPIs (3.1.2.6).

type EstadoIndicador = "ÓPTIMO" | "REGULAR" | "CRÍTICO";

type CompKpiCobranza = {
  codCompKpi: string;
  periodo: string;
  sponsor: string;
  canal: string;
  casosAsignados: number;
  casosGestionados: number;
  casosContactados: number;
  promesasPago: number;
  promesasCumplidas: number;
  montoAsignado: number;
  montoRecuperado: number;
  tasaContactabilidad: number; // ratio 0–1
  tasaEfectividad: number;     // ratio 0–1
  tasaCumplimiento: number;    // ratio 0–1 (promesas cumplidas / promesas)
  estadoIndicador: EstadoIndicador;
};

const MOCK_DATA: CompKpiCobranza[] = [
  {
    codCompKpi: "KPI-001", periodo: "2026-04", sponsor: "SPN-FIN-ANDINA", canal: "Llamada",
    casosAsignados: 180, casosGestionados: 162, casosContactados: 118, promesasPago: 54, promesasCumplidas: 41,
    montoAsignado: 210000, montoRecuperado: 98000,
    tasaContactabilidad: 0.728, tasaEfectividad: 0.467, tasaCumplimiento: 0.759, estadoIndicador: "ÓPTIMO",
  },
  {
    codCompKpi: "KPI-002", periodo: "2026-04", sponsor: "SPN-RETAIL-NORTE", canal: "SMS",
    casosAsignados: 120, casosGestionados: 95, casosContactados: 52, promesasPago: 20, promesasCumplidas: 11,
    montoAsignado: 96000, montoRecuperado: 28000,
    tasaContactabilidad: 0.433, tasaEfectividad: 0.211, tasaCumplimiento: 0.550, estadoIndicador: "CRÍTICO",
  },
  {
    codCompKpi: "KPI-003", periodo: "2026-04", sponsor: "SPN-TELECOM-SUR", canal: "WhatsApp",
    casosAsignados: 96, casosGestionados: 88, casosContactados: 66, promesasPago: 33, promesasCumplidas: 27,
    montoAsignado: 74000, montoRecuperado: 51000,
    tasaContactabilidad: 0.688, tasaEfectividad: 0.375, tasaCumplimiento: 0.818, estadoIndicador: "ÓPTIMO",
  },
  {
    codCompKpi: "KPI-004", periodo: "2026-05", sponsor: "SPN-FIN-ANDINA", canal: "Llamada",
    casosAsignados: 190, casosGestionados: 175, casosContactados: 129, promesasPago: 61, promesasCumplidas: 46,
    montoAsignado: 225000, montoRecuperado: 112000,
    tasaContactabilidad: 0.737, tasaEfectividad: 0.463, tasaCumplimiento: 0.754, estadoIndicador: "ÓPTIMO",
  },
  {
    codCompKpi: "KPI-005", periodo: "2026-05", sponsor: "SPN-RETAIL-NORTE", canal: "SMS",
    casosAsignados: 128, casosGestionados: 101, casosContactados: 58, promesasPago: 22, promesasCumplidas: 13,
    montoAsignado: 102000, montoRecuperado: 33000,
    tasaContactabilidad: 0.453, tasaEfectividad: 0.257, tasaCumplimiento: 0.591, estadoIndicador: "REGULAR",
  },
  {
    codCompKpi: "KPI-006", periodo: "2026-05", sponsor: "SPN-TELECOM-SUR", canal: "WhatsApp",
    casosAsignados: 102, casosGestionados: 94, casosContactados: 74, promesasPago: 38, promesasCumplidas: 32,
    montoAsignado: 79000, montoRecuperado: 58000,
    tasaContactabilidad: 0.725, tasaEfectividad: 0.402, tasaCumplimiento: 0.842, estadoIndicador: "ÓPTIMO",
  },
  {
    codCompKpi: "KPI-007", periodo: "2026-06", sponsor: "SPN-FIN-ANDINA", canal: "Llamada",
    casosAsignados: 198, casosGestionados: 184, casosContactados: 139, promesasPago: 66, promesasCumplidas: 52,
    montoAsignado: 232000, montoRecuperado: 121000,
    tasaContactabilidad: 0.756, tasaEfectividad: 0.475, tasaCumplimiento: 0.788, estadoIndicador: "ÓPTIMO",
  },
  {
    codCompKpi: "KPI-008", periodo: "2026-06", sponsor: "SPN-RETAIL-NORTE", canal: "SMS",
    casosAsignados: 132, casosGestionados: 108, casosContactados: 61, promesasPago: 24, promesasCumplidas: 14,
    montoAsignado: 106000, montoRecuperado: 37000,
    tasaContactabilidad: 0.465, tasaEfectividad: 0.265, tasaCumplimiento: 0.583, estadoIndicador: "REGULAR",
  },
  {
    codCompKpi: "KPI-009", periodo: "2026-06", sponsor: "SPN-TELECOM-SUR", canal: "WhatsApp",
    casosAsignados: 108, casosGestionados: 101, casosContactados: 80, promesasPago: 41, promesasCumplidas: 35,
    montoAsignado: 82000, montoRecuperado: 63000,
    tasaContactabilidad: 0.741, tasaEfectividad: 0.412, tasaCumplimiento: 0.854, estadoIndicador: "ÓPTIMO",
  },
];

const fmt = (n: number) => n.toLocaleString("es-PE");
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;
const fmtSol = (n: number) => `S/ ${n.toLocaleString("es-PE")}`;

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
    color: "var(--foreground)",
  },
  labelStyle: { color: "var(--foreground)", fontWeight: 600 as const },
  itemStyle: { color: "var(--foreground)", fontWeight: 500 as const },
};

const ESTADO_BADGE: Record<EstadoIndicador, string> = {
  "ÓPTIMO":  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "REGULAR": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "CRÍTICO": "bg-red-100  text-red-700   dark:bg-red-900/30   dark:text-red-400",
};

export function IndicadoresKPI() {
  const [periodoFiltro, setPeriodoFiltro] = useState("");
  const [sponsorFiltro, setSponsorFiltro] = useState("");
  const [canalFiltro, setCanalFiltro] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");

  const periodos = useMemo(() => [...new Set(MOCK_DATA.map((r) => r.periodo))].sort(), []);
  const sponsors = useMemo(() => [...new Set(MOCK_DATA.map((r) => r.sponsor))].sort(), []);
  const canales = useMemo(() => [...new Set(MOCK_DATA.map((r) => r.canal))].sort(), []);
  const estados: EstadoIndicador[] = ["ÓPTIMO", "REGULAR", "CRÍTICO"];

  const filtered = useMemo(
    () =>
      MOCK_DATA.filter(
        (r) =>
          (!periodoFiltro || r.periodo === periodoFiltro) &&
          (!sponsorFiltro || r.sponsor === sponsorFiltro) &&
          (!canalFiltro || r.canal === canalFiltro) &&
          (!estadoFiltro || r.estadoIndicador === estadoFiltro),
      ),
    [periodoFiltro, sponsorFiltro, canalFiltro, estadoFiltro],
  );

  const kpis = useMemo(() => {
    if (filtered.length === 0) return null;
    const n = filtered.length;

    const sumAsignados = filtered.reduce((s, r) => s + r.casosAsignados, 0);
    const sumGestionados = filtered.reduce((s, r) => s + r.casosGestionados, 0);
    const sumContactados = filtered.reduce((s, r) => s + r.casosContactados, 0);
    const sumPromesas = filtered.reduce((s, r) => s + r.promesasPago, 0);
    const sumCumplidas = filtered.reduce((s, r) => s + r.promesasCumplidas, 0);
    const sumMontoAsignado = filtered.reduce((s, r) => s + r.montoAsignado, 0);
    const sumMontoRecuperado = filtered.reduce((s, r) => s + r.montoRecuperado, 0);
    const avgContactabilidad = filtered.reduce((s, r) => s + r.tasaContactabilidad, 0) / n;
    const avgEfectividad = filtered.reduce((s, r) => s + r.tasaEfectividad, 0) / n;
    const avgCumplimiento = filtered.reduce((s, r) => s + r.tasaCumplimiento, 0) / n;

    const casosPendientes = sumAsignados - sumGestionados;
    const tasaRecuperacion = sumMontoAsignado > 0 ? (sumMontoRecuperado / sumMontoAsignado) * 100 : 0;
    const brechaMonto = sumMontoAsignado - sumMontoRecuperado;

    return {
      sumAsignados, sumGestionados, sumContactados, sumPromesas, sumCumplidas,
      sumMontoAsignado, sumMontoRecuperado,
      avgContactabilidad, avgEfectividad, avgCumplimiento,
      casosPendientes, tasaRecuperacion, brechaMonto,
    };
  }, [filtered]);

  const periodChartData = useMemo(() => {
    type Acc = {
      periodo: string; efSum: number; cnt: number;
      montoAsignado: number; montoRecuperado: number;
      promesas: number; cumplidas: number;
    };
    const map = new Map<string, Acc>();
    for (const r of filtered) {
      const e = map.get(r.periodo) ?? {
        periodo: r.periodo, efSum: 0, cnt: 0,
        montoAsignado: 0, montoRecuperado: 0, promesas: 0, cumplidas: 0,
      };
      e.efSum += r.tasaEfectividad;
      e.cnt += 1;
      e.montoAsignado += r.montoAsignado;
      e.montoRecuperado += r.montoRecuperado;
      e.promesas += r.promesasPago;
      e.cumplidas += r.promesasCumplidas;
      map.set(r.periodo, e);
    }
    return Array.from(map.values())
      .sort((a, b) => a.periodo.localeCompare(b.periodo))
      .map(({ periodo, efSum, cnt, montoAsignado, montoRecuperado, promesas, cumplidas }) => ({
        periodo,
        "Efectividad %": Number(((efSum / cnt) * 100).toFixed(1)),
        "Monto asignado": montoAsignado,
        "Monto recuperado": montoRecuperado,
        "Promesas": promesas,
        "Cumplidas": cumplidas,
      }));
  }, [filtered]);

  const sponsorChartData = useMemo(() => {
    type Acc = { sponsor: string; montoRecuperado: number; contSum: number; cnt: number };
    const map = new Map<string, Acc>();
    for (const r of filtered) {
      const e = map.get(r.sponsor) ?? { sponsor: r.sponsor, montoRecuperado: 0, contSum: 0, cnt: 0 };
      e.montoRecuperado += r.montoRecuperado;
      e.contSum += r.tasaContactabilidad;
      e.cnt += 1;
      map.set(r.sponsor, e);
    }
    return Array.from(map.values())
      .sort((a, b) => b.montoRecuperado - a.montoRecuperado)
      .map(({ sponsor, montoRecuperado, contSum, cnt }) => ({
        sponsor: sponsor.replace("SPN-", ""),
        "Monto recuperado": montoRecuperado,
        "Contactabilidad %": Number(((contSum / cnt) * 100).toFixed(2)),
      }));
  }, [filtered]);

  const limpiarFiltros = () => {
    setPeriodoFiltro(""); setSponsorFiltro(""); setCanalFiltro(""); setEstadoFiltro("");
  };
  const hayFiltros = periodoFiltro || sponsorFiltro || canalFiltro || estadoFiltro;

  return (
    <div className="min-h-full bg-background">
      <PageHeader
        title="Indicadores KPI de Cobranza"
        subtitle="Consolidado batch de contactabilidad, efectividad, promesas de pago y recuperación de cartera"
        actions={
          <span className="text-xs text-muted-foreground">
            Última actualización batch: 01/07/2026 03:45
          </span>
        }
      />

      <div className="space-y-6 p-6 lg:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Filtrar por:</span>

          {[
            { label: "Periodo", value: periodoFiltro, set: setPeriodoFiltro, opts: periodos, placeholder: "Todos los periodos" },
            { label: "Sponsor", value: sponsorFiltro, set: setSponsorFiltro, opts: sponsors, placeholder: "Todos los sponsors" },
            { label: "Canal", value: canalFiltro, set: setCanalFiltro, opts: canales, placeholder: "Todos los canales" },
            { label: "Estado", value: estadoFiltro, set: setEstadoFiltro, opts: estados as string[], placeholder: "Todos los estados" },
          ].map(({ label, value, set, opts, placeholder }) => (
            <select
              key={label}
              value={value}
              onChange={(e) => set(e.target.value)}
              className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">{placeholder}</option>
              {opts.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}

          {hayFiltros && (
            <button
              onClick={limpiarFiltros}
              className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Limpiar filtros
            </button>
          )}
          <span className="ml-auto text-xs text-muted-foreground">{filtered.length} registro(s)</span>
        </div>

        {!kpis ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Sin datos para los filtros seleccionados.
          </p>
        ) : (
          <>
            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Casos y contactabilidad
              </h3>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <KPICard
                  title="Contactabilidad"
                  value={fmtPct(kpis.avgContactabilidad)}
                  subtitle="Promedio del periodo"
                  icon={PhoneCall}
                  variant="secondary"
                />
                <KPICard
                  title="Casos gestionados"
                  value={fmt(kpis.sumGestionados)}
                  subtitle={`de ${fmt(kpis.sumAsignados)} asignados`}
                  icon={Users}
                  variant="secondary"
                />
                <KPICard
                  title="Casos pendientes"
                  value={fmt(kpis.casosPendientes)}
                  subtitle="Asignados − Gestionados"
                  icon={Users}
                  variant="secondary"
                />
                <KPICard
                  title="Promesas de pago"
                  value={fmt(kpis.sumPromesas)}
                  subtitle={`${fmt(kpis.sumCumplidas)} cumplidas`}
                  icon={AlertTriangle}
                  variant="secondary"
                />
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Recuperación de cartera
              </h3>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <KPICard title="Monto recuperado" value={fmtSol(kpis.sumMontoRecuperado)} icon={DollarSign} variant="secondary" />
                <KPICard title="Monto asignado" value={fmtSol(kpis.sumMontoAsignado)} icon={TrendingUp} variant="secondary" />
                <KPICard title="Brecha de recuperación" value={fmtSol(kpis.brechaMonto)} subtitle="Asignado − Recuperado" icon={TrendingDown} variant="secondary" />
                <KPICard title="Tasa de recuperación" value={`${kpis.tasaRecuperacion.toFixed(1)}%`} icon={DollarSign} variant="secondary" />
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Efectividad y cumplimiento de promesas
              </h3>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <KPICard title="Efectividad de gestión" value={fmtPct(kpis.avgEfectividad)} icon={BarChart2} variant="destructive" />
                <KPICard title="Cumplimiento de promesas" value={fmtPct(kpis.avgCumplimiento)} icon={Percent} variant="secondary" />
                <KPICard
                  title="% Casos contactados"
                  value={`${kpis.sumGestionados > 0 ? ((kpis.sumContactados / kpis.sumGestionados) * 100).toFixed(1) : "0.0"}%`}
                  subtitle="Contactados / Gestionados"
                  icon={Percent}
                  variant="secondary"
                />
                <KPICard title="Promesas incumplidas" value={fmt(kpis.sumPromesas - kpis.sumCumplidas)} icon={AlertTriangle} variant="destructive" />
              </div>
            </div>

            <div className="col-span-2 rounded-xl border border-border bg-card p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Estado indicador — distribución
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {(["ÓPTIMO", "REGULAR", "CRÍTICO"] as EstadoIndicador[]).map((estado) => {
                  const count = filtered.filter((r) => r.estadoIndicador === estado).length;
                  return (
                    <span key={estado} className={`rounded-full px-3 py-1 text-sm font-medium ${ESTADO_BADGE[estado]}`}>
                      {estado}: {count}
                    </span>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Total de registros en la selección: {filtered.length}
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h3 className="mb-4 font-semibold text-foreground">Evolución de efectividad por periodo</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={periodChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="periodo" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                    <YAxis domain={[0, 100]} unit="%" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                    <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`${v}%`, "Efectividad"]} />
                    <Line type="monotone" dataKey="Efectividad %" stroke="var(--foreground)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--foreground)" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h3 className="mb-4 font-semibold text-foreground">Monto asignado vs recuperado por periodo</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={periodChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="periodo" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                    <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                    <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`S/ ${v.toLocaleString("es-PE")}`, ""]} />
                    <Legend wrapperStyle={{ color: "var(--muted-foreground)", fontSize: 12 }} />
                    <Bar dataKey="Monto asignado" fill="#9ca3af" opacity={0.5} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Monto recuperado" fill="var(--foreground)" opacity={0.85} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h3 className="mb-4 font-semibold text-foreground">Promesas generadas vs cumplidas por periodo</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={periodChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="periodo" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                    <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ color: "var(--muted-foreground)", fontSize: 12 }} />
                    <Bar dataKey="Promesas" fill="var(--foreground)" opacity={0.8} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Cumplidas" fill="#22c55e" opacity={0.7} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h3 className="mb-4 font-semibold text-foreground">Ranking de sponsors — monto recuperado</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={sponsorChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                    <YAxis type="category" dataKey="sponsor" width={110} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                    <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`S/ ${v.toLocaleString("es-PE")}`, "Monto recuperado"]} />
                    <Bar dataKey="Monto recuperado" fill="var(--primary)" opacity={0.85} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h3 className="font-semibold text-foreground">Registros COMP_KPI_COBRANZA</h3>
                <span className="text-xs text-muted-foreground">{filtered.length} registros</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/35 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Periodo</th>
                      <th className="px-4 py-3 text-left font-semibold">Sponsor</th>
                      <th className="px-4 py-3 text-left font-semibold">Canal</th>
                      <th className="px-4 py-3 text-right font-semibold">Asignados</th>
                      <th className="px-4 py-3 text-right font-semibold">Gestionados</th>
                      <th className="px-4 py-3 text-right font-semibold">Promesas</th>
                      <th className="px-4 py-3 text-right font-semibold">Cumplidas</th>
                      <th className="px-4 py-3 text-right font-semibold">Contactabilidad</th>
                      <th className="px-4 py-3 text-right font-semibold">Monto asignado</th>
                      <th className="px-4 py-3 text-right font-semibold">Monto recuperado</th>
                      <th className="px-4 py-3 text-left font-semibold">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filtered.map((r) => (
                      <tr key={r.codCompKpi} className="hover:bg-muted/20">
                        <td className="px-4 py-3 text-foreground">{r.periodo}</td>
                        <td className="px-4 py-3 font-medium text-foreground">{r.sponsor}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.canal}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-foreground">{r.casosAsignados}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-foreground">{r.casosGestionados}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-foreground">{r.promesasPago}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-foreground">{r.promesasCumplidas}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-foreground">{fmtPct(r.tasaContactabilidad)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-foreground">{fmtSol(r.montoAsignado)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-foreground">{fmtSol(r.montoRecuperado)}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ESTADO_BADGE[r.estadoIndicador]}`}>
                            {r.estadoIndicador}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
