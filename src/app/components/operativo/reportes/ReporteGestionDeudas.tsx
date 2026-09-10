import { useMemo } from "react";
import { Download, Printer } from "lucide-react";

import {
  getDeudas,
  getDeudores,
  getGestionesCobranza,
  getSponsors,
  getTicketsGestion,
} from "../../../store/localDb";
import { seedAllIfEmpty } from "../../../store/seedAll";

const fmtSol = (n: number) => `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;

const estadoDeudaBadge = (estado: string) => {
  const map: Record<string, string> = {
    Pendiente: "bg-muted text-foreground",
    Vencida: "bg-amber-100 text-amber-700",
    Pagada: "bg-emerald-100 text-emerald-700",
    Incobrable: "bg-rose-100 text-rose-700",
  };
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${map[estado] || ""} print:bg-transparent print:border print:border-black print:text-black`}>
      {estado}
    </span>
  );
};

// REP — Reporte de gestión de deudas. Documento operativo de solo lectura:
// no registra transacciones, consolida el estado de la cartera asignada a cobranza.
export function ReporteGestionDeudas() {
  seedAllIfEmpty();

  const deudas = useMemo(() => getDeudas(), []);
  const deudores = useMemo(() => getDeudores(), []);
  const sponsors = useMemo(() => getSponsors(), []);
  const tickets = useMemo(() => getTicketsGestion(), []);
  const gestiones = useMemo(() => getGestionesCobranza(), []);

  const deudorOf = (id: string) => deudores.find((d) => d.id === id);
  const sponsorOf = (id: string) => sponsors.find((s) => s.id === id);
  const ticketOf = (deudaId: string) => tickets.find((t) => t.deudaId === deudaId);
  const ultimaGestion = (deudaId: string) => {
    const relacionadas = gestiones.filter((g) => g.deudaId === deudaId);
    return relacionadas[relacionadas.length - 1] || null;
  };

  const totales = useMemo(() => {
    const totalDeuda = deudas.reduce((s, d) => s + d.monto, 0);
    const totalSaldo = deudas.reduce((s, d) => s + d.saldo, 0);
    const totalRecuperado = totalDeuda - totalSaldo;
    return { totalDeuda, totalSaldo, totalRecuperado, cantidad: deudas.length };
  }, [deudas]);

  return (
    <div className="min-h-screen bg-muted p-8">
      <div className="max-w-5xl mx-auto mb-4 flex items-center justify-between print:hidden">
        <h1 className="text-2xl font-bold text-foreground">Reporte de Gestión de Deudas</h1>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
          <button className="flex items-center gap-2 px-4 py-2 text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors">
            <Download className="w-4 h-4" />
            Descargar PDF
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto bg-card shadow-lg print:shadow-none">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-8 print:bg-none print:text-black print:border-b-2 print:border-black">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 print:text-black">REPORTE DE GESTIÓN DE DEUDAS</h1>
              <p className="text-lg print:text-black">Sistema de Cobranza</p>
              <p className="text-sm mt-1 print:text-black">Documento de solo consulta — no registra transacciones</p>
            </div>
            <div className="text-right">
              <p className="text-sm mt-2 print:text-black">Fecha de emisión: 01/07/2026</p>
              <p className="text-sm print:text-black">{totales.cantidad} deuda(s) reportadas</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Resumen */}
          <div className="mb-8">
            <h2 className="text-sm font-bold text-muted-foreground uppercase mb-4 pb-2 border-b border-border">
              Resumen de Cartera
            </h2>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Monto Total de Deuda</p>
                <p className="text-xl font-bold">{fmtSol(totales.totalDeuda)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Saldo Pendiente</p>
                <p className="text-xl font-bold text-amber-700 print:text-black">{fmtSol(totales.totalSaldo)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Monto Recuperado</p>
                <p className="text-xl font-bold text-emerald-700 print:text-black">{fmtSol(totales.totalRecuperado)}</p>
              </div>
            </div>
          </div>

          {/* Detalle de deudas */}
          <div className="mb-8">
            <h2 className="text-sm font-bold text-muted-foreground uppercase mb-4 pb-2 border-b border-border">
              Detalle de Deudas Asignadas
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2 pr-4">Código</th>
                    <th className="py-2 pr-4">Deudor</th>
                    <th className="py-2 pr-4">Sponsor</th>
                    <th className="py-2 pr-4 text-right">Saldo</th>
                    <th className="py-2 pr-4 text-right">Días Mora</th>
                    <th className="py-2 pr-4">Ticket de Gestión</th>
                    <th className="py-2 pr-4">Último Resultado</th>
                    <th className="py-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {deudas.map((d) => {
                    const deudor = deudorOf(d.deudorId);
                    const sponsor = sponsorOf(d.sponsorId);
                    const ticket = ticketOf(d.id);
                    const gestion = ultimaGestion(d.id);
                    return (
                      <tr key={d.id} className="border-b border-border/60">
                        <td className="py-3 pr-4 font-medium">{d.codigo}</td>
                        <td className="py-3 pr-4">{deudor?.nombre || d.deudorId}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{sponsor?.razonSocial || d.sponsorId}</td>
                        <td className="py-3 pr-4 text-right font-semibold">{fmtSol(d.saldo)}</td>
                        <td className="py-3 pr-4 text-right">{d.diasMora}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{ticket ? `${ticket.codigo} (${ticket.estado})` : "—"}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{gestion?.resultado || "Sin gestión"}</td>
                        <td className="py-3">{estadoDeudaBadge(d.estado)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Este reporte consolida el estado de la cartera asignada a cobranza. No representa una nueva transacción.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Área de Cobranzas: (01) 123-4567 | cobranzas@empresa.pe
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
