import {
  AUTOMATA_SEED,
  CANALES_SEED,
  ESTRATEGIAS_SEED,
  PLANTILLAS_SEED,
  SERVICIOS_SEED,
} from "./catalogSeed";
import {
  getCatalog,
  getSponsors,
  newId,
  resetIfSchemaChanged,
  setCatalog,
  setSponsors,
  type Sponsor,
} from "./localDb";

function isEmptyCatalog(id: any) {
  return getCatalog(id, []).length === 0;
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

  // Nada más se siembra: NO hay morosos, deudas, tickets ni envíos de ejemplo.
  // El prototipo arranca en blanco a propósito — el sponsor debe subir su lista de morosos
  // en "Reservar tickets" para que el sistema los clasifique y empiece el flujo desde cero.
}
