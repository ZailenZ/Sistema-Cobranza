import { useSyncExternalStore } from "react";

// ---------------------------------------------------------------------------
// Modelo de sesión / rol (mock para el prototipo)
//
// El rol está FIJO por usuario: el usuario final no elige libremente su rol.
// El "selector de perfil" del Header es únicamente una ayuda de navegación del
// prototipo (modo demo) para poder recorrer todos los módulos durante la
// defensa. No representa una elección de rol del usuario real.
// ---------------------------------------------------------------------------

export type Role = "Administrador" | "Gerencial" | "Operativo" | "Tecnico";

export type ModuleKey = "seguridad" | "gerencial" | "operativo" | "reportes" | "tecnico";

export const ROLES: Role[] = ["Administrador", "Gerencial", "Operativo", "Tecnico"];

export type MockUser = {
  id: string;
  nombre: string;
  documento: string;
  cargo: string;
  rol: Role;
};

// Usuarios mock con rol pre-asignado (uno por rol para el modo demo).
export const MOCK_USERS: Record<Role, MockUser> = {
  Administrador: {
    id: "USR-ADM",
    nombre: "Ana Quiroz Salcedo",
    documento: "DNI 40123456",
    cargo: "Administrador del sistema",
    rol: "Administrador",
  },
  Gerencial: {
    id: "USR-GER",
    nombre: "Carlos Mendoza Ríos",
    documento: "DNI 41890234",
    cargo: "Gerente de cobranzas",
    rol: "Gerencial",
  },
  Operativo: {
    id: "USR-OPE",
    nombre: "Lucía Fernández Paz",
    documento: "DNI 45879632",
    cargo: "Gestor de cobranza",
    rol: "Operativo",
  },
  Tecnico: {
    id: "USR-TEC",
    nombre: "Jorge Ramírez Soto",
    documento: "DNI 43567812",
    cargo: "Administrador técnico de BD",
    rol: "Tecnico",
  },
};

// Matriz de acceso por rol (arquitectura §1.2). El Administrador ve todo.
export const ROLE_MODULES: Record<Role, ModuleKey[]> = {
  Administrador: ["seguridad", "gerencial", "operativo", "reportes", "tecnico"],
  Gerencial: ["gerencial"],
  Operativo: ["operativo", "reportes"],
  Tecnico: ["tecnico"],
};

// Pantalla de inicio por rol (a dónde redirige "/").
export const ROLE_HOME: Record<Role, string> = {
  Administrador: "/gerencial/dashboard",
  Gerencial: "/gerencial/dashboard",
  Operativo: "/operativo/dashboard",
  Tecnico: "/tecnico/batch-monitor",
};

export const ROLE_LABEL: Record<Role, string> = {
  Administrador: "Administrador",
  Gerencial: "Gerencial",
  Operativo: "Operativo",
  Tecnico: "Técnico",
};

const STORAGE_KEY = "swcobranza:session:role";
const DEFAULT_ROLE: Role = "Administrador";

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function getCurrentRole(): Role {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && (ROLES as string[]).includes(raw)) return raw as Role;
  } catch {
    /* noop */
  }
  return DEFAULT_ROLE;
}

export function setCurrentRole(role: Role) {
  try {
    localStorage.setItem(STORAGE_KEY, role);
  } catch {
    /* noop */
  }
  emit();
}

export function getCurrentUser(): MockUser {
  return MOCK_USERS[getCurrentRole()];
}

export function canAccess(module: ModuleKey, role: Role = getCurrentRole()): boolean {
  return ROLE_MODULES[role].includes(module);
}

/** Hook reactivo: re-renderiza cuando cambia el rol del modo demo. */
export function useCurrentRole(): Role {
  return useSyncExternalStore(subscribe, getCurrentRole, () => DEFAULT_ROLE);
}
