import {
  AUTOMATA_SEED,
  CANALES_SEED,
  ESTRATEGIAS_SEED,
  MOROSOS_SEED,
  PLANTILLAS_SEED,
  SERVICIOS_SEED,
} from "./catalogSeed";
import {
  getCatalog,
  getDeudas,
  getDeudores,
  getSponsors,
  getTicketsGestion,
  newId,
  resetIfSchemaChanged,
  setCatalog,
  setDeudas,
  setDeudores,
  setSponsors,
  setTicketsGestion,
  type Deuda,
  type Deudor,
  type Sponsor,
  type TicketGestion,
} from "./localDb";
import { aplicarEstrategia, clasificarServicio, recomendarEstrategia } from "./sponsorFlow";
import type { EstrategiaCobranza, ServicioCobranza, TipoMoroso } from "./catalogSeed";

function isEmptyCatalog(id: any) {
  return getCatalog(id, []).length === 0;
}

/** Morosos de muestra de los sponsors que NO son el del flujo demo, con su mora y saldo.
 *  `gestionar: false` deja al moroso sin estrategia, para que los reportes muestren también
 *  ese estado. */
const CARTERA_MUESTRA: {
  sponsorCodigo: string;
  documento: string;
  nombre: string;
  telefono: string;
  diasMora: number;
  saldo: number;
  gestionar: boolean;
}[] = [
  { sponsorCodigo: "SPN-002", documento: "DNI 70112233", nombre: "Karla Villanueva Ríos", telefono: "987112233", diasMora: 6, saldo: 820, gestionar: true },
  { sponsorCodigo: "SPN-002", documento: "DNI 70223344", nombre: "Julio Quispe Mamani", telefono: "987223344", diasMora: 22, saldo: 2400, gestionar: true },
  { sponsorCodigo: "SPN-002", documento: "DNI 70334455", nombre: "Elena Bravo Ccahuana", telefono: "987334455", diasMora: 38, saldo: 7300, gestionar: true },
  { sponsorCodigo: "SPN-002", documento: "DNI 70445566", nombre: "Óscar Ramos Ticona", telefono: "987445566", diasMora: 54, saldo: 18200, gestionar: false },
  { sponsorCodigo: "SPN-003", documento: "DNI 70556677", nombre: "Marcela Espinoza Vera", telefono: "987556677", diasMora: 11, saldo: 940, gestionar: true },
  { sponsorCodigo: "SPN-003", documento: "DNI 70667788", nombre: "Néstor Huamán Rojas", telefono: "987667788", diasMora: 27, saldo: 1750, gestionar: true },
  { sponsorCodigo: "SPN-003", documento: "DNI 70778899", nombre: "Paola Cárdenas Luna", telefono: "987778899", diasMora: 44, saldo: 12500, gestionar: true },
  { sponsorCodigo: "SPN-003", documento: "DNI 70889900", nombre: "Iván Zegarra Ponce", telefono: "987889900", diasMora: 33, saldo: 5600, gestionar: false },
];

/** Crea las carteras de muestra (deudores + deudas + tickets) y aplica la estrategia recomendada
 *  a los morosos marcados, para que las consultas gerenciales tengan contenido que mostrar. */
function sembrarCarteraDeMuestra() {
  const sponsors = getSponsors();
  const servicios = getCatalog<ServicioCobranza>("servicios", []);
  const estrategias = getCatalog<EstrategiaCobranza>("estrategias", []);
  const tiposMoroso = getCatalog<TipoMoroso>("morosos", []);
  const ahora = new Date().toISOString();

  const deudores: Deudor[] = [];
  const deudas: Deuda[] = [];
  const tickets: TicketGestion[] = [];

  CARTERA_MUESTRA.forEach((m, idx) => {
    const sponsor = sponsors.find((s) => s.codigo === m.sponsorCodigo);
    if (!sponsor) return;
    const servicio = clasificarServicio(m.diasMora, servicios, tiposMoroso);

    const deudor: Deudor = {
      id: newId("deu"),
      documento: m.documento,
      nombre: m.nombre,
      sponsorId: sponsor.id,
      telefono: m.telefono,
      email: `${m.nombre.split(" ")[0].toLowerCase()}@correo.com`,
      saldoTotal: m.saldo,
      diasMoraMax: m.diasMora,
      estado: "En Mora",
      createdAt: ahora,
    };
    deudores.push(deudor);

    const deuda: Deuda = {
      id: newId("deuda"),
      codigo: `DEU-2026-${String(500 + idx).padStart(4, "0")}`,
      deudorId: deudor.id,
      sponsorId: sponsor.id,
      servicioCodigo: servicio?.codigo || servicios[0]?.codigo || "",
      monto: m.saldo,
      saldo: m.saldo,
      fechaVencimiento: ahora.slice(0, 10),
      diasMora: m.diasMora,
      estado: "Vencida",
      createdAt: ahora,
    };
    deudas.push(deuda);

    tickets.push({
      id: newId("tkt"),
      codigo: `TKG-2026-${String(500 + idx).padStart(4, "0")}`,
      deudaId: deuda.id,
      deudorId: deudor.id,
      estado: "DI",
      createdAt: ahora,
    });
  });

  setDeudores([...getDeudores(), ...deudores]);
  setDeudas([...getDeudas(), ...deudas]);
  setTicketsGestion([...getTicketsGestion(), ...tickets]);

  // A los marcados se les aplica la estrategia que el sistema recomendaría.
  tickets.forEach((ticket, idx) => {
    if (!CARTERA_MUESTRA[idx]?.gestionar) return;
    const deuda = deudas[idx];
    const servicio = servicios.find((s) => s.codigo === deuda.servicioCodigo);
    const estrategia = recomendarEstrategia(deuda, servicio, estrategias, tiposMoroso);
    if (estrategia) aplicarEstrategia(ticket.id, estrategia.codigo);
  });
}

export function seedAllIfEmpty() {
  // Si el esquema de catálogos/entidades cambió desde la última visita, limpia los datos
  // simulados persistidos antes de sembrar/leer nada — así una pantalla que espera un campo
  // nuevo (p. ej. Servicio.canales) nunca choca contra datos guardados con la forma vieja.
  resetIfSchemaChanged();

  // --- Catálogos ---
  if (isEmptyCatalog("servicios")) {
    setCatalog("servicios", SERVICIOS_SEED as any[]);
  }

  if (isEmptyCatalog("morosos")) {
    setCatalog("morosos", MOROSOS_SEED as any[]);
  }

  if (isEmptyCatalog("canales")) {
    setCatalog("canales", CANALES_SEED as any[]);
  }

  if (isEmptyCatalog("plantillas")) {
    setCatalog("plantillas", PLANTILLAS_SEED as any[]);
  }

  if (isEmptyCatalog("estrategias")) {
    setCatalog("estrategias", ESTRATEGIAS_SEED as any[]);
  }

  if (isEmptyCatalog("automata")) {
    setCatalog("automata", AUTOMATA_SEED as any[]);
  }

  // --- Sponsors (empresas/entidades que encargan la cartera) ---
  if (getSponsors().length === 0) {
    const sponsors: Sponsor[] = [
      { id: newId("spn"), codigo: "SPN-001", razonSocial: "Financiera Andina S.A.", rubro: "Financiero", contacto: "Rosa Delgado", telefono: "+51 999 111 222", carteraAsignada: 850000, carteraRecuperada: 512000, estado: "Activo", createdAt: new Date().toISOString() },
      { id: newId("spn"), codigo: "SPN-002", razonSocial: "Retail Norte S.A.C.", rubro: "Retail", contacto: "Miguel Osorio", telefono: "+51 999 222 333", carteraAsignada: 420000, carteraRecuperada: 198000, estado: "Activo", createdAt: new Date().toISOString() },
      { id: newId("spn"), codigo: "SPN-003", razonSocial: "Telecom del Sur S.A.", rubro: "Telecomunicaciones", contacto: "Karla Vidal", telefono: "+51 999 333 444", carteraAsignada: 310000, carteraRecuperada: 275000, estado: "Activo", createdAt: new Date().toISOString() },
    ];
    setSponsors(sponsors);
  }

  // --- Carteras de muestra para los sponsors que NO usa el flujo demo ---
  // La cartera de Financiera Andina (SPN-001, el sponsor con el que se inicia sesión) se deja
  // vacía a propósito: ese flujo arranca desde cero subiendo la lista de morosos. Los otros dos
  // sponsors sí traen datos de muestra para que las consultas gerenciales no salgan en blanco.
  if (getDeudores().length === 0) {
    sembrarCarteraDeMuestra();
  }
}
