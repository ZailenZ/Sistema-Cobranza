import { Link } from "react-router";
import {
  AlertCircle,
  CheckSquare,
  Clock,
  DollarSign,
  FileUp,
  PhoneCall,
  Sparkles,
  Ticket,
  UserX,
  Zap,
} from "lucide-react";

import { PageHeader } from "../shared/PageHeader";
import { KPICard } from "../shared/KPICard";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  getCatalog,
  getDeudas,
  getDeudores,
  getEnviosCobranza,
  getSponsors,
  getTicketsGestion,
} from "../../store/localDb";
import { seedAllIfEmpty } from "../../store/seedAll";
import {
  formatCanalesFrecuencia,
  formatListaCanales,
  type CanalContacto,
  type EstrategiaCobranza,
  type ServicioCobranza,
} from "../../store/catalogSeed";
import { getCurrentUser } from "../../store/session";

const accionesRapidas = [
  { title: "Reservar tickets", icon: Ticket, path: "/operativo/reservar-tickets" },
  { title: "Entrega cobranza", icon: PhoneCall, path: "/operativo/entrega-cobranza" },
];

const fmtSol = (n: number) => `S/ ${Number(n).toLocaleString("es-PE")}`;

export function DashboardOperativo() {
  seedAllIfEmpty();
  const servicios = getCatalog<ServicioCobranza>("servicios", []);
  const canales = getCatalog<CanalContacto>("canales", []);
  const estrategias = getCatalog<EstrategiaCobranza>("estrategias", []);
  const user = getCurrentUser();
  const misSponsor = user.rol === "Sponsor" ? getSponsors().find((s) => s.codigo === user.sponsorCodigo) : undefined;

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
  const sinRespuesta = envios.filter((e) => e.respuesta === "Sin respuesta").length;
  const gastoEstrategias = envios.reduce((sum, e) => sum + (e.tarifa || 0), 0);

  const casosEnGestion = tickets
    .filter((t) => t.estado === "RE")
    .slice(0, 5)
    .map((t) => {
      const envio = envios.find((e) => e.ticketId === t.id);
      const estrategia = estrategias.find((e) => e.codigo === t.estrategiaCodigo);
      return {
        id: t.codigo,
        deudor: deudores.find((d) => d.id === t.deudorId)?.nombre || t.deudorId,
        estrategia: estrategia ? `${estrategia.codigo} · ${estrategia.nombre}` : "—",
        canales: formatListaCanales(estrategia?.canalCodigos, canales),
        respuesta: envio?.respuesta || "Sin respuesta",
        saldo: deudaOf(t.deudaId)?.saldo ?? 0,
      };
    });

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
            Esto es solo de referencia. Al subir tu cartera en "Reservar tickets", el sistema clasifica
            automáticamente a cada moroso según su información — tú no eliges el tipo.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {servicios
              .filter((s) => s.estado === "Activo")
              .map((s) => (
                <Link
                  key={s.codigo}
                  to={`/operativo/reservar-tickets?tipo=${encodeURIComponent(s.codigo)}`}
                  className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
                >
                  <p className="text-base font-semibold text-foreground">{s.tipoCobranza}</p>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Mora {s.moraMin}–{s.moraMax ?? "a más"} días · Saldo S/ {s.saldoMin.toLocaleString()}–
                    {s.saldoMax ? s.saldoMax.toLocaleString() : "a más"}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Canales: {formatCanalesFrecuencia(s.canales, canales)}
                  </p>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {estrategias.filter((e) => e.tipoCobranza === s.tipoCobranza && e.estado === "Activo").length}{" "}
                    estrategia(s) de hostigamiento
                  </p>
                </Link>
              ))}
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

        {/* Casos de hoy */}
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-col gap-2 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Casos de cobranza en gestión</CardTitle>
              <p className="text-sm text-muted-foreground">30 de junio, 2026</p>
            </div>
            <Link
              to="/operativo/reportes/gestion-deudas"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Ver reporte de deudas
            </Link>
          </CardHeader>

          <CardContent className="divide-y divide-border/60 p-0">
            {casosEnGestion.length === 0 ? (
              <p className="p-8 text-center text-base text-muted-foreground">
                Todavía no hay morosos en hostigamiento. Sube tu lista en "Reservar tickets" y elige una estrategia
                para empezar.
              </p>
            ) : (
              casosEnGestion.map((caso) => (
                <div key={caso.id} className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-1 flex-wrap items-center gap-6">
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 items-center justify-center rounded-xl border border-border bg-muted/30">
                        <UserX className="size-5 text-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{caso.id}</p>
                        <p className="text-sm text-muted-foreground">{caso.deudor}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Zap className="size-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{caso.estrategia}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <PhoneCall className="size-4 text-muted-foreground" />
                      <span className="text-foreground">{caso.canales}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-muted-foreground">Saldo</p>
                      <p className="font-bold text-foreground">{fmtSol(caso.saldo)}</p>
                    </div>
                    <Badge variant="secondary" className="rounded-full">{caso.respuesta}</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <QuickStat icon={Clock} title="Sin respuesta" value={String(sinRespuesta)} detail="Evaluar seguir hostigando" />
          <QuickStat icon={DollarSign} title="Gasto en estrategias" value={fmtSol(gastoEstrategias)} detail="Tarifas acumuladas" />
          <QuickStat icon={Ticket} title="Morosos por asignar" value={String(porAsignar)} detail="Sin estrategia elegida" />
        </div>
      </div>
    </div>
  );
}

function QuickStat({
  icon: Icon,
  title,
  value,
  detail,
}: {
  icon: typeof Clock;
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-muted/30">
            <Icon className="size-5 text-foreground" />
          </div>
          <h4 className="font-semibold text-foreground">{title}</h4>
        </div>
        <p className="mb-1 text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}
