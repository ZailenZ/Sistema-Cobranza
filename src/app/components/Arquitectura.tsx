import { useState } from "react";
import { Link } from "react-router";
import { Maximize2, X } from "lucide-react";

import { PageHeader } from "./shared/PageHeader";

// Arquitectura del sistema — pantalla de apertura del Administrador.
// Es lo primero que se muestra en la presentación: el diagrama completo del
// sistema, con los accesos directos a cada módulo debajo.

const IMAGEN = `${import.meta.env.BASE_URL}arquitectura-cobranza.png`;

const MODULOS = [
  { titulo: "1. Seguridad", detalle: "Login, métodos de acceso, perfiles y usuarios.", path: "/seguridad/perfiles" },
  { titulo: "2.1. Gerencial", detalle: "Mantenimiento de parámetros y consultas.", path: "/gerencial/dashboard" },
  { titulo: "2.2. Operativo", detalle: "Data-entry del sponsor y sus reportes.", path: "/operativo/dashboard" },
  { titulo: "3.1. Aplicativo", detalle: "Procesos batch: tickets, protocolos, estadísticas y KPIs.", path: "/aplicativo/monitor-batch" },
  { titulo: "3.2. Técnico", detalle: "Mantenimiento de la base de datos y contingencia.", path: "/tecnico/mantenimiento-bd" },
];

export function Arquitectura() {
  const [ampliada, setAmpliada] = useState(false);

  return (
    <div className="min-h-full bg-background">
      <PageHeader
        title="Arquitectura del sistema"
        subtitle="Descomposición funcional del Sistema de Cobranza: Seguridad, On-line (Gerencial y Operativo) y Batch (Aplicativo y Técnico)."
      />

      <div className="space-y-6 p-6 lg:p-8">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-foreground">Diagrama de bloques del sistema</h3>
            <button
              onClick={() => setAmpliada(true)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Maximize2 className="size-4" />
              Ver en grande
            </button>
          </div>
          <button
            onClick={() => setAmpliada(true)}
            className="block w-full cursor-zoom-in overflow-hidden rounded-lg border border-border bg-white"
            aria-label="Ampliar el diagrama de arquitectura"
          >
            <img src={IMAGEN} alt="Arquitectura del Sistema de Cobranza" className="h-auto w-full" />
          </button>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold text-foreground">Ir a un módulo</h3>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {MODULOS.map((m) => (
              <Link
                key={m.path}
                to={m.path}
                className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40"
              >
                <p className="text-base font-semibold text-foreground">{m.titulo}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">{m.detalle}</p>
                <span className="mt-3 inline-block text-sm font-medium text-primary group-hover:underline">
                  Entrar →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Diagrama a pantalla completa, para proyectarlo durante la presentación */}
      {ampliada && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/85 p-4">
          <div className="mb-3 flex items-center justify-between text-white">
            <p className="text-base font-semibold">Arquitectura del Sistema de Cobranza</p>
            <button
              onClick={() => setAmpliada(false)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-white/15"
            >
              <X className="size-4" />
              Cerrar
            </button>
          </div>
          <div className="scrollbar-modern flex-1 overflow-auto rounded-xl bg-white p-2">
            <img
              src={IMAGEN}
              alt="Arquitectura del Sistema de Cobranza"
              className="mx-auto h-auto w-full max-w-[1800px]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
