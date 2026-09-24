import { useSyncExternalStore } from "react";

// ---------------------------------------------------------------------------
// Modelo de sesión / rol (mock para el prototipo)
//
// El rol está FIJO por usuario: el usuario final no elige libremente su rol.
// El "selector de perfil" del Header es únicamente una ayuda de navegación del
// prototipo (modo demo) para poder recorrer todos los módulos durante la
// defensa. No representa una elección de rol del usuario real.
//
// Perfiles (arquitectura Seguridad / On-Line / Batch):
// - Administrador: acceso total, solo para recorrer el prototipo en modo demo.
// - GestorSeguridad: Seguridad — permisos de usuarios, módulos y roles (perfiles y usuarios).
// - Gerente: acceso al módulo Gerencial completo (dashboard, mantenimiento de parámetros y consultas).
// - Sponsor: Operativo en modo autoservicio — sube SU PROPIA cartera de morosos, el sistema los
//   clasifica por tipo de cobranza y el sponsor elige la estrategia de hostigamiento de cada uno.
//   Solo ve los morosos de su propia cartera.
// - Tecnico: módulo Técnico — el que va tocando sobre la base de datos (monitor batch,
//   mantenimiento de BD y backup).
// ---------------------------------------------------------------------------

export type Role = "Administrador" | "GestorSeguridad" | "Gerente" | "Sponsor" | "Tecnico";

export type ModuleKey = "seguridad" | "gerencial" | "operativo" | "reportes" | "aplicativo" | "tecnico";

export const ROLES: Role[] = ["Administrador", "GestorSeguridad", "Gerente", "Sponsor", "Tecnico"];

export type MockUser = {
  id: string;
  nombre: string;
  documento: string;
  cargo: string;
  rol: Role;
  /** Solo para Sponsor: código del Sponsor (localDb) que delimita su propia cartera. */
  sponsorCodigo?: string;
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
  GestorSeguridad: {
    id: "USR-SEG",
    nombre: "Rosa Valverde Campos",
    documento: "DNI 44012399",
    cargo: "Gestor de seguridad",
    rol: "GestorSeguridad",
  },
  Gerente: {
    id: "USR-GER",
    nombre: "Carlos Mendoza Ríos",
    documento: "DNI 41890234",
    cargo: "Gerente de cobranzas",
    rol: "Gerente",
  },
  Sponsor: {
    id: "USR-SPN",
    nombre: "Rosa Delgado",
    documento: "DNI 48123456",
    cargo: "Sponsor — Financiera Andina S.A.",
    rol: "Sponsor",
    sponsorCodigo: "SPN-001",
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
  Administrador: ["seguridad", "gerencial", "operativo", "reportes", "aplicativo", "tecnico"],
  GestorSeguridad: ["seguridad"],
  Gerente: ["gerencial"],
  Sponsor: ["operativo", "reportes"],
  Tecnico: ["aplicativo", "tecnico"],
};

// Pantalla de inicio por rol (a dónde redirige "/").
export const ROLE_HOME: Record<Role, string> = {
  Administrador: "/arquitectura",
  GestorSeguridad: "/seguridad/usuarios",
  Gerente: "/gerencial/dashboard",
  Sponsor: "/operativo/dashboard",
  Tecnico: "/aplicativo/monitor-batch",
};

export const ROLE_LABEL: Record<Role, string> = {
  Administrador: "Administrador",
  GestorSeguridad: "Gestor de seguridad",
  Gerente: "Gerente",
  Sponsor: "Sponsor",
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
