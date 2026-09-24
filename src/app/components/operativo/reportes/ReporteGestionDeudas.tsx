import { useMemo, useState } from "react";
import { BarChart3, Download, Eye, PieChart as PieChartIcon, Printer, Star, Table2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DataTable } from "../../shared/DataTable";
import {
  getCatalog,
  getDeudas,
  getDeudores,
  getEnviosCobranza,
  getCalificacionDe,
  getSponsors,
  getTicketsGestion,
  saveCalificacion,
  type EnvioCobranza,
  type TicketGestion,
} from "../../../store/localDb";
import { seedAllIfEmpty } from "../../../store/seedAll";
import {
  formatListaCanales,
  type CanalContacto,
  type PlantillaMensaje,
  type ServicioCobranza,
} from "../../../store/catalogSeed";
import { getCurrentUser } from "../../../store/session";
import { EnvioDetalleModal, type EnvioDetalleData } from "../EnvioDetalleModal";

const fmtSol = (n: number) => `S/ ${n.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;

// Resumen gráfico del cierre de la cartera. Igual que en las consultas gerenciales,
// son datos fijos de muestra: el prototipo no acumula el histórico de una campaña real.
const RESUMEN_MUESTRA = [
  { nombre: "Morosos hostigados", valor: 1300, color: "#1f77b4" },
  { nombre: "Respuestas positivas", valor: 680, color: "#10b981" },
  { nombre: "Respuestas negativas", valor: 320, color: "#f59e0b" },
  { nombre: "Sin respuesta", valor: 400, color: "#94a3b8" },
  { nombre: "Deudas pagadas", valor: 640, color: "#8b5cf6" },
  { nombre: "Deudas pendientes", valor: 660, color: "#ef4444" },
];

const TOTAL_MUESTRA = RESUMEN_MUESTRA.reduce((s, r) => s + r.valor, 0);

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    color: "var(--foreground)",
  },
  labelStyle: { color: "var(--foreground)", fontWeight: 600 as const },
  itemStyle: { color: "var(--foreground)", fontWeight: 500 as const },
};

type Vista = "tabla" | "histograma" | "pastel";

const estadoCobranzaBadge = (estado: string) => {
  const map: Record<string, string> = {
    "Sin estrategia": "bg-sky-50 text-sky-700 border border-sky-200",
    "En gestión": "bg-amber-50 text-amber-700 border border-amber-200",
    Finalizado: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  };
  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${map[estado] || ""} print:bg-transparent print:border print:border-black print:text-black`}>
      {estado}
    </span>
  );
};

const respuestaBadge = (r: EnvioCobranza["respuesta"]) => {
  const map: Record<EnvioCobranza["respuesta"], string> = {
    Afirmativa: "bg-emerald-100 text-emerald-700",
    Negativa: "bg-rose-100 text-rose-700",
    "Sin respuesta": "bg-muted text-muted-foreground",
  };
  return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${map[r]}`}>{r}</span>;
};

const estadoCobranzaDe = (ticket: TicketGestion | undefined) => {
  if (!ticket) return "Sin estrategia";
  if (ticket.estado === "CE") return "Finalizado";
  if (ticket.estado === "RE") return "En gestión";
  return "Sin estrategia";
};

// REP — Reporte de gestión de deudas. Documento operativo de solo lectura:
// consolida el estado final de la cartera de morosos del sponsor (o de todos, para Administrador).
export function ReporteGestionDeudas() {
  seedAllIfEmpty();
  const user = getCurrentUser();

  const deudas = useMemo(() => getDeudas(), []);
  const deudores = useMemo(() => getDeudores(), []);
  const sponsors = useMemo(() => getSponsors(), []);
  const tickets = useMemo(() => getTicketsGestion(), []);
  const envios = useMemo(() => getEnviosCobranza(), []);
  const canales = useMemo(() => getCatalog<CanalContacto>("canales", []), []);
  const plantillas = useMemo(() => getCatalog<PlantillaMensaje>("plantillas", []), []);
  const servicios = useMemo(() => getCatalog<ServicioCobranza>("servicios", []), []);

  const [detalle, setDetalle] = useState<EnvioDetalleData | null>(null);
  const [vista, setVista] = useState<Vista>("tabla");
  const [calificando, setCalificando] = useState(false);
  const [estrellas, setEstrellas] = useState(0);
  const [comentario, setComentario] = useState("");
  const [calificacion, setCalificacion] = useState(() =>
    user.sponsorCodigo ? getCalificacionDe(user.sponsorCodigo) : undefined,
  );

  const enviarCalificacion = () => {
    if (!user.sponsorCodigo || estrellas === 0) return;
    const nueva = {
      sponsorCodigo: user.sponsorCodigo,
      estrellas,
      comentario,
      fecha: new Date().toISOString(),
    };
    saveCalificacion(nueva);
    setCalificacion(nueva);
    setCalificando(false);
  };

  const deudorOf = (id: string) => deudores.find((d) => d.id === id);
  const ticketOf = (deudaId: string) => tickets.find((t) => t.deudaId === deudaId);
  const envioOf = (deudaId: string) => envios.find((e) => e.deudaId === deudaId);
  const plantillaNombre = (codigo?: string) => plantillas.find((p) => p.codigo === codigo)?.nombre || "—";
  const plantillaMensaje = (codigo?: string) => plantillas.find((p) => p.codigo === codigo)?.mensaje;

  const misSponsor = user.rol === "Sponsor" ? sponsors.find((s) => s.codigo === user.sponsorCodigo) : undefined;
  const misDeudas = deudas.filter((d) => !misSponsor || d.sponsorId === misSponsor.id);

  const totales = useMemo(() => {
    const totalDeuda = misDeudas.reduce((s, d) => s + d.monto, 0);
    const totalSaldo = misDeudas.reduce((s, d) => s + d.saldo, 0);
    const totalRecuperado = totalDeuda - totalSaldo;
    return { totalDeuda, totalSaldo, totalRecuperado, cantidad: misDeudas.length };
  }, [misDeudas]);

  const abrirDetalle = (deudaId: string) => {
    const deuda = misDeudas.find((d) => d.id === deudaId);
    const envio = envioOf(deudaId);
    const deudor = deudorOf(deuda?.deudorId || "");
    const servicio = servicios.find((s) => s.codigo === deuda?.servicioCodigo);
    const sponsor = sponsors.find((s) => s.id === deuda?.sponsorId);
    if (!deuda || !deudor || !envio) return;
    // El reporte final no muestra la estrategia usada: al sponsor le importa el resultado.
    setDetalle({
      envio,
      deudorNombre: deudor.nombre,
      canalesTexto: formatListaCanales(envio.canalIds, canales),
      plantillaNombre: plantillaNombre(envio.plantillaCodigo),
      plantillaMensaje: plantillaMensaje(envio.plantillaCodigo),
      tipoCobranza: servicio?.tipoCobranza || "—",
      sponsorNombre: sponsor?.razonSocial || "—",
      saldo: deuda.saldo,
      diasMora: deuda.diasMora,
      telefono: deudor.telefono,
    });
  };

  return (
    <div className="min-h-full bg-background">
      <div className="mx-auto max-w-6xl p-6 lg:p-8">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Reporte de Gestión de Deudas</h1>
            {misSponsor && (
              <p className="mt-1 text-base text-muted-foreground">
                Cartera de <span className="font-semibold text-foreground">{misSponsor.razonSocial}</span>
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Download className="w-4 h-4" />
              Descargar PDF
            </button>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-3 mb-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground mb-1.5">Monto Total de Deuda</p>
            <p className="text-2xl font-bold text-foreground">{fmtSol(totales.totalDeuda)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground mb-1.5">Saldo Pendiente</p>
            <p className="text-2xl font-bold text-amber-700">{fmtSol(totales.totalSaldo)}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-sm text-muted-foreground mb-1.5">Monto Recuperado</p>
            <p className="text-2xl font-bold text-emerald-700">{fmtSol(totales.totalRecuperado)}</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <h2 className="text-lg font-semibold text-foreground">Resultado de la cobranza</h2>
          <div className="flex gap-1 rounded-xl border border-border bg-card p-1">
            {([
              { id: "tabla", label: "Tabla", icon: Table2 },
              { id: "histograma", label: "Histograma", icon: BarChart3 },
              { id: "pastel", label: "Diagrama de pastel", icon: PieChartIcon },
            ] as const).map((v) => (
              <button
                key={v.id}
                onClick={() => setVista(v.id)}
                className={
                  vista === v.id
                    ? "flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
                    : "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                }
              >
                <v.icon className="size-4" />
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {vista !== "tabla" && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground">Reporte final de cobranzas</h3>
            <p className="mb-5 text-sm text-muted-foreground">
              Cierre consolidado de la campaña. Datos de muestra del prototipo, solo para visualizar cómo se
              presentarían los resultados.
            </p>

            {vista === "histograma" ? (
              <ResponsiveContainer width="100%" height={360}>
                <BarChart data={RESUMEN_MUESTRA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="nombre" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} interval={0} />
                  <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Bar dataKey="valor" name="Morosos" radius={[6, 6, 0, 0]} isAnimationActive={false}>
                    {RESUMEN_MUESTRA.map((r) => (
                      <Cell key={r.nombre} fill={r.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={360}>
                <PieChart>
                  <Pie
                    data={RESUMEN_MUESTRA}
                    dataKey="valor"
                    nameKey="nombre"
                    outerRadius={130}
                    isAnimationActive={false}
                    label={(e: any) => `${((e.value / TOTAL_MUESTRA) * 100).toFixed(0)}%`}
                  >
                    {RESUMEN_MUESTRA.map((r) => (
                      <Cell key={r.nombre} fill={r.color} />
                    ))}
                  </Pie>
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {vista === "tabla" && (
        <div className="rounded-xl border border-border bg-card p-6">
          <DataTable
            title={`${totales.cantidad} moroso(s) en cartera`}
            searchPlaceholder="Buscar moroso..."
            onExport={() => window.print()}
            columns={[
              {
                key: "deudorId", label: "Moroso", sortable: true,
                render: (d: (typeof misDeudas)[number]) => deudorOf(d.deudorId)?.nombre || d.deudorId,
              },
              {
                key: "tipoCobranza", label: "Tipo de cobranza",
                render: (d: (typeof misDeudas)[number]) =>
                  servicios.find((s) => s.codigo === d.servicioCodigo)?.tipoCobranza || "—",
              },
              {
                key: "canal", label: "Canal(es)",
                render: (d: (typeof misDeudas)[number]) => {
                  const envio = envioOf(d.id);
                  return envio ? formatListaCanales(envio.canalIds, canales) : "—";
                },
              },
              {
                key: "estadoCobranza", label: "Estado Cobranza",
                render: (d: (typeof misDeudas)[number]) => estadoCobranzaBadge(estadoCobranzaDe(ticketOf(d.id))),
              },
              {
                key: "fecha", label: "Fecha", sortable: true,
                render: (d: (typeof misDeudas)[number]) => envioOf(d.id)?.fechaEnvio || "—",
              },
              {
                key: "hora", label: "Hora envío",
                render: (d: (typeof misDeudas)[number]) => envioOf(d.id)?.horaEnvio || "—",
              },
              {
                key: "tarifa", label: "Tarifa",
                render: (d: (typeof misDeudas)[number]) => {
                  const envio = envioOf(d.id);
                  return envio ? `S/ ${Number(envio.tarifa).toLocaleString("es-PE")}` : "—";
                },
              },
              {
                key: "respuesta", label: "Respuesta",
                render: (d: (typeof misDeudas)[number]) => (envioOf(d.id) ? respuestaBadge(envioOf(d.id)!.respuesta) : "—"),
              },
              {
                key: "__detalle", label: "Detalle",
                render: (d: (typeof misDeudas)[number]) =>
                  envioOf(d.id) ? (
                    <button
                      onClick={() => abrirDetalle(d.id)}
                      className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Eye className="size-3.5" />
                      Ver más
                    </button>
                  ) : (
                    "—"
                  ),
              },
            ]}
            data={misDeudas}
          />
        </div>
        )}

        {/* Cierre: el sponsor califica cómo le fue con el sistema */}
        {misSponsor && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-6 print:hidden">
            {calificacion ? (
              <p className="flex items-center gap-2 text-sm text-foreground">
                <span className="flex">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={n <= calificacion.estrellas ? "size-4 fill-amber-400 text-amber-400" : "size-4 text-muted-foreground"}
                    />
                  ))}
                </span>
                Ya calificaste esta cobranza{calificacion.comentario ? `: "${calificacion.comentario}"` : "."}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                ¿Qué tal te fue con el sistema? Tu calificación cierra la gestión de esta cartera.
              </p>
            )}
            <button
              onClick={() => {
                setEstrellas(calificacion?.estrellas ?? 0);
                setComentario(calificacion?.comentario ?? "");
                setCalificando(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-amber-950 transition-colors hover:bg-amber-400"
            >
              <Star className="size-4" />
              {calificacion ? "Cambiar mi calificación" : "Calificar cobranza"}
            </button>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground print:hidden">
          Este reporte consolida el estado de la cartera de cobranza del sponsor. No representa una nueva transacción.
        </p>
      </div>

      {/* Calificación del servicio */}
      {calificando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-foreground">Calificar la cobranza</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Cuéntanos qué tan bien te resultó el sistema con esta cartera.
            </p>

            <div className="mt-5 flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setEstrellas(n)} aria-label={`${n} estrella(s)`}>
                  <Star
                    className={n <= estrellas ? "size-9 fill-amber-400 text-amber-400" : "size-9 text-muted-foreground"}
                  />
                </button>
              ))}
            </div>

            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={3}
              placeholder="Comentario (opcional)"
              className="mt-5 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setCalificando(false)}
                className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Cancelar
              </button>
              <button
                onClick={enviarCalificacion}
                disabled={estrellas === 0}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                Enviar calificación
              </button>
            </div>
          </div>
        </div>
      )}

      <EnvioDetalleModal data={detalle} onClose={() => setDetalle(null)} />
    </div>
  );
}
