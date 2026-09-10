import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowLeft, CheckCircle2, KeyRound, QrCode, ShieldCheck, Smartphone } from "lucide-react";

import { AuthShell } from "./AuthShell";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp";
import { Label } from "../ui/label";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { cn } from "../ui/utils";
import { getCurrentRole, ROLE_HOME } from "../../store/session";

// SEG-02 — Métodos alternativos de acceso.
// NO es recuperación de contraseña: permite ingresar al sistema mediante un
// método alternativo (PIN, código OTP o QR) cuando el acceso normal no aplica.

type MetodoId = "pin" | "otp" | "qr";

const metodos: {
  id: MetodoId;
  titulo: string;
  descripcion: string;
  icon: typeof KeyRound;
}[] = [
  {
    id: "pin",
    titulo: "PIN de operador",
    descripcion: "Ingreso rápido en counter con PIN de 6 dígitos asignado al usuario.",
    icon: KeyRound,
  },
  {
    id: "otp",
    titulo: "Código OTP",
    descripcion: "Código temporal enviado al dispositivo corporativo autorizado.",
    icon: Smartphone,
  },
  {
    id: "qr",
    titulo: "Credencial QR",
    descripcion: "Escaneo de credencial QR en terminales habilitadas.",
    icon: QrCode,
  },
];

export function MetodosAcceso() {
  const navigate = useNavigate();
  const [metodo, setMetodo] = useState<MetodoId>("pin");
  const [codigo, setCodigo] = useState("");
  const [validado, setValidado] = useState(false);

  const metodoActivo = metodos.find((m) => m.id === metodo)!;

  const handleValidar = (event: React.FormEvent) => {
    event.preventDefault();
    setValidado(true);
  };

  const handleIngresar = () => {
    navigate(ROLE_HOME[getCurrentRole()]);
  };

  return (
    <AuthShell>
      <Card className="w-full max-w-[520px] border-border bg-card shadow-sm">
        <CardHeader className="space-y-4 border-b border-border/60">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Badge
                variant="outline"
                className="rounded-full border-border/80 bg-muted/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em]"
              >
                Acceso alternativo
              </Badge>
              <CardTitle className="mt-4 text-3xl font-semibold">Métodos alternativos de acceso</CardTitle>
              <CardDescription className="mt-2 text-sm leading-6">
                Ingrese al sistema con un método alternativo autorizado. No modifica la contraseña.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-6">
          <RadioGroup
            value={metodo}
            onValueChange={(value) => {
              setMetodo(value as MetodoId);
              setValidado(false);
              setCodigo("");
            }}
            className="gap-3"
          >
            {metodos.map(({ id, titulo, descripcion, icon: Icon }) => (
              <Label
                key={id}
                htmlFor={`metodo-${id}`}
                className={cn(
                  "flex cursor-pointer items-start gap-4 rounded-[20px] border p-4 transition-all",
                  metodo === id
                    ? "border-foreground/20 bg-muted/35 shadow-[0_12px_32px_rgba(15,23,42,0.08)]"
                    : "border-border bg-background hover:bg-muted/15",
                )}
              >
                <RadioGroupItem id={`metodo-${id}`} value={id} className="mt-1" />
                <div className="flex size-11 items-center justify-center rounded-2xl border border-border bg-muted/35">
                  <Icon className="size-5 text-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{titulo}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{descripcion}</p>
                </div>
              </Label>
            ))}
          </RadioGroup>

          <Alert className="border-border bg-muted/30">
            <ShieldCheck className="size-4" />
            <AlertTitle>{metodoActivo.titulo}</AlertTitle>
            <AlertDescription>{metodoActivo.descripcion}</AlertDescription>
          </Alert>

          {!validado ? (
            <form onSubmit={handleValidar} className="space-y-5">
              {metodo === "qr" ? (
                <div className="flex flex-col items-center gap-3 rounded-[20px] border border-dashed border-border bg-background py-6">
                  <div className="flex size-36 items-center justify-center rounded-[20px] border border-border bg-muted/20">
                    <QrCode className="size-16 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">Escanee la credencial QR en la terminal.</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-[20px] border border-border bg-muted/20 py-6">
                  <p className="text-sm font-medium text-muted-foreground">
                    {metodo === "pin" ? "Ingrese su PIN de 6 dígitos" : "Ingrese el código OTP recibido"}
                  </p>
                  <InputOTP maxLength={6} value={codigo} onChange={setCodigo} containerClassName="justify-center">
                    <InputOTPGroup>
                      {Array.from({ length: 6 }).map((_, index) => (
                        <InputOTPSlot key={index} index={index} className="h-12 w-12 text-base font-semibold" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              )}

              <Button type="submit" size="lg" className="h-11 w-full rounded-xl">
                Validar acceso
              </Button>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="rounded-[20px] border border-border bg-muted/25 p-6 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full border border-border bg-background shadow-inner">
                  <CheckCircle2 className="size-9 text-foreground" />
                </div>
                <h3 className="mt-4 text-xl font-semibold">Acceso validado</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Método {metodoActivo.titulo} verificado. Continúe al sistema según su perfil.
                </p>
              </div>
              <Button size="lg" className="h-11 w-full rounded-xl" onClick={handleIngresar}>
                Ingresar al sistema
              </Button>
            </div>
          )}
        </CardContent>

        <CardFooter className="justify-start border-t border-border/60">
          <Button asChild variant="ghost" className="rounded-xl px-0 hover:bg-transparent">
            <Link to="/login">
              <ArrowLeft className="size-4" />
              Volver al ingreso normal
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </AuthShell>
  );
}
