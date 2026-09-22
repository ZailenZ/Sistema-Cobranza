import { Bell, Check, ChevronsUpDown, RotateCcw, Search, Settings, User } from "lucide-react";
import { useLocation } from "react-router";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { resetPrototipo } from "../../store/localDb";
import {
  getCurrentUser,
  MOCK_USERS,
  ROLE_LABEL,
  ROLES,
  setCurrentRole,
  useCurrentRole,
} from "../../store/session";

function getSectionLabel(pathname: string) {
  if (pathname.startsWith("/gerencial")) return "Gerencial";
  if (pathname.startsWith("/operativo")) return "Operativo";
  if (pathname.startsWith("/seguridad")) return "Seguridad";
  if (pathname.startsWith("/tecnico")) return "Técnico";
  return "Acceso";
}

export function Header() {
  const location = useLocation();
  const role = useCurrentRole();
  const user = getCurrentUser();
  const sectionLabel = getSectionLabel(location.pathname);

  return (
    <header className="border-b border-border bg-card/60 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between px-6">
        <div className="flex flex-1 items-center gap-4">
          <Badge
            variant="outline"
            className="hidden rounded-md border-border bg-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground lg:inline-flex"
          >
            {sectionLabel}
          </Badge>

          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar deudores, sponsors o tickets"
              className="h-9 rounded-lg border-border bg-card pl-10 pr-4 shadow-none"
            />
          </div>
        </div>

        <div className="ml-6 flex items-center gap-2">
          {role === "Administrador" && (
            <AlertDialog>
              {/* Sin `asChild`: el trigger ya renderiza un <button>, y envolver otro provoca
                  el warning de refs de Radix (SlotClone) sin aportar nada. */}
              <AlertDialogTrigger className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-destructive/30 px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">
                <RotateCcw className="size-4" />
                Resetear prototipo
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Resetear el prototipo?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esto borra todos los datos simulados (sponsors, morosos, deudas, tickets, envíos y
                    catálogos editados) y los vuelve a sembrar desde cero, tal como al primer uso. Esta
                    acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => {
                      resetPrototipo();
                      window.location.href = window.location.pathname;
                    }}
                  >
                    Sí, resetear
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-lg hover:bg-muted"
          >
            <Bell className="size-4 text-muted-foreground" />
            <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg hover:bg-muted"
          >
            <Settings className="size-4 text-muted-foreground" />
          </Button>

          {/* Selector de perfil — MODO DEMO (solo navegación del prototipo) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-2 flex items-center gap-3 rounded-lg border border-border bg-card py-1 pl-1 pr-3 transition-colors hover:bg-muted">
                <div className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                  <User className="size-5" />
                </div>
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-semibold leading-tight text-foreground">{user.nombre}</p>
                  <p className="text-xs leading-tight text-muted-foreground">{ROLE_LABEL[role]}</p>
                </div>
                <ChevronsUpDown className="size-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel className="flex items-center justify-between gap-2">
                <span>Perfil de sesión</span>
                <Badge variant="secondary" className="rounded-full text-[10px] uppercase tracking-wide">
                  Modo demo
                </Badge>
              </DropdownMenuLabel>
              <p className="px-2 pb-1 text-xs leading-5 text-muted-foreground">
                El rol está asociado al usuario. Este selector solo cambia el perfil para recorrer el prototipo.
              </p>
              <DropdownMenuSeparator />
              {ROLES.map((r) => {
                const u = MOCK_USERS[r];
                const active = r === role;
                return (
                  <DropdownMenuItem
                    key={r}
                    onClick={() => setCurrentRole(r)}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{ROLE_LABEL[r]}</p>
                      <p className="truncate text-xs text-muted-foreground">{u.nombre} · {u.cargo}</p>
                    </div>
                    {active && <Check className="size-4 shrink-0" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
