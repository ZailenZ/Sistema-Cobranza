import { useMemo, useState } from "react";
import { CheckCircle2, Ticket as TicketIcon } from "lucide-react";

import { PageHeader } from "../../shared/PageHeader";
import { DataTable } from "../../shared/DataTable";
import {
  addMovimientoTicket,
  getCatalog,
  getDeudas,
  getDeudores,
  getTicketsGestion,
  newId,
  setTicketsGestion,
  type TicketGestion,
} from "../../../store/localDb";
import { seedAllIfEmpty } from "../../../store/seedAll";
import { getCurrentUser } from "../../../store/session";

const prioridadBadge = (p: string) => {
  const map: Record<string, string> = {
    Alta: "bg-rose-100 text-rose-700",
    Media: "bg-amber-100 text-amber-700",
    Baja: "bg-muted text-muted-foreground",
  };
  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${map[p] || ""}`}>{p}</span>;
};

const estadoBadge = (e: string) => {
  const map: Record<string, { label: string; cls: string }> = {
    DI: { label: "Disponible", cls: "bg-sky-50 text-sky-700 border border-sky-200" },
    RE: { label: "Reservado", cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
    CE: { label: "Cerrado", cls: "bg-muted text-muted-foreground border border-border" },
  };
  const info = map[e] || { label: e, cls: "" };
  return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${info.cls}`}>{info.label}</span>;
};

export function ReservarTickets() {
  seedAllIfEmpty();
  const user = getCurrentUser();

  const [tickets, setTickets] = useState<TicketGestion[]>(() => getTicketsGestion());
  const deudas = useMemo(() => getDeudas(), []);
  const deudores = useMemo(() => getDeudores(), []);
  const canales = useMemo(() => getCatalog<any>("canales", []), []);

  const deudaOf = (id: string) => deudas.find((d) => d.id === id);
  const deudorOf = (id: string) => deudores.find((d) => d.id === id);
  const canalNombre = (codigo?: string) => canales.find((c) => c.codigo === codigo)?.nombre || codigo || "-";

  const disponibles = tickets.filter((t) => t.estado === "DI");
  const misReservados = tickets.filter((t) => t.estado === "RE");

  const handleReservar = (ticket: TicketGestion) => {
    const actualizado: TicketGestion = {
      ...ticket,
      estado: "RE",
      operarioId: user.id,
      fechaAsignacion: new Date().toISOString(),
    };
    const next = tickets.map((t) => (t.id === ticket.id ? actualizado : t));
    setTicketsGestion(next);
    setTickets(next);

    addMovimientoTicket({
      id: newId("mov"),
      ticketId: ticket.id,
      estadoAnterior: "DI",
      estadoNuevo: "RE",
      motivo: "Reserva de ticket de gestión por operario",
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <div className="min-h-full bg-muted">
      <PageHeader
        title="Reservar tickets"
        subtitle="Asigna tickets de gestión de cobranza disponibles (fabricados por Batch) a tu cartera de trabajo."
      />

      <div className="p-8 space-y-6">
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Tickets disponibles (DI)</h3>
            <span className="text-xs text-muted-foreground">{disponibles.length} caso(s)</span>
          </div>
          <DataTable
            searchPlaceholder="Buscar caso disponible..."
            columns={[
              { key: "codigo", label: "Código", sortable: true },
              {
                key: "deudorId", label: "Deudor",
                render: (i: any) => deudorOf(i.deudorId)?.nombre || i.deudorId,
              },
              {
                key: "deudaId", label: "Deuda",
                render: (i: any) => {
                  const d = deudaOf(i.deudaId);
                  return d ? `${d.codigo} — S/ ${d.saldo.toFixed(2)}` : i.deudaId;
                },
              },
              { key: "canalId", label: "Canal sugerido", render: (i: any) => canalNombre(i.canalId) },
              { key: "prioridad", label: "Prioridad", render: (i: any) => prioridadBadge(i.prioridad) },
              { key: "estado", label: "Estado", render: (i: any) => estadoBadge(i.estado) },
              {
                key: "__acciones", label: "Acciones",
                render: (i: any) => (
                  <button
                    onClick={() => handleReservar(i)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
                  >
                    <TicketIcon className="w-3.5 h-3.5" />
                    Reservar
                  </button>
                ),
              },
            ]}
            data={disponibles}
          />
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Mis tickets reservados (RE)</h3>
            <span className="text-xs text-muted-foreground">{misReservados.length} caso(s)</span>
          </div>
          <DataTable
            searchPlaceholder="Buscar en mis reservados..."
            columns={[
              { key: "codigo", label: "Código", sortable: true },
              { key: "deudorId", label: "Deudor", render: (i: any) => deudorOf(i.deudorId)?.nombre || i.deudorId },
              { key: "operarioId", label: "Gestor asignado" },
              { key: "prioridad", label: "Prioridad", render: (i: any) => prioridadBadge(i.prioridad) },
              { key: "estado", label: "Estado", render: (i: any) => estadoBadge(i.estado) },
            ]}
            data={misReservados}
          />
        </div>

        {misReservados.length > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <CheckCircle2 className="w-4 h-4" />
            Continúa con "Entrega cobranza" para registrar el resultado del contacto sobre tus tickets reservados.
          </div>
        )}
      </div>
    </div>
  );
}
