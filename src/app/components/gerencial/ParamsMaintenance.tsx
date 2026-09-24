import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { PageHeader } from "../shared/PageHeader";
import { DataTable } from "../shared/DataTable";
import { getCatalog, setCatalog } from "../../store/localDb";
import {
  AUTOMATA_SEED,
  CANALES_SEED,
  ESTRATEGIAS_SEED,
  PLANTILLAS_SEED,
  MOROSOS_SEED,
  SERVICIOS_SEED,
  ensureCatalogSeeded,
  formatCanalesFrecuencia,
  formatRangoMora,
  formatRangoSaldo,
  tipoMorosoDeServicio,
  formatDuracion,
  formatListaCanales,
  type CanalContacto,
  type CanalFrecuencia,
  type EstrategiaCobranza,
  type PlantillaMensaje,
  type ServicioCobranza,
  type TipoMoroso,
} from "../../store/catalogSeed";
import {
  Briefcase,
  UserX,
  MessageSquareText,
  FileText,
  Bot,
  Zap,
  X,
  Save,
  Plus,
  Trash2,
  Eye,
  Pencil,
  AlertTriangle,
} from "lucide-react";

const categories = [
  { id: "servicios",   name: "Catálogo de Servicio",    icon: Briefcase,         color: "teal" },
  { id: "morosos",     name: "Catálogo de Morosos",     icon: UserX,             color: "orange" },
  { id: "canales",     name: "Catálogo de Canales",     icon: MessageSquareText, color: "blue" },
  { id: "plantillas",  name: "Catálogo de Plantillas",  icon: FileText,          color: "purple" },
  { id: "estrategias", name: "Catálogo de Estrategias", icon: Zap,               color: "rose" },
  { id: "automata",    name: "Catálogo de Autómata",    icon: Bot,               color: "amber" },
];

const estadoOptions = ["Activo", "Inactivo"];

const serviciosData = SERVICIOS_SEED;
const morososData = MOROSOS_SEED;
const canalesData = CANALES_SEED;
const plantillasData = PLANTILLAS_SEED;
const estrategiasData = ESTRATEGIAS_SEED;
const automataData = AUTOMATA_SEED;

/** Catálogos vivos que necesitan las columnas/formularios para resolver referencias entre sí. */
type CatalogCtx = {
  canales: CanalContacto[];
  morosos: TipoMoroso[];
  plantillas: PlantillaMensaje[];
  servicios: ServicioCobranza[];
  estrategias: EstrategiaCobranza[];
};

const estadoBadge = (estado: string) => (
  <span
    className={`px-2 py-1 text-xs font-medium rounded-full ${
      estado === "Activo" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
    }`}
  >
    {estado}
  </span>
);

type FieldOption = string | { value: string; label: string };

interface FormField {
  key: string;
  label: string;
  type: "text" | "select" | "number" | "textarea" | "time" | "canalesFrecuencia" | "multicanal";
  options?: FieldOption[];
  allowCustom?: boolean;
  optional?: boolean;
  placeholder?: string;
  help?: string;
}

const optionValue = (o: FieldOption) => (typeof o === "string" ? o : o.value);
const optionLabel = (o: FieldOption) => (typeof o === "string" ? o : o.label);

/** Campos numéricos por catálogo: se convierten a número al guardar (vacío -> null si es opcional),
 *  para que las reglas de clasificación comparen números y no texto. */
const CAMPOS_NUMERICOS: Record<string, { key: string; nullable?: boolean }[]> = {
  morosos: [
    { key: "moraMin" },
    { key: "moraMax", nullable: true },
    { key: "saldoMin" },
    { key: "saldoMax", nullable: true },
  ],
  estrategias: [{ key: "duracionDias" }, { key: "tarifa" }],
  automata: [{ key: "capacidadMaxPorDia" }],
};

function coerceItem(category: string, data: Record<string, any>) {
  const numericos = CAMPOS_NUMERICOS[category] || [];
  const next = { ...data };
  numericos.forEach(({ key, nullable }) => {
    const raw = next[key];
    if (raw === "" || raw === undefined || raw === null) {
      next[key] = nullable ? null : 0;
      return;
    }
    const n = Number(raw);
    next[key] = Number.isNaN(n) ? (nullable ? null : 0) : n;
  });
  return next;
}

function getCategoryColumns(cat: string, ctx: CatalogCtx): any[] {
  switch (cat) {
    case "servicios":
      return [
        { key: "codigo",       label: "Código",           sortable: true },
        { key: "tipoCobranza", label: "Tipo de Cobranza", sortable: true },
        {
          key: "tipoMorosoCodigo", label: "Tipo de moroso", sortable: true,
          render: (i: any) => tipoMorosoDeServicio(i, ctx.morosos)?.nombre || "—",
        },
        { key: "__mora",  label: "Mora",  render: (i: any) => formatRangoMora(tipoMorosoDeServicio(i, ctx.morosos)) },
        { key: "__saldo", label: "Saldo", render: (i: any) => formatRangoSaldo(tipoMorosoDeServicio(i, ctx.morosos)) },
        { key: "canales",      label: "Canales y frecuencia", render: (i: any) => formatCanalesFrecuencia(i.canales, ctx.canales) },
        { key: "descripcion",  label: "Descripción", render: (i: any) => <span className="line-clamp-2 max-w-xs">{i.descripcion || "—"}</span> },
        {
          key: "__estrategias", label: "Estrategias",
          render: (i: any) => {
            const n = ctx.estrategias.filter((e) => e.tipoCobranza === i.tipoCobranza && e.estado === "Activo").length;
            return `${n} estrategia(s)`;
          },
        },
        { key: "estado",       label: "Estado", render: (i: any) => estadoBadge(i.estado) },
      ];
    case "morosos":
      return [
        { key: "codigo",      label: "Código",          sortable: true },
        { key: "nombre",      label: "Tipo de moroso",  sortable: true },
        { key: "moraMin",     label: "Mora mín. (días)" },
        { key: "moraMax",     label: "Mora máx. (días)", render: (i: any) => (i.moraMax === null || i.moraMax === "" ? "A más" : i.moraMax) },
        { key: "saldoMin",    label: "Saldo mín. (S/)",  render: (i: any) => `S/ ${Number(i.saldoMin).toLocaleString()}` },
        { key: "saldoMax",    label: "Saldo máx. (S/)",  render: (i: any) => (i.saldoMax === null || i.saldoMax === "" ? "A más" : `S/ ${Number(i.saldoMax).toLocaleString()}`) },
        {
          key: "__servicios", label: "Tipo de cobranza que le aplica",
          render: (i: any) => ctx.servicios.find((s) => s.tipoMorosoCodigo === i.codigo)?.tipoCobranza || "—",
        },
        { key: "descripcion", label: "Descripción", render: (i: any) => <span className="line-clamp-2 max-w-xs">{i.descripcion || "—"}</span> },
        { key: "estado",      label: "Estado", render: (i: any) => estadoBadge(i.estado) },
      ];
    case "morosos":
      return [
        { key: "codigo",      label: "Código",            type: "text",   optional: true, placeholder: "Ej: MOR-006" },
        { key: "nombre",      label: "Tipo de moroso",    type: "text",   placeholder: "Ej: Moroso ocasional" },
        { key: "moraMin",     label: "Mora mínima (días)", type: "number", placeholder: "Ej: 1" },
        { key: "moraMax",     label: "Mora máxima (días)", type: "number", optional: true, placeholder: "Vacío = a más" },
        { key: "saldoMin",    label: "Saldo mínimo (S/)",  type: "number", placeholder: "Ej: 500" },
        { key: "saldoMax",    label: "Saldo máximo (S/)",  type: "number", optional: true, placeholder: "Vacío = a más" },
        { key: "descripcion", label: "Descripción", type: "textarea", optional: true, placeholder: "Describe a este tipo de moroso" },
        { key: "estado",      label: "Estado",      type: "select", options: estadoOptions },
      ];
    case "canales":
      return [
        { key: "codigo",      label: "Código", sortable: true },
        { key: "nombre",      label: "Canal",  sortable: true },
        { key: "tipoCanal",   label: "Tipo de Canal" },
        { key: "horaInicio",  label: "Hora inicio" },
        { key: "horaFin",     label: "Hora fin" },
        { key: "descripcion", label: "Descripción", render: (i: any) => <span className="line-clamp-2 max-w-xs">{i.descripcion || "—"}</span> },
        { key: "estado",      label: "Estado", render: (i: any) => estadoBadge(i.estado) },
      ];
    case "plantillas":
      return [
        { key: "codigo",      label: "Código",          sortable: true },
        { key: "nombre",      label: "Tipo de mensaje", sortable: true },
        { key: "descripcion", label: "Descripción", render: (i: any) => <span className="line-clamp-2 max-w-xs">{i.descripcion || "—"}</span> },
        { key: "mensaje",     label: "Mensaje", render: (i: any) => <span className="line-clamp-2 max-w-md">{i.mensaje}</span> },
        { key: "estado",      label: "Estado", render: (i: any) => estadoBadge(i.estado) },
      ];
    case "estrategias":
      return [
        { key: "codigo",       label: "Código",            sortable: true },
        { key: "nombre",       label: "Estrategia",        sortable: true },
        { key: "tipoCobranza", label: "Tipo de Cobranza",  sortable: true },
        { key: "canalCodigos", label: "Canal(es) utilizado(s)", render: (i: any) => formatListaCanales(i.canalCodigos, ctx.canales) },
        {
          key: "plantillaCodigo", label: "Tipo de mensaje",
          render: (i: any) => ctx.plantillas.find((p) => p.codigo === i.plantillaCodigo)?.nombre || "—",
        },
        { key: "duracionDias", label: "Duración",  render: (i: any) => formatDuracion(Number(i.duracionDias)) },
        { key: "tarifa",       label: "Tarifa (S/)", sortable: true, render: (i: any) => `S/ ${Number(i.tarifa).toLocaleString()}` },
        { key: "descripcion",  label: "Descripción", render: (i: any) => <span className="line-clamp-2 max-w-xs">{i.descripcion || "—"}</span> },
        { key: "estado",       label: "Estado", render: (i: any) => estadoBadge(i.estado) },
      ];
    case "automata":
      return [
        { key: "codigo",             label: "Código", sortable: true },
        { key: "nombre",             label: "Autómata", sortable: true },
        { key: "capacidadMaxPorDia", label: "Capacidad máx. por día", render: (i: any) => Number(i.capacidadMaxPorDia || 0).toLocaleString() },
        { key: "descripcion",        label: "Descripción", render: (i: any) => <span className="line-clamp-2 max-w-xs">{i.descripcion || "—"}</span> },
        { key: "estado",             label: "Estado", render: (i: any) => estadoBadge(i.estado) },
      ];
    default:
      return [];
  }
}

function getCategoryData(cat: string): any[] {
  switch (cat) {
    case "servicios":   return serviciosData;
    case "morosos":     return morososData;
    case "canales":     return canalesData;
    case "plantillas":  return plantillasData;
    case "estrategias": return estrategiasData;
    case "automata":    return automataData;
    default:            return [];
  }
}

function getCategoryFormFields(cat: string, ctx: CatalogCtx): FormField[] {
  const canalNombreOptions = ctx.canales.map((c) => c.nombre);
  const tipoCobranzaOptions = ctx.servicios.map((s) => s.tipoCobranza);
  const plantillaOptions: FieldOption[] = ctx.plantillas.map((p) => ({ value: p.codigo, label: p.nombre }));
  const tipoMorosoOptions: FieldOption[] = ctx.morosos.map((m) => ({ value: m.codigo, label: `${m.nombre} (${m.codigo})` }));

  switch (cat) {
    case "servicios":
      return [
        { key: "codigo",       label: "Código de Servicio", type: "text",   optional: true, placeholder: "Ej: SRV-006" },
        { key: "tipoCobranza", label: "Tipo de Cobranza",   type: "text",   placeholder: "Ej: Cobranza temprana" },
        {
          key: "tipoMorosoCodigo",
          label: "Tipo de moroso",
          type: "select",
          options: tipoMorosoOptions,
          help: "Los rangos de mora y de saldo de este servicio salen del tipo de moroso elegido (Catálogo de Morosos).",
        },
        {
          key: "canales",
          label: "Canales y frecuencia",
          type: "canalesFrecuencia",
          help: "Marca los canales que usa este tipo de cobranza e indica cuántos mensajes se envían al día por cada uno.",
        },
        { key: "descripcion",  label: "Descripción", type: "textarea", optional: true, placeholder: "Describe el criterio de gestión" },
        { key: "estado",       label: "Estado",      type: "select", options: estadoOptions },
      ];
    case "canales":
      return [
        { key: "codigo",      label: "Código de Canal", type: "text",   optional: true, placeholder: "Ej: CAN-007" },
        { key: "nombre",      label: "Nombre",          type: "select", options: canalNombreOptions, allowCustom: true },
        { key: "tipoCanal",   label: "Tipo de Canal",   type: "select", options: ["Digital", "Físico"] },
        { key: "horaInicio",  label: "Hora de inicio",  type: "time",   help: "Horario diario en el que se permite contactar por este canal." },
        { key: "horaFin",     label: "Hora final",      type: "time" },
        { key: "descripcion", label: "Descripción",     type: "textarea", optional: true, placeholder: "Para qué sirve este canal" },
        { key: "estado",      label: "Estado",          type: "select", options: estadoOptions },
      ];
    case "plantillas":
      return [
        { key: "codigo",      label: "Código de Plantilla", type: "text",   optional: true, placeholder: "Ej: PLT-008" },
        { key: "nombre",      label: "Tipo de mensaje",     type: "text",   placeholder: "Ej: Amistoso, Recordatorio, Ultimátum" },
        { key: "descripcion", label: "Descripción",         type: "textarea", optional: true, placeholder: "Cuándo conviene usar este tipo de mensaje" },
        { key: "mensaje",     label: "Mensaje",             type: "textarea", placeholder: "Texto a enviar. Usa {nombre}, {saldo}, {mora} y {sponsor}." },
        { key: "estado",      label: "Estado",              type: "select", options: estadoOptions },
      ];
    case "estrategias":
      return [
        { key: "codigo",          label: "Código de Estrategia", type: "text",   optional: true, placeholder: "Ej: EST-13" },
        { key: "nombre",          label: "Estrategia",           type: "text",   placeholder: "Ej: Estrategia 12" },
        { key: "tipoCobranza",    label: "Tipo de Cobranza",     type: "select", options: tipoCobranzaOptions },
        { key: "canalCodigos",    label: "Canal(es) utilizado(s)", type: "multicanal", help: "Una estrategia puede hostigar por varios canales a la vez." },
        { key: "plantillaCodigo", label: "Tipo de mensaje",      type: "select", options: plantillaOptions },
        { key: "duracionDias",    label: "Duración (días)",      type: "number", placeholder: "Ej: 1.5" },
        { key: "tarifa",          label: "Tarifa (S/)",          type: "number", placeholder: "Ej: 5" },
        { key: "descripcion",     label: "Descripción",          type: "textarea", optional: true, placeholder: "En qué consiste esta estrategia" },
        { key: "estado",          label: "Estado",               type: "select", options: estadoOptions },
      ];
    case "automata":
      return [
        { key: "codigo",             label: "Código de Autómata",         type: "text",   optional: true, placeholder: "Ej: AUT-007" },
        { key: "nombre",             label: "Autómata",                   type: "text",   placeholder: "Ej: Autómata de SMS" },
        { key: "capacidadMaxPorDia", label: "Capacidad máx. por día",     type: "number", placeholder: "Ej: 2500" },
        { key: "descripcion",        label: "Descripción",                type: "textarea", optional: true, placeholder: "Qué envía este autómata" },
        { key: "estado",             label: "Estado",                     type: "select", options: estadoOptions },
      ];
    default:
      return [];
  }
}

/** Texto legible de un valor para la vista de detalle (maneja los campos estructurados). */
function formatFieldValue(field: FormField, item: any, ctx: CatalogCtx) {
  const raw = item[field.key];
  if (field.type === "canalesFrecuencia") return formatCanalesFrecuencia(raw, ctx.canales);
  if (field.type === "multicanal") return formatListaCanales(raw, ctx.canales);
  if (field.key === "plantillaCodigo") return ctx.plantillas.find((p) => p.codigo === raw)?.nombre || "—";
  if (raw === "" || raw === undefined || raw === null) return "—";
  return String(raw);
}

/** Editor de "canales y frecuencia": un check por canal y, si está marcado, sus mensajes por día. */
function CanalesFrecuenciaEditor({
  value,
  canales,
  onChange,
}: {
  value: CanalFrecuencia[];
  canales: CanalContacto[];
  onChange: (next: CanalFrecuencia[]) => void;
}) {
  const seleccionados = new Map((value || []).map((c) => [c.canalCodigo, c.vecesPorDia]));

  const toggle = (codigo: string, on: boolean) => {
    if (on) onChange([...(value || []), { canalCodigo: codigo, vecesPorDia: 1 }]);
    else onChange((value || []).filter((c) => c.canalCodigo !== codigo));
  };

  const setVeces = (codigo: string, veces: number) =>
    onChange((value || []).map((c) => (c.canalCodigo === codigo ? { ...c, vecesPorDia: veces } : c)));

  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      {canales.map((canal) => {
        const activo = seleccionados.has(canal.codigo);
        return (
          <div key={canal.codigo} className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input type="checkbox" checked={activo} onChange={(e) => toggle(canal.codigo, e.target.checked)} />
              {canal.nombre}
              {canal.estado !== "Activo" && <span className="text-xs text-muted-foreground">(inactivo)</span>}
            </label>
            {activo && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={seleccionados.get(canal.codigo) ?? 1}
                  onChange={(e) => setVeces(canal.codigo, Number(e.target.value) || 1)}
                  className="w-20 rounded-lg border border-border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <span className="text-xs text-muted-foreground">mensajes/día</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Selección múltiple de canales (para una estrategia). */
function MulticanalEditor({
  value,
  canales,
  onChange,
}: {
  value: string[];
  canales: CanalContacto[];
  onChange: (next: string[]) => void;
}) {
  const seleccionados = new Set(value || []);
  const toggle = (codigo: string, on: boolean) => {
    const next = new Set(seleccionados);
    if (on) next.add(codigo);
    else next.delete(codigo);
    onChange(canales.filter((c) => next.has(c.codigo)).map((c) => c.codigo));
  };

  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      {canales.map((canal) => (
        <label key={canal.codigo} className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={seleccionados.has(canal.codigo)}
            onChange={(e) => toggle(canal.codigo, e.target.checked)}
          />
          {canal.nombre}
          {canal.estado !== "Activo" && <span className="text-xs text-muted-foreground">(inactivo)</span>}
        </label>
      ))}
    </div>
  );
}

interface ModalProps {
  category: string;
  ctx: CatalogCtx;
  editingItem: any;
  onClose: () => void;
  onSave: (data: any) => void;
}

function CatalogModal({ category, ctx, editingItem, onClose, onSave }: ModalProps) {
  const fields = getCategoryFormFields(category, ctx);
  const cat = categories.find((c) => c.id === category);

  const initialState: Record<string, any> = {};
  fields.forEach((f) => {
    if (editingItem) {
      initialState[f.key] = editingItem[f.key];
      return;
    }
    if (f.type === "canalesFrecuencia" || f.type === "multicanal") initialState[f.key] = [];
    else if (f.type === "select" && f.options?.length) initialState[f.key] = optionValue(f.options[0]);
    else initialState[f.key] = "";
  });

  const [form, setForm] = useState<Record<string, any>>(initialState);

  const handleChange = (key: string, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    onSave(coerceItem(category, { ...form, id: editingItem?.id || Date.now() }));
  };

  if (fields.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {editingItem ? "Editar" : "Nuevo"} — {cat?.name}
            </h3>
            <p className="text-sm text-muted-foreground">Complete los campos del registro</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="scrollbar-modern overflow-y-auto px-6 py-4 space-y-4 flex-1">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-foreground mb-1">{field.label}</label>
              {field.help && <p className="mb-2 text-xs text-muted-foreground">{field.help}</p>}

              {field.type === "canalesFrecuencia" ? (
                <CanalesFrecuenciaEditor
                  value={form[field.key] || []}
                  canales={ctx.canales}
                  onChange={(next) => handleChange(field.key, next)}
                />
              ) : field.type === "multicanal" ? (
                <MulticanalEditor
                  value={form[field.key] || []}
                  canales={ctx.canales}
                  onChange={(next) => handleChange(field.key, next)}
                />
              ) : field.type === "select" ? (
                field.allowCustom ? (
                  <>
                    <input
                      list={`${category}-${field.key}-list`}
                      value={form[field.key] ?? ""}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <datalist id={`${category}-${field.key}-list`}>
                      {field.options?.map((opt) => (
                        <option key={optionValue(opt)} value={optionValue(opt)} />
                      ))}
                    </datalist>
                  </>
                ) : (
                  <select
                    value={form[field.key] ?? ""}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {field.options?.map((opt) => (
                      <option key={optionValue(opt)} value={optionValue(opt)}>
                        {optionLabel(opt)}
                      </option>
                    ))}
                  </select>
                )
              ) : field.type === "textarea" ? (
                <textarea
                  value={form[field.key] ?? ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              ) : (
                <input
                  type={field.type}
                  step={field.key === "duracionDias" ? "0.5" : undefined}
                  value={form[field.key] ?? ""}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Save className="w-4 h-4" />
            {editingItem ? "Guardar Cambios" : "Registrar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ catName, onAdd }: { catName: string; onAdd: () => void }) {
  return (
    <div className="bg-card rounded-xl shadow-sm border border-border flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center">
        <Plus className="w-8 h-8 text-muted-foreground" />
      </div>
      <div className="text-center">
        <p className="text-foreground font-semibold">No hay registros en {catName}</p>
        <p className="text-muted-foreground text-sm mt-1">Agrega el primer elemento para comenzar.</p>
      </div>
      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Agregar Registro
      </button>
    </div>
  );
}

interface DetailProps {
  category: string;
  ctx: CatalogCtx;
  item: any;
  onClose: () => void;
  onEdit: () => void;
}

function CatalogDetailModal({ category, ctx, item, onClose, onEdit }: DetailProps) {
  const fields = getCategoryFormFields(category, ctx);
  const cat = categories.find((c) => c.id === category);

  // En un servicio, muestra también qué estrategias de hostigamiento tiene disponibles.
  const estrategiasDelServicio =
    category === "servicios"
      ? ctx.estrategias.filter((e) => e.tipoCobranza === item.tipoCobranza)
      : [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="text-lg font-bold text-foreground">Detalle — {cat?.name}</h3>
            <p className="text-sm text-muted-foreground">Vista de solo lectura del registro</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="scrollbar-modern overflow-y-auto px-6 py-4 flex-1">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {fields.map((field) => (
              <div key={field.key} className="border-b border-border/60 py-1">
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{field.label}</dt>
                <dd className="text-sm text-foreground mt-0.5">{formatFieldValue(field, item, ctx)}</dd>
              </div>
            ))}
          </dl>

          {category === "servicios" && (
            <div className="mt-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Estrategias de hostigamiento disponibles
              </p>
              {estrategiasDelServicio.length === 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  Ninguna. Crea estrategias en el Catálogo de Estrategias para este tipo de cobranza.
                </p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {estrategiasDelServicio.map((e) => (
                    <li key={e.codigo} className="rounded-lg border border-border/60 px-3 py-2 text-sm">
                      <span className="font-medium text-foreground">{e.codigo} · {e.nombre}</span>{" "}
                      <span className="text-muted-foreground">
                        — {formatListaCanales(e.canalCodigos, ctx.canales)} ·{" "}
                        {ctx.plantillas.find((p) => p.codigo === e.plantillaCodigo)?.nombre || "—"} ·{" "}
                        {formatDuracion(Number(e.duracionDias))} · S/ {Number(e.tarifa).toLocaleString()}
                        {e.estado !== "Activo" && " · (inactiva)"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            Editar
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({
  catName,
  onCancel,
  onConfirm,
}: {
  catName: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-rose-50">
            <AlertTriangle className="size-5 text-rose-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Eliminar registro</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              ¿Confirma eliminar este registro de {catName}? Esta acción no se puede deshacer.
            </p>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

export function ParamsMaintenance() {
  const { category } = useParams();
  const [selectedCategory, setSelectedCategory] = useState("servicios");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [deletingItem, setDeletingItem] = useState<any>(null);
  const [localData, setLocalData] = useState<Record<string, any[]>>({});

  useEffect(() => {
    // Seed core catalogs once (only if localStorage is empty for that catalog)
    ensureCatalogSeeded("servicios", serviciosData as any[]);
    ensureCatalogSeeded("canales", canalesData as any[]);
    ensureCatalogSeeded("plantillas", plantillasData as any[]);
    ensureCatalogSeeded("estrategias", estrategiasData as any[]);
    ensureCatalogSeeded("automata", automataData as any[]);
  }, []);

  useEffect(() => {
    if (!category) {
      setSelectedCategory("servicios");
      return;
    }
    const exists = categories.some((c) => c.id === category);
    setSelectedCategory(exists ? category : "servicios");
  }, [category]);

  useEffect(() => {
    // Lista unificada por catálogo: usa lo almacenado o, si está vacío, la data semilla.
    const next: Record<string, any[]> = {};
    categories.forEach((c) => {
      const stored = getCatalog(c.id as any, []);
      next[c.id] = stored.length ? stored : getCategoryData(c.id);
    });
    setLocalData(next);
  }, []);

  const ctx: CatalogCtx = useMemo(
    () => ({
      canales: (localData["canales"] || canalesData) as CanalContacto[],
      morosos: (localData["morosos"] || morososData) as TipoMoroso[],
      plantillas: (localData["plantillas"] || plantillasData) as PlantillaMensaje[],
      servicios: (localData["servicios"] || serviciosData) as ServicioCobranza[],
      estrategias: (localData["estrategias"] || estrategiasData) as EstrategiaCobranza[],
    }),
    [localData],
  );

  const selectedCat = categories.find((c) => c.id === selectedCategory)!;
  const IconComponent = selectedCat.icon;

  const summaryCardClass = "bg-muted text-foreground border-border";

  const getData = () => localData[selectedCategory] || [];

  const handleAdd = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleEdit = (item: any) => {
    setViewingItem(null);
    setEditingItem(item);
    setShowModal(true);
  };

  const handleView = (item: any) => setViewingItem(item);

  const handleSave = (data: any) => {
    setLocalData((prev) => {
      const existing = prev[selectedCategory] || [];
      const nextItems = editingItem
        ? existing.map((i) => (i.id === data.id ? data : i))
        : [...existing, data];

      setCatalog(selectedCategory as any, nextItems);
      return { ...prev, [selectedCategory]: nextItems };
    });
    setShowModal(false);
  };

  const confirmDelete = () => {
    if (!deletingItem) return;
    setLocalData((prev) => {
      const existing = prev[selectedCategory] || [];
      const nextItems = existing.filter((i) => i.id !== deletingItem.id);
      setCatalog(selectedCategory as any, nextItems);
      return { ...prev, [selectedCategory]: nextItems };
    });
    setDeletingItem(null);
  };

  const baseColumns = getCategoryColumns(selectedCategory, ctx);
  const data = getData();
  const hasForm = getCategoryFormFields(selectedCategory, ctx).length > 0;

  const actionsColumn = {
    key: "__acciones",
    label: "Acciones",
    render: (item: any) => (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <button
          title="Ver detalle"
          onClick={() => handleView(item)}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Eye className="size-4" />
        </button>
        <button
          title="Editar"
          onClick={() => handleEdit(item)}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Pencil className="size-4" />
        </button>
        <button
          title="Eliminar"
          onClick={() => setDeletingItem(item)}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 transition-colors"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    ),
  };

  const columns = hasForm ? [...baseColumns, actionsColumn] : baseColumns;

  return (
    <div className="min-h-full bg-background">
      <PageHeader
        title="Mantenimiento de Parámetros"
        subtitle="Configure los catálogos maestros del sistema de cobranza"
      />

      <div className="p-8">
        <div className="min-w-0">
          <div className={`flex items-center gap-3 mb-4 px-4 py-3 rounded-xl border ${summaryCardClass}`}>
            <div className="w-8 h-8 flex items-center justify-center">
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-base">{selectedCat.name}</h2>
              <p className="text-sm opacity-70">{data.length} registro(s)</p>
            </div>
          </div>

          {columns.length === 0 || data.length === 0 ? (
            <EmptyState catName={selectedCat.name} onAdd={handleAdd} />
          ) : (
            <DataTable
              columns={columns}
              data={data}
              onRowClick={hasForm ? handleView : undefined}
              onAdd={hasForm ? handleAdd : undefined}
              onExport={() => {}}
              searchPlaceholder={`Buscar en ${selectedCat.name}...`}
              title={selectedCat.name}
            />
          )}
        </div>
      </div>

      {showModal && (
        <CatalogModal
          category={selectedCategory}
          ctx={ctx}
          editingItem={editingItem}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

      {viewingItem && (
        <CatalogDetailModal
          category={selectedCategory}
          ctx={ctx}
          item={viewingItem}
          onClose={() => setViewingItem(null)}
          onEdit={() => handleEdit(viewingItem)}
        />
      )}

      {deletingItem && (
        <ConfirmDeleteModal
          catName={selectedCat.name}
          onCancel={() => setDeletingItem(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
