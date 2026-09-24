import { useState } from "react";
import { ArrowLeft, Eye } from "lucide-react";

import { PageHeader } from "../shared/PageHeader";
import { DataTable } from "../shared/DataTable";

// APL — Actualización de protocolos (solo consulta).
// Lista las deudas cuyo protocolo de cobranza cambió y, por cada una, el historial
// de tipos de cobranza por los que pasó. Datos de muestra del prototipo.

type Protocolo = {
  id: string;
  codDeuda: string;
  protocoloActual: string;
  fVencimiento: string;
  fCambio: string;
  saldoInicial: number;
  saldoActual: number;
  mora: number;
  historial: { tipoCobranza: string; fecha: string; hora: string }[];
};

const PROTOCOLOS: Protocolo[] = [
  {
    id: "1", codDeuda: "328764591230", protocoloActual: "Temprana", fVencimiento: "15/11/2026", fCambio: "12/01/2026",
    saldoInicial: 900, saldoActual: 1250, mora: 12,
    historial: [{ tipoCobranza: "Temprana", fecha: "12/01/2026", hora: "17:34:50" }],
  },
  {
    id: "2", codDeuda: "109238475612", protocoloActual: "Temprana", fVencimiento: "20/11/2026", fCambio: "03/01/2026",
    saldoInicial: 700, saldoActual: 780, mora: 9,
    historial: [{ tipoCobranza: "Temprana", fecha: "03/01/2026", hora: "09:15:20" }],
  },
  {
    id: "3", codDeuda: "445566778899", protocoloActual: "Intermedia", fVencimiento: "10/12/2026", fCambio: "21/01/2026",
    saldoInicial: 2500, saldoActual: 3500, mora: 26,
    historial: [
      { tipoCobranza: "Temprana", fecha: "11/12/2026", hora: "17:34:50" },
      { tipoCobranza: "Intermedia", fecha: "21/01/2026", hora: "08:12:05" },
    ],
  },
  {
    id: "4", codDeuda: "998877665544", protocoloActual: "Intermedia", fVencimiento: "28/12/2026", fCambio: "02/02/2026",
    saldoInicial: 1800, saldoActual: 2100, mora: 24,
    historial: [
      { tipoCobranza: "Temprana", fecha: "30/12/2026", hora: "10:02:11" },
      { tipoCobranza: "Intermedia", fecha: "02/02/2026", hora: "11:41:30" },
    ],
  },
  {
    id: "5", codDeuda: "112233445566", protocoloActual: "Prejudicial", fVencimiento: "05/01/2026", fCambio: "15/03/2026",
    saldoInicial: 4200, saldoActual: 6100, mora: 41,
    historial: [
      { tipoCobranza: "Temprana", fecha: "11/04/2026", hora: "17:34:50" },
      { tipoCobranza: "Intermedia", fecha: "31/12/2026", hora: "17:34:50" },
      { tipoCobranza: "Prejudicial", fecha: "15/03/2026", hora: "17:34:50" },
    ],
  },
  {
    id: "6", codDeuda: "778890011223", protocoloActual: "Prejudicial", fVencimiento: "12/01/2026", fCambio: "22/02/2026",
    saldoInicial: 5100, saldoActual: 7300, mora: 38,
    historial: [
      { tipoCobranza: "Intermedia", fecha: "20/01/2026", hora: "14:20:00" },
      { tipoCobranza: "Prejudicial", fecha: "22/02/2026", hora: "15:05:45" },
    ],
  },
  {
    id: "7", codDeuda: "554433221100", protocoloActual: "Judicial", fVencimiento: "25/12/2026", fCambio: "05/03/2026",
    saldoInicial: 16500, saldoActual: 21800, mora: 63,
    historial: [
      { tipoCobranza: "Intermedia", fecha: "05/01/2026", hora: "09:00:00" },
      { tipoCobranza: "Prejudicial", fecha: "02/02/2026", hora: "16:30:10" },
      { tipoCobranza: "Judicial", fecha: "05/03/2026", hora: "12:11:25" },
    ],
  },
];

const fmtSol = (n: number) => `S/ ${n.toLocaleString("es-PE")}`;
const HOY = new Date().toLocaleDateString("es-PE");

export function ActualizacionProtocolos() {
  const [seleccionado, setSeleccionado] = useState<Protocolo | null>(null);

  if (seleccionado) {
    return (
      <div className="min-h-full bg-background">
        <PageHeader
          title={`Deuda N° ${seleccionado.codDeuda}`}
          subtitle="Estado de la deuda y por qué protocolos de cobranza ha pasado."
        />

        <div className="space-y-6 p-6 lg:p-8">
          <button
            onClick={() => setSeleccionado(null)}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Volver a los protocolos actualizados
          </button>

          <div className="grid gap-4 sm:grid-cols-5">
            <Dato label="Saldo inicial" value={fmtSol(seleccionado.saldoInicial)} />
            <Dato label="Fecha venc. deuda" value={seleccionado.fVencimiento} />
            <Dato label="Mora" value={`${seleccionado.mora} días`} />
            <Dato label="Saldo actual" value={fmtSol(seleccionado.saldoActual)} />
            <Dato label="Cambio de protocolo" value={seleccionado.fCambio} />
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Historial de protocolos</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-3 py-2 font-semibold text-foreground">Tipo de cobranza</th>
                  <th className="px-3 py-2 font-semibold text-foreground">Fecha</th>
                  <th className="px-3 py-2 font-semibold text-foreground">Hora</th>
                </tr>
              </thead>
              <tbody>
                {seleccionado.historial.map((h, i) => (
                  <tr key={i} className="border-b border-border/60 last:border-0">
                    <td className="px-3 py-2 font-medium text-foreground">{h.tipoCobranza}</td>
                    <td className="px-3 py-2 text-muted-foreground">{h.fecha}</td>
                    <td className="px-3 py-2 text-muted-foreground">{h.hora}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background">
      <PageHeader
        title="Actualización de protocolos"
        subtitle="Deudas cuyo protocolo de cobranza cambió al recalcularse su mora. Solo consulta."
      />

      <div className="space-y-6 p-6 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {PROTOCOLOS.length} deuda(s) con protocolo actualizado en la última corrida del batch.
          </p>
          <span className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground">{HOY}</span>
        </div>

        <DataTable
          title="Protocolos actualizados"
          searchPlaceholder="Buscar por código de deuda..."
          onRowClick={(p: any) => setSeleccionado(p)}
          columns={[
            { key: "codDeuda", label: "Cód. deuda", sortable: true },
            { key: "protocoloActual", label: "Protocolo actual", sortable: true },
            { key: "fVencimiento", label: "F. vencimiento deuda" },
            { key: "fCambio", label: "F. cambio de protocolo", sortable: true },
            {
              key: "__detalle", label: "Ver más",
              render: (p: any) => (
                <button
                  onClick={(e) => { e.stopPropagation(); setSeleccionado(p); }}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
                >
                  <Eye className="size-3.5" />
                  Ver más
                </button>
              ),
            },
          ]}
          data={PROTOCOLOS}
        />
      </div>
    </div>
  );
}

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}
