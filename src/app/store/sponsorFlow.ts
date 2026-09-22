// ---------------------------------------------------------------------------
// Simulación del flujo de autoservicio del Sponsor:
//  1) el sponsor "sube" su lista de morosos directamente (simulado, sin parseo
//     real de archivo) — no elige tipo de cobranza ni estrategia de antemano;
//  2) el sistema CLASIFICA a cada moroso según su información (días de mora) y
//     lo asigna a su tipo de cobranza del catálogo de servicios; cada moroso
//     queda como un ticket en estado DI, a la espera de una estrategia;
//  3) el sponsor ELIGE, por moroso, una de las estrategias de hostigamiento
//     disponibles para ese tipo de cobranza (canal(es) + tipo de mensaje +
//     duración + tarifa). Al elegirla, el ticket pasa a RE y el sistema simula
//     el envío y la respuesta del moroso, que es lo que luego se ve en
//     "Entrega cobranza" y en el "Reporte de gestión de deudas".
// Es un prototipo visual: no se parsea ningún archivo real, solo se generan
// datos de ejemplo y se clasifican como lo haría el sistema con datos reales.
// ---------------------------------------------------------------------------

import type {
  AutomataCatalogo,
  CanalContacto,
  EstrategiaCobranza,
  PlantillaMensaje,
  ServicioCobranza,
} from "./catalogSeed";
import {
  addEnviosCobranza,
  addMovimientoTicket,
  getCatalog,
  getDeudas,
  getDeudores,
  getSponsors,
  getTicketsGestion,
  newId,
  setDeudas,
  setDeudores,
  setTicketsGestion,
  type Deuda,
  type Deudor,
  type EnvioCobranza,
  type RespuestaEnvio,
  type TicketGestion,
} from "./localDb";

const NOMBRES_MOROSOS = [
  { nombre: "Tania Jiménez Rojas", documento: "DNI 71234567" },
  { nombre: "Alejandro Flores Quiñones", documento: "DNI 72345678" },
  { nombre: "Brenda Mirano Castillo", documento: "DNI 73456789" },
  { nombre: "Sebastián Gutiérrez Paredes", documento: "DNI 74567890" },
  { nombre: "Rodrigo Núñez Vidal", documento: "DNI 75678901" },
  { nombre: "Álvaro Jacinto Beltrán", documento: "DNI 76789012" },
  { nombre: "David Urbano Salcedo", documento: "DNI 77890123" },
  { nombre: "Camila Soto Herrera", documento: "DNI 78901234" },
  { nombre: "Renzo Palacios Del Río", documento: "DNI 79012345" },
  { nombre: "Fiorella Aguilar Mamani", documento: "DNI 70123456" },
];

function randomInt(min: number, max: number) {
  const lo = Math.ceil(min);
  const hi = Math.floor(max ?? min + 30);
  return Math.floor(Math.random() * (hi - lo + 1)) + lo;
}

function randomPick<T>(items: T[]): T | undefined {
  return items[Math.floor(Math.random() * items.length)];
}

function randomRespuesta(): RespuestaEnvio {
  const roll = Math.random();
  if (roll < 0.4) return "Afirmativa";
  if (roll < 0.7) return "Negativa";
  return "Sin respuesta";
}

/** Clasifica una deuda en el tipo de cobranza (servicio) activo cuya regla de mora la cubre —
 *  esta es la clasificación automática que hace el sistema a partir de la información del moroso,
 *  el sponsor no elige el tipo de cobranza. */
export function clasificarServicio(diasMora: number, servicios: ServicioCobranza[]): ServicioCobranza | undefined {
  return servicios
    .filter((s) => s.estado === "Activo")
    .find((s) => diasMora >= s.moraMin && (s.moraMax === null || diasMora <= s.moraMax));
}

/** Estrategias de hostigamiento activas disponibles para un tipo de cobranza,
 *  ordenadas de menos a más intensa (la tarifa crece con la intensidad). */
export function estrategiasDeServicio(tipoCobranza: string | undefined, estrategias: EstrategiaCobranza[]) {
  if (!tipoCobranza) return [];
  return estrategias
    .filter((e) => e.tipoCobranza === tipoCobranza && e.estado === "Activo")
    .sort((a, b) => a.tarifa - b.tarifa);
}

/** Qué tan avanzado está un valor dentro de su rango (0 = inicio, 1 = extremo). */
function posicionEnRango(valor: number, min: number, max: number | null) {
  if (max === null || max <= min) return valor > min ? 1 : 0; // tramo abierto ("a más")
  return Math.min(1, Math.max(0, (valor - min) / (max - min)));
}

/** Recomendación del sistema: entre las estrategias del tipo de cobranza del moroso, sugiere una
 *  de intensidad proporcional a qué tan avanzado está en el rango de mora y de saldo de ese tipo
 *  (más mora y más saldo → estrategia más intensa). Es solo una sugerencia: la decisión final de
 *  qué estrategia aplicar siempre es del sponsor. */
export function recomendarEstrategia(
  deuda: { diasMora: number; saldo: number } | undefined,
  servicio: ServicioCobranza | undefined,
  estrategias: EstrategiaCobranza[],
): EstrategiaCobranza | undefined {
  const disponibles = estrategiasDeServicio(servicio?.tipoCobranza, estrategias);
  if (disponibles.length === 0) return undefined;
  if (!deuda || !servicio) return disponibles[0];

  const intensidad =
    (posicionEnRango(deuda.diasMora, servicio.moraMin, servicio.moraMax) +
      posicionEnRango(deuda.saldo, servicio.saldoMin, servicio.saldoMax)) /
    2;

  return disponibles[Math.round(intensidad * (disponibles.length - 1))];
}

/** Resuelve el autómata del catálogo que corresponde a un nombre de canal (por palabra clave). */
export function automataParaCanal(canalNombre: string, automatas: AutomataCatalogo[]): AutomataCatalogo | undefined {
  const clave = canalNombre.toLowerCase();
  if (clave.includes("sms")) return automatas.find((a) => a.nombre.toLowerCase().includes("sms"));
  if (clave.includes("whatsapp")) return automatas.find((a) => a.nombre.toLowerCase().includes("whatsapp"));
  if (clave.includes("correo")) return automatas.find((a) => a.nombre.toLowerCase().includes("correo"));
  if (clave.includes("llamada")) return automatas.find((a) => a.nombre.toLowerCase().includes("llamada"));
  if (clave.includes("dron")) return automatas.find((a) => a.nombre.toLowerCase().includes("dron"));
  return undefined;
}

/** Reemplaza los marcadores {nombre}, {saldo}, {mora} y {sponsor} del mensaje de una plantilla
 *  por los datos reales del envío. Es lo que se muestra en "Ver Mensaje". */
export function renderMensajePlantilla(
  mensaje: string,
  params: { deudorNombre: string; saldo: number; diasMora: number; sponsorNombre: string },
) {
  const { deudorNombre, saldo, diasMora, sponsorNombre } = params;
  const saldoTxt = `S/ ${saldo.toLocaleString("es-PE", { minimumFractionDigits: 0 })}`;
  return mensaje
    .replace(/\{nombre\}/g, deudorNombre)
    .replace(/\{saldo\}/g, saldoTxt)
    .replace(/\{mora\}/g, `${diasMora} días`)
    .replace(/\{sponsor\}/g, sponsorNombre);
}

/** Texto de respaldo cuando el envío no tiene una plantilla del catálogo asociada. */
export function construirMensaje(params: {
  deudorNombre: string;
  saldo: number;
  diasMora: number;
  sponsorNombre: string;
  tipoCobranza: string;
}) {
  const { deudorNombre, saldo, diasMora, sponsorNombre } = params;
  const saldoTxt = `S/ ${saldo.toLocaleString("es-PE", { minimumFractionDigits: 0 })}`;
  return (
    `Estimado(a) ${deudorNombre}: registra una deuda de ${saldoTxt} con ${diasMora} días de atraso, ` +
    `encargada a gestión de cobranza por ${sponsorNombre}.`
  );
}

export type ResultadoCargaMorosos = {
  deudores: Deudor[];
  deudas: Deuda[];
  tickets: TicketGestion[];
  /** Cuántos morosos quedaron en cada tipo de cobranza tras la clasificación. */
  porTipo: { tipoCobranza: string; cantidad: number }[];
};

/** Simula la carga del archivo de morosos + deuda del sponsor: genera una cartera de ejemplo
 *  (mora y saldo variados) y, para cada moroso, el sistema lo CLASIFICA en su tipo de cobranza
 *  según sus días de mora. Los tickets quedan en DI: todavía sin estrategia — el sponsor debe
 *  elegir, por moroso, con qué estrategia hostigarlo. */
export function simularCargaMorosos(sponsorCodigo: string): ResultadoCargaMorosos | null {
  const sponsor = getSponsors().find((s) => s.codigo === sponsorCodigo);
  const serviciosActivos = getCatalog<ServicioCobranza>("servicios", []).filter((s) => s.estado === "Activo");
  if (!sponsor || serviciosActivos.length === 0) return null;

  const cantidad = randomInt(5, 7);
  const candidatos = [...NOMBRES_MOROSOS].sort(() => Math.random() - 0.5).slice(0, cantidad);

  const nuevosDeudores: Deudor[] = [];
  const nuevasDeudas: Deuda[] = [];
  const nuevosTickets: TicketGestion[] = [];
  const hoy = new Date();

  candidatos.forEach((persona, idx) => {
    // Cada moroso "trae" su propia mora/saldo (como si vinieran del archivo subido); el sistema
    // los clasifica después, a partir de esos días de mora, en su tipo de cobranza correspondiente.
    const perfil = randomPick(serviciosActivos)!;
    const diasMora = randomInt(perfil.moraMin, perfil.moraMax ?? perfil.moraMin + 20);
    const saldo = randomInt(perfil.saldoMin, perfil.saldoMax ?? perfil.saldoMin + 1000);
    const servicio = clasificarServicio(diasMora, serviciosActivos) || perfil;

    const deudor: Deudor = {
      id: newId("deu"),
      documento: persona.documento,
      nombre: persona.nombre,
      sponsorId: sponsor.id,
      telefono: `9${randomInt(10000000, 99999999)}`,
      email: `${persona.nombre.split(" ")[0].toLowerCase()}@correo.com`,
      saldoTotal: saldo,
      diasMoraMax: diasMora,
      estado: "En Mora",
      createdAt: hoy.toISOString(),
    };
    nuevosDeudores.push(deudor);

    const deuda: Deuda = {
      id: newId("deuda"),
      codigo: `DEU-2026-${String(1000 + idx + Math.floor(Math.random() * 900)).padStart(4, "0")}`,
      deudorId: deudor.id,
      sponsorId: sponsor.id,
      servicioCodigo: servicio.codigo,
      monto: saldo,
      saldo,
      fechaVencimiento: hoy.toISOString().slice(0, 10),
      diasMora,
      estado: "Vencida",
      createdAt: hoy.toISOString(),
    };
    nuevasDeudas.push(deuda);

    nuevosTickets.push({
      id: newId("tkt"),
      codigo: `TKG-2026-${String(2000 + idx + Math.floor(Math.random() * 900)).padStart(4, "0")}`,
      deudaId: deuda.id,
      deudorId: deudor.id,
      estado: "DI",
      createdAt: hoy.toISOString(),
    });
  });

  setDeudores([...getDeudores(), ...nuevosDeudores]);
  setDeudas([...getDeudas(), ...nuevasDeudas]);
  setTicketsGestion([...getTicketsGestion(), ...nuevosTickets]);

  const conteo = new Map<string, number>();
  nuevasDeudas.forEach((d) => {
    const tipo = serviciosActivos.find((s) => s.codigo === d.servicioCodigo)?.tipoCobranza || d.servicioCodigo;
    conteo.set(tipo, (conteo.get(tipo) || 0) + 1);
  });

  return {
    deudores: nuevosDeudores,
    deudas: nuevasDeudas,
    tickets: nuevosTickets,
    porTipo: [...conteo.entries()].map(([tipoCobranza, cantidad]) => ({ tipoCobranza, cantidad })),
  };
}

let operadorContador = 1;

/** El sponsor eligió una estrategia para hostigar a un moroso: el ticket pasa a RE y el sistema
 *  simula el envío por los canales de la estrategia (con su autómata y tipo de mensaje) más la
 *  respuesta del moroso. Devuelve el envío generado. */
export function aplicarEstrategia(ticketId: string, estrategiaCodigo: string): EnvioCobranza | null {
  const tickets = getTicketsGestion();
  const ticket = tickets.find((t) => t.id === ticketId);
  const estrategia = getCatalog<EstrategiaCobranza>("estrategias", []).find((e) => e.codigo === estrategiaCodigo);
  if (!ticket || !estrategia) return null;

  const canales = getCatalog<CanalContacto>("canales", []);
  const automatas = getCatalog<AutomataCatalogo>("automata", []);
  const plantillas = getCatalog<PlantillaMensaje>("plantillas", []);

  const canalPrincipal = canales.find((c) => c.codigo === estrategia.canalCodigos[0]);
  const automata = canalPrincipal ? automataParaCanal(canalPrincipal.nombre, automatas) : undefined;
  const plantilla = plantillas.find((p) => p.codigo === estrategia.plantillaCodigo);

  const hoy = new Date();
  const horaEnvio = `${String(randomInt(8, 18)).padStart(2, "0")}:${String(randomInt(0, 59)).padStart(2, "0")}:${String(randomInt(0, 59)).padStart(2, "0")}`;

  const envio: EnvioCobranza = {
    id: newId("env"),
    codigo: `ENV-2026-${String(3000 + Math.floor(Math.random() * 900)).padStart(4, "0")}`,
    ticketId: ticket.id,
    deudaId: ticket.deudaId,
    deudorId: ticket.deudorId,
    estrategiaCodigo: estrategia.codigo,
    canalIds: [...estrategia.canalCodigos],
    automataCodigo: automata?.codigo,
    operador: automata ? `${canalPrincipal?.nombre}${operadorContador++}` : "Notificación física",
    plantillaCodigo: plantilla?.codigo,
    tarifa: estrategia.tarifa,
    respuesta: randomRespuesta(),
    fechaEnvio: hoy.toISOString().slice(0, 10),
    horaEnvio,
    createdAt: hoy.toISOString(),
  };

  const actualizado: TicketGestion = {
    ...ticket,
    estado: "RE",
    estrategiaCodigo: estrategia.codigo,
    fechaAsignacion: hoy.toISOString(),
  };
  setTicketsGestion(tickets.map((t) => (t.id === ticket.id ? actualizado : t)));

  addMovimientoTicket({
    id: newId("mov"),
    ticketId: ticket.id,
    estadoAnterior: "DI",
    estadoNuevo: "RE",
    motivo: `El sponsor asignó la ${estrategia.nombre} (${estrategia.codigo}) para hostigar al moroso`,
    createdAt: hoy.toISOString(),
  });

  addEnviosCobranza([envio]);
  return envio;
}
