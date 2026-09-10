import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  UserCircle,
  Users,
  X,
} from "lucide-react";

import { PageHeader } from "../shared/PageHeader";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { cn } from "../ui/utils";

// SEG-03 — Gestión de perfiles y permisos.
// El rol está asociado al usuario; aquí se administran los perfiles, los módulos
// permitidos por perfil y los usuarios asociados. No permite que el usuario final
// elija libremente su rol.

const MODULOS = [
  { key: "seguridad", label: "Seguridad" },
  { key: "parametros", label: "Mantenimiento de parámetros" },
  { key: "consultas", label: "Consultas gerenciales" },
  { key: "operativo", label: "Operativo / Data-Entry" },
  { key: "reportes", label: "Reportes operativos" },
  { key: "tecnico", label: "Técnico / Batch" },
] as const;

type ModuloKey = (typeof MODULOS)[number]["key"];

type Perfil = {
  id: string;
  nombre: string;
  descripcion: string;
  estado: "Activo" | "Inactivo";
  modulos: ModuloKey[];
  usuarios: { nombre: string; documento: string }[];
};

const PERFILES_SEED: Perfil[] = [
  {
    id: "PRF-ADM",
    nombre: "Administrador",
    descripcion: "Seguridad, catálogos, parámetros, protocolos y control técnico.",
    estado: "Activo",
    modulos: ["seguridad", "parametros", "consultas", "operativo", "reportes", "tecnico"],
    usuarios: [{ nombre: "Ana Quiroz Salcedo", documento: "DNI 40123456" }],
  },
  {
    id: "PRF-GER",
    nombre: "Gerencial",
    descripcion: "Consultas, gráficas, indicadores y estadísticas de cartera. Sin transacciones operativas.",
    estado: "Activo",
    modulos: ["parametros", "consultas"],
    usuarios: [
      { nombre: "Carlos Mendoza Ríos", documento: "DNI 41890234" },
      { nombre: "Patricia León Vega", documento: "DNI 42567190" },
    ],
  },
  {
    id: "PRF-OPE",
    nombre: "Operativo",
    descripcion: "Reserva/asignación de tickets de gestión, registro de entrega de cobranza y reportes.",
    estado: "Activo",
    modulos: ["operativo", "reportes"],
    usuarios: [
      { nombre: "Lucía Fernández Paz", documento: "DNI 45879632" },
      { nombre: "Diego Salas Quispe", documento: "DNI 46012885" },
    ],
  },
  {
    id: "PRF-TEC",
    nombre: "Técnico",
    descripcion: "Monitoreo Batch, backup y mantenimiento de base de datos.",
    estado: "Activo",
    modulos: ["tecnico"],
    usuarios: [{ nombre: "Jorge Ramírez Soto", documento: "DNI 43567812" }],
  },
];

const emptyPerfil = (): Perfil => ({
  id: "",
  nombre: "",
  descripcion: "",
  estado: "Activo",
  modulos: [],
  usuarios: [],
});

export function PerfilesPermisos() {
  const [perfiles, setPerfiles] = useState<Perfil[]>(PERFILES_SEED);
  const [selectedId, setSelectedId] = useState<string>(PERFILES_SEED[0].id);
  const [mode, setMode] = useState<"view" | "edit" | "create">("view");
  const [draft, setDraft] = useState<Perfil | null>(null);

  const selected = useMemo(
    () => perfiles.find((p) => p.id === selectedId) ?? null,
    [perfiles, selectedId],
  );

  const startCreate = () => {
    setDraft(emptyPerfil());
    setMode("create");
  };

  const startEdit = () => {
    if (!selected) return;
    setDraft({ ...selected, modulos: [...selected.modulos], usuarios: [...selected.usuarios] });
    setMode("edit");
  };

  const cancel = () => {
    setDraft(null);
    setMode("view");
  };

  const toggleModulo = (key: ModuloKey) => {
    if (!draft) return;
    setDraft({
      ...draft,
      modulos: draft.modulos.includes(key)
        ? draft.modulos.filter((m) => m !== key)
        : [...draft.modulos, key],
    });
  };

  const save = () => {
    if (!draft) return;
    if (mode === "create") {
      const id = draft.id.trim() || `PRF-${Date.now()}`;
      const nuevo = { ...draft, id };
      setPerfiles((prev) => [...prev, nuevo]);
      setSelectedId(id);
    } else {
      setPerfiles((prev) => prev.map((p) => (p.id === draft.id ? draft : p)));
    }
    cancel();
  };

  const toggleEstado = () => {
    if (!selected) return;
    setPerfiles((prev) =>
      prev.map((p) =>
        p.id === selected.id ? { ...p, estado: p.estado === "Activo" ? "Inactivo" : "Activo" } : p,
      ),
    );
  };

  const isEditing = mode === "edit" || mode === "create";
  const current = isEditing ? draft : selected;

  return (
    <div className="min-h-full bg-background">
      <PageHeader
        title="Gestión de perfiles y permisos"
        subtitle="Administre perfiles, módulos permitidos y usuarios asociados. El rol está asociado al usuario."
        actions={
          <Button onClick={startCreate} className="rounded-xl">
            <Plus className="size-4" />
            Agregar perfil
          </Button>
        }
      />

      <div className="grid gap-6 p-6 lg:grid-cols-[320px_1fr] lg:p-8">
        {/* Lista de perfiles */}
        <Card className="border-border bg-card h-fit">
          <CardHeader className="border-b border-border/60">
            <CardTitle className="text-base font-semibold">Perfiles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-3">
            {perfiles.map((perfil) => (
              <button
                key={perfil.id}
                onClick={() => {
                  setSelectedId(perfil.id);
                  setMode("view");
                  setDraft(null);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                  perfil.id === selectedId && !isEditing
                    ? "border-foreground/20 bg-muted/40"
                    : "border-border/60 hover:bg-muted/20",
                )}
              >
                <div className="flex size-10 items-center justify-center rounded-xl border border-border bg-background">
                  <ShieldCheck className="size-5 text-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{perfil.nombre}</p>
                  <p className="text-xs text-muted-foreground">{perfil.usuarios.length} usuario(s)</p>
                </div>
                <Badge
                  variant={perfil.estado === "Activo" ? "secondary" : "outline"}
                  className="rounded-full text-[10px]"
                >
                  {perfil.estado}
                </Badge>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Detalle / edición */}
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/60">
            <CardTitle className="text-lg font-semibold">
              {mode === "create"
                ? "Nuevo perfil"
                : mode === "edit"
                ? `Editar — ${current?.nombre || ""}`
                : `Detalle — ${current?.nombre || ""}`}
            </CardTitle>
            <div className="flex items-center gap-2">
              {!isEditing && selected && (
                <>
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={startEdit}>
                    <Pencil className="size-4" />
                    Modificar
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={toggleEstado}>
                    <Trash2 className="size-4" />
                    {selected.estado === "Activo" ? "Desactivar" : "Activar"}
                  </Button>
                </>
              )}
              {isEditing && (
                <>
                  <Button variant="ghost" size="sm" className="rounded-xl" onClick={cancel}>
                    <X className="size-4" />
                    Cancelar
                  </Button>
                  <Button size="sm" className="rounded-xl" onClick={save}>
                    <Save className="size-4" />
                    Guardar
                  </Button>
                </>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6 p-6">
            {!current ? (
              <p className="text-sm text-muted-foreground">Seleccione un perfil para ver su detalle.</p>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Código de perfil</Label>
                    {isEditing ? (
                      <Input
                        value={current.id}
                        onChange={(e) => setDraft({ ...current, id: e.target.value })}
                        placeholder="Ej: PRF-005"
                        disabled={mode === "edit"}
                        className="rounded-xl"
                      />
                    ) : (
                      <p className="text-sm font-medium text-foreground">{current.id}</p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label>Nombre</Label>
                    {isEditing ? (
                      <Input
                        value={current.nombre}
                        onChange={(e) => setDraft({ ...current, nombre: e.target.value })}
                        placeholder="Ej: Supervisor de flota"
                        className="rounded-xl"
                      />
                    ) : (
                      <p className="text-sm font-medium text-foreground">{current.nombre}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Descripción</Label>
                  {isEditing ? (
                    <Input
                      value={current.descripcion}
                      onChange={(e) => setDraft({ ...current, descripcion: e.target.value })}
                      placeholder="Describe el alcance del perfil"
                      className="rounded-xl"
                    />
                  ) : (
                    <p className="text-sm leading-6 text-muted-foreground">{current.descripcion}</p>
                  )}
                </div>

                {/* Módulos permitidos */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">Módulos permitidos</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {MODULOS.map((modulo) => {
                      const enabled = current.modulos.includes(modulo.key);
                      return (
                        <Label
                          key={modulo.key}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border p-3 text-sm",
                            isEditing ? "cursor-pointer" : "cursor-default",
                            enabled ? "border-foreground/20 bg-muted/30" : "border-border/60",
                          )}
                        >
                          {isEditing ? (
                            <Checkbox
                              checked={enabled}
                              onCheckedChange={() => toggleModulo(modulo.key)}
                            />
                          ) : enabled ? (
                            <CheckCircle2 className="size-4 text-foreground" />
                          ) : (
                            <span className="size-4 rounded-full border border-border" />
                          )}
                          <span className={enabled ? "text-foreground" : "text-muted-foreground"}>
                            {modulo.label}
                          </span>
                        </Label>
                      );
                    })}
                  </div>
                </div>

                {/* Usuarios asociados */}
                <div className="space-y-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Users className="size-4" />
                    Usuarios asociados
                  </p>
                  {current.usuarios.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin usuarios asociados a este perfil.</p>
                  ) : (
                    <div className="divide-y divide-border/60 rounded-xl border border-border/60">
                      {current.usuarios.map((usuario) => (
                        <div key={usuario.documento} className="flex items-center gap-3 p-3">
                          <div className="flex size-9 items-center justify-center rounded-full bg-muted">
                            <UserCircle className="size-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{usuario.nombre}</p>
                            <p className="text-xs text-muted-foreground">{usuario.documento}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
