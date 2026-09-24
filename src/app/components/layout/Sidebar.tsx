import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  BarChart3,
  Bot,
  Building2,
  ChevronDown,
  ChevronRight,
  Database,
  FileText,
  HandCoins,
  HardDriveDownload,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  PhoneCall,
  Settings,
  ShieldCheck,
  Target,
  Ticket,
  UserX,
  Users,
  Wrench,
  Zap,
} from "lucide-react";

import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { cn } from "../ui/utils";
import { type ModuleKey, ROLE_LABEL, useCurrentRole, canAccess } from "../../store/session";

interface MenuItem {
  title: string;
  icon: React.ReactNode;
  path?: string;
  /** Si se define, el ítem (y sus hijos) solo es visible si el rol tiene acceso a este módulo. */
  module?: ModuleKey;
  children?: MenuItem[];
}

const menuBlocks: MenuItem[] = [
  {
    title: "Seguridad",
    icon: <ShieldCheck className="size-4" />,
    module: "seguridad",
    children: [
      { title: "Perfiles y permisos", icon: <ShieldCheck className="size-4" />, path: "/seguridad/perfiles" },
      { title: "Gestión de usuarios", icon: <Users className="size-4" />, path: "/seguridad/usuarios" },
    ],
  },
  {
    title: "Gerencial",
    icon: <BarChart3 className="size-4" />,
    module: "gerencial",
    children: [
      { title: "Dashboard", icon: <LayoutDashboard className="size-4" />, path: "/gerencial/dashboard" },
      {
        title: "Mantenimiento parámetros",
        icon: <Settings className="size-4" />,
        children: [
          { title: "Catálogo de servicio", icon: <FileText className="size-4" />, path: "/gerencial/parametros/servicios" },
          { title: "Catálogo de canales", icon: <MessageSquareText className="size-4" />, path: "/gerencial/parametros/canales" },
          { title: "Catálogo de plantillas", icon: <FileText className="size-4" />, path: "/gerencial/parametros/plantillas" },
          { title: "Catálogo de estrategias", icon: <Zap className="size-4" />, path: "/gerencial/parametros/estrategias" },
          { title: "Catálogo de autómata", icon: <Bot className="size-4" />, path: "/gerencial/parametros/automata" },
        ],
      },
      {
        title: "Consultas",
        icon: <BarChart3 className="size-4" />,
        children: [
          { title: "Sponsors", icon: <Building2 className="size-4" />, path: "/gerencial/consultas/sponsors" },
          { title: "Morosos", icon: <UserX className="size-4" />, path: "/gerencial/consultas/morosos" },
          { title: "Autómatas", icon: <Bot className="size-4" />, path: "/gerencial/consultas/automatas" },
          { title: "Indicadores KPI", icon: <Target className="size-4" />, path: "/gerencial/consultas/indicadores-kpi" },
          { title: "Gráficos estadísticos", icon: <BarChart3 className="size-4" />, path: "/gerencial/consultas/graficos" },
        ],
      },
    ],
  },
  {
    title: "Operativo",
    icon: <HandCoins className="size-4" />,
    module: "operativo",
    children: [
      { title: "Dashboard", icon: <LayoutDashboard className="size-4" />, path: "/operativo/dashboard" },
      {
        title: "Ingreso de datos",
        icon: <FileText className="size-4" />,
        children: [
          { title: "Reservar tickets", icon: <Ticket className="size-4" />, path: "/operativo/reservar-tickets" },
          { title: "Entrega cobranza", icon: <PhoneCall className="size-4" />, path: "/operativo/entrega-cobranza" },
        ],
      },
    ],
  },
  {
    title: "Reportes",
    icon: <FileText className="size-4" />,
    module: "reportes",
    children: [
      { title: "Reporte de gestión de deudas", icon: <FileText className="size-4" />, path: "/operativo/reportes/gestion-deudas" },
    ],
  },
  {
    title: "Técnico",
    icon: <Wrench className="size-4" />,
    module: "tecnico",
    children: [
      { title: "Monitor Batch", icon: <Database className="size-4" />, path: "/tecnico/batch-monitor" },
      { title: "Mantenimiento BD", icon: <Wrench className="size-4" />, path: "/tecnico/mantenimiento-bd" },
      { title: "Backup", icon: <HardDriveDownload className="size-4" />, path: "/tecnico/backup" },
    ],
  },
];

// Filtra recursivamente el árbol de menú según los módulos permitidos por rol.
// Un ítem con `module` se oculta (con toda su rama) si el rol no tiene acceso;
// un grupo sin `module` propio se oculta si, tras filtrar, no le queda ningún hijo visible.
function filterMenuItem(item: MenuItem, role: ReturnType<typeof useCurrentRole>): MenuItem | null {
  if (item.module && !canAccess(item.module, role)) return null;

  if (item.children) {
    const children = item.children
      .map((child) => filterMenuItem(child, role))
      .filter((child): child is MenuItem => child !== null);
    if (children.length === 0) return null;
    return { ...item, children };
  }

  return item;
}

function containsPath(item: MenuItem, pathname: string): boolean {
  if (item.path === pathname) return true;
  return item.children?.some((child) => containsPath(child, pathname)) ?? false;
}

function MenuItemComponent({ item, level = 0 }: { item: MenuItem; level?: number }) {
  const location = useLocation();
  const hasChildren = Boolean(item.children?.length);
  const isActive = item.path === location.pathname;
  const isOpenBranch = containsPath(item, location.pathname);
  const [isOpen, setIsOpen] = useState(level === 0 || isOpenBranch);

  useEffect(() => {
    if (isOpenBranch) setIsOpen(true);
  }, [isOpenBranch]);

  const indentStyle = level > 0 ? { paddingLeft: `${16 + level * 12}px` } : undefined;

  if (hasChildren) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setIsOpen((current) => !current)}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
            level === 0
              ? "text-[11px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/45 hover:text-sidebar-foreground/70"
              : "text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground",
            isOpenBranch && level > 0 && "bg-sidebar-accent text-sidebar-foreground",
          )}
          style={indentStyle}
        >
          {item.icon}
          <span className="flex-1">{item.title}</span>
          {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </button>
        {isOpen && (
          <div className="space-y-1">
            {item.children?.map((child) => (
              <MenuItemComponent key={`${item.title}-${child.title}`} item={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      to={item.path || "#"}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-sidebar-primary text-sidebar-primary-foreground"
          : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground",
      )}
      style={indentStyle}
    >
      {item.icon}
      <span>{item.title}</span>
    </Link>
  );
}

export function Sidebar() {
  const role = useCurrentRole();
  const visibleBlocks = menuBlocks
    .map((block) => filterMenuItem(block, role))
    .filter((block): block is MenuItem => block !== null);

  return (
    <aside className="hidden w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex lg:flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <HandCoins className="size-4.5" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold text-sidebar-foreground">Sistema de Cobranza</h1>
          <p className="text-xs text-sidebar-foreground/55">{ROLE_LABEL[role]}</p>
        </div>
      </div>

      <Separator className="bg-sidebar-border" />

      <nav className="scrollbar-modern flex-1 space-y-3 overflow-y-auto px-3 py-4">
        {visibleBlocks.map((block) => (
          <MenuItemComponent key={block.title} item={block} />
        ))}
      </nav>

      <div className="p-3">
        <Separator className="mb-3 bg-sidebar-border" />
        <Button
          asChild
          variant="ghost"
          className="w-full justify-start rounded-lg px-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          <Link to="/login">
            <LogOut className="size-4" />
            Cerrar sesión
          </Link>
        </Button>
      </div>
    </aside>
  );
}
