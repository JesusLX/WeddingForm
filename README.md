# 💍 Wedding RSVP — SaaS de invitaciones de boda

Plataforma multi-pareja para crear páginas de invitación de boda con confirmación de asistencia (RSVP). Cada pareja gestiona su boda desde un panel privado; los invitados acceden a una página pública personalizada y confirman sin necesidad de registrarse.

## Funcionalidades

- **Página pública personalizable** (`/boda/[slug]`): portada con cuenta atrás, historia, ubicaciones con mapa, programa del día, galería, código de vestimenta, playlist de Spotify, regalos (IBAN) y FAQ
- **Paleta de colores personalizable** por boda (presets + colores propios)
- **Formulario RSVP** multi-persona: adultos y niños con nombre, menú y alergias individuales, autobús ida/vuelta, sugerencia de canción
- **Panel de administración**: estadísticas, configuración, menús, programa, galería con reordenación, lista de invitados esperados con import CSV, confirmaciones con detección de duplicados y export CSV
- **Distribución de mesas**: grafo interactivo de relaciones (misma mesa / se conocen / separar) con asignación automática y ajuste manual por arrastre
- **Integraciones**: Google Sheets (sincronización de respuestas), Spotify (playlist embebida)

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Supabase (Auth, PostgreSQL con RLS, Storage) · Google Sheets API · Zod · D3

## Puesta en marcha

1. **Dependencias**
   ```bash
   npm install
   ```

2. **Supabase**
   - Crea un proyecto en [supabase.com](https://supabase.com)
   - Ejecuta `supabase/schema.sql` en el editor SQL (es idempotente: sirve para crear desde cero y para migrar)
   - Crea un bucket de Storage público llamado `wedding-photos`

3. **Variables de entorno** (`.env.local`)
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...          # solo servidor, para /api/rsvp
   GOOGLE_SERVICE_ACCOUNT_JSON='{...}'    # opcional, integración Google Sheets
   ```

4. **Desarrollo**
   ```bash
   npm run dev
   ```

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run check` | Typecheck + lint (ejecutar antes de commitear) |
| `npm run build` | Build de producción |

## Arquitectura

La documentación de arquitectura y las convenciones de desarrollo están en [`AGENTS.md`](./AGENTS.md). Resumen:

- `app/boda/[slug]/` — página pública (server-rendered, theming vía CSS variables)
- `app/dashboard/` — panel privado (patrón: `page.tsx` servidor + `XxxManager.tsx` cliente)
- `app/api/rsvp/` — endpoint público con validación Zod, rate limiting y honeypot
- `lib/` — tipos, clientes Supabase, helpers de auth (`requireWedding`), tokens de diseño, algoritmo de mesas
- `supabase/schema.sql` — fuente de verdad del esquema (RLS multi-tenant)
