<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Wedding RSVP SaaS

Multi-tenant: parejas autenticadas gestionan su boda desde `/dashboard`; los invitados (sin login) ven `/boda/[slug]` y confirman vía `/api/rsvp`.

## Stack
Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Supabase (Auth + Postgres + Storage) · Google Sheets API · Zod v4 · D3 (grafo de mesas)

## Comandos
- `npm run dev` — desarrollo
- `npm run check` — typecheck + lint (**ejecutar antes de cada commit**)
- `npm run build` — build de producción

## Estructura
```
app/
  boda/[slug]/          Página pública (SSR, force-dynamic) + components/
  dashboard/            Admin: una carpeta por sección (page.tsx servidor + XxxManager.tsx cliente)
  api/rsvp/             Endpoint público de confirmación
  login/, auth/         Autenticación
components/             Componentes compartidos entre páginas
lib/
  types.ts              TODOS los tipos compartidos (Wedding, RsvpResponse...)
  dashboard.ts          requireWedding() / requireUser() — auth de páginas dashboard
  ui.ts                 Tokens de diseño del dashboard (UI.*, inputClass, cardStyle...)
  supabase.ts           Cliente browser (solo 'use client')
  supabase-server.ts    Cliente servidor + createAdminClient (solo servidor; usa next/headers)
  utils.ts              Helpers puros (fechas, URLs de Maps/Spotify)
  sheets.ts             Google Sheets (solo servidor)
  seating-algorithm.ts  Algoritmo de mesas (puro, sin IO)
  rate-limit.ts         Rate limiter en memoria
supabase/schema.sql     Schema completo + migraciones idempotentes (fuente de verdad)
```

## Convenciones obligatorias

### Páginas del dashboard
Patrón: `page.tsx` es server component que carga datos y los pasa a un `XxxManager.tsx` cliente.
```tsx
const { supabase, wedding } = await requireWedding<{ campo: tipo }>('id, campo')
```
Nunca repitas el boilerplate auth+fetch manualmente. Título con `pageTitleClass`/`pageTitleStyle` de `lib/ui.ts`.

### Colores
- **Dashboard**: usa `UI.*` de `lib/ui.ts`. No hardcodees hex nuevos.
- **Página pública** (`app/boda/`): usa SIEMPRE las CSS vars de la paleta del usuario: `var(--w-bg)`, `var(--w-accent)`, `var(--w-primary)`, `var(--w-dark)` (se inyectan en `app/boda/[slug]/page.tsx`). Nunca hex hardcodeados — romperías la paleta personalizable.

### Supabase
- Los clientes de Supabase **no lanzan excepciones**: devuelven `{ data, error }`. Comprueba SIEMPRE `error` tras cada mutación; un `try/catch` solo no detecta fallos (p.ej. políticas RLS faltantes fallan en silencio).
- Cliente browser: mutaciones del dashboard (protegidas por RLS). Cliente admin (`createAdminClient`): solo en API routes del servidor.
- Toda tabla nueva necesita: RLS habilitado + políticas explícitas por operación + entrada en `schema.sql` como migración idempotente (`CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`).

### Tipos
Todos los tipos compartidos viven en `lib/types.ts`. Si añades una columna a `weddings`: actualiza `schema.sql` (migración idempotente) + interface `Wedding` + indica al usuario el SQL a ejecutar en Supabase.

### Claves de invitados (mesas)
Formato `${rsvpId}_adult_N` / `${rsvpId}_child_N`, usado en `table_assignments`, `guest_relationships` y el algoritmo. Al borrar/editar RSVPs hay que limpiar estas tablas (ver `GuestTable.handleDeletePerson` y el botón Sync de mesas).

### Seguridad
- `/api/rsvp` es público: validación Zod estricta, rate limit por IP, honeypot, verificación de que los menús pertenecen a la boda. Mantén estas defensas al tocarlo.
- URLs externas que se renderizan (Maps, Spotify): valida protocolo/host y codifica parámetros (ver `lib/utils.ts`).
- Entradas de usuario que acaban en estilos (colores): valida formato `#RRGGBB` antes de guardar.

### Idioma y estilo
- UI en español; código (variables, funciones, commits) en inglés.
- Errores al usuario: mensaje en estado del componente (no `console.error` solo). Evita `alert()` en código nuevo.
- Tras cualquier cambio: `npm run check` debe pasar.
