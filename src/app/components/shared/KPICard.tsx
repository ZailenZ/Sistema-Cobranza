import { LucideIcon } from "lucide-react";

import { cn } from "../ui/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  variant?: "primary" | "secondary" | "accent" | "destructive";
  subtitle?: string;
}

const iconToneClasses = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary text-secondary-foreground",
  accent: "bg-accent text-accent-foreground",
  destructive: "bg-destructive/10 text-destructive",
};

export function KPICard({ title, value, change, icon: Icon, variant = "primary", subtitle }: KPICardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", iconToneClasses[variant])}>
          <Icon className="size-4" />
        </div>
        <p className="min-w-0 truncate text-sm font-medium text-muted-foreground">{title}</p>
      </div>

      <p className="mt-3 text-2xl font-semibold text-foreground">{value}</p>

      {(subtitle || change !== undefined) && (
        <div className="mt-1.5 flex items-center gap-2">
          {change !== undefined && (
            <span
              className={cn(
                "text-xs font-semibold",
                change >= 0 ? "text-emerald-600" : "text-destructive",
              )}
            >
              {change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`}
            </span>
          )}
          {subtitle && <span className="truncate text-xs text-muted-foreground">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
