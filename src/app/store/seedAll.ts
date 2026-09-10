import {
  getCatalog,
  getDeudas,
  getDeudores,
  getGestionesCobranza,
  getMovimientosTicket,
  getSponsors,
  getTicketsGestion,
  newId,
  setCatalog,
  setDeudas,
  setDeudores,
  setGestionesCobranza,
  setMovimientosTicket,
  setSponsors,
  setTicketsGestion,
  type Deuda,
  type Deudor,
  type GestionCobranza,
  type MovimientoTicket,
  type Sponsor,
  type TicketGestion,
} from "./localDb";

function isEmptyCatalog(id: any) {
  return getCatalog(id, []).length === 0;
}

export function seedAllIfEmpty() {
  // --- Catálogos ---
  if (isEmptyCatalog("servicios")) {
    setCatalog("servicios", [
      { id: 1, codigo: "SRV-001", descripcion: "Cobranza Preventiva", condicionesEspeciales: "No", estado: "Activo" },
      { id: 2, codigo: "SRV-002", descripcion: "Cobranza Extrajudicial", condicionesEspeciales: "No", estado: "Activo" },
      { id: 3, codigo: "SRV-003", descripcion: "Cobranza Judicial", condicionesEspeciales: "Sí", estado: "Activo" },
      { id: 4, codigo: "SRV-004", descripcion: "Cobranza Castigada", condicionesEspeciales: "Sí", estado: "Activo" },
    ]);
  }

  if (isEmptyCatalog("canales")) {
    setCatalog("canales", [
      { id: 1, codigo: "CAN-001", nombre: "Llamada telefónica", descripcion: "Contacto vía call center", estado: "Activo" },
      { id: 2, codigo: "CAN-002", nombre: "SMS", descripcion: "Mensaje de texto automatizado", estado: "Activo" },
      { id: 3, codigo: "CAN-003", nombre: "Correo electrónico", descripcion: "Envío de comunicaciones por email", estado: "Activo" },
      { id: 4, codigo: "CAN-004", nombre: "WhatsApp", descripcion: "Mensajería instantánea", estado: "Activo" },
      { id: 5, codigo: "CAN-005", nombre: "Visita domiciliaria", descripcion: "Gestión presencial en campo", estado: "Inactivo" },
    ]);
  }

  if (isEmptyCatalog("operarios")) {
    setCatalog("operarios", [
      { id: 1, codigo: "OPE-001", nombre: "Gestor telefónico", rolFuncion: "Gestor", metaMensual: 25000, modalidadCosteo: "Sueldo Fijo", estado: "Activo" },
      { id: 2, codigo: "OPE-002", nombre: "Gestor de campo", rolFuncion: "Gestor", metaMensual: 18000, modalidadCosteo: "Comisión", estado: "Activo" },
      { id: 3, codigo: "OPE-003", nombre: "Supervisor de cartera", rolFuncion: "Supervisor", metaMensual: 60000, modalidadCosteo: "Sueldo Fijo", estado: "Activo" },
    ]);
  }

  if (isEmptyCatalog("plantillas")) {
    setCatalog("plantillas", [
      { id: 1, codigo: "PLT-001", canal: "SMS", asunto: "Recordatorio de pago", cuerpo: "Estimado cliente, su deuda vence en 3 días. Regularice para evitar recargos.", estado: "Activo" },
      { id: 2, codigo: "PLT-002", canal: "Correo electrónico", asunto: "Aviso de mora", cuerpo: "Le informamos que su cuenta presenta días de atraso. Contáctenos para negociar.", estado: "Activo" },
      { id: 3, codigo: "PLT-003", canal: "WhatsApp", asunto: "Promesa de pago", cuerpo: "Gracias por su compromiso de pago. Le recordaremos la fecha acordada.", estado: "Activo" },
    ]);
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

  // --- Deudores (morosos) ---
  const sponsors = getSponsors();
  if (getDeudores().length === 0) {
    const deudores: Deudor[] = [
      { id: newId("deu"), documento: "DNI 45879632", nombre: "Juan Carlos Pérez García", sponsorId: sponsors[0]?.id || "", telefono: "+51 999 888 777", email: "juan.perez@correo.com", saldoTotal: 3250.5, diasMoraMax: 62, estado: "En Mora", createdAt: new Date().toISOString() },
      { id: newId("deu"), documento: "DNI 41890234", nombre: "María Torres Quispe", sponsorId: sponsors[0]?.id || "", telefono: "+51 999 777 666", email: "maria.torres@correo.com", saldoTotal: 1180.0, diasMoraMax: 15, estado: "En Mora", createdAt: new Date().toISOString() },
      { id: newId("deu"), documento: "DNI 42567190", nombre: "Diego Salas Quispe", sponsorId: sponsors[1]?.id || "", telefono: "+51 999 666 555", email: "diego.salas@correo.com", saldoTotal: 890.75, diasMoraMax: 120, estado: "Castigado", createdAt: new Date().toISOString() },
      { id: newId("deu"), documento: "DNI 46012885", nombre: "Patricia León Vega", sponsorId: sponsors[2]?.id || "", telefono: "+51 999 555 444", email: "patricia.leon@correo.com", saldoTotal: 540.25, diasMoraMax: 8, estado: "En Mora", createdAt: new Date().toISOString() },
      { id: newId("deu"), documento: "DNI 43567812", nombre: "Jorge Ramírez Soto", sponsorId: sponsors[1]?.id || "", telefono: "+51 999 444 333", email: "jorge.ramirez@correo.com", saldoTotal: 0, diasMoraMax: 0, estado: "Al día", createdAt: new Date().toISOString() },
    ];
    setDeudores(deudores);
  }

  // --- Deudas ---
  const deudores = getDeudores();
  if (getDeudas().length === 0) {
    const deudas: Deuda[] = [
      { id: newId("deuda"), codigo: "DEU-2026-0142", deudorId: deudores[0]?.id || "", sponsorId: deudores[0]?.sponsorId || "", servicioCodigo: "SRV-002", monto: 3250.5, saldo: 3250.5, fechaVencimiento: "2026-05-10", diasMora: 62, estado: "Vencida", createdAt: new Date().toISOString() },
      { id: newId("deuda"), codigo: "DEU-2026-0143", deudorId: deudores[1]?.id || "", sponsorId: deudores[1]?.sponsorId || "", servicioCodigo: "SRV-001", monto: 1180.0, saldo: 1180.0, fechaVencimiento: "2026-06-15", diasMora: 15, estado: "Vencida", createdAt: new Date().toISOString() },
      { id: newId("deuda"), codigo: "DEU-2026-0144", deudorId: deudores[2]?.id || "", sponsorId: deudores[2]?.sponsorId || "", servicioCodigo: "SRV-004", monto: 890.75, saldo: 890.75, fechaVencimiento: "2026-03-01", diasMora: 120, estado: "Incobrable", createdAt: new Date().toISOString() },
      { id: newId("deuda"), codigo: "DEU-2026-0145", deudorId: deudores[3]?.id || "", sponsorId: deudores[3]?.sponsorId || "", servicioCodigo: "SRV-001", monto: 540.25, saldo: 540.25, fechaVencimiento: "2026-06-22", diasMora: 8, estado: "Vencida", createdAt: new Date().toISOString() },
    ];
    setDeudas(deudas);
  }

  // --- Tickets de gestión (fabricados por Batch a partir de deudas vencidas) ---
  const deudas = getDeudas();
  if (getTicketsGestion().length === 0) {
    const tickets: TicketGestion[] = deudas
      .filter((d) => d.estado === "Vencida")
      .map((d, idx) => ({
        id: newId("tkt"),
        codigo: `TKG-2026-${String(idx + 1).padStart(4, "0")}`,
        deudaId: d.id,
        deudorId: d.deudorId,
        canalId: "CAN-001",
        prioridad: d.diasMora > 30 ? "Alta" : d.diasMora > 10 ? "Media" : "Baja",
        estado: idx === 0 ? "RE" : "DI",
        operarioId: idx === 0 ? "OPE-001" : undefined,
        fechaAsignacion: idx === 0 ? new Date().toISOString() : undefined,
        createdAt: new Date().toISOString(),
      }));
    setTicketsGestion(tickets);

    const movimientos: MovimientoTicket[] = tickets
      .filter((t) => t.estado === "RE")
      .map((t) => ({
        id: newId("mov"),
        ticketId: t.id,
        estadoAnterior: "DI",
        estadoNuevo: "RE",
        motivo: "Asignación de caso de cobranza",
        createdAt: new Date().toISOString(),
      }));
    setMovimientosTicket(movimientos);
  }

  // --- Gestiones de cobranza (entregas) demo ---
  if (getGestionesCobranza().length === 0) {
    const ticketAsignado = getTicketsGestion().find((t) => t.estado === "RE");
    if (ticketAsignado) {
      const gestion: GestionCobranza = {
        id: newId("ges"),
        codigo: "GES-2026-0001",
        ticketId: ticketAsignado.id,
        deudaId: ticketAsignado.deudaId,
        operarioId: ticketAsignado.operarioId,
        canalId: ticketAsignado.canalId,
        tipoContacto: "Llamada",
        resultado: "Promesa de Pago",
        montoComprometido: 500,
        fechaCompromiso: "2026-07-10",
        observaciones: "Cliente se compromete a pagar parcialmente antes del 10 de julio.",
        createdAt: new Date().toISOString(),
      };
      setGestionesCobranza([gestion]);
    }
  }
}
