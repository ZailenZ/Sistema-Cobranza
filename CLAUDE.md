# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A **visual-only prototype** of a debt-collection system ("Sistema de Cobranza"). There is no backend: all data
is simulated and persisted in the browser's `localStorage`. This is a design/UX prototype, not a production app —
don't add real auth, a server, or a database.

## Commands

Run from `SistemaCobranza/` (the actual project root — the repo root also contains an unrelated `Obsidian-SistCobranza`
notes vault, ignore that directory for code work):

```bash
npm i            # install dependencies
npm run dev       # dev server (Vite)
npm run build     # production build -> dist/
npm run preview   # preview the production build
npm run deploy    # build, then force-push dist/ to the gh-pages branch via git subtree split
npm run ui:add    # add a new shadcn/ui component (npx shadcn@latest add)
```

There is no test suite and no lint script configured.

## Architecture

### Role-gated, hash-routed SPA

- Routing is `react-router` with `createHashRouter` ([src/app/routes.tsx](src/app/routes.tsx)). All authenticated
  routes render inside `MainLayout` (Sidebar + Header + `<Outlet>`); `/login` and `/acceso-alternativo` render
  standalone without the layout.
- **The role is fixed per user** and drives both routing and menu visibility — it is not a real permission system,
  just a demo mechanism. See [src/app/store/session.ts](src/app/store/session.ts):
  - `Role` = `Administrador | GestorSeguridad | Gerente | Sponsor | Tecnico`, persisted in `localStorage` under
    `swcobranza:session:role`.
  - `ROLE_MODULES` maps each role to the `ModuleKey`s (`seguridad | gerencial | operativo | reportes | tecnico`) it
    can see: Administrador gets all five; GestorSeguridad only `seguridad`; Gerente only `gerencial` (dashboard +
    mantenimiento de parámetros + consultas, all one module — there's no finer split); Sponsor `operativo` +
    `reportes` (scoped to their own portfolio, see below); Tecnico only `tecnico` (Monitor Batch + Mantenimiento
    BD + Backup, all one module).
  - `canAccess(module, role)` backs a recursive menu filter in [Sidebar.tsx](src/app/components/layout/Sidebar.tsx)
    (`filterMenuItem`) — a menu item with a `module` hides its whole subtree if the role lacks access, and a group
    with no `module` of its own hides once it has no visible children left. `ROLE_HOME` decides where `/` redirects
    each role.
  - The role selector in the Header is a **prototype navigation aid only** (to let a demo/defense walk through every
    module) — it does not represent a real user choosing their own role. Switching role there does **not** re-render
    a currently-mounted screen that already called `getCurrentUser()` (only `Header`/`Sidebar` use the reactive
    `useCurrentRole()` hook) — the effect only shows up after the next route change/mount.
  - Five `MOCK_USERS` (one per role) stand in for a real user directory. **Sponsor is the odd one out**: it's a
    real login profile, not just the `Sponsor` data entity — it's the client company's own self-service user, who
    reserves/works tickets only from their own portfolio. Its `MockUser.sponsorCodigo` links it to a `Sponsor`
    record's `codigo` in `localDb.ts`. Don't confuse it with the `automata` catalog (the bots that actually
    send each gestión) — those are not users and have nothing to do with login roles.
  - `ReservarTickets.tsx`/`EntregaCobranza.tsx`/`ReporteGestionDeudas.tsx` scope their data to the current sponsor's
    own portfolio when `role === "Sponsor"` (matching `Deuda.sponsorId` against the sponsor's own `Sponsor.id`);
    for every other role they show the unscoped, all-sponsors view (this is also how `Administrador` demos the
    "internal" queue-based experience — see below).

### Data layer: everything lives in localStorage

- [src/app/store/localDb.ts](src/app/store/localDb.ts) is the single data-access module: typed entities
  (`Sponsor`, `Deudor`, `Deuda`, `TicketGestion`, `MovimientoTicket`, `EnvioCobranza`) plus catalogs
  (`servicios`, `canales`, `plantillas`, `estrategias`, `automata` via `CatalogId`). Every entity has paired
  `getX()`/`setX()` functions that JSON-serialize to a `swcobranza:` prefixed key; there is no async/API layer to mirror.
  There is **no `operarios` catalog** — the "operators" in this system are the `automata` (bots), not people.
- [src/app/store/catalogSeed.ts](src/app/store/catalogSeed.ts) is the **single source of truth for catalog seed
  data and types** (`ServicioCobranza`, `CanalContacto`, `EstrategiaCobranza`, `PlantillaMensaje`, `AutomataCatalogo`
  + their `*_SEED` arrays), imported by both `seedAll.ts` (localStorage seeding) and
  [ParamsMaintenance.tsx](src/app/components/gerencial/ParamsMaintenance.tsx) (catalog CRUD screen) — don't
  reintroduce a second copy of this data in either place. `ensureCatalogSeeded(id, seed)` seeds one catalog if empty.
  How the catalogs fit together (this is the heart of the domain — read this before touching any of them):
  - `servicios` = the **tipo de cobranza**: the classification rule (mora range + saldo range) plus `canales`,
    an array of `{ canalCodigo, vecesPorDia }` — which channels that collection type uses and **how many
    messages per day** through each. Render it with `formatCanalesFrecuencia(canales, catalogoCanales)`.
  - `estrategias` = how a single moroso is actually hounded, within a tipo de cobranza: `canalCodigos` (one or
    several), a `plantillaCodigo` (the message type), `duracionDias` (supports halves: 0.5, 1.5…) and a `tarifa`
    (what the sponsor pays to run it on one moroso). Each belongs to a servicio via `tipoCobranza`, so
    "which strategies does this servicio have" is derived, not stored twice.
  - `plantillas` = the **tipo de mensaje** (Amistoso, Recordatorio, Aviso formal, Advertencia, Ultimátum, Carta
    notarial) and its `mensaje` text, with `{nombre}`/`{saldo}`/`{mora}`/`{sponsor}` placeholders — see
    `renderMensajePlantilla` in `sponsorFlow.ts`. They are **not** tied to a tipo de cobranza; a strategy picks one.
  - `automata` = the bot that sends through each digital channel (`automataParaCanal` maps a canal name to it).
  - Every catalog's `*_SEED` includes one deliberately **Inactivo** example row (e.g. `SRV-005`, `CAN-006`,
    `EST-12`) to demonstrate that a catalog entry can be deactivated without deleting it — keep this pattern when
    adding catalog entries; don't remove those example rows.
- [src/app/store/seedAll.ts](src/app/store/seedAll.ts) (`seedAllIfEmpty`) seeds the catalogs, the `Sponsor`
  companies, and a small sample portfolio for SPN-002/SPN-003 only (`CARTERA_MUESTRA`), so the Gerencial
  consultas have something to show. **SPN-001 (Financiera Andina) is left deliberately empty** — that is the
  sponsor the demo logs in as, and its flow must start from zero by uploading the debtor list. Don't seed
  morosos for SPN-001 "so a screen isn't empty" — give the screen an empty state instead. It's invoked once from `MainLayout`'s
  `useEffect`, and again (idempotently) at the top of every Operativo screen's render.
- [src/app/store/sponsorFlow.ts](src/app/store/sponsorFlow.ts) holds the whole Sponsor simulation, in two steps
  that must stay separate:
  - `simularCargaMorosos(sponsorCodigo)` — the "upload": generates a canned batch of `Deudor`/`Deuda`/
    `TicketGestion` (varied mora/saldo across the active servicio tiers) and classifies each one.
    **The sponsor never picks a tipo de cobranza**: `clasificarServicio(diasMora, servicios)` derives it from
    mora alone (active servicios only), and `seedAll.ts` reuses that same function, so there is one single
    classification rule in the codebase. Tickets land in **DI** — no message is sent yet.
  - `aplicarEstrategia(ticketId, estrategiaCodigo)` — what happens when the sponsor picks a strategy for one
    moroso: the ticket goes **DI → RE**, a `MovimientoTicket` is appended, and one `EnvioCobranza` is created
    with the strategy's canales/plantilla/tarifa, the matching `automata` as `operador`, and a simulated response.
  - `estrategiasDeServicio(tipoCobranza, estrategias)` lists the active strategies a moroso may be worked with,
    sorted cheapest → most intense. `recomendarEstrategia(deuda, servicio, estrategias)` picks the one whose
    intensity matches how far into its tipo's mora **and** saldo ranges the moroso sits — the UI pre-selects it
    and badges it "Recomendada", but **the sponsor always decides**; never auto-apply a recommendation.
  - `renderMensajePlantilla(mensaje, vars)` fills a plantilla's placeholders for "Ver Mensaje";
    `construirMensaje(...)` is only a fallback when an envío has no matching plantilla.
  - No real file is ever parsed — this is a visual prototype; "uploading a file" just triggers the generator.
- When adding a new entity or catalog, follow the existing pattern: define the type + `getX`/`setX` in `localDb.ts`
  (add the id to `CatalogId` for a catalog), add its seed array to `catalogSeed.ts`, wire it into both
  `seedAllIfEmpty` and `ParamsMaintenance.tsx`'s `categories`/column/form-field switches, generate ids with `newId(prefix)`.

### The core domain flow: Batch → ticket → envío automático

This is the concept the whole Operativo module is built around (see [README.md](README.md) for the full narrative).
The Sponsor's self-service journey through the four Operativo/Reportes screens is:

1. **Dashboard** ("Panel operativo") — a welcome/overview screen for the Sponsor (`misSponsor` in
   `DashboardOperativo.tsx`) explaining the 4-step flow, the `servicios` catalog shown as **read-only reference
   cards** (not something to pick), plus KPIs and a shortcut into "Reservar tickets".
2. **Reservar tickets** — the core of the flow, in three stacked sections: (1) "sube tu lista de morosos"
   dropzones (simulated) whose "Actualizar" calls `simularCargaMorosos(sponsor.codigo)`; (2) **"Morosos
   clasificados — elige su estrategia"**: one row per moroso with its saldo, mora, the **tipo de cobranza the
   system assigned**, the **strategy the system recommends**, and an "Elegir estrategia" button that opens a modal
   listing the strategies available for that moroso's tipo (canales, tipo de mensaje, duración, tarifa) with the
   recommended one pre-selected — confirming calls `aplicarEstrategia`; (3) "Morosos en hostigamiento": the ones
   already assigned, with a running **Total a pagar** (sum of tarifas). There is deliberately **no "tickets
   disponibles / mis tickets reservados" queue UI and no prioridad column** — both framings were wrong for this
   domain. An optional `?tipo=` query param only filters the view.
3. **Batch** is not itself a user-facing flow — it's simulated as already having run, producing `TicketGestion`
   records from overdue `Deuda`s (`BatchMonitor` is a read-only technical view of it). A ticket has three states:
   **DI** (classified, no strategy yet) → **RE** (strategy applied, gestión sent) → **CE** (cerrado); every
   transition appends a `MovimientoTicket` audit row.
4. **Entrega cobranza** — **not** a manual call-center form. It's a read-only report of the `EnvioCobranza` records
   (automated message + simulated response) for the sponsor's tickets: KPIs (afirmativa/negativa/sin respuesta) +
   a `DataTable` + a "Ver detalle" action opening [EnvioDetalleModal.tsx](src/app/components/operativo/EnvioDetalleModal.tsx)
   (detail fields, then "Ver Mensaje" for the actual generated text).
5. **Reporte de gestión de deudas** — the final consolidated report of the sponsor's whole `Deuda` list (including
   morosos with no envío yet, shown as "Pendiente"), reusing the same `EnvioDetalleModal` via "Ver más".

### UI conventions

- Path alias `@/*` → `src/*` (configured in both [vite.config.ts](vite.config.ts) and [tsconfig.json](tsconfig.json)).
- `src/app/components/ui/` is shadcn/ui (`new-york` style, see [components.json](components.json)) — add new primitives
  via `npm run ui:add`, don't hand-roll them.
- `src/app/components/shared/` (`DataTable`, `KPICard`, `PageHeader`) are the reusable building blocks every module
  screen is composed from.
- Screens are grouped by role/module under `src/app/components/{seguridad,gerencial,operativo,tecnico}/`, mirroring
  the route structure in `routes.tsx` and the menu structure in `Sidebar.tsx` — when adding a screen, update all three
  (route, sidebar menu entry, `ROLE_MODULES`/`canAccess` if it's gated on a new module).
- Catalog maintenance screens (`ParamsMaintenance`) follow a consistent six-action shape: listar, buscar, ver detalle,
  agregar, modificar, eliminar, with empty/list/edit states.
- Consulta screens (Sponsors, Morosos, Indicadores KPI) follow a consistent shape: filters → KPIs → chart → table → export.
