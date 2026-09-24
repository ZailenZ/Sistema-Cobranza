import { useMemo, useState } from "react";
import { ArrowLeft, Bot, Eye, MessageSquareText, Reply, Wrench } from "lucide-react";

import { PageHeader } from "../../shared/PageHeader";
import { KPICard } from "../../shared/KPICard";
import { DataTable } from "../../shared/DataTable";
import { getCatalog } from "../../../store/localDb";
import { seedAllIfEmpty } from "../../../store/seedAll";
import type { AutomataCatalogo } from "../../../store/catalogSeed";

// Consulta de autómatas. La carga de trabajo (mensajes enviados, respuestas y la
// cola de mensajes por enviar) es data simulada del prototipo: se genera de forma
// determinista a partir del código del autómata, para que la pantalla muestre
// siempre lo mismo entre recargas sin necesitar un backend.

/** PRNG determinista: la misma semilla siempre da la misma secuencia. */
function crearRandom(semilla: string) {
  let s = 0;
  for (const c of semilla) s = (s * 31 + c.charCodeAt(0)) % 2147483647;
  return (min: number, max: number) => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return min + Math.floor((s / 2147483648) * (max - min + 1));
  };
}

const APELLIDOS = ["González", "García", "Fernández", "Rodríguez", "López", "Martínez", "Sánchez", "Ramírez", "Díaz", "Chirinos", "Quispe", "Vargas", "Rojas", "Flores"];
const NOMBRES = ["María", "Juan", "Carmen", "Manuel", "Ana", "Javier", "Laura", "Miguel", "Teresa", "Fernando", "Rosa", "Carlos", "Elena", "Pedro"];
const PLANTILLAS = ["Amistoso", "Recordatorio", "Aviso formal", "Advertencia", "Ultimátum"];
const ESTADOS_MSJ = ["Programado", "En cola", "Enviado"] as const;

type FilaAutomata = AutomataCatalogo & {
  mensajesEnviados: number;
  respuestas: number;
  morososAsignados: number;
  mensajesPorHora: number;
  tasaRespuesta: number;
};

type MensajePendiente = {
  id: string;
  apellidos: string;
  nombres: string;
  fecha: string;
  plantilla: string;
  estado: string;
};

function construirFila(a: AutomataCatalogo): FilaAutomata {
  const rnd = crearRandom(a.codigo);
  const mensajesEnviados = a.estado === "Activo" ? rnd(Math.round(a.capacidadMaxPorDia * 0.25), a.capacidadMaxPorDia) : 0;
  const respuestas = Math.round(mensajesEnviados * (rnd(12, 46) / 100));
  return {
    ...a,
    mensajesEnviados,
    respuestas,
    // La cartera asignada se mantiene proporcional a lo que el autómata puede procesar.
    morososAsignados: a.estado === "Activo" ? rnd(Math.round(a.capacidadMaxPorDia * 0.6), a.capacidadMaxPorDia * 2) : 0,
    mensajesPorHora: Math.max(1, Math.round(a.capacidadMaxPorDia / 24)),
    tasaRespuesta: mensajesEnviados > 0 ? (respuestas / mensajesEnviados) * 100 : 0,
  };
}

function colaDe(a: AutomataCatalogo): MensajePendiente[] {
  if (a.estado !== "Activo") return [];
  const rnd = crearRandom(a.codigo + "-cola");
  const cuantos = rnd(8, 14);
  return Array.from({ length: cuantos }, (_, i) => {
    const dia = 20 + Math.floor(i / 4); // fechas correlativas, varias por día
    return {
      id: `${a.codigo}-${i}`,
      apellidos: APELLIDOS[rnd(0, APELLIDOS.length - 1)],
      nombres: NOMBRES[rnd(0, NOMBRES.length - 1)],
      fecha: `${String(Math.min(dia, 28)).padStart(2, "0")}/09/2026`,
      plantilla: PLANTILLAS[rnd(0, PLANTILLAS.length - 1)],
      estado: ESTADOS_MSJ[rnd(0, ESTADOS_MSJ.length - 1)],
    };
  });
}

/** Barra de proporción del wireframe: "X de Y". */
function BarraProporcion({ label, valor, total, color }: { label: string; valor: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min(100, (valor / total) * 100) : 0;
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-2 h-4 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1.5 text-sm font-semibold text-foreground">
        {valor.toLocaleString("es-PE")} de {total.toLocaleString("es-PE")}
      </p>
    </div>
  );
}

export function Automatas() {
  seedAllIfEmpty();
  const [seleccionado, setSeleccionado] = useState<FilaAutomata | null>(null);
  const [estadoFiltro, setEstadoFiltro] = useState("");

  const automatas = useMemo(() => getCatalog<AutomataCatalogo>("automata", []), []);
  const filas = useMemo(() => automatas.map(construirFila), [automatas]);

  const visibles = useMemo(
    () => filas.filter((f) => !estadoFiltro || f.estado === estadoFiltro),
    [filas, estadoFiltro],
  );

  const totales = useMemo(() => {
    const capacidad = filas.reduce((s, f) => s + f.capacidadMaxPorDia, 0);
    const enviados = filas.reduce((s, f) => s + f.mensajesEnviados, 0);
    const respuestas = filas.reduce((s, f) => s + f.respuestas, 0);
    return {
      capacidad,
      enviados,
      respuestas,
      disponibles: capacidad - enviados,
      inactivos: filas.filter((f) => f.estado !== "Activo").reduce((s, f) => s + f.capacidadMaxPorDia, 0),
      tasa: enviados > 0 ? (respuestas / enviados) * 100 : 0,
    };
  }, [filas]);

  // --- Detalle de un autómata: su ficha + su cola de mensajes por enviar ---
  if (seleccionado) {
    const cola = colaDe(seleccionado);

    return (
      <div className="min-h-full bg-background">
        <PageHeader
          title="Detalle del autómata"
          subtitle="Datos del autómata y los mensajes que tiene por enviar a los morosos"
        />

        <div className="space-y-6 p-6 lg:p-8">
          <button
            onClick={() => setSeleccionado(null)}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Volver a la lista de autómatas
          </button>

          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                <Bot className="size-8" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">{seleccionado.nombre}</h3>
              <p className="text-sm text-muted-foreground">{seleccionado.codigo}</p>

              <dl className="mt-5 space-y-4">
                {[
                  { label: "Descripción", value: seleccionado.descripcion },
                  { label: "Mensajes por hora", value: String(seleccionado.mensajesPorHora) },
                  { label: "Capacidad máx. por día", value: seleccionado.capacidadMaxPorDia.toLocaleString("es-PE") },
                  { label: "Morosos asignados", value: seleccionado.morososAsignados.toLocaleString("es-PE") },
                  { label: "Mensajes enviados hoy", value: seleccionado.mensajesEnviados.toLocaleString("es-PE") },
                  { label: "Respuestas recibidas", value: seleccionado.respuestas.toLocaleString("es-PE") },
                  { label: "Estado", value: seleccionado.estado },
                ].map((campo) => (
                  <div key={campo.label}>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{campo.label}</dt>
                    <dd className="mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
                      {campo.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-1 text-lg font-semibold text-foreground">Detalle de morosos por enviar mensaje</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Cola de mensajes programados por {seleccionado.nombre}, con la fecha en que le toca salir a cada moroso.
              </p>
              {cola.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border py-10 text-center text-base text-muted-foreground">
                  Este autómata está inactivo: no tiene mensajes programados.
                </p>
              ) : (
                <DataTable
                  searchPlaceholder="Buscar moroso..."
                  columns={[
                    { key: "apellidos", label: "Apellidos", sortable: true },
                    { key: "nombres", label: "Nombres", sortable: true },
                    { key: "fecha", label: "Fecha de mensaje", sortable: true },
                    { key: "plantilla", label: "Tipo de mensaje" },
                    {
                      key: "estado", label: "Estado",
                      render: (m: any) => (
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                          m.estado === "Enviado" ? "bg-emerald-100 text-emerald-700"
                            : m.estado === "En cola" ? "bg-amber-100 text-amber-700"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {m.estado}
                        </span>
                      ),
                    },
                  ]}
                  data={cola}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Lista de autómatas ---
  return (
    <div className="min-h-full bg-background">
      <PageHeader
        title="Consulta de Autómatas"
        subtitle="Los operadores del sistema son autómatas. Elige uno para ver su ficha y su cola de mensajes."
      />

      <div className="space-y-6 p-6 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-5 text-base font-semibold text-foreground">Información general de los autómatas</h3>
            <div className="space-y-5">
              <BarraProporcion label="Capacidad disponible hoy" valor={totales.disponibles} total={totales.capacidad} color="bg-emerald-500" />
              <BarraProporcion label="Capacidad fuera de servicio" valor={totales.inactivos} total={totales.capacidad} color="bg-destructive" />
              <BarraProporcion label="Capacidad en proceso de cobranza" valor={totales.enviados} total={totales.capacidad} color="bg-amber-500" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <KPICard title="Autómatas activos" value={filas.filter((f) => f.estado === "Activo").length} icon={Bot} variant="secondary" />
              <KPICard title="Mensajes enviados hoy" value={totales.enviados.toLocaleString("es-PE")} icon={MessageSquareText} variant="secondary" />
              <KPICard title="Respuestas recibidas" value={totales.respuestas.toLocaleString("es-PE")} icon={Reply} variant="secondary" subtitle={`${totales.tasa.toFixed(1)}% de respuesta`} />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Filtrar por:</span>
              <select
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value)}
                className="rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Todos los estados</option>
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
              {estadoFiltro && (
                <button
                  onClick={() => setEstadoFiltro("")}
                  className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  Limpiar filtros
                </button>
              )}
              <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                <Wrench className="size-3.5" />
                {visibles.length} autómata(s)
              </span>
            </div>
          </div>
        </div>

        <DataTable
          title="Autómatas"
          searchPlaceholder="Buscar autómata..."
          onExport={() => {}}
          onRowClick={(a: any) => setSeleccionado(a)}
          columns={[
            { key: "codigo", label: "Cód. autómata", sortable: true },
            { key: "nombre", label: "Autómata", sortable: true },
            { key: "morososAsignados", label: "Morosos asignados", sortable: true, render: (a: any) => a.morososAsignados.toLocaleString("es-PE") },
            { key: "mensajesEnviados", label: "Mensajes enviados", sortable: true, render: (a: any) => a.mensajesEnviados.toLocaleString("es-PE") },
            { key: "respuestas", label: "Respuestas recibidas", sortable: true, render: (a: any) => a.respuestas.toLocaleString("es-PE") },
            { key: "tasaRespuesta", label: "Tasa de respuesta", sortable: true, render: (a: any) => `${a.tasaRespuesta.toFixed(1)}%` },
            {
              key: "estado", label: "Estado",
              render: (a: any) => (
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${a.estado === "Activo" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                  {a.estado}
                </span>
              ),
            },
            {
              key: "__detalle", label: "Información",
              render: (a: any) => (
                <button
                  onClick={(e) => { e.stopPropagation(); setSeleccionado(a); }}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
                >
                  <Eye className="size-3.5" />
                  Ver más
                </button>
              ),
            },
          ]}
          data={visibles}
        />
      </div>
    </div>
  );
}
