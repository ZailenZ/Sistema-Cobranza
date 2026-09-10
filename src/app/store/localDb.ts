export type CatalogId = "servicios" | "canales" | "operarios" | "plantillas";

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

const STORAGE_PREFIX = "swcobranza:";

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
  estado: "Al día" | "En Mora" | "Castigado";
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
  estado: "Pendiente" | "Vencida" | "Pagada" | "Incobrable";
  createdAt: string;
};

// --- Ticket de gestión de cobranza (caso asignable) ---
// DI: disponible (fabricado por Batch, sin asignar) | RE: reservado (asignado a un operario) | CE: cerrado
export type TicketGestion = {
  id: string;
  codigo: string;
  deudaId: string;
  deudorId: string;
  canalId?: string; // catálogo canales
  prioridad: "Alta" | "Media" | "Baja";
  estado: "DI" | "RE" | "CE";
  operarioId?: string; // catálogo operarios
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

// --- Gestión de cobranza ("Entrega cobranza"): registro de contacto/pago sobre un ticket reservado ---
export type GestionCobranza = {
  id: string;
  codigo: string;
  ticketId: string;
  deudaId: string;
  operarioId?: string;
  canalId?: string;
  tipoContacto: "Llamada" | "Visita" | "Mensaje" | "Correo";
  resultado: "Contactado" | "Promesa de Pago" | "Pago Realizado" | "Sin Contacto" | "Rechazo";
  montoComprometido?: number;
  montoPagado?: number;
  fechaCompromiso?: string;
  observaciones?: string;
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

export function getGestionesCobranza(): GestionCobranza[] {
  return readJson<GestionCobranza[]>(txKey("gestionesCobranza"), []);
}
export function setGestionesCobranza(items: GestionCobranza[]) {
  writeJson(txKey("gestionesCobranza"), items as unknown as Json);
}
export function addGestionCobranza(g: GestionCobranza) {
  const next = [...getGestionesCobranza(), g];
  setGestionesCobranza(next);
  return next;
}

export function newId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}
