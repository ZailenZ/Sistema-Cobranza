import { useState } from "react";
import { Link } from "react-router";
import {
  AlertCircle,
  CheckSquare,
  FileUp,
  PhoneCall,
  ScrollText,
  Sparkles,
  Ticket,
  X,
  Zap,
} from "lucide-react";

import { PageHeader } from "../shared/PageHeader";
import { KPICard } from "../shared/KPICard";
import {
  getCatalog,
  getDeudas,
  getDeudores,
  getEnviosCobranza,
  getSponsors,
  getTicketsGestion,
} from "../../store/localDb";
import { seedAllIfEmpty } from "../../store/seedAll";
import { automataParaCanal } from "../../store/sponsorFlow";
import {
  formatCanalesFrecuencia,
  formatDuracion,
  formatListaCanales,
  type AutomataCatalogo,
  type CanalContacto,
  type EstrategiaCobranza,
  type PlantillaMensaje,
  type ServicioCobranza,
} from "../../store/catalogSeed";
import { getCurrentUser } from "../../store/session";

const accionesRapidas = [
  { title: "Reservar tickets", icon: Ticket, path: "/operativo/reservar-tickets" },
  { title: "Entrega cobranza", icon: PhoneCall, path: "/operativo/entrega-cobranza" },
];

const fmtSol = (n: number) => `S/ ${Number(n).toLocaleString("es-PE")}`;

/** Ocupación simulada de un canal. Determinista a partir del código del canal, para
 *  que la disponibilidad no cambie en cada recarga durante una demostración. */
function disponibilidadCanal(canal: CanalContacto, automata: AutomataCatalogo | undefined) {
  let s = 0;
  for (const c of canal.codigo) s = (s * 31 + c.charCodeAt(0)) % 2147483647;
  const rnd = (min: number, max: number) => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return min + Math.floor((s / 2147483648) * (max - min + 1));
  };
  const operadores = rnd(4, 12);
  const capacidadTotal = (automata?.capacidadMaxPorDia ?? 0) * operadores;
  const ocupados = Math.round(capacidadTotal * (rnd(18, 72) / 100));
  return { operadores, capacidadTotal, ocupados };
}

export function DashboardOperativo() {
  seedAllIfEmpty();
  const servicios = getCatalog<ServicioCobranza>("servicios", []);
  const canales = getCatalog<CanalContacto>("canales", []);
  const estrategias = getCatalog<EstrategiaCobranza>("estrategias", []);
  const plantillas = getCatalog<PlantillaMensaje>("plantillas", []);
  const automatas = getCatalog<AutomataCatalogo>("automata", []);
  const user = getCurrentUser();
  const misSponsor = user.rol === "Sponsor" ? getSponsors().find((s) => s.codigo === user.sponsorCodigo) : undefined;

  const [tipoDetalle, setTipoDetalle] = useState<ServicioCobranza | null>(null);
  const estrategiasDe = (tipoCobranza: string) =>
    estrategias.filter((e) => e.tipoCobranza === tipoCobranza && e.estado === "Activo");

  // Todo el panel refleja datos reales: arranca en cero hasta que el sponsor suba su cartera.
  const deudas = getDeudas();
  const deudaOf = (id: string) => deudas.find((d) => d.id === id);
  const deMiCartera = (deudaId: string) => !misSponsor || deudaOf(deudaId)?.sponsorId === misSponsor.id;

  const tickets = getTicketsGestion().filter((t) => deMiCartera(t.deudaId));
  const envios = getEnviosCobranza().filter((e) => deMiCartera(e.deudaId));
  const deudores = getDeudores().filter((d) => !misSponsor || d.sponsorId === misSponsor.id);

  const porAsignar = tickets.filter((t) => t.estado === "DI").length;
  const enHostigamiento = tickets.filter((t) => t.estado === "RE").length;
  const afirmativas = envios.filter((e) => e.respuesta === "Afirmativa").length;
  const gastoEstrategias = envios.reduce((sum, e) => sum + (e.tarifa || 0), 0);

  return (
    <div className="min-h-full bg-background">
      <PageHeader
        title="Panel operativo"
        subtitle={
          misSponsor
            ? `Control diario de la gestión de cobranza — cartera de ${misSponsor.razonSocial}.`
            : "Control diario de la gestión de cobranza."
        }
      />

      <div className="space-y-6 p-6 lg:p-8">
        {/* Bienvenida — vistazo del flujo para el sponsor autoservicio */}
        {misSponsor && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-7">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Sparkles className="size-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">
                  Bienvenido, {misSponsor.razonSocial}
                </h3>
                <p className="mt-1.5 max-w-2xl text-base leading-6 text-muted-foreground">
                  Este es tu panel de autoservicio de cobranza. Así funciona el flujo, de principio a fin:
                </p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { n: 1, title: "Sube tu lista de morosos", detail: "En \"Reservar tickets\", sube tu cartera; el sistema la clasifica por tipo de cobranza según la información de cada moroso." },
                { n: 2, title: "Elige la estrategia por moroso", detail: "Cada tipo de cobranza trae sus estrategias de hostigamiento (canal, mensaje, duración y tarifa). Tú eliges cuál aplicar." },
                { n: 3, title: "Revisa las respuestas", detail: "En \"Entrega cobranza\" ves quién respondió, quién falta y el mensaje exacto enviado." },
                { n: 4, title: "Descarga el reporte final", detail: "En \"Reporte de gestión de deudas\" consultas el estado consolidado de tu cartera." },
              ].map((paso) => (
                <div key={paso.n} className="rounded-xl border border-border bg-card p-5">
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {paso.n}
                  </span>
                  <p className="mt-2.5 text-base font-semibold text-foreground">{paso.title}</p>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{paso.detail}</p>
                </div>
              ))}
            </div>
            <Link
              to="/operativo/reservar-tickets"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-base font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <FileUp className="size-4" />
              Comenzar en Reservar tickets
            </Link>
          </div>
        )}

        {/* KPIs */}
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <KPICard title="Morosos por asignar" value={porAsignar} icon={Ticket} subtitle="Esperan que elijas su estrategia" />
          <KPICard title="En hostigamiento" value={enHostigamiento} icon={PhoneCall} variant="secondary" subtitle={`Costo acumulado ${fmtSol(gastoEstrategias)}`} />
          <KPICard title="Respondieron afirmativo" value={afirmativas} icon={CheckSquare} variant="accent" subtitle="Van a pagar" />
          <KPICard title="Morosos en mi cartera" value={deudores.length} icon={AlertCircle} variant="destructive" subtitle="Total cargado" />
        </div>

        {/* Tipos de cobranza que existen (referencia informativa — el sponsor no los elige,
            el sistema clasifica cada moroso automáticamente al subir la cartera) */}
        <div>
          <h3 className="mb-1 text-xl font-semibold text-foreground">Tipos de cobranza del sistema</h3>
          <p className="mb-4 text-base text-muted-foreground">
            Haz clic en uno para ver en qué consiste. Es solo de referencia: al subir tu cartera en
            "Reservar tickets", el sistema clasifica automáticamente a cada moroso según su información.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {servicios
              .filter((s) => s.estado === "Activo")
              .map((s) => (
                <button
                  key={s.codigo}
                  onClick={() => setTipoDetalle(s)}
                  className="group rounded-xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/40"
                >
                  <p className="text-base font-semibold text-foreground">{s.tipoCobranza}</p>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Mora {s.moraMin}–{s.moraMax ?? "a más"} días · Saldo S/ {s.saldoMin.toLocaleString()}–
                    {s.saldoMax ? s.saldoMax.toLocaleString() : "a más"}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {estrategiasDe(s.tipoCobranza).length} estrategia(s) de hostigamiento
                  </p>
                  <span className="mt-3 inline-block text-sm font-medium text-primary group-hover:underline">
                    Ver en qué consiste →
                  </span>
                </button>
              ))}
          </div>
        </div>

        {/* Disponibilidad de los canales por los que el sistema hostiga */}
        <div>
          <h3 className="mb-1 text-xl font-semibold text-foreground">Disponibilidad de canales</h3>
          <p className="mb-4 text-base text-muted-foreground">
            Capacidad de envío que tiene hoy cada canal del sistema. Mientras más libre esté un canal,
            más rápido sale la gestión de tus morosos.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {canales
              .filter((c) => c.estado === "Activo" && !c.nombre.toLowerCase().includes("notarial"))
              .map((c) => {
                const automata = automataParaCanal(c.nombre, automatas);
                const { operadores, capacidadTotal, ocupados } = disponibilidadCanal(c, automata);
                const pct = capacidadTotal > 0 ? Math.min(100, (ocupados / capacidadTotal) * 100) : 0;
                return (
                  <div key={c.codigo} className="rounded-xl border border-border bg-card p-5">
                    <p className="text-base font-semibold text-foreground">{c.nombre}</p>
                    <dl className="mt-3 space-y-1.5 text-sm">
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Operadores:</dt>
                        <dd className="font-semibold text-foreground">{operadores}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Capacidad total:</dt>
                        <dd className="font-semibold text-foreground">{capacidadTotal.toLocaleString("es-PE")}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Ocupados:</dt>
                        <dd className="font-semibold text-foreground">{ocupados.toLocaleString("es-PE")}</dd>
                      </div>
                    </dl>
                    <div className="mt-3 h-4 w-full overflow-hidden rounded-full border border-border bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {pct.toFixed(0)}% ocupado · atiende de {c.horaInicio} a {c.horaFin}
                    </p>
                  </div>
                );
              })}
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
            <ScrollText className="mt-0.5 size-5 shrink-0 text-amber-700" />
            <p className="text-sm leading-6 text-amber-900">
              También disponemos del canal de <strong>carta notarial</strong>, atendido por un notario y
              reservado únicamente para ejecutar una <strong>cobranza judicial</strong>.
            </p>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div>
          <h3 className="mb-4 text-xl font-semibold text-foreground">Acciones rápidas (flujo operativo)</h3>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {accionesRapidas.map(({ title, icon: Icon, path }) => (
              <Link
                key={path}
                to={path}
                className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
              >
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
                  <Icon className="size-5" />
                </div>
                <p className="mt-4 text-base font-semibold text-foreground">{title}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Detalle de un tipo de cobranza: en qué consiste y cómo se gestiona */}
      {tipoDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-card shadow-2xl">
            <div className="flex items-start justify-between border-b border-border px-6 py-4">
              <div>
                <h3 className="text-xl font-bold text-foreground">{tipoDetalle.tipoCobranza}</h3>
                <p className="text-sm text-muted-foreground">{tipoDetalle.codigo}</p>
              </div>
              <button onClick={() => setTipoDetalle(null)} className="rounded-lg p-2 transition-colors hover:bg-muted">
                <X className="size-5 text-muted-foreground" />
              </button>
            </div>

            <div className="scrollbar-modern flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <p className="text-base leading-6 text-foreground">{tipoDetalle.descripcion}</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Cuándo aplica</p>
                  <p className="mt-1.5 text-base text-foreground">
                    Mora de {tipoDetalle.moraMin} a {tipoDetalle.moraMax ?? "más"} días
                  </p>
                  <p className="text-base text-foreground">
                    Saldo de {fmtSol(tipoDetalle.saldoMin)} a{" "}
                    {tipoDetalle.saldoMax ? fmtSol(tipoDetalle.saldoMax) : "más"}
                  </p>
                </div>
                <div className="rounded-xl border border-border p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Canales y frecuencia
                  </p>
                  <p className="mt-1.5 text-base text-foreground">
                    {formatCanalesFrecuencia(tipoDetalle.canales, canales)}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-base font-semibold text-foreground">Estrategias de hostigamiento</p>
                {estrategiasDe(tipoDetalle.tipoCobranza).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Este tipo aún no tiene estrategias activas.</p>
                ) : (
                  <ul className="space-y-2">
                    {estrategiasDe(tipoDetalle.tipoCobranza).map((e) => (
                      <li key={e.codigo} className="rounded-xl border border-border p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="flex items-center gap-1.5 text-base font-semibold text-foreground">
                            <Zap className="size-4 text-primary" />
                            {e.codigo} · {e.nombre}
                          </p>
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                            {fmtSol(e.tarifa)}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm text-muted-foreground">{e.descripcion}</p>
                        <p className="mt-1.5 text-sm text-muted-foreground">
                          {formatListaCanales(e.canalCodigos, canales)} ·{" "}
                          {plantillas.find((p) => p.codigo === e.plantillaCodigo)?.nombre || "—"} ·{" "}
                          {formatDuracion(Number(e.duracionDias))}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
              <button
                onClick={() => setTipoDetalle(null)}
                className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Cerrar
              </button>
              <Link
                to="/operativo/reservar-tickets"
                className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Ticket className="size-4" />
                Reservar ticket
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
