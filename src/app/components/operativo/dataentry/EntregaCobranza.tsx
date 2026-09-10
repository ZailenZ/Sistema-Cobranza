import { useMemo, useState } from "react";
import { CheckCircle2, PhoneCall, Save } from "lucide-react";

import { PageHeader } from "../../shared/PageHeader";
import { DataTable } from "../../shared/DataTable";
import {
  addGestionCobranza,
  addMovimientoTicket,
  getCatalog,
  getDeudas,
  getDeudores,
  getGestionesCobranza,
  getTicketsGestion,
  newId,
  setDeudas,
  setTicketsGestion,
  type GestionCobranza,
  type TicketGestion,
} from "../../../store/localDb";
import { seedAllIfEmpty } from "../../../store/seedAll";

const TIPOS_CONTACTO: GestionCobranza["tipoContacto"][] = ["Llamada", "Visita", "Mensaje", "Correo"];
const RESULTADOS: GestionCobranza["resultado"][] = [
  "Contactado",
  "Promesa de Pago",
  "Pago Realizado",
  "Sin Contacto",
  "Rechazo",
];

const resultadoBadge = (r: string) => {
  const map: Record<string, string> = {
    "Contactado": "bg-sky-50 text-sky-700 border border-sky-200",
    "Promesa de Pago": "bg-amber-50 text-amber-700 border border-amber-200",
    "Pago Realizado": "bg-emerald-50 text-emerald-700 border border-emerald-200",
    "Sin Contacto": "bg-muted text-muted-foreground border border-border",
    "Rechazo": "bg-rose-50 text-rose-700 border border-rose-200",
  };
  return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${map[r] || ""}`}>{r}</span>;
};

export function EntregaCobranza() {
  seedAllIfEmpty();

  const [tickets, setTickets] = useState<TicketGestion[]>(() => getTicketsGestion());
  const [gestiones, setGestiones] = useState<GestionCobranza[]>(() => getGestionesCobranza());
  const deudas = useMemo(() => getDeudas(), []);
  const deudores = useMemo(() => getDeudores(), []);
  const canales = useMemo(() => getCatalog<any>("canales", []), []);

  const reservados = tickets.filter((t) => t.estado === "RE");
  const [selectedTicketId, setSelectedTicketId] = useState<string>(reservados[0]?.id || "");
  const selectedTicket = reservados.find((t) => t.id === selectedTicketId) || null;
  const deuda = selectedTicket ? deudas.find((d) => d.id === selectedTicket.deudaId) : null;
  const deudor = selectedTicket ? deudores.find((d) => d.id === selectedTicket.deudorId) : null;

  const [tipoContacto, setTipoContacto] = useState<GestionCobranza["tipoContacto"]>("Llamada");
  const [resultado, setResultado] = useState<GestionCobranza["resultado"]>("Contactado");
  const [montoComprometido, setMontoComprometido] = useState("");
  const [montoPagado, setMontoPagado] = useState("");
  const [fechaCompromiso, setFechaCompromiso] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [mensaje, setMensaje] = useState<string | null>(null);

  const canalNombre = (codigo?: string) => canales.find((c) => c.codigo === codigo)?.nombre || codigo || "-";

  const handleRegistrar = () => {
    if (!selectedTicket) return;

    const gestion: GestionCobranza = {
      id: newId("ges"),
      codigo: `GES-2026-${String(gestiones.length + 1).padStart(4, "0")}`,
      ticketId: selectedTicket.id,
      deudaId: selectedTicket.deudaId,
      operarioId: selectedTicket.operarioId,
      canalId: selectedTicket.canalId,
      tipoContacto,
      resultado,
      montoComprometido: montoComprometido ? Number(montoComprometido) : undefined,
      montoPagado: montoPagado ? Number(montoPagado) : undefined,
      fechaCompromiso: fechaCompromiso || undefined,
      observaciones: observaciones || undefined,
      createdAt: new Date().toISOString(),
    };
    setGestiones(addGestionCobranza(gestion));

    // Si el pago se realizó, cierra el ticket (RE -> CE) y reduce el saldo de la deuda.
    if (resultado === "Pago Realizado") {
      const nextTickets = tickets.map((t) =>
        t.id === selectedTicket.id ? { ...t, estado: "CE" as const } : t,
      );
      setTicketsGestion(nextTickets);
      setTickets(nextTickets);

      addMovimientoTicket({
        id: newId("mov"),
        ticketId: selectedTicket.id,
        estadoAnterior: "RE",
        estadoNuevo: "CE",
        motivo: "Cierre por pago confirmado en entrega de cobranza",
        createdAt: new Date().toISOString(),
      });

      if (deuda) {
        const pagado = Number(montoPagado) || 0;
        const nextDeudas = getDeudas().map((d) =>
          d.id === deuda.id
            ? { ...d, saldo: Math.max(0, d.saldo - pagado), estado: Math.max(0, d.saldo - pagado) === 0 ? ("Pagada" as const) : d.estado }
            : d,
        );
        setDeudas(nextDeudas);
      }
    }

    setMensaje(`Gestión ${gestion.codigo} registrada correctamente.`);
    setMontoComprometido("");
    setMontoPagado("");
    setFechaCompromiso("");
    setObservaciones("");
    setSelectedTicketId(tickets.filter((t) => t.estado === "RE" && t.id !== selectedTicket.id)[0]?.id || "");
  };

  return (
    <div className="min-h-full bg-muted">
      <PageHeader
        title="Entrega cobranza"
        subtitle="Registra el resultado del contacto (llamada, visita, mensaje) sobre un ticket de gestión reservado."
      />

      <div className="p-8 space-y-6">
        {!selectedTicket ? (
          <div className="bg-card rounded-xl shadow-sm border border-border p-10 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted">
              <PhoneCall className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No tienes tickets reservados</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              Primero reserva un ticket de gestión de cobranza para poder registrar el resultado del contacto.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-card rounded-xl shadow-sm border border-border p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Registro de gestión</h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1">Ticket reservado</label>
                  <select
                    value={selectedTicketId}
                    onChange={(e) => setSelectedTicketId(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {reservados.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.codigo} — {deudores.find((d) => d.id === t.deudorId)?.nombre || t.deudorId}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Tipo de contacto</label>
                  <select
                    value={tipoContacto}
                    onChange={(e) => setTipoContacto(e.target.value as any)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {TIPOS_CONTACTO.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Resultado</label>
                  <select
                    value={resultado}
                    onChange={(e) => setResultado(e.target.value as any)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {RESULTADOS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                {resultado === "Promesa de Pago" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Monto comprometido (S/)</label>
                      <input
                        type="number"
                        value={montoComprometido}
                        onChange={(e) => setMontoComprometido(e.target.value)}
                        placeholder="Ej: 500"
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Fecha de compromiso</label>
                      <input
                        type="date"
                        value={fechaCompromiso}
                        onChange={(e) => setFechaCompromiso(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </>
                )}

                {resultado === "Pago Realizado" && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">Monto pagado (S/)</label>
                    <input
                      type="number"
                      value={montoPagado}
                      onChange={(e) => setMontoPagado(e.target.value)}
                      placeholder="Ej: 500"
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                )}

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1">Observaciones</label>
                  <textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows={3}
                    placeholder="Detalle de la conversación o motivo del resultado"
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>
              </div>

              <button
                onClick={handleRegistrar}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
              >
                <Save className="w-4 h-4" />
                Registrar gestión
              </button>

              {mensaje && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                  <CheckCircle2 className="w-4 h-4" />
                  {mensaje}
                </div>
              )}
            </div>

            <div className="bg-card rounded-xl shadow-sm border border-border p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Datos del caso</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase">Deudor</p>
                  <p className="font-semibold text-foreground">{deudor?.nombre || "—"}</p>
                  <p className="text-xs text-muted-foreground">{deudor?.documento}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase">Deuda</p>
                  <p className="font-semibold text-foreground">{deuda?.codigo} — S/ {deuda?.saldo.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Días de mora: {deuda?.diasMora}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase">Canal sugerido</p>
                  <p className="font-semibold text-foreground">{canalNombre(selectedTicket.canalId)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase">Prioridad</p>
                  <p className="font-semibold text-foreground">{selectedTicket.prioridad}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Gestiones registradas</h3>
          <DataTable
            searchPlaceholder="Buscar gestión..."
            columns={[
              { key: "codigo", label: "Código", sortable: true },
              { key: "tipoContacto", label: "Tipo de Contacto" },
              { key: "resultado", label: "Resultado", render: (i: any) => resultadoBadge(i.resultado) },
              { key: "montoComprometido", label: "Comprometido", render: (i: any) => (i.montoComprometido ? `S/ ${Number(i.montoComprometido).toFixed(2)}` : "—") },
              { key: "montoPagado", label: "Pagado", render: (i: any) => (i.montoPagado ? `S/ ${Number(i.montoPagado).toFixed(2)}` : "—") },
              { key: "observaciones", label: "Observaciones" },
            ]}
            data={gestiones}
          />
        </div>
      </div>
    </div>
  );
}
