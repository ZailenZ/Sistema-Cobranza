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
//   canal                        = medio de contacto (SMS, WhatsApp, carta notarial…).
//   autómata                     = el robot que envía por cada canal digital.
// ---------------------------------------------------------------------------

// --- Catálogo de canal: medio de contacto y su naturaleza (digital/físico) ---
export type CanalContacto = {
  id: number;
  codigo: string;
  nombre: string;
  tipoCanal: "Digital" | "Físico";
  /** Horario diario permitido para contactar por este canal (HH:mm). */
  horaInicio: string;
  horaFin: string;
  descripcion: string;
  estado: "Activo" | "Inactivo";
};

export const CANALES_SEED: CanalContacto[] = [
  { id: 1, codigo: "CAN-001", nombre: "SMS", tipoCanal: "Digital", horaInicio: "08:00", horaFin: "20:00", descripcion: "Mensaje de texto masivo: el canal más económico y de mayor alcance.", estado: "Activo" },
  { id: 2, codigo: "CAN-002", nombre: "Whatsapp", tipoCanal: "Digital", horaInicio: "08:00", horaFin: "21:00", descripcion: "Mensajería instantánea con mayor tasa de lectura y respuesta.", estado: "Activo" },
  { id: 3, codigo: "CAN-003", nombre: "Correo", tipoCanal: "Digital", horaInicio: "00:00", horaFin: "23:59", descripcion: "Comunicación formal, deja constancia escrita del aviso enviado.", estado: "Activo" },
  { id: 4, codigo: "CAN-004", nombre: "Llamada (IVR)", tipoCanal: "Digital", horaInicio: "09:00", horaFin: "18:00", descripcion: "Llamada automatizada con menú de respuesta; solo en horario laboral.", estado: "Activo" },
  { id: 5, codigo: "CAN-005", nombre: "Carta notarial", tipoCanal: "Físico", horaInicio: "09:00", horaFin: "17:00", descripcion: "Entrega física: la notaría lleva la carta al domicilio del moroso a través de un notario.", estado: "Activo" },
  // Ejemplo desactivado: demuestra que un canal puede darse de baja sin eliminarlo.
  { id: 6, codigo: "CAN-006", nombre: "Telegram (ejemplo)", tipoCanal: "Digital", horaInicio: "08:00", horaFin: "20:00", descripcion: "Canal de ejemplo para probar la desactivación de un canal.", estado: "Inactivo" },
];

// --- Catálogo de morosos: qué perfil de moroso define cada rango de mora y saldo ---
export type TipoMoroso = {
  id: number;
  codigo: string;
  nombre: string;
  /** Cuántas veces ha incurrido en mora: el otro criterio que define el perfil. */
  incidenciasMin: number;
  incidenciasMax: number | null; // null = "a más"
  moraMin: number;
  moraMax: number | null; // null = "a más"
  saldoMin: number;
  saldoMax: number | null; // null = "a más"
  descripcion: string;
  estado: "Activo" | "Inactivo";
};

export const MOROSOS_SEED: TipoMoroso[] = [
  { id: 1, codigo: "MOR-001", nombre: "Moroso ocasional", incidenciasMin: 0, incidenciasMax: 1, moraMin: 1, moraMax: 15, saldoMin: 500, saldoMax: 1000, descripcion: "Se atrasó poco y debe poco; suele pagar apenas se le recuerda.", estado: "Activo" },
  { id: 2, codigo: "MOR-002", nombre: "Moroso reincidente", incidenciasMin: 2, incidenciasMax: 3, moraMin: 16, moraMax: 30, saldoMin: 1001, saldoMax: 3000, descripcion: "Atraso que se repite mes a mes, con saldo que ya empieza a pesar.", estado: "Activo" },
  { id: 3, codigo: "MOR-003", nombre: "Moroso riesgoso", incidenciasMin: 4, incidenciasMax: 5, moraMin: 31, moraMax: 45, saldoMin: 3001, saldoMax: 16000, descripcion: "Mora prolongada y deuda alta; el cobro peligra si no se actúa.", estado: "Activo" },
  { id: 4, codigo: "MOR-004", nombre: "Moroso crítico", incidenciasMin: 6, incidenciasMax: null, moraMin: 46, moraMax: null, saldoMin: 16001, saldoMax: null, descripcion: "Deuda muy vencida y elevada; candidato a proceso judicial.", estado: "Activo" },
  // Ejemplo desactivado: demuestra que un tipo de moroso puede darse de baja sin eliminarlo.
  { id: 5, codigo: "MOR-005", nombre: "Moroso de prueba (ejemplo)", incidenciasMin: 99, incidenciasMax: null, moraMin: 200, moraMax: null, saldoMin: 100000, saldoMax: null, descripcion: "Tipo de moroso de ejemplo para probar la desactivación.", estado: "Inactivo" },
];

/** Formatea el rango de incidencias de un tipo de moroso: "0–1" / "6 a más". */
export function formatRangoIncidencias(tipo: TipoMoroso | undefined) {
  if (!tipo) return "—";
  return tipo.incidenciasMax === null
    ? `${tipo.incidenciasMin} a más`
    : `${tipo.incidenciasMin}–${tipo.incidenciasMax}`;
}

/** Formatea el rango de mora de un tipo de moroso: "1–15 días" / "46 días a más". */
export function formatRangoMora(tipo: TipoMoroso | undefined) {
  if (!tipo) return "—";
  return tipo.moraMax === null ? `${tipo.moraMin} días a más` : `${tipo.moraMin}–${tipo.moraMax} días`;
}

/** Formatea el rango de saldo de un tipo de moroso: "S/ 500–1,000" / "S/ 16,001 a más". */
export function formatRangoSaldo(tipo: TipoMoroso | undefined) {
  if (!tipo) return "—";
  const min = `S/ ${tipo.saldoMin.toLocaleString("es-PE")}`;
  return tipo.saldoMax === null ? `${min} a más` : `${min}–S/ ${tipo.saldoMax.toLocaleString("es-PE")}`;
}

/** Tipo de moroso al que apunta un servicio (el que le presta sus rangos de mora y saldo). */
export function tipoMorosoDeServicio(
  servicio: { tipoMorosoCodigo?: string } | undefined,
  tipos: TipoMoroso[],
) {
  return tipos.find((m) => m.codigo === servicio?.tipoMorosoCodigo);
}

// --- Catálogo de servicio: qué tipo de cobranza le toca a cada tipo de moroso ---
/** Un canal usado por un servicio, con su frecuencia = cuántos mensajes al día se envían por ahí. */
export type CanalFrecuencia = {
  canalCodigo: string;
  vecesPorDia: number;
};

export type ServicioCobranza = {
  id: number;
  codigo: string;
  tipoCobranza: string;
  /** Tipo de moroso al que aplica este servicio; de ahí salen los rangos de mora y saldo. */
  tipoMorosoCodigo: string;
  /** Estrategias de hostigamiento que este tipo de cobranza puede usar. La relación
   *  servicio ↔ estrategia se define aquí, no en el catálogo de estrategias. */
  estrategiaCodigos: string[];
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
    tipoMorosoCodigo: "MOR-001",
    estrategiaCodigos: ["EST-01", "EST-02", "EST-03"],
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
    tipoCobranza: "Cobranza intermedia",
    tipoMorosoCodigo: "MOR-002",
    estrategiaCodigos: ["EST-04", "EST-05", "EST-06", "EST-07"],
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
    tipoMorosoCodigo: "MOR-003",
    estrategiaCodigos: ["EST-08", "EST-09", "EST-10"],
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
    tipoMorosoCodigo: "MOR-004",
    estrategiaCodigos: ["EST-11"],
    canales: [{ canalCodigo: "CAN-005", vecesPorDia: 1 }],
    descripcion: "Notificación formal por carta notarial para derivar el caso a proceso judicial.",
    estado: "Activo",
  },
  // Ejemplo desactivado: demuestra que un tipo de cobranza puede darse de baja sin eliminarlo.
  {
    id: 5,
    codigo: "SRV-005",
    tipoCobranza: "Cobranza Extra (ejemplo)",
    tipoMorosoCodigo: "MOR-005",
    estrategiaCodigos: ["EST-12"],
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
  descripcion: string;
  estado: "Activo" | "Inactivo";
};

export const PLANTILLAS_SEED: PlantillaMensaje[] = [
  {
    id: 1,
    codigo: "PLT-001",
    nombre: "Amistoso",
    mensaje:
      "Hola {nombre}, esperamos que estés bien. Te recordamos que tienes una deuda pendiente de {saldo}, con {mora} de retraso, registrada por tu sponsor {sponsor}. Queremos ayudarte a resolverlo de forma sencilla. Responde con: 1 – Sí, voy a pagar. 2 – No puedo pagar ahora, me contactaré con mi sponsor.",
    descripcion: "Primer contacto cordial: invita a pagar sin presionar.",
    estado: "Activo",
  },
  {
    id: 2,
    codigo: "PLT-002",
    nombre: "Recordatorio",
    mensaje:
      "Hola {nombre}, te recordamos que tu deuda de {saldo} con {sponsor} ya acumula {mora} de atraso. Regulariza hoy para evitar recargos adicionales.",
    descripcion: "Segundo toque: recuerda la deuda y menciona los recargos.",
    estado: "Activo",
  },
  {
    id: 3,
    codigo: "PLT-003",
    nombre: "Aviso formal",
    mensaje:
      "Estimado(a) {nombre}: Le informamos formalmente que su cuenta con {sponsor} registra {mora} de atraso y un saldo pendiente de {saldo}. Le solicitamos regularizar su situación a la brevedad.",
    descripcion: "Comunicación formal que deja constancia escrita del atraso.",
    estado: "Activo",
  },
  {
    id: 4,
    codigo: "PLT-004",
    nombre: "Advertencia",
    mensaje:
      "Estimado(a) {nombre}: Su deuda de {saldo} con {sponsor} acumula {mora} de atraso. De no registrarse su pago, el caso pasará a la etapa prejudicial con los costos adicionales que ello implica.",
    descripcion: "Anuncia que el caso puede escalar a la etapa prejudicial.",
    estado: "Activo",
  },
  {
    id: 5,
    codigo: "PLT-005",
    nombre: "Ultimátum",
    mensaje:
      "Estimado(a) {nombre}: Este es el último aviso antes de iniciar acciones legales. Su deuda de {saldo} con {sponsor} registra {mora} de atraso. Cuenta con 48 horas para regularizar.",
    descripcion: "Último aviso antes de iniciar acciones legales.",
    estado: "Activo",
  },
  {
    id: 6,
    codigo: "PLT-006",
    nombre: "Carta notarial",
    mensaje:
      "Estimado(a) {nombre}: Por medio de la presente carta notarial se le notifica que su deuda de {saldo} con {sponsor}, con {mora} de atraso, ha sido derivada a proceso judicial. Atentamente, Área Legal.",
    descripcion: "Notificación legal que formaliza la derivación a proceso judicial.",
    estado: "Activo",
  },
  // Ejemplo desactivado: demuestra que una plantilla puede darse de baja sin eliminarla.
  {
    id: 7,
    codigo: "PLT-007",
    nombre: "Mensaje de prueba (ejemplo)",
    mensaje: "Este es un mensaje de ejemplo para {nombre}, de parte de {sponsor}. Esta plantilla está desactivada y no se envía.",
    descripcion: "Plantilla de ejemplo para probar la desactivación de un mensaje.",
    estado: "Inactivo",
  },
];

// --- Catálogo de estrategias: cómo se hostiga a un moroso dentro de un tipo de cobranza ---
export type EstrategiaCobranza = {
  id: number;
  codigo: string;
  nombre: string;
  canalCodigos: string[]; // uno o varios canales del catálogo de canales
  plantillaCodigo: string; // tipo de mensaje del catálogo de plantillas
  duracionDias: number; // cuánto dura la estrategia (admite medios días: 0.5, 1.5…)
  tarifa: number; // costo en soles de ejecutar la estrategia sobre un moroso
  descripcion: string;
  estado: "Activo" | "Inactivo";
};

export const ESTRATEGIAS_SEED: EstrategiaCobranza[] = [
  // Cobranza temprana (leve)
  { id: 1, codigo: "EST-01", nombre: "Estrategia 01", canalCodigos: ["CAN-001"], plantillaCodigo: "PLT-001", duracionDias: 1, tarifa: 3, descripcion: "Un SMS amistoso durante un día: el primer toque y el más económico.", estado: "Activo" },
  { id: 2, codigo: "EST-02", nombre: "Estrategia 02", canalCodigos: ["CAN-002"], plantillaCodigo: "PLT-001", duracionDias: 0.5, tarifa: 4, descripcion: "Mensaje amistoso por WhatsApp: llega más rápido y se lee más.", estado: "Activo" },
  { id: 3, codigo: "EST-03", nombre: "Estrategia 03", canalCodigos: ["CAN-002", "CAN-001"], plantillaCodigo: "PLT-002", duracionDias: 1.5, tarifa: 5, descripcion: "Recordatorio combinado por WhatsApp y SMS para reforzar el aviso.", estado: "Activo" },
  // Cobranza intermedia (intermedia)
  { id: 4, codigo: "EST-04", nombre: "Estrategia 04", canalCodigos: ["CAN-002"], plantillaCodigo: "PLT-002", duracionDias: 0.5, tarifa: 6, descripcion: "Recordatorio breve por WhatsApp para morosos que recién se atrasan.", estado: "Activo" },
  { id: 5, codigo: "EST-05", nombre: "Estrategia 05", canalCodigos: ["CAN-003"], plantillaCodigo: "PLT-003", duracionDias: 2, tarifa: 7, descripcion: "Aviso formal por correo, con constancia escrita del atraso.", estado: "Activo" },
  { id: 6, codigo: "EST-06", nombre: "Estrategia 06", canalCodigos: ["CAN-002", "CAN-003"], plantillaCodigo: "PLT-003", duracionDias: 2.5, tarifa: 8, descripcion: "Aviso formal por WhatsApp y correo a la vez, para más presión.", estado: "Activo" },
  { id: 7, codigo: "EST-07", nombre: "Estrategia 07", canalCodigos: ["CAN-002", "CAN-003", "CAN-001"], plantillaCodigo: "PLT-004", duracionDias: 3.5, tarifa: 9, descripcion: "Advertencia por tres canales durante varios días: la más intensa del tramo.", estado: "Activo" },
  // Cobranza prejudicial
  { id: 8, codigo: "EST-08", nombre: "Estrategia 08", canalCodigos: ["CAN-004"], plantillaCodigo: "PLT-004", duracionDias: 1, tarifa: 10, descripcion: "Llamada automatizada de advertencia, con respuesta del moroso.", estado: "Activo" },
  { id: 9, codigo: "EST-09", nombre: "Estrategia 09", canalCodigos: ["CAN-004", "CAN-002"], plantillaCodigo: "PLT-005", duracionDias: 0.5, tarifa: 11, descripcion: "Ultimátum por llamada y WhatsApp: aviso final antes de lo legal.", estado: "Activo" },
  { id: 10, codigo: "EST-10", nombre: "Estrategia 10", canalCodigos: ["CAN-004", "CAN-002", "CAN-003"], plantillaCodigo: "PLT-005", duracionDias: 2.5, tarifa: 12, descripcion: "Ultimátum sostenido por llamada, WhatsApp y correo.", estado: "Activo" },
  // Cobranza judicial
  { id: 11, codigo: "EST-11", nombre: "Estrategia 11", canalCodigos: ["CAN-005"], plantillaCodigo: "PLT-006", duracionDias: 1, tarifa: 60, descripcion: "Carta notarial entregada por el notario en el domicilio; inicia el proceso judicial.", estado: "Activo" },
  // Ejemplo desactivado: demuestra que una estrategia puede darse de baja sin eliminarla.
  { id: 12, codigo: "EST-12", nombre: "Estrategia de prueba (ejemplo)", canalCodigos: ["CAN-006"], plantillaCodigo: "PLT-007", duracionDias: 1, tarifa: 0, descripcion: "Estrategia de ejemplo para probar la desactivación.", estado: "Inactivo" },
];

// --- Catálogo de autómata: el robot de envío masivo por canal y su capacidad ---
export type AutomataCatalogo = {
  id: number;
  codigo: string;
  nombre: string;
  /** Tope de mensajes que el autómata puede procesar en un día (el mínimo siempre es 0). */
  capacidadMaxPorDia: number;
  descripcion: string;
  estado: "Activo" | "Inactivo";
};

// Un autómata NO entrega el mensaje por su cuenta: toma la plantilla, arma el
// mensaje para cada moroso y lo despacha a través de un MEDIO externo, que es
// quien lo hace llegar y devuelve la respuesta. El medio depende del moroso
// (su operador móvil, su proveedor de correo) o del canal (la notaría).
export const AUTOMATA_SEED: AutomataCatalogo[] = [
  { id: 1, codigo: "AUT-001", nombre: "Autómata de SMS", capacidadMaxPorDia: 2500, descripcion: "Arma el SMS desde la plantilla y lo despacha por el operador móvil de cada moroso (Claro, Movistar, Entel); por ahí mismo le vuelve la respuesta.", estado: "Activo" },
  { id: 2, codigo: "AUT-002", nombre: "Autómata de Whatsapp", capacidadMaxPorDia: 3000, descripcion: "Arma el mensaje desde la plantilla y lo despacha por WhatsApp, que lo entrega al número del moroso y devuelve lo que responde.", estado: "Activo" },
  { id: 3, codigo: "AUT-003", nombre: "Autómata de correos", capacidadMaxPorDia: 1000, descripcion: "Arma el correo desde la plantilla y lo despacha por el proveedor de correo del moroso (Gmail, Outlook, iCloud), que lo entrega en su bandeja.", estado: "Activo" },
  { id: 4, codigo: "AUT-004", nombre: "Autómata de llamadas", capacidadMaxPorDia: 500, descripcion: "Convierte la plantilla en locución IVR y cursa la llamada por el operador telefónico del moroso; el menú de respuesta recoge lo que contesta.", estado: "Activo" },
  { id: 5, codigo: "AUT-005", nombre: "Autómata de cartas", capacidadMaxPorDia: 40, descripcion: "Genera la carta notarial desde la plantilla y la despacha por medio de la notaría, que la hace entregar por un notario en el domicilio del moroso.", estado: "Activo" },
  // Ejemplo desactivado: demuestra que un autómata puede darse de baja sin eliminarlo.
  { id: 6, codigo: "AUT-006", nombre: "Autómata de Telegram (ejemplo)", capacidadMaxPorDia: 800, descripcion: "Autómata de ejemplo para probar la desactivación; despacharía por Telegram.", estado: "Inactivo" },
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
