import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff, QrCode, ScanLine, ShieldCheck } from "lucide-react";

import { AuthShell } from "./AuthShell";
import { getCurrentRole, ROLE_HOME } from "../../store/session";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [dni, setDni] = useState("");
  // Escaneo de QR simulado: "lee" el código un momento y luego entra al sistema.
  const [escaneando, setEscaneando] = useState(false);
  const navigate = useNavigate();

  const entrar = () => navigate(ROLE_HOME[getCurrentRole()]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    entrar();
  };

  const escanearQR = () => {
    setEscaneando(true);
    window.setTimeout(entrar, 1400);
  };

  return (
    <AuthShell>
      <Card className="w-full max-w-[960px] border-border bg-card shadow-sm">
        <CardHeader className="space-y-4 border-b border-border/60 px-8 pb-6 pt-7">
          <div className="flex items-start justify-between gap-4">
            <Badge
              variant="outline"
              className="rounded-full border-border/80 bg-muted/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground"
            >
              Control de acceso
            </Badge>

            <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Sistema de Cobranza
            </span>
          </div>

          <div className="space-y-2">
            <CardTitle className="text-3xl font-semibold tracking-tight text-foreground">
              Acceso al sistema
            </CardTitle>
            <CardDescription className="max-w-xl text-sm leading-6 text-muted-foreground">
              Ingrese sus credenciales para continuar según su perfil autorizado.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-8 py-6">
          <div className="grid items-start gap-5 lg:grid-cols-[1.42fr_0.82fr]">
            <div className="rounded-[22px] border border-border bg-background p-5">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-2">
                  <Label htmlFor="login-dni">DNI</Label>
                  <Input
                    id="login-dni"
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    value={dni}
                    onChange={(e) => setDni(e.target.value.replace(/D/g, ""))}
                    placeholder="12345678"
                    className="h-11 rounded-xl border-border/80 bg-background px-4 tracking-[0.2em]"
                  />
                  <p className="text-xs text-muted-foreground">8 dígitos, sin puntos ni guiones.</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="login-password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-11 rounded-xl border-border/80 bg-background px-4 pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={
                        showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Checkbox id="remember-session" />
                    <Label
                      htmlFor="remember-session"
                      className="text-sm font-medium text-muted-foreground"
                    >
                      Recordar sesión
                    </Label>
                  </div>

                  <Link
                    to="/acceso-alternativo"
                    className="text-sm font-semibold text-foreground transition-colors hover:text-primary/80"
                  >
                    Acceso alternativo
                  </Link>
                </div>

                <Button type="submit" size="lg" className="h-11 w-full rounded-xl">
                  Ingresar
                </Button>
              </form>
            </div>

            <div className="flex h-full flex-col rounded-[22px] border border-border bg-muted/20 p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-background">
                  <QrCode className="size-5 text-foreground" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-foreground">Ingresar escaneando un QR</h3>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Apunta la cámara al código y entras sin escribir tu DNI.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-1 items-center justify-center py-2">
                <div className="relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-[20px] border border-dashed border-border bg-background">
                  <QrCode className={escaneando ? "size-12 text-primary" : "size-12 text-muted-foreground"} />
                  {escaneando && (
                    <span className="absolute inset-x-3 top-3 h-0.5 animate-pulse rounded-full bg-primary" />
                  )}
                </div>
              </div>

              <Button
                type="button"
                variant={escaneando ? "secondary" : "outline"}
                onClick={escanearQR}
                disabled={escaneando}
                className="h-10 w-full rounded-xl"
              >
                <ScanLine className="size-4" />
                {escaneando ? "Leyendo código…" : "Escanear QR"}
              </Button>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                Prototipo: el escaneo es simulado.
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-t border-border/60 px-8 py-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4" />
            Acceso controlado según rol y permisos. Prototipo: cualquier DNI y contraseña ingresan.
          </div>
        </CardFooter>
      </Card>
    </AuthShell>
  );
}