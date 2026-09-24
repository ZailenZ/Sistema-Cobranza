import { useMemo, useState } from "react";
import { AlertTriangle, DollarSign, UserX, Users } from "lucide-react";

import { PageHeader } from "../../shared/PageHeader";
import { KPICard } from "../../shared/KPICard";
import { DataTable } from "../../shared/DataTable";
import { getCatalog, getDeudas, getDeudores, getSponsors } from "../../../store/localDb";
import { seedAllIfEmpty } from "../../../store/seedAll";
import type { TipoMoroso } from "../../../store/catalogSeed";

const fmtSol = (n: number) => `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;

const estadoBadge = (estado: string) => {
  const map: Record<string, string> = {
    "Al día": "bg-emerald-100 text-emerald-700",
    "En Mora": "bg-amber-100 text-amber-700",
  };
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${map[estado] || "bg-muted text-muted-foreground"}`}>
      {estado}
    </span>
  );
};

export function Morosos() {
  seedAllIfEmpty();
  const [estadoFiltro, setEstadoFiltro] = useState("");
  const [sponsorFiltro, setSponsorFiltro] = useState("");

  const deudores = useMemo(() => getDeudores(), []);
  const deudas = useMemo(() => getDeudas(), []);
  const sponsors = useMemo(() => getSponsors(), []);
  const tiposMoroso = useMemo(() => getCatalog<TipoMoroso>("morosos", []), []);

  const sponsorNombre = (id: string) => sponsors.find((s) => s.id === id)?.razonSocial || id;

  /** Perfil del Catálogo de Morosos en el que cae un deudor según sus días de mora. */
  const tipoMorosoDe = (diasMora: number) =>
    tiposMoroso.find(
      (m) => m.estado === "Activo" && diasMora >= m.moraMin && (m.moraMax === null || diasMora <= m.moraMax),
    )?.nombre || "—";

  const rows = useMemo(
    () =>
      deudores.map((d) => {
        const deudasDeudor = deudas.filter((x) => x.deudorId === d.id);
        return {
          ...d,
          sponsorNombre: sponsorNombre(d.sponsorId),
          tipoMoroso: tipoMorosoDe(d.diasMoraMax),
          numDeudas: deudasDeudor.length,
        };
      }),
    [deudores, deudas],
  );

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (!estadoFiltro || r.estado === estadoFiltro) &&
          (!sponsorFiltro || r.sponsorId === sponsorFiltro),
      ),
    [rows, estadoFiltro, sponsorFiltro],
  );

  const kpis = useMemo(() => {
    const enMora = filtered.filter((r) => r.estado === "En Mora");
    const saldoTotal = filtered.reduce((s, r) => s + r.saldoTotal, 0);
    const moraPromedio = filtered.length
      ? Math.round(filtered.reduce((s, r) => s + r.diasMoraMax, 0) / filtered.length)
      : 0;
    return {
      total: filtered.length,
      enMora: enMora.length,
      moraPromedio,
      saldoTotal,
    };
  }, [filtered]);

  return (
    <div className="min-h-full bg-background">
      <PageHeader
        title="Consulta de Morosos"
        subtitle="Deudores con cartera vencida asignados a gestión de cobranza"
      />

      <div className="space-y-6 p-6 lg:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Filtrar por:</span>
          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Todos los estados</option>
            <option value="Al día">Al día</option>
            <option value="En Mora">En Mora</option>
          </select>
          <select
            value={sponsorFiltro}
            onChange={(e) => setSponsorFiltro(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Todos los sponsors</option>
            {sponsors.map((s) => (
              <option key={s.id} value={s.id}>{s.razonSocial}</option>
            ))}
          </select>
          {(estadoFiltro || sponsorFiltro) && (
            <button
              onClick={() => { setEstadoFiltro(""); setSponsorFiltro(""); }}
              className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Limpiar filtros
            </button>
          )}
          <span className="ml-auto text-xs text-muted-foreground">{filtered.length} deudor(es)</span>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KPICard title="Deudores" value={kpis.total} icon={Users} variant="secondary" />
          <KPICard title="En Mora" value={kpis.enMora} icon={AlertTriangle} variant="destructive" />
          <KPICard title="Mora promedio" value={`${kpis.moraPromedio} días`} icon={UserX} variant="secondary" />
          <KPICard title="Saldo Total" value={fmtSol(kpis.saldoTotal)} icon={DollarSign} variant="secondary" />
        </div>

        <DataTable
          title="Morosos"
          searchPlaceholder="Buscar deudor por nombre o documento..."
          onExport={() => {}}
          columns={[
            { key: "documento", label: "Documento", sortable: true },
            { key: "nombre", label: "Nombre", sortable: true },
            { key: "sponsorNombre", label: "Sponsor" },
            { key: "numDeudas", label: "N° Deudas", sortable: true },
            { key: "saldoTotal", label: "Saldo Total", sortable: true, render: (i: any) => fmtSol(i.saldoTotal) },
            { key: "diasMoraMax", label: "Días Mora Máx.", sortable: true },
            { key: "tipoMoroso", label: "Tipo de moroso", sortable: true },
            { key: "estado", label: "Estado", render: (i: any) => estadoBadge(i.estado) },
          ]}
          data={filtered}
        />
      </div>
    </div>
  );
}
