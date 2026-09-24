import { useMemo, useState } from "react";

import { PageHeader } from "../shared/PageHeader";
import { DataTable } from "../shared/DataTable";

// APL — Fabricación de tickets de gestión (solo consulta).
// Muestra los tickets que el proceso batch fabricó, agrupados por lote y por la
// hora en que cada operador (autómata) los atiende. Datos de muestra del prototipo.

type TicketFabricado = {
  id: string;
  codigo: string;
  canal: string;
  operador: string;
  hora: string;
  lote: string;
};

const LOTES = [
  { lote: "LT001", canal: "SMS", operador: "SMS001", hora: "8:00-9:00", prefijo: "ST0", desde: 1, cantidad: 7 },
  { lote: "LT002", canal: "Llamadas", operador: "IVR01", hora: "11:00-12:00", prefijo: "ST1", desde: 1, cantidad: 4 },
  { lote: "LT003", canal: "Correo", operador: "CORREO001", hora: "8:00-9:00", prefijo: "ST2", desde: 1, cantidad: 5 },
  { lote: "LT004", canal: "Whatsapp", operador: "WSP001", hora: "14:00-15:00", prefijo: "ST3", desde: 1, cantidad: 6 },
  { lote: "LT005", canal: "Carta notarial", operador: "NOTARIO01", hora: "9:00-10:00", prefijo: "ST4", desde: 1, cantidad: 2 },
];

const TICKETS: TicketFabricado[] = LOTES.flatMap((l) =>
  Array.from({ length: l.cantidad }, (_, i) => {
    const codigo = `${l.prefijo}${String(l.desde + i).padStart(2, "0")}`;
    return { id: codigo, codigo, canal: l.canal, operador: l.operador, hora: l.hora, lote: l.lote };
  }),
);

const HOY = new Date().toLocaleDateString("es-PE");

export function FabricacionTickets() {
  const [loteFiltro, setLoteFiltro] = useState("");

  const visibles = useMemo(
    () => TICKETS.filter((t) => !loteFiltro || t.lote === loteFiltro),
    [loteFiltro],
  );

  return (
    <div className="min-h-full bg-background">
      <PageHeader
        title="Fabricación de tickets de gestión"
        subtitle="Tickets fabricados por el proceso batch, por lote y capacidad/hora. Solo consulta."
      />

      <div className="space-y-6 p-6 lg:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Filtrar por lote:</span>
          <select
            value={loteFiltro}
            onChange={(e) => setLoteFiltro(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Todos los lotes</option>
            {LOTES.map((l) => (
              <option key={l.lote} value={l.lote}>{l.lote}</option>
            ))}
          </select>
          <span className="ml-auto rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground">
            {HOY}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Resumen label="Tickets fabricados" value={String(TICKETS.length)} />
          <Resumen label="Lotes del día" value={String(LOTES.length)} />
          <Resumen label="Canales usados" value={String(new Set(LOTES.map((l) => l.canal)).size)} />
        </div>

        <DataTable
          title="Fabricación — lotes y capacidad por hora"
          searchPlaceholder="Buscar ticket, canal u operador..."
          columns={[
            { key: "codigo", label: "Código", sortable: true },
            { key: "canal", label: "Canal", sortable: true },
            { key: "operador", label: "Operador", sortable: true },
            { key: "hora", label: "Hora" },
            { key: "lote", label: "Lote", sortable: true },
          ]}
          data={visibles}
        />
      </div>
    </div>
  );
}

function Resumen({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
