import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Eye, HelpCircle, PhoneCall, XCircle } from "lucide-react";

import { PageHeader } from "../../shared/PageHeader";
import { DataTable } from "../../shared/DataTable";
import { KPICard } from "../../shared/KPICard";
import {
  getCatalog,
  getDeudas,
  getDeudores,
  getEnviosCobranza,
  getSponsors,
  type EnvioCobranza,
} from "../../../store/localDb";
import { seedAllIfEmpty } from "../../../store/seedAll";
import {
  formatListaCanales,
  type CanalContacto,
  type EstrategiaCobranza,
  type PlantillaMensaje,
  type ServicioCobranza,
  type TipoMoroso,
} from "../../../store/catalogSeed";
import { getCurrentUser } from "../../../store/session";
import { EnvioDetalleModal, type EnvioDetalleData } from "../EnvioDetalleModal";

const respuestaBadge = (r: EnvioCobranza["respuesta"]) => {
  const map: Record<EnvioCobranza["respuesta"], string> = {
    Afirmativa: "bg-emerald-100 text-emerald-700",
    Negativa: "bg-rose-100 text-rose-700",
    "Sin respuesta": "bg-muted text-muted-foreground",
  };
  return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${map[r]}`}>{r}</span>;
};

const fmtSol = (n: number) => `S/ ${Number(n).toLocaleString("es-PE")}`;

export function EntregaCobranza() {
  seedAllIfEmpty();
  const user = getCurrentUser();

  const envios = useMemo(() => getEnviosCobranza(), []);
  const deudas = useMemo(() => getDeudas(), []);
  const deudores = useMemo(() => getDeudores(), []);
  const sponsors = useMemo(() => getSponsors(), []);
  const canales = useMemo(() => getCatalog<CanalContacto>("canales", []), []);
  const plantillas = useMemo(() => getCatalog<PlantillaMensaje>("plantillas", []), []);
  const servicios = useMemo(() => getCatalog<ServicioCobranza>("servicios", []), []);
  const tiposMoroso = useMemo(() => getCatalog<TipoMoroso>("morosos", []), []);

  /** Perfil del Catálogo de Morosos en el que cae un deudor según sus días de mora. */
  const tipoMorosoDe = (diasMora: number) =>
    tiposMoroso.find(
      (m) => m.estado === "Activo" && diasMora >= m.moraMin && (m.moraMax === null || diasMora <= m.moraMax),
    )?.nombre || "—";
  const estrategias = useMemo(() => getCatalog<EstrategiaCobranza>("estrategias", []), []);

  const [detalle, setDetalle] = useState<EnvioDetalleData | null>(null);

  const deudaOf = (id: string) => deudas.find((d) => d.id === id);
  const deudorOf = (id: string) => deudores.find((d) => d.id === id);
  const plantillaDe = (codigo?: string) => plantillas.find((p) => p.codigo === codigo);
  const estrategiaDe = (codigo: string) => estrategias.find((e) => e.codigo === codigo);

  // Sponsor en modo autoservicio: solo ve los envíos de cobranza de su propia cartera de morosos.
  const misSponsor = user.rol === "Sponsor" ? sponsors.find((s) => s.codigo === user.sponsorCodigo) : undefined;

  const misEnvios = envios.filter((e) => !misSponsor || deudaOf(e.deudaId)?.sponsorId === misSponsor.id);

  const resumen = useMemo(() => {
    const afirmativa = misEnvios.filter((e) => e.respuesta === "Afirmativa").length;
    const negativa = misEnvios.filter((e) => e.respuesta === "Negativa").length;
    const sinRespuesta = misEnvios.filter((e) => e.respuesta === "Sin respuesta").length;
    const gasto = misEnvios.reduce((sum, e) => sum + (e.tarifa || 0), 0);
    return { total: misEnvios.length, afirmativa, negativa, sinRespuesta, gasto };
  }, [misEnvios]);

  const abrirDetalle = (envio: EnvioCobranza) => {
    const deuda = deudaOf(envio.deudaId);
    const deudor = deudorOf(envio.deudorId);
    const servicio = servicios.find((s) => s.codigo === deuda?.servicioCodigo);
    const sponsor = sponsors.find((s) => s.id === deuda?.sponsorId);
    const estrategia = estrategiaDe(envio.estrategiaCodigo);
    if (!deuda || !deudor) return;
    setDetalle({
      envio,
      deudorNombre: deudor.nombre,
      canalesTexto: formatListaCanales(envio.canalIds, canales),
      estrategiaTexto: estrategia ? `${estrategia.codigo} · ${estrategia.nombre}` : envio.estrategiaCodigo || "—",
      plantillaNombre: plantillaDe(envio.plantillaCodigo)?.nombre || "—",
      plantillaMensaje: plantillaDe(envio.plantillaCodigo)?.mensaje,
      tipoCobranza: servicio?.tipoCobranza || "—",
      tipoMoroso: tipoMorosoDe(deuda.diasMora),
      sponsorNombre: sponsor?.razonSocial || "—",
      saldo: deuda.saldo,
      diasMora: deuda.diasMora,
      telefono: deudor.telefono,
    });
  };

  return (
    <div className="min-h-full bg-background">
      <PageHeader
        title="Entrega cobranza"
        subtitle={
          misSponsor
            ? "Reporte de las estrategias ejecutadas sobre tu cartera de morosos y la respuesta de cada uno."
            : "Reporte de las estrategias de hostigamiento ejecutadas y sus respuestas."
        }
      />

      <div className="space-y-6 p-6 lg:p-8">
        {misSponsor && (
          <div className="rounded-xl border border-border bg-card px-5 py-4 text-base text-foreground">
            Cartera propia: <span className="font-semibold">{misSponsor.razonSocial}</span>
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <KPICard title="Gestiones enviadas" value={resumen.total} icon={PhoneCall} subtitle={`Costo total ${fmtSol(resumen.gasto)}`} />
          <KPICard title="Respondieron afirmativo" value={resumen.afirmativa} icon={CheckCircle2} variant="secondary" subtitle="Van a pagar" />
          <KPICard title="Respondieron negativo" value={resumen.negativa} icon={XCircle} variant="destructive" subtitle="No pueden pagar aún" />
          <KPICard title="Sin respuesta" value={resumen.sinRespuesta} icon={HelpCircle} variant="accent" subtitle="Evaluar seguir con hostigamiento" />
        </div>

        {misEnvios.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <AlertTriangle className="mx-auto mb-3 size-9 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Aún no hay gestiones enviadas</h3>
            <p className="mt-2 text-base text-muted-foreground">
              Ve a "Reservar tickets", sube tu lista de morosos y elige una estrategia de hostigamiento para cada uno.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <DataTable
              searchPlaceholder="Buscar moroso..."
              columns={[
                { key: "deudorId", label: "Moroso", sortable: true, render: (i: EnvioCobranza) => deudorOf(i.deudorId)?.nombre || i.deudorId },
                {
                  key: "estrategiaCodigo", label: "Estrategia", sortable: true,
                  render: (i: EnvioCobranza) => estrategiaDe(i.estrategiaCodigo)?.nombre || i.estrategiaCodigo,
                },
                { key: "canalIds", label: "Canal(es)", render: (i: EnvioCobranza) => formatListaCanales(i.canalIds, canales) },
                { key: "operador", label: "Operador" },
                {
                  key: "plantillaCodigo", label: "Mensaje",
                  render: (i: EnvioCobranza) => plantillaDe(i.plantillaCodigo)?.nombre || "—",
                },
                { key: "mora", label: "Mora", render: (i: EnvioCobranza) => `${deudaOf(i.deudaId)?.diasMora ?? "—"} días` },
                {
                  key: "tipoMoroso", label: "Tipo de moroso",
                  render: (i: EnvioCobranza) => tipoMorosoDe(deudaOf(i.deudaId)?.diasMora ?? 0),
                },
                { key: "saldo", label: "Saldo", render: (i: EnvioCobranza) => fmtSol(deudaOf(i.deudaId)?.saldo ?? 0) },
                { key: "tarifa", label: "Tarifa", render: (i: EnvioCobranza) => fmtSol(i.tarifa) },
                { key: "fechaEnvio", label: "Fecha", sortable: true },
                { key: "horaEnvio", label: "Hora" },
                { key: "respuesta", label: "Respuesta", render: (i: EnvioCobranza) => respuestaBadge(i.respuesta) },
                {
                  key: "__detalle", label: "Detalle",
                  render: (i: EnvioCobranza) => (
                    <button
                      onClick={() => abrirDetalle(i)}
                      className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
                    >
                      <Eye className="size-3.5" />
                      Ver detalle
                    </button>
                  ),
                },
              ]}
              data={misEnvios}
              onRowClick={abrirDetalle}
            />
          </div>
        )}

        {resumen.sinRespuesta > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-5 text-base text-amber-800">
            <Clock className="size-5 shrink-0" />
            {resumen.sinRespuesta} moroso(s) aún no responden — considera aplicarles una estrategia más intensa desde
            "Reservar tickets".
          </div>
        )}
      </div>

      <EnvioDetalleModal data={detalle} onClose={() => setDetalle(null)} />
    </div>
  );
}
