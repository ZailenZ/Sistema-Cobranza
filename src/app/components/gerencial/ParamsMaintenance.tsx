import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { PageHeader } from "../shared/PageHeader";
import { DataTable } from "../shared/DataTable";
import { getCatalog, setCatalog } from "../../store/localDb";
import { ensureCatalogSeeded } from "../../store/catalogSeed";
import {
  Briefcase,
  MessageSquareText,
  Users,
  FileText,
  X,
  Save,
  Plus,
  Trash2,
  Eye,
  Pencil,
  AlertTriangle,
} from "lucide-react";

const categories = [
  { id: "servicios",  name: "Catálogo de Servicio",   icon: Briefcase,        color: "teal" },
  { id: "canales",    name: "Catálogo de Canales",    icon: MessageSquareText, color: "blue" },
  { id: "operarios",  name: "Catálogo de Operarios",  icon: Users,            color: "emerald" },
  { id: "plantillas", name: "Catálogo de Plantillas", icon: FileText,         color: "purple" },
];

const estadoOptions = ["Activo", "Inactivo"];

const serviciosData = [
  { id: 1, codigo: "SRV-001", descripcion: "Cobranza Preventiva",      condicionesEspeciales: "No", estado: "Activo" },
  { id: 2, codigo: "SRV-002", descripcion: "Cobranza Extrajudicial",   condicionesEspeciales: "No", estado: "Activo" },
  { id: 3, codigo: "SRV-003", descripcion: "Cobranza Judicial",        condicionesEspeciales: "Sí", estado: "Activo" },
  { id: 4, codigo: "SRV-004", descripcion: "Cobranza Castigada",       condicionesEspeciales: "Sí", estado: "Activo" },
];

const canalesData = [
  { id: 1, codigo: "CAN-001", nombre: "Llamada telefónica",  descripcion: "Contacto vía call center",         estado: "Activo" },
  { id: 2, codigo: "CAN-002", nombre: "SMS",                 descripcion: "Mensaje de texto automatizado",     estado: "Activo" },
  { id: 3, codigo: "CAN-003", nombre: "Correo electrónico",  descripcion: "Envío de comunicaciones por email", estado: "Activo" },
  { id: 4, codigo: "CAN-004", nombre: "WhatsApp",            descripcion: "Mensajería instantánea",            estado: "Activo" },
  { id: 5, codigo: "CAN-005", nombre: "Visita domiciliaria", descripcion: "Gestión presencial en campo",       estado: "Inactivo" },
];

const operariosData = [
  { id: 1, codigo: "OPE-001", nombre: "Gestor telefónico",   rolFuncion: "Gestor",     metaMensual: 25000, modalidadCosteo: "Sueldo Fijo", estado: "Activo" },
  { id: 2, codigo: "OPE-002", nombre: "Gestor de campo",     rolFuncion: "Gestor",     metaMensual: 18000, modalidadCosteo: "Comisión",     estado: "Activo" },
  { id: 3, codigo: "OPE-003", nombre: "Supervisor de cartera", rolFuncion: "Supervisor", metaMensual: 60000, modalidadCosteo: "Sueldo Fijo", estado: "Activo" },
];

const plantillasData = [
  { id: 1, codigo: "PLT-001", canal: "SMS",                asunto: "Recordatorio de pago", cuerpo: "Estimado cliente, su deuda vence en 3 días. Regularice para evitar recargos.",   estado: "Activo" },
  { id: 2, codigo: "PLT-002", canal: "Correo electrónico",  asunto: "Aviso de mora",         cuerpo: "Le informamos que su cuenta presenta días de atraso. Contáctenos para negociar.", estado: "Activo" },
  { id: 3, codigo: "PLT-003", canal: "WhatsApp",            asunto: "Promesa de pago",       cuerpo: "Gracias por su compromiso de pago. Le recordaremos la fecha acordada.",           estado: "Activo" },
];

const estadoBadge = (estado: string) => (
  <span
    className={`px-2 py-1 text-xs font-medium rounded-full ${
      estado === "Activo" ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
    }`}
  >
    {estado}
  </span>
);

interface FormField {
  key: string;
  label: string;
  type: "text" | "select" | "number" | "textarea";
  options?: string[];
  allowCustom?: boolean;
  optional?: boolean;
  placeholder?: string;
}

function getCategoryColumns(cat: string): any[] {
  switch (cat) {
    case "servicios":
      return [
        { key: "codigo",                label: "Código",      sortable: true },
        { key: "descripcion",           label: "Descripción", sortable: true },
        { key: "condicionesEspeciales", label: "Cond. Especiales" },
        { key: "estado",                label: "Estado",      render: (i: any) => estadoBadge(i.estado) },
      ];
    case "canales":
      return [
        { key: "codigo",      label: "Código", sortable: true },
        { key: "nombre",      label: "Nombre", sortable: true },
        { key: "descripcion", label: "Descripción" },
        { key: "estado",      label: "Estado", render: (i: any) => estadoBadge(i.estado) },
      ];
    case "operarios":
      return [
        { key: "codigo",         label: "Código", sortable: true },
        { key: "nombre",         label: "Nombre", sortable: true },
        { key: "rolFuncion",     label: "Rol/Función" },
        { key: "metaMensual",    label: "Meta Mensual (S/)", sortable: true, render: (i: any) => `S/ ${Number(i.metaMensual).toLocaleString()}` },
        { key: "modalidadCosteo",label: "Modalidad Costeo" },
        { key: "estado",         label: "Estado", render: (i: any) => estadoBadge(i.estado) },
      ];
    case "plantillas":
      return [
        { key: "codigo", label: "Código", sortable: true },
        { key: "canal",  label: "Canal" },
        { key: "asunto", label: "Asunto", sortable: true },
        { key: "cuerpo", label: "Cuerpo del Mensaje" },
        { key: "estado", label: "Estado", render: (i: any) => estadoBadge(i.estado) },
      ];
    default:
      return [];
  }
}

function getCategoryData(cat: string): any[] {
  switch (cat) {
    case "servicios":  return serviciosData;
    case "canales":    return canalesData;
    case "operarios":  return operariosData;
    case "plantillas": return plantillasData;
    default:           return [];
  }
}

function getCategoryFormFields(cat: string): FormField[] {
  switch (cat) {
    case "servicios":
      return [
        { key: "codigo",                label: "Código de Servicio",              type: "text", optional: true, placeholder: "Ej: SRV-005" },
        { key: "descripcion",           label: "Descripción",                     type: "text", placeholder: "Ej: Cobranza Preventiva" },
        { key: "condicionesEspeciales", label: "Requiere Condiciones Especiales", type: "select", options: ["No", "Sí"] },
        { key: "estado",                label: "Estado",                          type: "select", options: estadoOptions },
      ];
    case "canales":
      return [
        { key: "codigo",      label: "Código de Canal", type: "text",   optional: true, placeholder: "Ej: CAN-006" },
        { key: "nombre",      label: "Nombre",          type: "select", options: ["Llamada telefónica", "SMS", "Correo electrónico", "WhatsApp", "Visita domiciliaria"], allowCustom: true },
        { key: "descripcion", label: "Descripción",     type: "textarea", optional: true, placeholder: "Describe el canal de contacto" },
        { key: "estado",      label: "Estado",          type: "select", options: estadoOptions },
      ];
    case "operarios":
      return [
        { key: "codigo",          label: "Código de Operario",  type: "text",   optional: true, placeholder: "Ej: OPE-004" },
        { key: "nombre",          label: "Nombre / Puesto",     type: "text",   placeholder: "Ej: Gestor telefónico" },
        { key: "rolFuncion",      label: "Rol/Función",         type: "select", options: ["Gestor", "Supervisor"] },
        { key: "metaMensual",     label: "Meta Mensual (S/)",   type: "number", placeholder: "Ej: 25000" },
        { key: "modalidadCosteo", label: "Modalidad Costeo",    type: "select", options: ["Sueldo Fijo", "Comisión", "Mixto"] },
        { key: "estado",          label: "Estado",              type: "select", options: estadoOptions },
      ];
    case "plantillas":
      return [
        { key: "codigo", label: "Código de Plantilla", type: "text",   optional: true, placeholder: "Ej: PLT-004" },
        { key: "canal",  label: "Canal",                type: "select", options: ["Llamada telefónica", "SMS", "Correo electrónico", "WhatsApp", "Visita domiciliaria"] },
        { key: "asunto", label: "Asunto",               type: "text",   placeholder: "Ej: Recordatorio de pago" },
        { key: "cuerpo", label: "Cuerpo del Mensaje",   type: "textarea", placeholder: "Texto de la comunicación al deudor" },
        { key: "estado", label: "Estado",               type: "select", options: estadoOptions },
      ];
    default:
      return [];
  }
}

interface ModalProps {
  category: string;
  editingItem: any;
  onClose: () => void;
  onSave: (data: any) => void;
}

function CatalogModal({ category, editingItem, onClose, onSave }: ModalProps) {
  const fields = getCategoryFormFields(category);
  const cat = categories.find((c) => c.id === category);

  const initialState: Record<string, any> = {};
  fields.forEach((f) => {
    initialState[f.key] = editingItem ? editingItem[f.key] : (f.type === "select" && f.options ? f.options[0] : "");
  });

  const [form, setForm] = useState<Record<string, any>>(initialState);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    onSave({ ...form, id: editingItem?.id || Date.now() });
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

              {field.type === "select" ? (
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
                        <option key={opt} value={opt} />
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
                      <option key={opt} value={opt}>{opt}</option>
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
  item: any;
  onClose: () => void;
  onEdit: () => void;
}

function CatalogDetailModal({ category, item, onClose, onEdit }: DetailProps) {
  const fields = getCategoryFormFields(category);
  const cat = categories.find((c) => c.id === category);

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
                <dd className="text-sm text-foreground mt-0.5">
                  {item[field.key] === "" || item[field.key] === undefined || item[field.key] === null
                    ? "—"
                    : String(item[field.key])}
                </dd>
              </div>
            ))}
          </dl>
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
    ensureCatalogSeeded("operarios", operariosData as any[]);
    ensureCatalogSeeded("plantillas", plantillasData as any[]);
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

  const baseColumns = getCategoryColumns(selectedCategory);
  const data = getData();
  const hasForm = getCategoryFormFields(selectedCategory).length > 0;

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
              <h2 className="font-semibold text-sm">{selectedCat.name}</h2>
              <p className="text-xs opacity-70">{data.length} registro(s)</p>
            </div>
          </div>

          {columns.length === 0 ? (
            <EmptyState catName={selectedCat.name} onAdd={handleAdd} />
          ) : data.length === 0 ? (
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
          editingItem={editingItem}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

      {viewingItem && (
        <CatalogDetailModal
          category={selectedCategory}
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
