export type CatalogId = "servicios" | "morosos" | "canales" | "estrategias" | "plantillas" | "automata";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

const STORAGE_PREFIX = "swcobranza:";

// Sube este número cada vez que cambie la forma de un catálogo o entidad
// simulada (nuevos campos, renombrados, etc.). Los datos ya guardados en el
// navegador de un usuario que abrió una versión anterior del prototipo nunca
// se migran solos; sin este chequeo, una pantalla nueva que espere un campo
// que no existía (p. ej. Servicio.saldoMin) rompe al leer datos con la forma vieja.
const SCHEMA_VERSION = 12;
const SCHEMA_VERSION_KEY = `${STORAGE_PREFIX}schemaVersion`;

/** Si el esquema de catálogos/entidades cambió, limpia los datos simulados persistidos
 *  (no la sesión) para que se vuelvan a sembrar con la forma actual. Llamar una vez al
 *  iniciar la app, antes de `seedAllIfEmpty()`. */
export function resetIfSchemaChanged() {
  try {
    if (localStorage.getItem(SCHEMA_VERSION_KEY) === String(SCHEMA_VERSION)) return;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(`${STORAGE_PREFIX}catalog:`) || key.startsWith(`${STORAGE_PREFIX}tx:`))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    localStorage.setItem(SCHEMA_VERSION_KEY, String(SCHEMA_VERSION));
  } catch {
    /* noop */
  }
}

/** Resetea el prototipo por completo: borra TODOS los datos simulados (catálogos, sponsors,
 *  deudores, deudas, tickets, envíos) y la sesión (rol activo), para volver a la forma base
 *  recién sembrada. Pensado para el botón "Resetear prototipo" del Administrador — el llamador
 *  debe recargar la página después para que todo se vuelva a sembrar desde cero. */
export function resetPrototipo() {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) keysToRemove.push(key);
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    /* noop */
  }
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: Json) {
  localStorage.setItem(key, JSON.stringify(value));
}

function catalogKey(id: CatalogId) {
  return `${STORAGE_PREFIX}catalog:${id}`;
}

export function getCatalog<T = any>(id: CatalogId, fallback: T[] = []): T[] {
  return readJson<T[]>(catalogKey(id), fallback);
}

export function setCatalog<T = any>(id: CatalogId, items: T[]) {
  writeJson(catalogKey(id), items as unknown as Json);
}

export function upsertCatalogItem<T extends { id?: string | number }>(id: CatalogId, item: T) {
  const current = getCatalog<T>(id, []);
  const next = (() => {
    if (item.id === undefined || item.id === null) return [...current, item];
    const idx = current.findIndex((x) => x.id === item.id);
    if (idx === -1) return [...current, item];
    return current.map((x) => (x.id === item.id ? item : x));
  })();
  setCatalog(id, next);
  return next;
}

// --- Sponsor: empresa/entidad acreedora que encarga la cartera a gestionar ---
export type Sponsor = {
  id: string;
  codigo: string;
  razonSocial: string;
  rubro: string;
  contacto: string;
  telefono?: string;
  carteraAsignada: number;
  carteraRecuperada: number;
  estado: "Activo" | "Inactivo";
  createdAt: string;
};

// --- Deudor / Moroso ---
export type Deudor = {
  id: string;
  documento: string;
  nombre: string;
  sponsorId: string;
  telefono?: string;
  email?: string;
  saldoTotal: number;
  diasMoraMax: number;
  estado: "Al día" | "En Mora";
  createdAt: string;
};

// --- Deuda ---
export type Deuda = {
  id: string;
  codigo: string;
  deudorId: string;
  sponsorId: string;
  servicioCodigo: string; // catálogo servicios
  monto: number;
  saldo: number;
  fechaVencimiento: string; // yyyy-mm-dd
  diasMora: number;
  estado: "Pendiente" | "Vencida" | "Pagada";
  createdAt: string;
};

// --- Ticket de gestión de cobranza (un moroso clasificado, listo para hostigar) ---
// DI: clasificado, aún sin estrategia asignada | RE: con estrategia asignada y gestión enviada | CE: cerrado
export type TicketGestion = {
  id: string;
  codigo: string;
  deudaId: string;
  deudorId: string;
  estado: "DI" | "RE" | "CE";
  /** Estrategia de hostigamiento que el sponsor eligió para este moroso (catálogo de estrategias). */
  estrategiaCodigo?: string;
  fechaAsignacion?: string;
  createdAt: string;
};

// --- Movimiento del ticket de gestión (auditoría DI -> RE -> CE) ---
export type MovimientoTicket = {
  id: string;
  ticketId: string;
  estadoAnterior: string;
  estadoNuevo: string;
  motivo: string;
  createdAt: string;
};

// --- Envío de cobranza: la ejecución de la estrategia que el sponsor eligió para un moroso.
// El sistema simula haber enviado el mensaje por el/los canal(es) de la estrategia y registra la
// respuesta del moroso. Es lo que el Sponsor monitorea en "Entrega cobranza" y en el
// "Reporte de gestión de deudas" — el sponsor no llama ni escribe manualmente. ---
export type RespuestaEnvio = "Afirmativa" | "Negativa" | "Sin respuesta";

export type EnvioCobranza = {
  id: string;
  codigo: string;
  ticketId: string;
  deudaId: string;
  deudorId: string;
  estrategiaCodigo: string; // catálogo estrategias
  canalIds: string[]; // canales de la estrategia (catálogo canales)
  automataCodigo?: string; // catálogo automata (vacío si ningún canal tiene autómata)
  operador: string; // etiqueta simulada del autómata que envió, p. ej. "SMS1"
  plantillaCodigo?: string; // tipo de mensaje enviado (catálogo plantillas)
  tarifa: number; // costo cobrado al sponsor por ejecutar la estrategia
  respuesta: RespuestaEnvio;
  fechaEnvio: string; // yyyy-mm-dd
  horaEnvio: string; // HH:mm:ss
  createdAt: string;
};

function txKey(name: string) {
  return `${STORAGE_PREFIX}tx:${name}`;
}

export function getSponsors(): Sponsor[] {
  return readJson<Sponsor[]>(txKey("sponsors"), []);
}
export function setSponsors(items: Sponsor[]) {
  writeJson(txKey("sponsors"), items as unknown as Json);
}

export function getDeudores(): Deudor[] {
  return readJson<Deudor[]>(txKey("deudores"), []);
}
export function setDeudores(items: Deudor[]) {
  writeJson(txKey("deudores"), items as unknown as Json);
}

export function getDeudas(): Deuda[] {
  return readJson<Deuda[]>(txKey("deudas"), []);
}
export function setDeudas(items: Deuda[]) {
  writeJson(txKey("deudas"), items as unknown as Json);
}

export function getTicketsGestion(): TicketGestion[] {
  return readJson<TicketGestion[]>(txKey("ticketsGestion"), []);
}
export function setTicketsGestion(items: TicketGestion[]) {
  writeJson(txKey("ticketsGestion"), items as unknown as Json);
}
export function upsertTicketGestion(t: TicketGestion) {
  const current = getTicketsGestion();
  const idx = current.findIndex((x) => x.id === t.id);
  const next = idx === -1 ? [...current, t] : current.map((x) => (x.id === t.id ? t : x));
  setTicketsGestion(next);
  return next;
}

export function getMovimientosTicket(): MovimientoTicket[] {
  return readJson<MovimientoTicket[]>(txKey("movimientosTicket"), []);
}
export function setMovimientosTicket(items: MovimientoTicket[]) {
  writeJson(txKey("movimientosTicket"), items as unknown as Json);
}
export function addMovimientoTicket(m: MovimientoTicket) {
  const next = [...getMovimientosTicket(), m];
  setMovimientosTicket(next);
  return next;
}

export function getEnviosCobranza(): EnvioCobranza[] {
  return readJson<EnvioCobranza[]>(txKey("enviosCobranza"), []);
}
export function setEnviosCobranza(items: EnvioCobranza[]) {
  writeJson(txKey("enviosCobranza"), items as unknown as Json);
}
export function addEnviosCobranza(items: EnvioCobranza[]) {
  const next = [...getEnviosCobranza(), ...items];
  setEnviosCobranza(next);
  return next;
}

export function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

// --- Acuerdo de gestión de cobranza ---
// Antes de poder subir su lista de morosos, el sponsor debe llenar sus datos y
// aceptar el acuerdo de confidencialidad. Se guarda por sponsor para que no se
// le vuelva a pedir en cada visita.
export type AcuerdoSponsor = {
  sponsorCodigo: string;
  nombreCliente: string;
  documento: string;
  telefono: string;
  correo: string;
  numMorosos: string;
  fecha: string;
};

export function getAcuerdos(): AcuerdoSponsor[] {
  return readJson<AcuerdoSponsor[]>(txKey("acuerdos"), []);
}
export function getAcuerdoDe(sponsorCodigo: string): AcuerdoSponsor | undefined {
  return getAcuerdos().find((a) => a.sponsorCodigo === sponsorCodigo);
}
export function saveAcuerdo(acuerdo: AcuerdoSponsor) {
  const next = [...getAcuerdos().filter((a) => a.sponsorCodigo !== acuerdo.sponsorCodigo), acuerdo];
  writeJson(txKey("acuerdos"), next as unknown as Json);
  return next;
}

// --- Calificación del servicio ---
// Al cerrar el reporte final, el sponsor puede calificar cómo le fue con el sistema.
export type CalificacionSponsor = {
  sponsorCodigo: string;
  estrellas: number;
  comentario: string;
  fecha: string;
};

export function getCalificaciones(): CalificacionSponsor[] {
  return readJson<CalificacionSponsor[]>(txKey("calificaciones"), []);
}
export function getCalificacionDe(sponsorCodigo: string): CalificacionSponsor | undefined {
  return getCalificaciones().find((c) => c.sponsorCodigo === sponsorCodigo);
}
export function saveCalificacion(calificacion: CalificacionSponsor) {
  const next = [...getCalificaciones().filter((c) => c.sponsorCodigo !== calificacion.sponsorCodigo), calificacion];
  writeJson(txKey("calificaciones"), next as unknown as Json);
  return next;
}
