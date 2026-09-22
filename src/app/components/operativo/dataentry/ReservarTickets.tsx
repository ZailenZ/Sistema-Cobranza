import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { CheckCircle2, FileSpreadsheet, Sparkles, UploadCloud, Wallet, X, Zap } from "lucide-react";

import { PageHeader } from "../../shared/PageHeader";
import { DataTable } from "../../shared/DataTable";
import {
  getCatalog,
  getDeudas,
  getDeudores,
  getSponsors,
  getTicketsGestion,
  getEnviosCobranza,
  type Deuda,
  type Deudor,
  type EnvioCobranza,
  type TicketGestion,
} from "../../../store/localDb";
import { seedAllIfEmpty } from "../../../store/seedAll";
import {
  aplicarEstrategia,
  estrategiasDeServicio,
  recomendarEstrategia,
  simularCargaMorosos,
} from "../../../store/sponsorFlow";
import {
  formatCanalesFrecuencia,
  formatDuracion,
  formatListaCanales,
  type CanalContacto,
  type EstrategiaCobranza,
  type PlantillaMensaje,
  type ServicioCobranza,
} from "../../../store/catalogSeed";
import { getCurrentUser } from "../../../store/session";

const fmtSol = (n: number) => `S/ ${Number(n).toLocaleString("es-PE")}`;

function ArchivoDropzone({
  titulo,
  formato,
  archivo,
  onChange,
}: {
  titulo: string;
  formato: string;
  archivo: File | null;
  onChange: (file: File | null) => void;
}) {
  const inputId = `dz-${titulo.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className="rounded-xl border-2 border-dashed border-border p-7 text-center">
      <p className="mb-3 text-base font-semibold text-foreground">{titulo}</p>
      <UploadCloud className="mx-auto mb-3 size-9 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Arrastra archivo o presiona el botón seleccionar</p>
      <label
        htmlFor={inputId}
        className="mt-4 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-cyan-400 px-4 py-1.5 text-sm font-semibold text-cyan-950 hover:bg-cyan-300"
      >
        Seleccionar
      </label>
      <input
        id={inputId}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
      {archivo && (
        <p className="mt-2 flex items-center justify-center gap-1.5 text-sm font-medium text-emerald-700">
          <FileSpreadsheet className="size-4" />
          {archivo.name}
        </p>
      )}
      <p className="mt-4 text-left text-sm leading-6 text-muted-foreground">
        Formato esperado:
        <br />
        {formato}
      </p>
    </div>
  );
}

/** Modal para elegir con qué estrategia de hostigamiento se trabajará a un moroso. */
function ElegirEstrategiaModal({
  deudorNombre,
  tipoCobranza,
  estrategias,
  recomendada,
  canales,
  plantillas,
  onElegir,
  onClose,
}: {
  deudorNombre: string;
  tipoCobranza: string;
  estrategias: EstrategiaCobranza[];
  recomendada?: EstrategiaCobranza;
  canales: CanalContacto[];
  plantillas: PlantillaMensaje[];
  onElegir: (codigo: string) => void;
  onClose: () => void;
}) {
  // La recomendación del sistema viene preseleccionada, pero el sponsor puede cambiarla.
  const [seleccion, setSeleccion] = useState<string>(recomendada?.codigo || estrategias[0]?.codigo || "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-card shadow-2xl">
        <div className="flex items-start justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">Elegir estrategia de hostigamiento</h3>
            <p className="text-sm text-muted-foreground">
              Moroso: <span className="font-medium text-foreground">{deudorNombre}</span> · Clasificado como{" "}
              <span className="font-medium text-foreground">{tipoCobranza}</span>
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 transition-colors hover:bg-muted">
            <X className="size-5 text-muted-foreground" />
          </button>
        </div>

        {recomendada && (
          <div className="mx-6 mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <Sparkles className="mt-0.5 size-4 shrink-0" />
            <span>
              El sistema recomienda la <span className="font-semibold">{recomendada.nombre}</span> según los días de
              mora y el saldo de este moroso dentro de su tipo de cobranza. Viene preseleccionada, pero la decisión
              final es tuya: puedes elegir cualquier otra.
            </span>
          </div>
        )}

        <div className="scrollbar-modern flex-1 space-y-3 overflow-y-auto px-6 py-4">
          {estrategias.length === 0 ? (
            <p className="py-8 text-center text-base text-muted-foreground">
              No hay estrategias activas para {tipoCobranza}. Pídele al gerente que las configure en el Catálogo de
              Estrategias.
            </p>
          ) : (
            estrategias.map((e) => {
              const activa = seleccion === e.codigo;
              const esRecomendada = recomendada?.codigo === e.codigo;
              return (
                <label
                  key={e.codigo}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                    activa ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="estrategia"
                    className="mt-1.5"
                    checked={activa}
                    onChange={() => setSeleccion(e.codigo)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="flex flex-wrap items-center gap-2 text-base font-semibold text-foreground">
                        {e.codigo} · {e.nombre}
                        {esRecomendada && (
                          <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                            <Sparkles className="size-3" />
                            Recomendada
                          </span>
                        )}
                      </p>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                        Tarifa {fmtSol(e.tarifa)}
                      </span>
                    </div>
                    <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-muted-foreground">Canal(es)</dt>
                        <dd className="text-foreground">{formatListaCanales(e.canalCodigos, canales)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-muted-foreground">Tipo de mensaje</dt>
                        <dd className="text-foreground">
                          {plantillas.find((p) => p.codigo === e.plantillaCodigo)?.nombre || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-muted-foreground">Duración</dt>
                        <dd className="text-foreground">{formatDuracion(Number(e.duracionDias))}</dd>
                      </div>
                    </dl>
                  </div>
                </label>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            onClick={() => seleccion && onElegir(seleccion)}
            disabled={!seleccion}
            className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Zap className="size-4" />
            Aplicar estrategia
          </button>
        </div>
      </div>
    </div>
  );
}

export function ReservarTickets() {
  seedAllIfEmpty();
  const user = getCurrentUser();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tickets, setTickets] = useState<TicketGestion[]>(() => getTicketsGestion());
  const [deudas, setDeudas] = useState<Deuda[]>(() => getDeudas());
  const [deudores, setDeudores] = useState<Deudor[]>(() => getDeudores());
  const [envios, setEnvios] = useState<EnvioCobranza[]>(() => getEnviosCobranza());
  const canales = useMemo(() => getCatalog<CanalContacto>("canales", []), []);
  const servicios = useMemo(() => getCatalog<ServicioCobranza>("servicios", []), []);
  const plantillas = useMemo(() => getCatalog<PlantillaMensaje>("plantillas", []), []);
  const estrategias = useMemo(() => getCatalog<EstrategiaCobranza>("estrategias", []), []);
  const sponsors = useMemo(() => getSponsors(), []);

  const deudaOf = (id: string) => deudas.find((d) => d.id === id);
  const deudorOf = (id: string) => deudores.find((d) => d.id === id);
  const servicioDe = (t: TicketGestion) => servicios.find((s) => s.codigo === deudaOf(t.deudaId)?.servicioCodigo);
  const estrategiaDe = (t: TicketGestion) => estrategias.find((e) => e.codigo === t.estrategiaCodigo);
  const envioDe = (t: TicketGestion) => envios.find((e) => e.ticketId === t.id);
  const recomendacionDe = (t: TicketGestion) => recomendarEstrategia(deudaOf(t.deudaId), servicioDe(t), estrategias);

  // Sponsor en modo autoservicio: solo ve su propia cartera de morosos.
  const misSponsor = user.rol === "Sponsor" ? sponsors.find((s) => s.codigo === user.sponsorCodigo) : undefined;

  // Filtro opcional por tipo de cobranza (solo para VER un subconjunto de la cartera ya clasificada).
  const tipoCodigo = searchParams.get("tipo");
  const tipoServicio = tipoCodigo ? servicios.find((s) => s.codigo === tipoCodigo) : undefined;

  const dentroDeCartera = (t: TicketGestion) => !misSponsor || deudaOf(t.deudaId)?.sponsorId === misSponsor.id;
  const dentroDeTipo = (t: TicketGestion) =>
    !tipoServicio || deudaOf(t.deudaId)?.servicioCodigo === tipoServicio.codigo;

  const visibles = tickets.filter((t) => dentroDeCartera(t) && dentroDeTipo(t));
  const porAsignar = visibles.filter((t) => t.estado === "DI");
  const conEstrategia = visibles.filter((t) => t.estado !== "DI");

  const totalTarifas = conEstrategia.reduce((sum, t) => sum + (envioDe(t)?.tarifa ?? estrategiaDe(t)?.tarifa ?? 0), 0);

  // --- Carga de la lista de morosos (simulada) ---
  const [archivoMorosos, setArchivoMorosos] = useState<File | null>(null);
  const [archivoDeuda, setArchivoDeuda] = useState<File | null>(null);
  const [mensajeCarga, setMensajeCarga] = useState<string | null>(null);
  const tieneCartera = Boolean(misSponsor) && tickets.some((t) => dentroDeCartera(t));
  const [panelCargaAbierto, setPanelCargaAbierto] = useState(!tieneCartera);

  const recargarDatos = () => {
    setTickets(getTicketsGestion());
    setDeudas(getDeudas());
    setDeudores(getDeudores());
    setEnvios(getEnviosCobranza());
  };

  const handleActualizar = () => {
    if (!misSponsor) return;
    const resultado = simularCargaMorosos(misSponsor.codigo);
    if (!resultado) return;
    recargarDatos();
    setPanelCargaAbierto(false);
    setArchivoMorosos(null);
    setArchivoDeuda(null);
    setMensajeCarga(
      `Se cargaron ${resultado.deudores.length} moroso(s). El sistema los clasificó en: ` +
        resultado.porTipo.map((t) => `${t.cantidad} en ${t.tipoCobranza}`).join(", ") +
        ". Ahora elige la estrategia de hostigamiento para cada uno.",
    );
  };

  // --- Elección de estrategia por moroso ---
  const [ticketEnEdicion, setTicketEnEdicion] = useState<TicketGestion | null>(null);

  const confirmarEstrategia = (codigo: string) => {
    if (!ticketEnEdicion) return;
    aplicarEstrategia(ticketEnEdicion.id, codigo);
    recargarDatos();
    setTicketEnEdicion(null);
  };

  const ticketEnEdicionServicio = ticketEnEdicion ? servicioDe(ticketEnEdicion) : undefined;

  return (
    <div className="min-h-full bg-muted">
      <PageHeader
        title="Reservar tickets"
        subtitle={
          misSponsor
            ? "Sube tu lista de morosos, el sistema los clasifica por tipo de cobranza y tú eliges la estrategia de hostigamiento de cada uno."
            : "Cartera de morosos clasificada y estrategias de hostigamiento asignadas."
        }
      />

      <div className="space-y-6 p-8">
        {misSponsor && (
          <div className="rounded-xl border border-border bg-card px-5 py-4 text-base text-foreground">
            Cartera propia: <span className="font-semibold">{misSponsor.razonSocial}</span> — solo ves tus propios morosos.
          </div>
        )}

        {/* Paso 1: subir la lista de morosos (simulado) */}
        {misSponsor && panelCargaAbierto && (
          <div className="rounded-xl border border-border bg-card p-7">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-foreground">1. Sube tu lista de morosos</h3>
              <p className="text-sm text-muted-foreground">
                Prototipo visual: no se procesa el archivo real. Al confirmar, el sistema clasifica a cada moroso
                según su información (días de mora) y le asigna su tipo de cobranza.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <ArchivoDropzone
                titulo="Archivo morosos"
                formato="dni / nombre / teléfono / correo / dirección"
                archivo={archivoMorosos}
                onChange={setArchivoMorosos}
              />
              <ArchivoDropzone
                titulo="Archivo deuda"
                formato="nombre (moroso asoc) / fecha nacimiento / saldo deuda"
                archivo={archivoDeuda}
                onChange={setArchivoDeuda}
              />
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleActualizar}
                className="rounded-lg bg-emerald-600 px-6 py-2.5 text-base font-semibold text-white hover:bg-emerald-700"
              >
                Actualizar
              </button>
            </div>
          </div>
        )}

        {mensajeCarga && (
          <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-base text-emerald-800">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
            {mensajeCarga}
          </div>
        )}

        {misSponsor && !panelCargaAbierto && (
          <div className="flex justify-end">
            <button
              onClick={() => setPanelCargaAbierto(true)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              + Cargar otra lista de morosos
            </button>
          </div>
        )}

        {tipoServicio && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 px-5 py-4 text-base">
            <span>
              Viendo solo los morosos clasificados como{" "}
              <span className="font-semibold">{tipoServicio.tipoCobranza}</span>
            </span>
            <button
              onClick={() => setSearchParams({})}
              className="flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
              Ver todos
            </button>
          </div>
        )}

        {/* Paso 2: elegir estrategia por moroso */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">
              2. Morosos clasificados — elige su estrategia
            </h3>
            <span className="text-sm text-muted-foreground">{porAsignar.length} moroso(s) por asignar</span>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            El sistema ya asignó el tipo de cobranza de cada moroso según sus días de mora. Elige con qué estrategia
            de hostigamiento quieres trabajarlo; cada estrategia tiene su canal, mensaje, duración y tarifa.
          </p>
          {porAsignar.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border py-10 text-center text-base text-muted-foreground">
              {tieneCartera
                ? "Todos tus morosos ya tienen una estrategia asignada."
                : "Aún no has subido tu lista de morosos. Súbela arriba para que el sistema la clasifique."}
            </p>
          ) : (
          <DataTable
            searchPlaceholder="Buscar moroso..."
            columns={[
              { key: "deudorId", label: "Moroso", sortable: true, render: (t: any) => deudorOf(t.deudorId)?.nombre || t.deudorId },
              { key: "documento", label: "Documento", render: (t: any) => deudorOf(t.deudorId)?.documento || "—" },
              { key: "saldo", label: "Saldo", render: (t: any) => fmtSol(deudaOf(t.deudaId)?.saldo ?? 0) },
              { key: "mora", label: "Mora", render: (t: any) => `${deudaOf(t.deudaId)?.diasMora ?? "—"} días` },
              {
                key: "tipoCobranza", label: "Tipo de cobranza asignado",
                render: (t: any) => servicioDe(t)?.tipoCobranza || "—",
              },
              {
                key: "recomendada", label: "Recomendada por el sistema",
                render: (t: any) => {
                  const rec = recomendacionDe(t);
                  return rec ? (
                    <span className="flex items-center gap-1.5 text-sm">
                      <Sparkles className="size-3.5 text-amber-600" />
                      {rec.nombre} · {fmtSol(rec.tarifa)}
                    </span>
                  ) : (
                    "—"
                  );
                },
              },
              {
                key: "__accion", label: "Estrategia",
                render: (t: any) => (
                  <button
                    onClick={() => setTicketEnEdicion(t)}
                    className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <Zap className="size-3.5" />
                    Elegir estrategia
                  </button>
                ),
              },
            ]}
            data={porAsignar}
          />
          )}
          {porAsignar.length > 0 && (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Sparkles className="size-4 text-amber-600" />
              La recomendación considera los días de mora y el saldo del moroso dentro de su tipo de cobranza. Es
              solo una sugerencia: al elegir la estrategia puedes aplicar cualquier otra.
            </p>
          )}
        </div>

        {/* Paso 3: morosos ya en hostigamiento */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-foreground">3. Morosos en hostigamiento</h3>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{conEstrategia.length} con estrategia asignada</span>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700">
                <Wallet className="size-4" />
                Total a pagar: {fmtSol(totalTarifas)}
              </span>
            </div>
          </div>
          {conEstrategia.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border py-10 text-center text-base text-muted-foreground">
              Todavía no has aplicado ninguna estrategia.
            </p>
          ) : (
          <DataTable
            searchPlaceholder="Buscar en mis morosos en gestión..."
            columns={[
              { key: "deudorId", label: "Moroso", sortable: true, render: (t: any) => deudorOf(t.deudorId)?.nombre || t.deudorId },
              { key: "tipoCobranza", label: "Tipo de cobranza", render: (t: any) => servicioDe(t)?.tipoCobranza || "—" },
              {
                key: "estrategia", label: "Estrategia",
                render: (t: any) => {
                  const e = estrategiaDe(t);
                  return e ? `${e.codigo} · ${e.nombre}` : "—";
                },
              },
              {
                key: "canales", label: "Canal(es)",
                render: (t: any) => formatListaCanales(estrategiaDe(t)?.canalCodigos, canales),
              },
              {
                key: "mensaje", label: "Tipo de mensaje",
                render: (t: any) => plantillas.find((p) => p.codigo === estrategiaDe(t)?.plantillaCodigo)?.nombre || "—",
              },
              {
                key: "duracion", label: "Duración",
                render: (t: any) => {
                  const e = estrategiaDe(t);
                  return e ? formatDuracion(Number(e.duracionDias)) : "—";
                },
              },
              {
                key: "tarifa", label: "Tarifa",
                render: (t: any) => fmtSol(envioDe(t)?.tarifa ?? estrategiaDe(t)?.tarifa ?? 0),
              },
            ]}
            data={conEstrategia}
          />
          )}
          {conEstrategia.length > 0 && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-base text-emerald-800">
              <CheckCircle2 className="size-5 shrink-0" />
              Revisa las respuestas de estos morosos en "Entrega cobranza".
            </div>
          )}
        </div>

        {/* Referencia: tipos de cobranza del sistema y sus canales/frecuencia */}
        {misSponsor && (
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-semibold text-foreground">Tipos de cobranza que maneja el sistema</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Solo de referencia: tú no eliges el tipo, el sistema clasifica a cada moroso según sus días de mora.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {servicios
                .filter((s) => s.estado === "Activo")
                .map((s) => {
                  const suyas = estrategiasDeServicio(s.tipoCobranza, estrategias);
                  return (
                    <div key={s.codigo} className="rounded-xl border border-border p-5">
                      <p className="text-base font-semibold text-foreground">{s.tipoCobranza}</p>
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        Mora {s.moraMin}–{s.moraMax ?? "a más"} días · Saldo S/ {s.saldoMin.toLocaleString()}–
                        {s.saldoMax ? s.saldoMax.toLocaleString() : "a más"}
                      </p>
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        Canales: {formatCanalesFrecuencia(s.canales, canales)}
                      </p>
                      <p className="mt-1.5 text-sm text-muted-foreground">
                        {suyas.length} estrategia(s) disponible(s): {suyas.map((e) => e.codigo).join(", ") || "—"}
                      </p>
                      <button
                        onClick={() => setSearchParams({ tipo: s.codigo })}
                        className="mt-3 text-sm font-medium text-primary hover:underline"
                      >
                        Ver mis morosos de este tipo →
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {ticketEnEdicion && (
        <ElegirEstrategiaModal
          deudorNombre={deudorOf(ticketEnEdicion.deudorId)?.nombre || "—"}
          tipoCobranza={ticketEnEdicionServicio?.tipoCobranza || "—"}
          estrategias={estrategiasDeServicio(ticketEnEdicionServicio?.tipoCobranza, estrategias)}
          recomendada={recomendacionDe(ticketEnEdicion)}
          canales={canales}
          plantillas={plantillas}
          onElegir={confirmarEstrategia}
          onClose={() => setTicketEnEdicion(null)}
        />
      )}
    </div>
  );
}
