import { useMemo, useState } from "react";
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
import { Clock, DollarSign, HandCoins, MessageSquareReply, Percent, TrendingUp } from "lucide-react";

import { PageHeader } from "../../shared/PageHeader";
import { KPICard } from "../../shared/KPICard";

// Indicadores de Gestión de Cobranza. El histórico por periodo es data de muestra
// (el prototipo no acumula meses reales); el detalle del día a día vive en las
// pantallas operativas y en las consultas de Sponsors y Morosos.

type RegistroKpi = {
  periodo: string;
  sponsor: string;
  montoAsignado: number;
  montoRecuperado: number;
  /** Gestiones enviadas y cuántas obtuvieron respuesta del moroso. */
  gestiones: number;
  respuestas: number;
  /** Días promedio entre la gestión enviada y la respuesta/cierre del caso. */
  diasResolucion: number;
  /** Compromisos de pago obtenidos y cuántos terminaron pagándose. */
  compromisos: number;
  pagosCumplidos: number;
};

const HISTORICO: RegistroKpi[] = [
  { periodo: "2026-04", sponsor: "Financiera Andina S.A.", montoAsignado: 210000, montoRecuperado: 98000, gestiones: 820, respuestas: 214, diasResolucion: 4.8, compromisos: 96, pagosCumplidos: 54 },
  { periodo: "2026-04", sponsor: "Retail Norte S.A.C.", montoAsignado: 104000, montoRecuperado: 41000, gestiones: 410, respuestas: 121, diasResolucion: 6.1, compromisos: 52, pagosCumplidos: 24 },
  { periodo: "2026-04", sponsor: "Telecom del Sur S.A.", montoAsignado: 76000, montoRecuperado: 52000, gestiones: 300, respuestas: 118, diasResolucion: 3.9, compromisos: 44, pagosCumplidos: 29 },
  { periodo: "2026-05", sponsor: "Financiera Andina S.A.", montoAsignado: 218000, montoRecuperado: 121000, gestiones: 860, respuestas: 251, diasResolucion: 4.4, compromisos: 104, pagosCumplidos: 63 },
  { periodo: "2026-05", sponsor: "Retail Norte S.A.C.", montoAsignado: 108000, montoRecuperado: 47000, gestiones: 425, respuestas: 134, diasResolucion: 5.8, compromisos: 56, pagosCumplidos: 27 },
  { periodo: "2026-05", sponsor: "Telecom del Sur S.A.", montoAsignado: 79000, montoRecuperado: 61000, gestiones: 312, respuestas: 129, diasResolucion: 3.6, compromisos: 47, pagosCumplidos: 33 },
  { periodo: "2026-06", sponsor: "Financiera Andina S.A.", montoAsignado: 224000, montoRecuperado: 143000, gestiones: 890, respuestas: 275, diasResolucion: 4.1, compromisos: 112, pagosCumplidos: 71 },
  { periodo: "2026-06", sponsor: "Retail Norte S.A.C.", montoAsignado: 112000, montoRecuperado: 58000, gestiones: 440, respuestas: 146, diasResolucion: 5.5, compromisos: 60, pagosCumplidos: 31 },
  { periodo: "2026-06", sponsor: "Telecom del Sur S.A.", montoAsignado: 83000, montoRecuperado: 69000, gestiones: 325, respuestas: 138, diasResolucion: 3.4, compromisos: 50, pagosCumplidos: 36 },
  { periodo: "2026-07", sponsor: "Financiera Andina S.A.", montoAsignado: 231000, montoRecuperado: 150000, gestiones: 915, respuestas: 289, diasResolucion: 3.9, compromisos: 118, pagosCumplidos: 76 },
  { periodo: "2026-07", sponsor: "Retail Norte S.A.C.", montoAsignado: 118000, montoRecuperado: 52000, gestiones: 452, respuestas: 140, diasResolucion: 5.9, compromisos: 58, pagosCumplidos: 28 },
  { periodo: "2026-07", sponsor: "Telecom del Sur S.A.", montoAsignado: 88000, montoRecuperado: 74000, gestiones: 338, respuestas: 147, diasResolucion: 3.2, compromisos: 53, pagosCumplidos: 39 },
];

const fmtSol = (n: number) => `S/ ${n.toLocaleString("es-PE")}`;

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

export function IndicadoresKPI() {
  const [periodoFiltro, setPeriodoFiltro] = useState("");
  const [sponsorFiltro, setSponsorFiltro] = useState("");

  const periodos = useMemo(() => [...new Set(HISTORICO.map((r) => r.periodo))].sort(), []);
  const sponsors = useMemo(() => [...new Set(HISTORICO.map((r) => r.sponsor))].sort(), []);

  const filtrado = useMemo(
    () =>
      HISTORICO.filter(
        (r) => (!periodoFiltro || r.periodo === periodoFiltro) && (!sponsorFiltro || r.sponsor === sponsorFiltro),
      ),
    [periodoFiltro, sponsorFiltro],
  );

  const totales = useMemo(() => {
    const suma = (f: (r: RegistroKpi) => number) => filtrado.reduce((s, r) => s + f(r), 0);
    const asignado = suma((r) => r.montoAsignado);
    const recuperado = suma((r) => r.montoRecuperado);
    const gestiones = suma((r) => r.gestiones);
    const respuestas = suma((r) => r.respuestas);
    const compromisos = suma((r) => r.compromisos);
    const pagos = suma((r) => r.pagosCumplidos);
    // El tiempo de resolución se pondera por gestiones: un periodo con más envíos pesa más.
    const diasPonderados = suma((r) => r.diasResolucion * r.gestiones);
    return {
      asignado,
      recuperado,
      tasa: asignado > 0 ? (recuperado / asignado) * 100 : 0,
      tasaRespuesta: gestiones > 0 ? (respuestas / gestiones) * 100 : 0,
      tiempoResolucion: gestiones > 0 ? diasPonderados / gestiones : 0,
      tasaPagos: compromisos > 0 ? (pagos / compromisos) * 100 : 0,
      gestiones,
      respuestas,
      compromisos,
      pagos,
    };
  }, [filtrado]);

  const porPeriodo = useMemo(() => {
    const mapa = new Map<string, { periodo: string; Asignado: number; Recuperado: number }>();
    for (const r of filtrado) {
      const acc = mapa.get(r.periodo) ?? { periodo: r.periodo, Asignado: 0, Recuperado: 0 };
      acc.Asignado += r.montoAsignado;
      acc.Recuperado += r.montoRecuperado;
      mapa.set(r.periodo, acc);
    }
    return [...mapa.values()].sort((a, b) => a.periodo.localeCompare(b.periodo));
  }, [filtrado]);

  const rankingSponsors = useMemo(() => {
    const mapa = new Map<string, { sponsor: string; Recuperado: number }>();
    for (const r of filtrado) {
      const acc = mapa.get(r.sponsor) ?? { sponsor: r.sponsor, Recuperado: 0 };
      acc.Recuperado += r.montoRecuperado;
      mapa.set(r.sponsor, acc);
    }
    return [...mapa.values()]
      .sort((a, b) => b.Recuperado - a.Recuperado)
      .map((r) => ({ ...r, sponsor: r.sponsor.length > 20 ? r.sponsor.slice(0, 20) + "…" : r.sponsor }));
  }, [filtrado]);

  const hayFiltros = periodoFiltro || sponsorFiltro;

  return (
    <div className="min-h-full bg-background">
      <PageHeader
        title="Indicadores KPI"
        subtitle="Recuperación de cartera por periodo y por sponsor"
      />

      <div className="space-y-6 p-6 lg:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Filtrar por:</span>
          <select
            value={periodoFiltro}
            onChange={(e) => setPeriodoFiltro(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Todos los periodos</option>
            {periodos.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <select
            value={sponsorFiltro}
            onChange={(e) => setSponsorFiltro(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Todos los sponsors</option>
            {sponsors.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {hayFiltros && (
            <button
              onClick={() => { setPeriodoFiltro(""); setSponsorFiltro(""); }}
              className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <KPICard title="Monto asignado" value={fmtSol(totales.asignado)} icon={TrendingUp} variant="secondary" />
          <KPICard title="Monto recuperado" value={fmtSol(totales.recuperado)} icon={DollarSign} variant="secondary" />
          <KPICard title="Tasa de recuperación" value={`${totales.tasa.toFixed(1)}%`} icon={Percent} variant="secondary" />
          <KPICard
            title="Tasa de respuestas"
            value={`${totales.tasaRespuesta.toFixed(1)}%`}
            icon={MessageSquareReply}
            variant="secondary"
            subtitle={`${totales.respuestas.toLocaleString("es-PE")} de ${totales.gestiones.toLocaleString("es-PE")} gestiones`}
          />
          <KPICard
            title="Tiempo promedio de resolución"
            value={`${totales.tiempoResolucion.toFixed(1)} días`}
            icon={Clock}
            variant="secondary"
            subtitle="Desde la gestión enviada hasta la respuesta"
          />
          <KPICard
            title="Tasa de recuperación de pagos"
            value={`${totales.tasaPagos.toFixed(1)}%`}
            icon={HandCoins}
            variant="secondary"
            subtitle={`${totales.pagos.toLocaleString("es-PE")} de ${totales.compromisos.toLocaleString("es-PE")} compromisos pagados`}
          />
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Monto asignado vs recuperado por periodo</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={porPeriodo}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="periodo" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
              <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
              <Tooltip formatter={(v: number) => fmtSol(Number(v))} {...TOOLTIP_STYLE} />
              <Legend />
              <Bar dataKey="Asignado" fill="var(--muted-foreground)" opacity={0.5} radius={[6, 6, 0, 0]} />
              <Bar dataKey="Recuperado" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Ranking de sponsors — monto recuperado</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={rankingSponsors} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="sponsor"
                width={150}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <Tooltip formatter={(v: number) => fmtSol(Number(v))} {...TOOLTIP_STYLE} />
              <Bar dataKey="Recuperado" fill="var(--primary)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
