import { createHashRouter, Navigate } from "react-router";
import { MainLayout } from "./components/layout/MainLayout";
import { Login } from "./components/auth/Login";
import { MetodosAcceso } from "./components/auth/MetodosAcceso";
import { PerfilesPermisos } from "./components/seguridad/PerfilesPermisos";
import { GestionUsuarios } from "./components/seguridad/GestionUsuarios";
import { DashboardGerencial } from "./components/gerencial/DashboardGerencial";
import { DashboardOperativo } from "./components/operativo/DashboardOperativo";
import { ParamsMaintenance } from "./components/gerencial/ParamsMaintenance";
import { Sponsors } from "./components/gerencial/consultas/Sponsors";
import { Morosos } from "./components/gerencial/consultas/Morosos";
import { IndicadoresKPI } from "./components/gerencial/consultas/IndicadoresKPI";
import { ReservarTickets } from "./components/operativo/dataentry/ReservarTickets";
import { EntregaCobranza } from "./components/operativo/dataentry/EntregaCobranza";
import { ReporteGestionDeudas } from "./components/operativo/reportes/ReporteGestionDeudas";
import { BatchMonitor } from "./components/tecnico/BatchMonitor";
import { MantenimientoBD } from "./components/tecnico/MantenimientoBD";
import { Backup } from "./components/tecnico/Backup";
import { getCurrentRole, ROLE_HOME } from "./store/session";

// Redirección de "/" al dashboard del rol activo (rol fijo por usuario).
function RootRedirect() {
  return <Navigate to={ROLE_HOME[getCurrentRole()]} replace />;
}

export const router = createHashRouter([
  // --- Seguridad (sin layout) ---
  { path: "/login", Component: Login },
  { path: "/acceso-alternativo", Component: MetodosAcceso },

  {
    path: "/",
    Component: MainLayout,
    children: [
      { index: true, Component: RootRedirect },

      // --- Seguridad ---
      { path: "seguridad/perfiles", Component: PerfilesPermisos },
      { path: "seguridad/usuarios", Component: GestionUsuarios },

      // --- Gerencial ---
      { path: "gerencial/dashboard", Component: DashboardGerencial },
      { path: "gerencial/parametros", Component: ParamsMaintenance },
      { path: "gerencial/parametros/:category", Component: ParamsMaintenance },
      { path: "gerencial/consultas/sponsors", Component: Sponsors },
      { path: "gerencial/consultas/morosos", Component: Morosos },
      { path: "gerencial/consultas/indicadores-kpi", Component: IndicadoresKPI },

      // --- Operativo (Data-Entry) ---
      { path: "operativo/dashboard", Component: DashboardOperativo },
      { path: "operativo/reservar-tickets", Component: ReservarTickets },
      { path: "operativo/entrega-cobranza", Component: EntregaCobranza },

      // --- Reportes operativos ---
      { path: "operativo/reportes/gestion-deudas", Component: ReporteGestionDeudas },

      // --- Técnico / Administrativo (gated por rol) ---
      { path: "tecnico/batch-monitor", Component: BatchMonitor },
      { path: "tecnico/mantenimiento-bd", Component: MantenimientoBD },
      { path: "tecnico/backup", Component: Backup },
    ],
  },

  // Cualquier ruta desconocida vuelve al inicio.
  { path: "*", element: <Navigate to="/" replace /> },
]);
