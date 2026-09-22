import { useMemo, useState } from "react";
import { Download, Eye, Printer } from "lucide-react";

import { DataTable } from "../../shared/DataTable";
import {
  getCatalog,
  getDeudas,
  getDeudores,
  getEnviosCobranza,
  getSponsors,
  getTicketsGestion,
  type EnvioCobranza,
  type TicketGestion,
} from "../../../store/localDb";
import { seedAllIfEmpty } from "../../../store/seedAll";
import {
  formatListaCanales,
  type CanalContacto,
  type EstrategiaCobranza,
  type PlantillaMensaje,
  type ServicioCobranza,
} from "../../../store/catalogSeed";
import { getCurrentUser } from "../../../store/session";
import { EnvioDetalleModal, type EnvioDetalleData } from "../EnvioDetalleModal";

const fmtSol = (n: number) => `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;

const estadoCobranzaBadge = (estado: string) => {
  const map: Record<string, string> = {
    "Sin estrategia": "bg-sky-50 text-sky-700 border border-sky-200",
    "En gestión": "bg-amber-50 text-amber-700 border border-amber-200",
    Finalizado: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  };
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${map[estado] || ""} print:bg-transparent print:border print:border-black print:text-black`}>
      {estado}
    </span>
  );
};

const respuestaBadge = (r: EnvioCobranza["respuesta"]) => {
  const map: Record<EnvioCobranza["respuesta"], string> = {
    Afirmativa: "bg-emerald-100 text-emerald-700",
    Negativa: "bg-rose-100 text-rose-700",
    "Sin respuesta": "bg-muted text-muted-foreground",
  };
  return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${map[r]}`}>{r}</span>;
};

const estadoCobranzaDe = (ticket: TicketGestion | undefined) => {
  if (!ticket) return "Sin estrategia";
  if (ticket.estado === "CE") return "Finalizado";
  if (ticket.estado === "RE") return "En gestión";
  return "Sin estrategia";
};

// REP — Reporte de gestión de deudas. Documento operativo de solo lectura:
// consolida el estado final de la cartera de morosos del sponsor (o de todos, para Administrador).
export function ReporteGestionDeudas() {
  seedAllIfEmpty();
  const user = getCurrentUser();

  const deudas = useMemo(() => getDeudas(), []);
  const deudores = useMemo(() => getDeudores(), []);
  const sponsors = useMemo(() => getSponsors(), []);
  const tickets = useMemo(() => getTicketsGestion(), []);
  const envios = useMemo(() => getEnviosCobranza(), []);
  const canales = useMemo(() => getCatalog<CanalContacto>("canales", []), []);
  const plantillas = useMemo(() => getCatalog<PlantillaMensaje>("plantillas", []), []);
  const servicios = useMemo(() => getCatalog<ServicioCobranza>("servicios", []), []);
  const estrategias = useMemo(() => getCatalog<EstrategiaCobranza>("estrategias", []), []);

  const [detalle, setDetalle] = useState<EnvioDetalleData | null>(null);

  const deudorOf = (id: string) => deudores.find((d) => d.id === id);
  const ticketOf = (deudaId: string) => tickets.find((t) => t.deudaId === deudaId);
  const envioOf = (deudaId: string) => envios.find((e) => e.deudaId === deudaId);
  const estrategiaDe = (codigo?: string) => estrategias.find((e) => e.codigo === codigo);
  const plantillaNombre = (codigo?: string) => plantillas.find((p) => p.codigo === codigo)?.nombre || "—";
  const plantillaMensaje = (codigo?: string) => plantillas.find((p) => p.codigo === codigo)?.mensaje;

  const misSponsor = user.rol === "Sponsor" ? sponsors.find((s) => s.codigo === user.sponsorCodigo) : undefined;
  const misDeudas = deudas.filter((d) => !misSponsor || d.sponsorId === misSponsor.id);

  const totales = useMemo(() => {
    const totalDeuda = misDeudas.reduce((s, d) => s + d.monto, 0);
    const totalSaldo = misDeudas.reduce((s, d) => s + d.saldo, 0);
    const totalRecuperado = totalDeuda - totalSaldo;
    return { totalDeuda, totalSaldo, totalRecuperado, cantidad: misDeudas.length };
  }, [misDeudas]);

  const abrirDetalle = (deudaId: string) => {
    const deuda = misDeudas.find((d) => d.id === deudaId);
    const envio = envioOf(deudaId);
    const deudor = deudorOf(deuda?.deudorId || "");
    const servicio = servicios.find((s) => s.codigo === deuda?.servicioCodigo);
    const sponsor = sponsors.find((s) => s.id === deuda?.sponsorId);
    if (!deuda || !deudor || !envio) return;
    const estrategia = estrategiaDe(envio.estrategiaCodigo);
    setDetalle({
      envio,
      deudorNombre: deudor.nombre,
      canalesTexto: formatListaCanales(envio.canalIds, canales),
      estrategiaTexto: estrategia ? `${estrategia.codigo} · ${estrategia.nombre}` : envio.estrategiaCodigo || "—",
      plantillaNombre: plantillaNombre(envio.plantillaCodigo),
      plantillaMensaje: plantillaMensaje(envio.plantillaCodigo),
      tipoCobranza: servicio?.tipoCobranza || "—",
      sponsorNombre: sponsor?.razonSocial || "—",
      saldo: deuda.saldo,
      diasMora: deuda.diasMora,
      telefono: deudor.telefono,
    });
  };

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-6xl p-6 lg:p-8">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reporte de Gestión de Deudas</h1>
            {misSponsor && (
              <p className="mt-1 text-base text-muted-foreground">
                Cartera de <span className="font-semibold text-foreground">{misSponsor.razonSocial}</span>
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Download className="w-4 h-4" />
              Descargar PDF
            </button>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-3 mb-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground mb-1.5">Monto Total de Deuda</p>
            <p className="text-2xl font-bold text-foreground">{fmtSol(totales.totalDeuda)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground mb-1.5">Saldo Pendiente</p>
            <p className="text-2xl font-bold text-amber-700">{fmtSol(totales.totalSaldo)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground mb-1.5">Monto Recuperado</p>
            <p className="text-2xl font-bold text-emerald-700">{fmtSol(totales.totalRecuperado)}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <DataTable
            title={`${totales.cantidad} moroso(s) en cartera`}
            searchPlaceholder="Buscar moroso..."
            onExport={() => window.print()}
            columns={[
              {
                key: "deudorId", label: "Moroso", sortable: true,
                render: (d: (typeof misDeudas)[number]) => deudorOf(d.deudorId)?.nombre || d.deudorId,
              },
              {
                key: "tipoCobranza", label: "Tipo de cobranza",
                render: (d: (typeof misDeudas)[number]) =>
                  servicios.find((s) => s.codigo === d.servicioCodigo)?.tipoCobranza || "—",
              },
              {
                key: "estrategia", label: "Estrategia",
                render: (d: (typeof misDeudas)[number]) => {
                  const e = estrategiaDe(envioOf(d.id)?.estrategiaCodigo);
                  return e ? `${e.codigo} · ${e.nombre}` : "—";
                },
              },
              {
                key: "canal", label: "Canal(es)",
                render: (d: (typeof misDeudas)[number]) => {
                  const envio = envioOf(d.id);
                  return envio ? formatListaCanales(envio.canalIds, canales) : "—";
                },
              },
              {
                key: "estadoCobranza", label: "Estado Cobranza",
                render: (d: (typeof misDeudas)[number]) => estadoCobranzaBadge(estadoCobranzaDe(ticketOf(d.id))),
              },
              {
                key: "fecha", label: "Fecha", sortable: true,
                render: (d: (typeof misDeudas)[number]) => envioOf(d.id)?.fechaEnvio || "—",
              },
              {
                key: "hora", label: "Hora envío",
                render: (d: (typeof misDeudas)[number]) => envioOf(d.id)?.horaEnvio || "—",
              },
              {
                key: "tarifa", label: "Tarifa",
                render: (d: (typeof misDeudas)[number]) => {
                  const envio = envioOf(d.id);
                  return envio ? `S/ ${Number(envio.tarifa).toLocaleString("es-PE")}` : "—";
                },
              },
              {
                key: "respuesta", label: "Respuesta",
                render: (d: (typeof misDeudas)[number]) => (envioOf(d.id) ? respuestaBadge(envioOf(d.id)!.respuesta) : "—"),
              },
              {
                key: "__detalle", label: "Detalle",
                render: (d: (typeof misDeudas)[number]) =>
                  envioOf(d.id) ? (
                    <button
                      onClick={() => abrirDetalle(d.id)}
                      className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Eye className="size-3.5" />
                      Ver más
                    </button>
                  ) : (
                    "—"
                  ),
              },
            ]}
            data={misDeudas}
          />
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground print:hidden">
          Este reporte consolida el estado de la cartera de cobranza del sponsor. No representa una nueva transacción.
        </p>
      </div>

      <EnvioDetalleModal data={detalle} onClose={() => setDetalle(null)} />
    </div>
  );
}
