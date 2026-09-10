import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Pencil,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  UserCircle,
  X,
} from "lucide-react";

import { PageHeader } from "../shared/PageHeader";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { cn } from "../ui/utils";

// SEG-04 — Gestión de usuarios del sistema.
// Permite registrar, consultar, modificar y activar/desactivar usuarios.
// El perfil asociado controla los módulos que puede ver el usuario.

const PERFILES = ["Administrador", "Gerencial", "Operativo", "Técnico"] as const;
type PerfilUsuario = (typeof PERFILES)[number];

const TIPOS_DOC = ["DNI", "CE", "Pasaporte"] as const;
type TipoDoc = (typeof TIPOS_DOC)[number];

type Usuario = {
  id: string;
  nombre: string;
  tipoDoc: TipoDoc;
  numDoc: string;
  email: string;
  perfil: PerfilUsuario;
  estado: "Activo" | "Inactivo";
  ultimaConexion: string;
};

const USUARIOS_SEED: Usuario[] = [
  {
    id: "USR-001",
    nombre: "Ana Quiroz Salcedo",
    tipoDoc: "DNI",
    numDoc: "40123456",
    email: "a.quiroz@cobranza.pe",
    perfil: "Administrador",
    estado: "Activo",
    ultimaConexion: "01/07/2026 08:14",
  },
  {
    id: "USR-002",
    nombre: "Carlos Mendoza Ríos",
    tipoDoc: "DNI",
    numDoc: "41890234",
    email: "c.mendoza@cobranza.pe",
    perfil: "Gerencial",
    estado: "Activo",
    ultimaConexion: "30/06/2026 17:45",
  },
  {
    id: "USR-003",
    nombre: "Patricia León Vega",
    tipoDoc: "DNI",
    numDoc: "42567190",
    email: "p.leon@cobranza.pe",
    perfil: "Gerencial",
    estado: "Activo",
    ultimaConexion: "01/07/2026 09:02",
  },
  {
    id: "USR-004",
    nombre: "Lucía Fernández Paz",
    tipoDoc: "DNI",
    numDoc: "45879632",
    email: "l.fernandez@cobranza.pe",
    perfil: "Operativo",
    estado: "Activo",
    ultimaConexion: "01/07/2026 07:58",
  },
  {
    id: "USR-005",
    nombre: "Diego Salas Quispe",
    tipoDoc: "DNI",
    numDoc: "46012885",
    email: "d.salas@cobranza.pe",
    perfil: "Operativo",
    estado: "Inactivo",
    ultimaConexion: "15/05/2026 11:30",
  },
  {
    id: "USR-006",
    nombre: "Jorge Ramírez Soto",
    tipoDoc: "DNI",
    numDoc: "43567812",
    email: "j.ramirez@cobranza.pe",
    perfil: "Técnico",
    estado: "Activo",
    ultimaConexion: "01/07/2026 06:50",
  },
];

const emptyUsuario = (): Usuario => ({
  id: "",
  nombre: "",
  tipoDoc: "DNI",
  numDoc: "",
  email: "",
  perfil: "Operativo",
  estado: "Activo",
  ultimaConexion: "—",
});

const PERFIL_COLOR: Record<PerfilUsuario, string> = {
  Administrador: "bg-foreground/10 text-foreground border-foreground/20",
  Gerencial: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
  Operativo: "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400",
  Técnico: "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400",
};

export function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>(USUARIOS_SEED);
  const [selectedId, setSelectedId] = useState<string>(USUARIOS_SEED[0].id);
  const [mode, setMode] = useState<"view" | "edit" | "create">("view");
  const [draft, setDraft] = useState<Usuario | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const selected = useMemo(
    () => usuarios.find((u) => u.id === selectedId) ?? null,
    [usuarios, selectedId],
  );

  const filteredUsuarios = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return usuarios;
    return usuarios.filter(
      (u) =>
        u.nombre.toLowerCase().includes(q) ||
        u.numDoc.includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.perfil.toLowerCase().includes(q),
    );
  }, [usuarios, searchQuery]);

  const startCreate = () => {
    setDraft(emptyUsuario());
    setPassword("");
    setMode("create");
  };

  const startEdit = () => {
    if (!selected) return;
    setDraft({ ...selected });
    setPassword("");
    setMode("edit");
  };

  const cancel = () => {
    setDraft(null);
    setMode("view");
    setShowPassword(false);
  };

  const save = () => {
    if (!draft) return;
    if (mode === "create") {
      const id = `USR-${String(usuarios.length + 1).padStart(3, "0")}`;
      const nuevo: Usuario = { ...draft, id, ultimaConexion: "—" };
      setUsuarios((prev) => [...prev, nuevo]);
      setSelectedId(id);
    } else {
      setUsuarios((prev) => prev.map((u) => (u.id === draft.id ? draft : u)));
    }
    cancel();
  };

  const toggleEstado = () => {
    if (!selected) return;
    setUsuarios((prev) =>
      prev.map((u) =>
        u.id === selected.id ? { ...u, estado: u.estado === "Activo" ? "Inactivo" : "Activo" } : u,
      ),
    );
  };

  const isEditing = mode === "edit" || mode === "create";
  const current = isEditing ? draft : selected;

  return (
    <div className="min-h-full bg-background">
      <PageHeader
        title="Gestión de usuarios"
        subtitle="Registre, consulte y administre los usuarios del sistema. El perfil asignado determina los módulos accesibles."
        actions={
          <Button onClick={startCreate} className="rounded-xl">
            <Plus className="size-4" />
            Nuevo usuario
          </Button>
        }
      />

      <div className="grid gap-6 p-6 lg:grid-cols-[320px_1fr] lg:p-8">
        {/* Lista de usuarios */}
        <Card className="border-border bg-card h-fit">
          <CardHeader className="border-b border-border/60 pb-3">
            <CardTitle className="text-base font-semibold">
              Usuarios ({usuarios.length})
            </CardTitle>
            <Input
              placeholder="Buscar por nombre, doc. o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mt-2 rounded-xl text-sm"
            />
          </CardHeader>
          <CardContent className="space-y-2 p-3">
            {filteredUsuarios.length === 0 && (
              <p className="px-1 py-4 text-center text-sm text-muted-foreground">
                Sin resultados.
              </p>
            )}
            {filteredUsuarios.map((usuario) => (
              <button
                key={usuario.id}
                onClick={() => {
                  setSelectedId(usuario.id);
                  setMode("view");
                  setDraft(null);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                  usuario.id === selectedId && !isEditing
                    ? "border-foreground/20 bg-muted/40"
                    : "border-border/60 hover:bg-muted/20",
                )}
              >
                <div className="flex size-10 items-center justify-center rounded-xl border border-border bg-background">
                  <UserCircle className="size-5 text-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{usuario.nombre}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {usuario.tipoDoc} {usuario.numDoc}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge
                    variant="outline"
                    className={cn("rounded-full text-[10px] border", PERFIL_COLOR[usuario.perfil])}
                  >
                    {usuario.perfil}
                  </Badge>
                  <Badge
                    variant={usuario.estado === "Activo" ? "secondary" : "outline"}
                    className="rounded-full text-[10px]"
                  >
                    {usuario.estado}
                  </Badge>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Detalle / edición */}
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/60">
            <CardTitle className="text-lg font-semibold">
              {mode === "create"
                ? "Nuevo usuario"
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
              <p className="text-sm text-muted-foreground">
                Seleccione un usuario para ver su detalle.
              </p>
            ) : (
              <>
                {/* Identificación */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">Identificación</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label>Código de usuario</Label>
                      {isEditing ? (
                        <Input
                          value={current.id}
                          disabled
                          placeholder="Asignado automáticamente"
                          className="rounded-xl text-muted-foreground"
                        />
                      ) : (
                        <p className="text-sm font-medium text-foreground">{current.id}</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label>Nombre completo</Label>
                      {isEditing ? (
                        <Input
                          value={current.nombre}
                          onChange={(e) => setDraft({ ...current, nombre: e.target.value })}
                          placeholder="Ej: María Torres Quispe"
                          className="rounded-xl"
                        />
                      ) : (
                        <p className="text-sm font-medium text-foreground">{current.nombre}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label>Tipo de documento</Label>
                      {isEditing ? (
                        <select
                          value={current.tipoDoc}
                          onChange={(e) =>
                            setDraft({ ...current, tipoDoc: e.target.value as TipoDoc })
                          }
                          className="flex h-9 w-full rounded-xl border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          {TIPOS_DOC.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-sm font-medium text-foreground">{current.tipoDoc}</p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label>Número de documento</Label>
                      {isEditing ? (
                        <Input
                          value={current.numDoc}
                          onChange={(e) => setDraft({ ...current, numDoc: e.target.value })}
                          placeholder="Ej: 40123456"
                          className="rounded-xl"
                          maxLength={12}
                        />
                      ) : (
                        <p className="text-sm font-medium text-foreground">{current.numDoc}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contacto y acceso */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">Contacto y acceso</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label>Correo electrónico</Label>
                      {isEditing ? (
                        <Input
                          type="email"
                          value={current.email}
                          onChange={(e) => setDraft({ ...current, email: e.target.value })}
                          placeholder="usuario@cobranza.pe"
                          className="rounded-xl"
                        />
                      ) : (
                        <p className="text-sm font-medium text-foreground">{current.email}</p>
                      )}
                    </div>
                    {mode === "create" && (
                      <div className="grid gap-2">
                        <Label>Contraseña inicial</Label>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mínimo 8 caracteres"
                            className="rounded-xl pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                        </div>
                      </div>
                    )}
                    {mode === "edit" && (
                      <div className="grid gap-2">
                        <Label>Restablecer contraseña</Label>
                        <Button variant="outline" size="sm" className="rounded-xl justify-start gap-2 h-9">
                          <KeyRound className="size-4" />
                          Enviar enlace de restablecimiento
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Perfil y estado */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">Perfil y estado</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label>Perfil asignado</Label>
                      {isEditing ? (
                        <select
                          value={current.perfil}
                          onChange={(e) =>
                            setDraft({ ...current, perfil: e.target.value as PerfilUsuario })
                          }
                          className="flex h-9 w-full rounded-xl border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          {PERFILES.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="size-4 text-muted-foreground" />
                          <span
                            className={cn(
                              "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                              PERFIL_COLOR[current.perfil as PerfilUsuario] ?? "",
                            )}
                          >
                            {current.perfil}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label>Estado</Label>
                      {isEditing ? (
                        <select
                          value={current.estado}
                          onChange={(e) =>
                            setDraft({
                              ...current,
                              estado: e.target.value as "Activo" | "Inactivo",
                            })
                          }
                          className="flex h-9 w-full rounded-xl border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="Activo">Activo</option>
                          <option value="Inactivo">Inactivo</option>
                        </select>
                      ) : (
                        <div className="flex items-center gap-2">
                          <CheckCircle2
                            className={cn(
                              "size-4",
                              current.estado === "Activo"
                                ? "text-green-500"
                                : "text-muted-foreground",
                            )}
                          />
                          <span className="text-sm font-medium text-foreground">
                            {current.estado}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Última conexión (solo vista) */}
                {!isEditing && (
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <p className="text-xs text-muted-foreground">Última conexión registrada</p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {current.ultimaConexion}
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
