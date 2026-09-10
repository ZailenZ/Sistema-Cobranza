import { Link } from "react-router";
import {
  AlertCircle,
  CheckSquare,
  Clock,
  DollarSign,
  PhoneCall,
  Ticket,
  UserX,
  Users,
} from "lucide-react";

import { PageHeader } from "../shared/PageHeader";
import { KPICard } from "../shared/KPICard";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { getTicketsGestion, getDeudores } from "../../store/localDb";
import { seedAllIfEmpty } from "../../store/seedAll";

const casosHoy = [
  { id: "TKG-001", deudor: "Juan Carlos Pérez García", sponsor: "Financiera Andina S.A.", gestor: "Lucía Fernández Paz", estado: "En gestión", prioridad: "Alta", saldo: 3250.5 },
  { id: "TKG-002", deudor: "María Torres Quispe", sponsor: "Financiera Andina S.A.", gestor: "Diego Salas Quispe", estado: "Contactado", prioridad: "Media", saldo: 1180.0 },
  { id: "TKG-003", deudor: "Patricia León Vega", sponsor: "Telecom del Sur S.A.", gestor: "Lucía Fernández Paz", estado: "Pendiente", prioridad: "Baja", saldo: 540.25 },
];

const accionesRapidas = [
  { title: "Reservar tickets", icon: Ticket, path: "/operativo/reservar-tickets" },
  { title: "Entrega cobranza", icon: PhoneCall, path: "/operativo/entrega-cobranza" },
];

export function DashboardOperativo() {
  seedAllIfEmpty();
  const tickets = getTicketsGestion();
  const deudores = getDeudores();

  const disponibles = tickets.filter((t) => t.estado === "DI").length;
  const asignados = tickets.filter((t) => t.estado === "RE").length;

  return (
    <div className="min-h-full bg-background">
      <PageHeader title="Panel operativo" subtitle="Control diario de la gestión de cobranza." />

      <div className="space-y-6 p-6 lg:p-8">
        {/* KPIs */}
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <KPICard title="Casos asignados hoy" value={asignados} icon={Ticket} subtitle="Tickets en gestión" />
          <KPICard title="Contactos realizados" value={45} icon={PhoneCall} variant="secondary" subtitle="Llamadas y mensajes" />
          <KPICard title="Promesas de pago" value={12} icon={CheckSquare} variant="accent" subtitle="Registradas hoy" />
          <KPICard title="Deudores en mora" value={deudores.filter((d) => d.estado === "En Mora").length} icon={AlertCircle} variant="destructive" subtitle="Alertas de cartera" />
        </div>

        {/* Acciones rápidas */}
        <div>
          <h3 className="mb-4 text-lg font-semibold text-foreground">Acciones rápidas (flujo operativo)</h3>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {accionesRapidas.map(({ title, icon: Icon, path }) => (
              <Link
                key={path}
                to={path}
                className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
              >
                <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
                  <Icon className="size-5" />
                </div>
                <p className="mt-4 font-semibold text-foreground">{title}</p>
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
            {casosHoy.map((caso) => (
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
                    <Users className="size-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">{caso.sponsor}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <PhoneCall className="size-4 text-muted-foreground" />
                    <span className="text-foreground">{caso.gestor}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-muted-foreground">Saldo</p>
                    <p className="font-bold text-foreground">S/ {caso.saldo.toFixed(2)}</p>
                  </div>
                  <Badge variant="outline" className="rounded-full">{caso.prioridad}</Badge>
                  <Badge variant="secondary" className="rounded-full">{caso.estado}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick stats */}
        <div className="grid gap-6 md:grid-cols-3">
          <QuickStat icon={Clock} title="Próximo compromiso" value="10/07/2026" detail="Promesa de pago pendiente" />
          <QuickStat icon={DollarSign} title="Recuperado hoy" value="S/ 2,140" detail="8 pagos confirmados" />
          <QuickStat icon={Ticket} title="Tickets disponibles" value={String(disponibles)} detail="Casos sin asignar" />
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
