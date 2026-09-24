import { useState } from "react";
import { FileSignature, X } from "lucide-react";

import type { AcuerdoSponsor } from "../../../store/localDb";

// Acuerdo de gestión de cobranza. El sponsor llena sus datos y acepta las condiciones
// de confidencialidad ANTES de poder subir su lista de morosos.

const HOY = new Date().toLocaleDateString("es-PE");

type Campos = Omit<AcuerdoSponsor, "sponsorCodigo" | "fecha">;

const VACIO: Campos = { nombreCliente: "", documento: "", telefono: "", correo: "", numMorosos: "" };

/** Datos de ejemplo para el botón "Rellenar" del prototipo. */
const EJEMPLO: Campos = {
  nombreCliente: "Ricardo Salas Vegas",
  documento: "45782139",
  telefono: "987 654 321",
  correo: "cobranzas@financieraandina.com.pe",
  numMorosos: "8",
};

export function AcuerdoCobranzaModal({
  razonSocial,
  onAceptar,
  onCancelar,
}: {
  razonSocial: string;
  onAceptar: (campos: Campos) => void;
  onCancelar: () => void;
}) {
  const [campos, setCampos] = useState<Campos>(VACIO);
  const [aceptado, setAceptado] = useState(false);

  const set = (key: keyof Campos) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setCampos((c) => ({ ...c, [key]: e.target.value }));

  const completo = Object.values(campos).every((v) => v.trim() !== "") && aceptado;

  const campo = (key: keyof Campos, label: string, placeholder: string, type = "text") => (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</label>
      <input
        type={type}
        value={campos[key]}
        onChange={set(key)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl bg-card shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div>
            <h3 className="text-xl font-bold text-foreground">Acuerdo de gestión de cobranza</h3>
            <p className="text-sm text-muted-foreground">{razonSocial}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground">{HOY}</span>
            <button onClick={onCancelar} className="rounded-lg p-2 transition-colors hover:bg-muted">
              <X className="size-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="border-b border-amber-300 bg-amber-100 px-6 py-3 text-sm font-medium text-amber-900">
          Antes de subir los datos para iniciar el proceso de cobranza, necesitamos que firmes el siguiente
          contrato de confidencialidad de los datos de los morosos.
        </div>

        <div className="scrollbar-modern flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {campo("nombreCliente", "Nombre del cliente", "Nombres y apellidos del representante")}
            {campo("documento", "Documento de identidad", "DNI / RUC")}
            {campo("telefono", "Teléfono", "999 999 999")}
            {campo("correo", "Correo electrónico", "contacto@empresa.com", "email")}
            {campo("numMorosos", "Número de morosos a gestionar", "Ej: 8")}
          </div>

          <div className="rounded-xl border border-border bg-background p-5 text-sm leading-6 text-foreground">
            <p className="font-semibold uppercase tracking-wide">Documento de confidencialidad y compromiso de cobranza</p>
            <p className="mt-3">
              Este acuerdo establece los términos de confidencialidad, responsabilidad y compromiso entre el cliente y
              el sistema de cobranza automatizado. Su propósito es garantizar el uso ético y seguro de la información
              proporcionada, así como la participación activa del cliente en el proceso de recuperación de deuda.
            </p>
            <p className="mt-3 font-medium">El cliente declara y se compromete a:</p>
            <ol className="mt-1 list-decimal space-y-1 pl-5">
              <li>Proporcionar información veraz, completa y actualizada sobre los morosos a gestionar.</li>
              <li>Mantener absoluta confidencialidad respecto a los datos, estrategias y métodos usados por el sistema.</li>
              <li>Realizar un pago inicial no reembolsable como señal de compromiso y activación del servicio.</li>
              <li>Participar activamente en el proceso de cobranza, brindando soporte y seguimiento hasta su conclusión.</li>
            </ol>
            <p className="mt-3">
              <strong>Monto inicial:</strong> cobranza mínima × número de morosos (no reembolsable), en soles.
              <br />
              <strong>Monto final:</strong> costo total del sistema − monto inicial.
              <br />
              <strong>Métodos de pago:</strong> transferencia bancaria, tarjeta de crédito/débito u otro medio acordado.
            </p>
            <p className="mt-3">
              El sistema aplicará filtros inteligentes para identificar a los morosos con mayor probabilidad de pago,
              optimizando recursos y estrategias. Cualquier incumplimiento por parte del cliente respecto a los
              compromisos asumidos podrá derivar en acciones legales conforme a la normativa vigente.
            </p>
            <p className="mt-3">
              Al firmar este documento, el cliente declara haber leído, comprendido y aceptado todos los términos aquí
              expuestos, autorizando el inicio del proceso de cobranza automatizada bajo las condiciones pactadas.
            </p>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4">
            <input
              type="checkbox"
              checked={aceptado}
              onChange={(e) => setAceptado(e.target.checked)}
              className="mt-0.5 size-4"
            />
            <span className="text-sm text-foreground">
              He leído y acepto los términos del acuerdo de confidencialidad y compromiso de cobranza.
            </span>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-6 py-4">
          <button
            onClick={() => setCampos(EJEMPLO)}
            className="rounded-lg border border-border bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-200"
          >
            Rellenar con datos de ejemplo
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onCancelar}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              onClick={() => completo && onAceptar(campos)}
              disabled={!completo}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              <FileSignature className="size-4" />
              Firmar y enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
