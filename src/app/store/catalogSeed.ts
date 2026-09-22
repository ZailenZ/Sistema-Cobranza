import type { CatalogId } from "./localDb";
import { getCatalog, setCatalog } from "./localDb";

// Seeds catalogs only if empty in localStorage.
export function ensureCatalogSeeded(id: CatalogId, seed: any[]) {
  const current = getCatalog(id, []);
  if (current.length > 0) return;
  setCatalog(id, seed);
}

// ---------------------------------------------------------------------------
// Catálogos maestros (mantenimiento de parámetros) — fuente única de la data
// semilla, compartida por ParamsMaintenance.tsx y seedAll.ts.
//
// Cómo encajan entre sí:
//   servicio (tipo de cobranza)  = regla de clasificación (mora/saldo) + qué canales
//                                  usa y cuántas veces al día cada uno.
//   estrategia                   = forma concreta de hostigar a UN moroso: canal(es)
//                                  + tipo de mensaje (plantilla) + duración + tarifa.
//                                  Pertenece a un tipo de cobranza; el sponsor elige
//                                  una estrategia por moroso.
//   plantilla                    = el tipo de mensaje y su texto (Amistoso, Ultimátum…).
//   canal                        = medio de contacto (SMS, WhatsApp, dron…).
//   autómata                     = el robot que envía por cada canal digital.
// ---------------------------------------------------------------------------

// --- Catálogo de canal: medio de contacto y su naturaleza (digital/físico) ---
export type CanalContacto = {
  id: number;
  codigo: string;
  nombre: string;
  tipoCanal: "Digital" | "Físico";
  estado: "Activo" | "Inactivo";
};

export const CANALES_SEED: CanalContacto[] = [
  { id: 1, codigo: "CAN-001", nombre: "SMS", tipoCanal: "Digital", estado: "Activo" },
  { id: 2, codigo: "CAN-002", nombre: "Whatsapp", tipoCanal: "Digital", estado: "Activo" },
  { id: 3, codigo: "CAN-003", nombre: "Correo", tipoCanal: "Digital", estado: "Activo" },
  { id: 4, codigo: "CAN-004", nombre: "Llamada (IVR)", tipoCanal: "Digital", estado: "Activo" },
  { id: 5, codigo: "CAN-005", nombre: "Dron inteligente", tipoCanal: "Físico", estado: "Activo" },
  // Ejemplo desactivado: demuestra que un canal puede darse de baja sin eliminarlo.
  { id: 6, codigo: "CAN-006", nombre: "Telegram (ejemplo)", tipoCanal: "Digital", estado: "Inactivo" },
];

// --- Catálogo de servicio: reglas de tipo de cobranza por mora/saldo ---
/** Un canal usado por un servicio, con su frecuencia = cuántos mensajes al día se envían por ahí. */
export type CanalFrecuencia = {
  canalCodigo: string;
  vecesPorDia: number;
};

export type ServicioCobranza = {
  id: number;
  codigo: string;
  tipoCobranza: string;
  moraMin: number;
  moraMax: number | null; // null = "a más"
  saldoMin: number;
  saldoMax: number | null; // null = "a más"
  /** Canales que usa este tipo de cobranza, cada uno con su frecuencia diaria. */
  canales: CanalFrecuencia[];
  descripcion: string;
  estado: "Activo" | "Inactivo";
};

export const SERVICIOS_SEED: ServicioCobranza[] = [
  {
    id: 1,
    codigo: "SRV-001",
    tipoCobranza: "Cobranza temprana",
    moraMin: 1,
    moraMax: 15,
    saldoMin: 500,
    saldoMax: 1000,
    canales: [
      { canalCodigo: "CAN-001", vecesPorDia: 3 },
      { canalCodigo: "CAN-002", vecesPorDia: 2 },
    ],
    descripcion: "Presiona a morosos ocasionales con deuda ligera, por canales digitales de bajo costo.",
    estado: "Activo",
  },
  {
    id: 2,
    codigo: "SRV-002",
    tipoCobranza: "Cobranza tardía",
    moraMin: 16,
    moraMax: 30,
    saldoMin: 1001,
    saldoMax: 3000,
    canales: [
      { canalCodigo: "CAN-002", vecesPorDia: 3 },
      { canalCodigo: "CAN-003", vecesPorDia: 2 },
      { canalCodigo: "CAN-001", vecesPorDia: 2 },
    ],
    descripcion: "Contacto multicanal más insistente ante atraso prolongado o deuda persistente.",
    estado: "Activo",
  },
  {
    id: 3,
    codigo: "SRV-003",
    tipoCobranza: "Cobranza prejudicial",
    moraMin: 31,
    moraMax: 45,
    saldoMin: 3001,
    saldoMax: 16000,
    canales: [
      { canalCodigo: "CAN-004", vecesPorDia: 2 },
      { canalCodigo: "CAN-002", vecesPorDia: 3 },
      { canalCodigo: "CAN-003", vecesPorDia: 1 },
    ],
    descripcion: "Gestión intensiva sobre deuda riesgosa, previa a la derivación legal.",
    estado: "Activo",
  },
  {
    id: 4,
    codigo: "SRV-004",
    tipoCobranza: "Cobranza judicial",
    moraMin: 46,
    moraMax: null,
    saldoMin: 16001,
    saldoMax: null,
    canales: [{ canalCodigo: "CAN-005", vecesPorDia: 1 }],
    descripcion: "Notificación formal por dron para derivar el caso a proceso judicial.",
    estado: "Activo",
  },
  // Ejemplo desactivado: demuestra que un tipo de cobranza puede darse de baja sin eliminarlo.
  {
    id: 5,
    codigo: "SRV-005",
    tipoCobranza: "Cobranza Extra (ejemplo)",
    moraMin: 200,
    moraMax: null,
    saldoMin: 100000,
    saldoMax: null,
    canales: [{ canalCodigo: "CAN-006", vecesPorDia: 1 }],
    descripcion: "Servicio de ejemplo para probar la desactivación de un tipo de cobranza.",
    estado: "Inactivo",
  },
];

// --- Catálogo de plantilla: el tipo de mensaje y su texto ---
// `mensaje` admite los marcadores {nombre}, {saldo}, {mora} y {sponsor}, que el sistema
// reemplaza por los datos reales del moroso/deuda/sponsor al momento de mostrarlo.
export type PlantillaMensaje = {
  id: number;
  codigo: string;
  nombre: string; // tipo de mensaje: Amistoso, Recordatorio, Ultimátum…
  mensaje: string;
  estado: "Activo" | "Inactivo";
};

export const PLANTILLAS_SEED: PlantillaMensaje[] = [
  {
    id: 1,
    codigo: "PLT-001",
    nombre: "Amistoso",
    mensaje:
      "Hola {nombre}, esperamos que estés bien. Te recordamos que tienes una deuda pendiente de {saldo}, con {mora} de retraso, registrada por tu sponsor {sponsor}. Queremos ayudarte a resolverlo de forma sencilla. Responde con: 1 – Sí, voy a pagar. 2 – No puedo pagar ahora, me contactaré con mi sponsor.",
    estado: "Activo",
  },
  {
    id: 2,
    codigo: "PLT-002",
    nombre: "Recordatorio",
    mensaje:
      "Hola {nombre}, te recordamos que tu deuda de {saldo} con {sponsor} ya acumula {mora} de atraso. Regulariza hoy para evitar recargos adicionales.",
    estado: "Activo",
  },
  {
    id: 3,
    codigo: "PLT-003",
    nombre: "Aviso formal",
    mensaje:
      "Estimado(a) {nombre}: Le informamos formalmente que su cuenta con {sponsor} registra {mora} de atraso y un saldo pendiente de {saldo}. Le solicitamos regularizar su situación a la brevedad.",
    estado: "Activo",
  },
  {
    id: 4,
    codigo: "PLT-004",
    nombre: "Advertencia",
    mensaje:
      "Estimado(a) {nombre}: Su deuda de {saldo} con {sponsor} acumula {mora} de atraso. De no registrarse su pago, el caso pasará a la etapa prejudicial con los costos adicionales que ello implica.",
    estado: "Activo",
  },
  {
    id: 5,
    codigo: "PLT-005",
    nombre: "Ultimátum",
    mensaje:
      "Estimado(a) {nombre}: Este es el último aviso antes de iniciar acciones legales. Su deuda de {saldo} con {sponsor} registra {mora} de atraso. Cuenta con 48 horas para regularizar.",
    estado: "Activo",
  },
  {
    id: 6,
    codigo: "PLT-006",
    nombre: "Carta notarial",
    mensaje:
      "Estimado(a) {nombre}: Por medio de la presente carta notarial se le notifica que su deuda de {saldo} con {sponsor}, con {mora} de atraso, ha sido derivada a proceso judicial. Atentamente, Área Legal.",
    estado: "Activo",
  },
  // Ejemplo desactivado: demuestra que una plantilla puede darse de baja sin eliminarla.
  {
    id: 7,
    codigo: "PLT-007",
    nombre: "Mensaje de prueba (ejemplo)",
    mensaje: "Este es un mensaje de ejemplo para {nombre}, de parte de {sponsor}. Esta plantilla está desactivada y no se envía.",
    estado: "Inactivo",
  },
];

// --- Catálogo de estrategias: cómo se hostiga a un moroso dentro de un tipo de cobranza ---
export type EstrategiaCobranza = {
  id: number;
  codigo: string;
  nombre: string;
  tipoCobranza: string; // referencia a ServicioCobranza.tipoCobranza
  canalCodigos: string[]; // uno o varios canales del catálogo de canales
  plantillaCodigo: string; // tipo de mensaje del catálogo de plantillas
  duracionDias: number; // cuánto dura la estrategia (admite medios días: 0.5, 1.5…)
  tarifa: number; // costo en soles de ejecutar la estrategia sobre un moroso
  estado: "Activo" | "Inactivo";
};

export const ESTRATEGIAS_SEED: EstrategiaCobranza[] = [
  // Cobranza temprana (leve)
  { id: 1, codigo: "EST-01", nombre: "Estrategia 01", tipoCobranza: "Cobranza temprana", canalCodigos: ["CAN-001"], plantillaCodigo: "PLT-001", duracionDias: 1, tarifa: 3, estado: "Activo" },
  { id: 2, codigo: "EST-02", nombre: "Estrategia 02", tipoCobranza: "Cobranza temprana", canalCodigos: ["CAN-002"], plantillaCodigo: "PLT-001", duracionDias: 0.5, tarifa: 4, estado: "Activo" },
  { id: 3, codigo: "EST-03", nombre: "Estrategia 03", tipoCobranza: "Cobranza temprana", canalCodigos: ["CAN-002", "CAN-001"], plantillaCodigo: "PLT-002", duracionDias: 1.5, tarifa: 5, estado: "Activo" },
  // Cobranza tardía (intermedia)
  { id: 4, codigo: "EST-04", nombre: "Estrategia 04", tipoCobranza: "Cobranza tardía", canalCodigos: ["CAN-002"], plantillaCodigo: "PLT-002", duracionDias: 0.5, tarifa: 6, estado: "Activo" },
  { id: 5, codigo: "EST-05", nombre: "Estrategia 05", tipoCobranza: "Cobranza tardía", canalCodigos: ["CAN-003"], plantillaCodigo: "PLT-003", duracionDias: 2, tarifa: 7, estado: "Activo" },
  { id: 6, codigo: "EST-06", nombre: "Estrategia 06", tipoCobranza: "Cobranza tardía", canalCodigos: ["CAN-002", "CAN-003"], plantillaCodigo: "PLT-003", duracionDias: 2.5, tarifa: 8, estado: "Activo" },
  { id: 7, codigo: "EST-07", nombre: "Estrategia 07", tipoCobranza: "Cobranza tardía", canalCodigos: ["CAN-002", "CAN-003", "CAN-001"], plantillaCodigo: "PLT-004", duracionDias: 3.5, tarifa: 9, estado: "Activo" },
  // Cobranza prejudicial
  { id: 8, codigo: "EST-08", nombre: "Estrategia 08", tipoCobranza: "Cobranza prejudicial", canalCodigos: ["CAN-004"], plantillaCodigo: "PLT-004", duracionDias: 1, tarifa: 10, estado: "Activo" },
  { id: 9, codigo: "EST-09", nombre: "Estrategia 09", tipoCobranza: "Cobranza prejudicial", canalCodigos: ["CAN-004", "CAN-002"], plantillaCodigo: "PLT-005", duracionDias: 0.5, tarifa: 11, estado: "Activo" },
  { id: 10, codigo: "EST-10", nombre: "Estrategia 10", tipoCobranza: "Cobranza prejudicial", canalCodigos: ["CAN-004", "CAN-002", "CAN-003"], plantillaCodigo: "PLT-005", duracionDias: 2.5, tarifa: 12, estado: "Activo" },
  // Cobranza judicial
  { id: 11, codigo: "EST-11", nombre: "Estrategia 11", tipoCobranza: "Cobranza judicial", canalCodigos: ["CAN-005"], plantillaCodigo: "PLT-006", duracionDias: 1, tarifa: 60, estado: "Activo" },
  // Ejemplo desactivado: demuestra que una estrategia puede darse de baja sin eliminarla.
  { id: 12, codigo: "EST-12", nombre: "Estrategia de prueba (ejemplo)", tipoCobranza: "Cobranza Extra (ejemplo)", canalCodigos: ["CAN-006"], plantillaCodigo: "PLT-007", duracionDias: 1, tarifa: 0, estado: "Inactivo" },
];

// --- Catálogo de autómata: el robot de envío masivo por canal y su capacidad ---
export type AutomataCatalogo = {
  id: number;
  codigo: string;
  nombre: string;
  capacidadMinima: number | null;
  capacidadPorDia: number;
  estado: "Activo" | "Inactivo";
};

export const AUTOMATA_SEED: AutomataCatalogo[] = [
  { id: 1, codigo: "AUT-001", nombre: "Autómata de SMS", capacidadMinima: null, capacidadPorDia: 2500, estado: "Activo" },
  { id: 2, codigo: "AUT-002", nombre: "Autómata de Whatsapp", capacidadMinima: null, capacidadPorDia: 3000, estado: "Activo" },
  { id: 3, codigo: "AUT-003", nombre: "Autómata de correos", capacidadMinima: null, capacidadPorDia: 1000, estado: "Activo" },
  { id: 4, codigo: "AUT-004", nombre: "Autómata de llamadas", capacidadMinima: null, capacidadPorDia: 500, estado: "Activo" },
  { id: 5, codigo: "AUT-005", nombre: "Autómata de dron", capacidadMinima: null, capacidadPorDia: 40, estado: "Activo" },
  // Ejemplo desactivado: demuestra que un autómata puede darse de baja sin eliminarlo.
  { id: 6, codigo: "AUT-006", nombre: "Autómata de Telegram (ejemplo)", capacidadMinima: null, capacidadPorDia: 800, estado: "Inactivo" },
];

// --- Helpers de formato compartidos por las pantallas ---

export function nombreCanal(codigo: string, canales: CanalContacto[]) {
  return canales.find((c) => c.codigo === codigo)?.nombre || codigo;
}

/** "SMS ×3/día · Whatsapp ×2/día" */
export function formatCanalesFrecuencia(canales: CanalFrecuencia[] | undefined, catalogo: CanalContacto[]) {
  if (!canales?.length) return "—";
  return canales.map((c) => `${nombreCanal(c.canalCodigo, catalogo)} ×${c.vecesPorDia}/día`).join(" · ");
}

/** "SMS y Whatsapp" / "Llamada (IVR), Whatsapp y Correo" */
export function formatListaCanales(codigos: string[] | undefined, catalogo: CanalContacto[]) {
  if (!codigos?.length) return "—";
  const nombres = codigos.map((c) => nombreCanal(c, catalogo));
  if (nombres.length === 1) return nombres[0];
  return `${nombres.slice(0, -1).join(", ")} y ${nombres[nombres.length - 1]}`;
}

/** "1 día" / "0.5 días" / "3.5 días" */
export function formatDuracion(dias: number) {
  return dias === 1 ? "1 día" : `${dias} días`;
}
