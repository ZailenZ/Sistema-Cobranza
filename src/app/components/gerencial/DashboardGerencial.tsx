import { KPICard } from "../shared/KPICard";
import { PageHeader } from "../shared/PageHeader";
import {
  DollarSign,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle,
  Calendar,
  UserX,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const recuperacionData = [
  { mes: "Ene", asignado: 620000, recuperado: 285000 },
  { mes: "Feb", asignado: 640000, recuperado: 302000 },
  { mes: "Mar", asignado: 655000, recuperado: 318000 },
  { mes: "Abr", asignado: 670000, recuperado: 335000 },
  { mes: "May", asignado: 690000, recuperado: 352000 },
  { mes: "Jun", asignado: 710000, recuperado: 371000 },
];

const carteraData = [
  { name: "Recuperada", value: 52, color: "var(--primary)" },
  { name: "Pendiente", value: 48, color: "var(--border)" },
];

const sponsorsData = [
  { sponsor: "Financiera Andina S.A.", casos: 145, recuperado: 512000 },
  { sponsor: "Retail Norte S.A.C.", casos: 98, recuperado: 198000 },
  { sponsor: "Telecom del Sur S.A.", casos: 76, recuperado: 275000 },
];

export function DashboardGerencial() {
  return (
    <div className="min-h-full bg-background">
      <PageHeader
        title="Dashboard Gerencial"
        subtitle="Visión general de la gestión de cobranza y recuperación de cartera"
      />

      <div className="p-8 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-4 gap-6">
          <KPICard
            title="Cartera Recuperada"
            value="S/ 371,000"
            change={5.4}
            icon={DollarSign}
            variant="primary"
            subtitle="Junio 2026"
          />
          <KPICard
            title="Casos Gestionados"
            value="319"
            change={8.1}
            icon={Users}
            variant="primary"
            subtitle="Este mes"
          />
          <KPICard
            title="Tasa de Recuperación"
            value="52%"
            change={3.2}
            icon={TrendingUp}
            variant="secondary"
            subtitle="Cartera asignada"
          />
          <KPICard
            title="Deudores en Mora"
            value="86"
            change={-6.5}
            icon={AlertTriangle}
            variant="destructive"
            subtitle="Reducción mensual"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-2 gap-6">
          {/* Cartera asignada vs recuperada */}
          <div className="bg-card rounded-xl shadow-sm border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-foreground">Cartera Asignada vs Recuperada</h3>
                <p className="text-sm text-muted-foreground">Últimos 6 meses</p>
              </div>
              <select className="px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground">
                <option>2026</option>
                <option>2025</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={recuperacionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="mes" tick={{ fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fill: "var(--muted-foreground)" }} />
                <Tooltip
                  formatter={(value, name) => [
                    `S/ ${Number(value).toLocaleString()}`,
                    typeof name === "string" ? name : "",
                  ]}
                  labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
                  itemStyle={{ color: "var(--foreground)" }}
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.08)",
                    color: "var(--foreground)",
                  }}
                  cursor={{ fill: "var(--muted)" }}
                />
                <Legend />
                <Bar dataKey="asignado" fill="var(--muted-foreground)" name="Cartera asignada" radius={[8, 8, 0, 0]} />
                <Bar dataKey="recuperado" fill="var(--primary)" name="Cartera recuperada" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Distribución de cartera */}
          <div className="bg-card rounded-xl shadow-sm border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-foreground">Distribución de Cartera</h3>
                <p className="text-sm text-muted-foreground">Estado actual</p>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-64 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={carteraData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {carteraData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="ml-8 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-primary rounded"></div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Recuperada</p>
                    <p className="text-xs text-muted-foreground">52% (S/ 1,485,000)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-border rounded"></div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Pendiente</p>
                    <p className="text-xs text-muted-foreground">48% (S/ 1,371,000)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sponsors con mayor recuperación */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-foreground">Sponsors con Mayor Recuperación</h3>
              <p className="text-sm text-muted-foreground">Top del mes</p>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-primary hover:bg-muted rounded-lg transition-colors">
              Ver detalle completo
            </button>
          </div>
          <div className="space-y-4">
            {sponsorsData.map((s, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                    <span className="font-bold text-primary">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{s.sponsor}</p>
                    <p className="text-sm text-muted-foreground">{s.casos} casos gestionados</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">S/ {s.recuperado.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Recuperado</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-primary rounded-xl shadow-lg p-6 text-primary-foreground">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 opacity-80" />
              <span className="text-sm font-medium bg-primary-foreground/20 px-3 py-1 rounded-full">Activos</span>
            </div>
            <p className="text-3xl font-bold mb-1">18</p>
            <p className="text-primary-foreground/80">Gestores en Servicio</p>
          </div>

          <div className="bg-accent rounded-xl shadow-lg p-6 text-accent-foreground">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="w-8 h-8 opacity-80" />
              <span className="text-sm font-medium bg-accent-foreground/20 px-3 py-1 rounded-full">Hoy</span>
            </div>
            <p className="text-3xl font-bold mb-1">27</p>
            <p className="text-accent-foreground/80">Promesas de Pago</p>
          </div>

          <div className="bg-secondary rounded-xl shadow-lg p-6 text-secondary-foreground">
            <div className="flex items-center justify-between mb-4">
              <UserX className="w-8 h-8 opacity-80" />
              <span className="text-sm font-medium bg-secondary-foreground/20 px-3 py-1 rounded-full">Semana</span>
            </div>
            <p className="text-3xl font-bold mb-1">142</p>
            <p className="text-secondary-foreground/80">Tickets de Gestión Cerrados</p>
          </div>
        </div>
      </div>
    </div>
  );
}
