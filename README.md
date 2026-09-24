# Sistema de Cobranza — Prototipo Visual

Prototipo de Diseño Externo de un Sistema de Cobranza, construido a partir de la
arquitectura **Seguridad / On-Line / Batch** (Gerencial y Operativo dentro de
On-Line, Aplicativo y Técnico dentro de Batch). Es un prototipo **solo visual**:
no hay backend real, los datos se simulan en `localStorage` del navegador.

## Ejecutar

```bash
npm i        # instalar dependencias
npm run dev  # servidor de desarrollo
npm run build  # build de producción (dist/)
```

## Acceso

La pantalla de inicio de sesión está en `/#/login` (Seguridad › Inicio de sesión, o
"Cerrar sesión" en el pie del menú). Pide **DNI y contraseña**, y ofrece además
**ingresar escaneando un QR** (simulado). Cualquier credencial entra: el prototipo
no valida nada, lleva al inicio del perfil activo.

## Acceso y perfiles (modo demo)

El rol está **fijo por usuario**. El selector de perfil del encabezado es solo una
ayuda de navegación del prototipo (**modo demo**) para recorrer todos los módulos.
El menú lateral se filtra según el perfil activo. Perfiles disponibles:

- **Administrador:** acceso total (solo para recorrer el prototipo en modo demo).
- **Gestor de seguridad:** módulo Seguridad — permisos de usuarios, módulos y
  roles (perfiles y permisos, gestión de usuarios).
- **Gerente:** acceso al módulo Gerencial completo (dashboard, mantenimiento de
  parámetros y consultas).
- **Sponsor:** Operativo en **modo autoservicio** — el sponsor es la empresa/
  entidad acreedora que encarga su cartera de morosos al sistema. Este perfil
  solo trabaja los morosos de **su propia cartera**.
- **Técnico:** módulo Técnico — el que va tocando sobre la base de datos: Monitor
  Batch, mantenimiento de BD y backup.

## Estructura de módulos

- **Seguridad:** Login, Métodos alternativos de acceso, Gestión de perfiles y
  permisos, Gestión de usuarios.
- **Gerencial:**
  - Dashboard con indicadores generales de cartera y recuperación.
  - Mantenimiento de parámetros:
    - **Catálogo de morosos**: los perfiles de moroso (ocasional, reincidente,
      riesgoso, crítico) y los rangos de **mora y saldo** que definen a cada uno.
      Es el catálogo que manda sobre la clasificación.
    - **Catálogo de servicio** (tipos de cobranza): a qué **tipo de moroso** aplica
      cada tipo de cobranza — de ahí hereda sus rangos de mora y saldo — y los
      canales que usa con su frecuencia (cuántos mensajes al día por cada canal).
    - **Catálogo de canales**: medio de contacto, su naturaleza (digital/físico) y el
      horario diario en que se permite contactar por ahí. El canal físico es la
      **carta notarial**, reservada para la cobranza judicial.
    - **Catálogo de plantillas**: el tipo de mensaje (Amistoso, Recordatorio,
      Aviso formal, Advertencia, Ultimátum, Carta notarial) y su texto real.
    - **Catálogo de estrategias**: cómo se hostiga a un moroso — canal(es) + tipo
      de mensaje + duración + tarifa, asociado a un tipo de cobranza.
    - **Catálogo de autómata**: el robot que envía por cada canal y su capacidad
      máxima por día (el mínimo siempre es 0). La carta notarial la entrega un
      **notario**, no un robot.
    Cada uno con estados vacío/lista/edición y las seis acciones: listar, buscar,
    ver detalle, agregar, modificar, eliminar. Cada catálogo incluye un registro de
    ejemplo desactivado, para mostrar que se puede dar de baja sin eliminarlo.
  - Consultas:
    - **Sponsors**: lista → ficha del sponsor con su cartera de morosos.
    - **Morosos**: cartera consolidada con filtros, KPIs y exportación.
    - **Autómatas**: carga de trabajo de cada autómata (capacidad, mensajes
      enviados, respuestas) y, al entrar al detalle, su cola de mensajes por
      enviar con la fecha que le toca a cada moroso.
    - **Indicadores KPI**: recuperación de cartera, tasa de respuestas, tiempo
      promedio de resolución y tasa de recuperación de pagos, con dos gráficas.
    - **Gráficos estadísticos**: tres indicadores (tipos de cobranza realizadas,
      canales utilizados, tasa de respuestas), cada uno visible como tabla,
      gráfico de línea o histograma. Los filtros de tipo y rango de fecha son
      demostrativos; los datos son de muestra.
- **Operativo — flujo de autoservicio del Sponsor:**
  1. **Dashboard**: bienvenida y vistazo del flujo completo, con los tipos de
     cobranza del sistema como referencia y la **disponibilidad de cada canal**
     (operadores, capacidad total y capacidad ocupada hoy).
  2. **Reservar tickets**: antes de cualquier carga, el sponsor debe llenar sus
     datos y firmar el **acuerdo de gestión de cobranza** (confidencialidad de los
     datos de los morosos); recién entonces se habilita la subida. Luego
     **sube su lista de morosos directamente**
     (simulado: dos dropzones — archivo morosos y archivo deuda — sin
     procesamiento real de archivo). El sponsor **no elige** el tipo de cobranza:
     al confirmar, el sistema clasifica automáticamente a cada moroso según su
     información (días de mora) y le asigna su tipo de cobranza. Luego, por cada
     moroso, el sponsor **elige la estrategia de hostigamiento** a aplicar de entre
     las disponibles para ese tipo de cobranza (con su canal, tipo de mensaje,
     duración y tarifa); al aplicarla se ejecuta la gestión y se acumula el costo.
     El sistema **recomienda** una estrategia según los días de mora y el saldo del
     moroso y la deja preseleccionada, pero la decisión final es del sponsor.
     Elegir una estrategia **no la ejecuta**: queda pendiente y se puede cambiar las
     veces que haga falta; al final el sponsor revisa todo el lote en una pantalla de
     confirmación (con opción de editar moroso por moroso) y recién ahí se envía.
  3. **Entrega cobranza**: reporte de las gestiones automáticas enviadas (canal,
     operador/autómata, plantilla) y su respuesta (afirmativa/negativa/sin
     respuesta), con detalle por moroso y el mensaje exacto enviado.
  Un usuario Sponsor solo ve su propia cartera; el Administrador ve la cola
  interna completa (comportamiento previo, sin el flujo de autoservicio).
- **Reportes operativos (solo ver/imprimir/descargar):** Reporte de gestión de
  deudas — consolidado final de la cartera del sponsor, con búsqueda, paginación y
  detalle por moroso. Se puede ver como **tabla, histograma o diagrama de pastel**
  (los gráficos usan datos de muestra fijos). No muestra con qué estrategia se
  trabajó a cada moroso. Al cierre, el sponsor puede **calificar la cobranza**.
- **Técnico (restringido, fuera del flujo operativo):** Monitor Batch Aplicativo
  (solo lectura), Mantenimiento de BD, Backup.

## Decisiones de diseño relevantes

- **Batch** no es un flujo del usuario: fabrica los tickets de gestión de
  cobranza a partir de deudas vencidas, y solo se refleja como monitor técnico
  de solo lectura (Monitor Batch Aplicativo).
- El ticket de gestión tiene tres estados: **DI** (moroso clasificado, aún sin
  estrategia asignada) → **RE** (con estrategia aplicada y gestión enviada) →
  **CE** (cerrado).
- No existe un "catálogo de operarios": los operadores del sistema son los
  **autómatas**, no personas.
- La cartera del sponsor con el que se inicia sesión (Financiera Andina S.A.)
  **arranca vacía**: su flujo nace de subir la lista de morosos. Los otros dos
  sponsors sí traen una cartera de muestra, para que las consultas gerenciales
  tengan contenido que mostrar.
- **Entrega cobranza** ya no es un formulario manual: es un reporte de solo
  lectura de los envíos automáticos de cobranza (SMS/WhatsApp/correo/carta) y
  la respuesta simulada del moroso. El reporte de gestión de deudas es el
  consolidado final; ninguna de las dos pantallas registra transacciones.
