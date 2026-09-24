import { useState } from "react";
import { ArrowLeft, MessageSquareText } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { construirMensaje, renderMensajePlantilla } from "../../store/sponsorFlow";
import type { EnvioCobranza } from "../../store/localDb";

export type EnvioDetalleData = {
  envio: EnvioCobranza;
  deudorNombre: string;
  /** Canal(es) por los que se envió la gestión, ya formateados ("Llamada (IVR) y Whatsapp"). */
  canalesTexto: string;
  /** Estrategia aplicada, formateada ("EST-03 · Estrategia 03"). Opcional: el reporte
   *  final de cobranzas no muestra con qué estrategia se trabajó al moroso. */
  estrategiaTexto?: string;
  plantillaNombre: string;
  /** Texto de la plantilla del catálogo (con marcadores {nombre}/{saldo}/{mora}/{sponsor}), si tiene una asociada. */
  plantillaMensaje?: string;
  tipoCobranza: string;
  /** Perfil del Catálogo de Morosos en el que cae el deudor (por sus días de mora). */
  tipoMoroso?: string;
  sponsorNombre: string;
  saldo: number;
  diasMora: number;
  telefono?: string;
};

const respuestaClase: Record<EnvioCobranza["respuesta"], string> = {
  Afirmativa: "bg-emerald-100 text-emerald-700",
  Negativa: "bg-rose-100 text-rose-700",
  "Sin respuesta": "bg-muted text-muted-foreground",
};

function Campo({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <p className="inline-block rounded-md bg-emerald-600 px-3 py-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

/** Modal de dos pasos: 1) detalle del envío de cobranza a un moroso, 2) el mensaje simulado enviado. */
export function EnvioDetalleModal({
  data,
  onClose,
}: {
  data: EnvioDetalleData | null;
  onClose: () => void;
}) {
  const [verMensaje, setVerMensaje] = useState(false);

  if (!data) return null;
  const {
    envio,
    deudorNombre,
    canalesTexto,
    estrategiaTexto,
    plantillaNombre,
    plantillaMensaje,
    tipoCobranza,
    tipoMoroso,
    sponsorNombre,
    saldo,
    diasMora,
    telefono,
  } = data;

  const mensaje = plantillaMensaje
    ? renderMensajePlantilla(plantillaMensaje, { deudorNombre, saldo, diasMora, sponsorNombre })
    : construirMensaje({ deudorNombre, saldo, diasMora, sponsorNombre, tipoCobranza });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          setVerMensaje(false);
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-2xl">
        {!verMensaje ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-rose-600">Detalle de la Cobranza</DialogTitle>
              <DialogDescription className="sr-only">
                Detalle del envío de cobranza automático enviado a {deudorNombre}
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-xl border border-border p-5">
              <p className="mb-4 -mt-8 w-fit bg-background px-2 text-sm font-semibold text-foreground">
                {deudorNombre}
              </p>
              <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-3">
                {tipoMoroso && <Campo label="Tipo de moroso" value={tipoMoroso} />}
                <Campo label="Tipo de cobranza" value={tipoCobranza} />
                {estrategiaTexto && <Campo label="Estrategia" value={estrategiaTexto} />}
                <Campo label="Respuesta" value={envio.respuesta} />
                <Campo label="Canal(es)" value={canalesTexto} />
                <Campo label="Autómata" value={envio.operador} />
                <Campo label="Plantilla" value={plantillaNombre} />
                <Campo label="Mora" value={`${diasMora} días`} />
                <Campo label="Nro." value={telefono || "—"} />
                <Campo label="Saldo (en S/.)" value={String(saldo)} />
                <Campo label="Tarifa (en S/.)" value={String(envio.tarifa)} />
                <Campo label="Hora" value={envio.horaEnvio} />
                <Campo label="Fecha" value={envio.fechaEnvio} />
              </div>
              <div className="mt-5 flex justify-end">
                <Button onClick={() => setVerMensaje(true)} className="rounded-xl">
                  <MessageSquareText className="size-4" />
                  Ver Mensaje
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <button
                onClick={() => setVerMensaje(false)}
                className="mb-1 flex w-fit items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="size-3.5" />
                Regresar
              </button>
              <DialogTitle className="text-rose-600">Detalle - Mensaje</DialogTitle>
              <DialogDescription className="sr-only">Mensaje enviado a {deudorNombre}</DialogDescription>
            </DialogHeader>

            <div
              className={`rounded-lg px-3 py-2 text-sm font-medium text-white ${
                envio.respuesta === "Afirmativa" ? "bg-emerald-600" : envio.respuesta === "Negativa" ? "bg-rose-600" : "bg-muted-foreground"
              }`}
            >
              Mensaje "{plantillaNombre}" enviado por {canalesTexto}
            </div>

            <div className="whitespace-pre-line rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-foreground">
              {mensaje}
            </div>

            <p className="text-right text-xs">
              <span className={`rounded-full px-2 py-0.5 font-semibold ${respuestaClase[envio.respuesta]}`}>
                {envio.respuesta}
              </span>
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
