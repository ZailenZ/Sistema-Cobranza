import { useState } from "react";
import { CheckCircle2, Database, HardDriveDownload } from "lucide-react";

import { PageHeader } from "../shared/PageHeader";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

// TEC-01 — Backup. Herramienta técnica/administrativa, fuera del flujo operativo.

type Copia = {
  id: string;
  fecha: string;
  tipo: "Completo" | "Incremental";
  destino: string;
  tamano: string;
  responsable: string;
  estado: "OK" | "OK (verificado)";
};

const HISTORIAL_SEED: Copia[] = [
  { id: "BK-0312", fecha: "30/06/2026 01:00", tipo: "Completo", destino: "Almacenamiento frío (S3)", tamano: "4.2 GB", responsable: "Proceso automático", estado: "OK (verificado)" },
  { id: "BK-0311", fecha: "29/06/2026 01:00", tipo: "Incremental", destino: "Almacenamiento frío (S3)", tamano: "612 MB", responsable: "Proceso automático", estado: "OK" },
  { id: "BK-0310", fecha: "28/06/2026 01:00", tipo: "Incremental", destino: "Almacenamiento frío (S3)", tamano: "584 MB", responsable: "Proceso automático", estado: "OK" },
  { id: "BK-0309", fecha: "27/06/2026 01:00", tipo: "Completo", destino: "Almacenamiento frío (S3)", tamano: "4.1 GB", responsable: "J. Ramírez (técnico)", estado: "OK (verificado)" },
];

export function Backup() {
  const [historial, setHistorial] = useState<Copia[]>(HISTORIAL_SEED);
  const [resultado, setResultado] = useState<string | null>(null);

  const generar = () => {
    const nueva: Copia = {
      id: `BK-${313 + (historial.length - HISTORIAL_SEED.length)}`,
      fecha: new Date().toLocaleString("es-PE"),
      tipo: "Completo",
      destino: "Almacenamiento frío (S3)",
      tamano: "4.2 GB",
      responsable: "J. Ramírez (técnico)",
      estado: "OK",
    };
    setHistorial((prev) => [nueva, ...prev]);
    setResultado(`Copia ${nueva.id} generada correctamente el ${nueva.fecha}.`);
  };

  return (
    <div className="min-h-full bg-background">
      <PageHeader
        title="Backup de base de datos"
        subtitle="Gestión de copias de seguridad. Herramienta técnica/administrativa, fuera del flujo operativo."
        actions={
          <Button className="rounded-xl" onClick={generar}>
            <HardDriveDownload className="size-4" />
            Generar copia ahora
          </Button>
        }
      />

      <div className="space-y-6 p-6 lg:p-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard label="Frecuencia" value="Diaria · 01:00" />
          <SummaryCard label="Última copia" value="30/06/2026 01:00" />
          <SummaryCard label="Retención" value="30 días" />
        </div>

        {resultado && (
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/25 p-4 text-sm text-foreground">
            <CheckCircle2 className="size-5" />
            {resultado}
          </div>
        )}

        <Card className="border-border bg-card">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="text-lg font-semibold">Historial de copias</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border/60 p-0">
            {historial.map((copia) => (
              <div key={copia.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-background">
                    <Database className="size-4 text-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {copia.id} · {copia.tipo}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {copia.fecha} · {copia.destino} · {copia.tamano}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{copia.responsable}</span>
                  <Badge variant="secondary" className="rounded-full">{copia.estado}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}
