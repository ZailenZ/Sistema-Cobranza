import { useMemo, useState } from "react";
import { ArrowLeft, Building2, DollarSign, Eye, TrendingUp, Users } from "lucide-react";

import { PageHeader } from "../../shared/PageHeader";
import { KPICard } from "../../shared/KPICard";
import { DataTable } from "../../shared/DataTable";
import {
  getCatalog,
  getDeudas,
  getDeudores,
  getSponsors,
  getTicketsGestion,
  type Sponsor,
} from "../../../store/localDb";
import { seedAllIfEmpty } from "../../../store/seedAll";
import type { ServicioCobranza } from "../../../store/catalogSeed";

const fmtSol = (n: number) => `S/ ${n.toLocaleString("es-PE")}`;

export function Sponsors() {
  seedAllIfEmpty();
  const [rubroFiltro, setRubroFiltro] = useState("");
  const [seleccionado, setSeleccionado] = useState<Sponsor | null>(null);

  const sponsors = useMemo(() => getSponsors(), []);
  const deudores = useMemo(() => getDeudores(), []);
  const deudas = useMemo(() => getDeudas(), []);
  const tickets = useMemo(() => getTicketsGestion(), []);
  const servicios = useMemo(() => getCatalog<ServicioCobranza>("servicios", []), []);

  const rubros = useMemo(() => [...new Set(sponsors.map((s) => s.rubro))].sort(), [sponsors]);

  const morososDe = (sponsorId: string) =>
    deudores
      .filter((d) => d.sponsorId === sponsorId)
      .map((d) => {
        const deudaDelDeudor = deudas.find((x) => x.deudorId === d.id);
        const ticket = tickets.find((t) => t.deudaId === deudaDelDeudor?.id);
        return {
          ...d,
          tipoCobranza: servicios.find((s) => s.codigo === deudaDelDeudor?.servicioCodigo)?.tipoCobranza || "—",
          enGestion: ticket?.estado === "RE" ? "En gestión" : ticket ? "Sin estrategia" : "—",
        };
      });

  const filas = useMemo(
    () =>
      sponsors
        .filter((s) => !rubroFiltro || s.rubro === rubroFiltro)
        .map((s) => ({
          ...s,
          numMorosos: deudores.filter((d) => d.sponsorId === s.id).length,
          tasa: s.carteraAsignada > 0 ? (s.carteraRecuperada / s.carteraAsignada) * 100 : 0,
        })),
    [sponsors, deudores, rubroFiltro],
  );

  const kpis = useMemo(() => {
    const sumAsignada = filas.reduce((s, x) => s + x.carteraAsignada, 0);
    const sumRecuperada = filas.reduce((s, x) => s + x.carteraRecuperada, 0);
    return {
      total: filas.length,
      sumAsignada,
      sumRecuperada,
      tasa: sumAsignada > 0 ? (sumRecuperada / sumAsignada) * 100 : 0,
    };
  }, [filas]);

  // --- Detalle de un sponsor: sus datos + su lista de morosos ---
  if (seleccionado) {
    const morosos = morososDe(seleccionado.id);
    const saldoCartera = morosos.reduce((s, m) => s + m.saldoTotal, 0);

    return (
      <div className="min-h-full bg-background">
        <PageHeader
          title="Consulta de Sponsors"
          subtitle="Ficha del sponsor y la cartera de morosos que tiene encargada"
        />

        <div className="space-y-6 p-6 lg:p-8">
          <button
            onClick={() => setSeleccionado(null)}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Volver a la lista de sponsors
          </button>

          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            {/* Datos del sponsor */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Building2 className="size-8" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">{seleccionado.razonSocial}</h3>
              <p className="text-sm text-muted-foreground">{seleccionado.codigo}</p>

              <dl className="mt-5 space-y-4">
                {[
                  { label: "Rubro", value: seleccionado.rubro },
                  { label: "Contacto", value: seleccionado.contacto },
                  { label: "Teléfono", value: seleccionado.telefono || "—" },
                  { label: "N° de morosos", value: String(morosos.length) },
                  { label: "Saldo de la cartera", value: fmtSol(saldoCartera) },
                  { label: "Cartera asignada", value: fmtSol(seleccionado.carteraAsignada) },
                  { label: "Cartera recuperada", value: fmtSol(seleccionado.carteraRecuperada) },
                  { label: "Estado", value: seleccionado.estado },
                ].map((campo) => (
                  <div key={campo.label}>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {campo.label}
                    </dt>
                    <dd className="mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                      {campo.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Lista de morosos del sponsor */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 text-lg font-semibold text-foreground">
                Morosos de {seleccionado.razonSocial}
              </h3>
              {morosos.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border py-10 text-center text-base text-muted-foreground">
                  Este sponsor todavía no ha subido su lista de morosos.
                </p>
              ) : (
                <DataTable
                  searchPlaceholder="Buscar moroso..."
                  columns={[
                    { key: "nombre", label: "Moroso", sortable: true },
                    { key: "documento", label: "Documento" },
                    { key: "diasMoraMax", label: "Tiempo de mora", sortable: true, render: (m: any) => `${m.diasMoraMax} días` },
                    { key: "saldoTotal", label: "Saldo pendiente", sortable: true, render: (m: any) => fmtSol(m.saldoTotal) },
                    { key: "tipoCobranza", label: "Tipo de cobranza" },
                    { key: "enGestion", label: "Estado" },
                  ]}
                  data={morosos}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Lista de sponsors ---
  return (
    <div className="min-h-full bg-background">
      <PageHeader
        title="Consulta de Sponsors"
        subtitle="Entidades/empresas que encargan cartera de cobranza. Elige uno para ver su ficha y sus morosos."
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
          <span className="ml-auto text-xs text-muted-foreground">{filas.length} sponsor(s)</span>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KPICard title="Sponsors" value={kpis.total} icon={Building2} variant="secondary" />
          <KPICard title="Cartera Asignada" value={fmtSol(kpis.sumAsignada)} icon={DollarSign} variant="secondary" />
          <KPICard title="Cartera Recuperada" value={fmtSol(kpis.sumRecuperada)} icon={TrendingUp} variant="secondary" />
          <KPICard title="Tasa de Recuperación" value={`${kpis.tasa.toFixed(1)}%`} icon={Users} variant="secondary" />
        </div>

        <DataTable
          title="Sponsors"
          searchPlaceholder="Buscar sponsor..."
          onExport={() => {}}
          onRowClick={(s: any) => setSeleccionado(s)}
          columns={[
            { key: "codigo", label: "Código", sortable: true },
            { key: "razonSocial", label: "Razón Social", sortable: true },
            { key: "rubro", label: "Rubro" },
            { key: "contacto", label: "Contacto" },
            { key: "numMorosos", label: "N° Morosos", sortable: true },
            { key: "carteraAsignada", label: "Cartera Asignada", sortable: true, render: (i: any) => fmtSol(i.carteraAsignada) },
            { key: "carteraRecuperada", label: "Cartera Recuperada", sortable: true, render: (i: any) => fmtSol(i.carteraRecuperada) },
            { key: "tasa", label: "Tasa Recuperación", render: (i: any) => `${i.tasa.toFixed(1)}%` },
            {
              key: "estado", label: "Estado",
              render: (i: any) => (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${i.estado === "Activo" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                  {i.estado}
                </span>
              ),
            },
            {
              key: "__detalle", label: "Información",
              render: (i: any) => (
                <button
                  onClick={(e) => { e.stopPropagation(); setSeleccionado(i); }}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
                >
                  <Eye className="size-3.5" />
                  Ver más
                </button>
              ),
            },
          ]}
          data={filas}
        />
      </div>
    </div>
  );
}
