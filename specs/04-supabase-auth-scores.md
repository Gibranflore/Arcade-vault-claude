# SPEC 04 — Integración de Supabase (Auth + Scores)

> **Estado:** Aprobado
> **Dependencias:** Spec 01 (pantallas visuales del MVP — AuthModal, HallOfFame, GamePlayer mock)
> **Fecha:** 2026-07-25
> **Objetivo:** Reemplazar el auth mock (localStorage) y los scores mock hardcodeados por integración real con Supabase (Auth + tabla `scores` con RLS), manteniendo la misma interfaz de `useAuth()` y el modo invitado 100% local.

## Scope

**Dentro del alcance:**

- Instalar `@supabase/supabase-js` y `@supabase/ssr` como dependencias de producción.
- Clientes de Supabase para Next.js App Router: `app/lib/supabase/client.ts` (browser, para Client Components) y `app/lib/supabase/server.ts` (server, con cookies vía `next/headers`, para Server Components/Actions).
- `proxy.ts` en la raíz del proyecto (el archivo que en Next.js 16 reemplaza a `middleware.ts` — ver `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`) para refrescar la sesión de Supabase en cada request.
- Migración SQL (vía `mcp__supabase__apply_migration`) que crea:
  - Tabla `profiles` (`id uuid` referenciando `auth.users.id`, `username text`, `created_at timestamptz`).
  - Trigger `on_auth_user_created` que inserta en `profiles` al hacer signup, tomando `username` de `raw_user_meta_data`.
  - Tabla `scores` (`id uuid`, `game_id text`, `user_id uuid` referenciando `auth.users.id`, `score integer`, `created_at timestamptz`) — sin `player_name` propio; el nombre se resuelve via join/lookup a `profiles.username`.
  - RLS en `profiles`: `SELECT` público, `UPDATE` solo del propio usuario (`auth.uid() = id`).
  - RLS en `scores`: `SELECT` público (necesario para el leaderboard), `INSERT` solo si `auth.uid() = user_id`. Sin `UPDATE`/`DELETE` para nadie salvo `service_role`.
- Reescribir `app/lib/auth.tsx` para usar Supabase Auth real (`signInWithPassword`, `signUp` con `options.data.username`, `signOut`, `onAuthStateChange` para mantener sesión sincronizada), conservando exactamente la misma interfaz pública (`user`, `guest`, `signIn`, `signUp`, `signOut`, `playAsGuest`, `displayName`) para no tocar los componentes consumidores (`AuthModal`, `Navbar`, `GameDetail`, `GamePlayer`, `HallOfFame`).
- Confirmación de email **desactivada** (se documenta como paso manual de configuración en el dashboard de Supabase, ya que no es controlable por migración SQL).
- El modo invitado (`playAsGuest`) se mantiene exactamente igual: 100% local, sin fila en Supabase, sin sesión — sigue usando `localStorage` (`mock_arcade_vault_guest`).
- Reescribir `app/lib/scores.ts` para leer de Supabase real: `getLeaderboard(gameId, limit)` y `getUserBest(gameId, userId)` pasan a ser funciones `async` que consultan la tabla `scores` (con join a `profiles` para el username), en vez de leer `MOCK_SCORES`.
- Agregar `submitScore(gameId, userId, score)` en `app/lib/scores.ts` que hace el `INSERT` real contra Supabase — se crea pero **no se conecta a ningún juego todavía** (los juegos siguen mostrando "PRÓXIMAMENTE" en `GamePlayer.tsx`).
- Actualizar `HallOfFame.tsx` para manejar los nuevos `getLeaderboard`/`getUserBest` async (estado de carga mientras se resuelve la consulta).
- Actualizar `.env.example` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (vacíos), documentando que van en `.env.local`.
- Verificación funcional con Playwright: signup, login, logout y estado vacío del Salón de la Fama contra el proyecto Supabase real ya conectado (`jmnrxworahnuzuvjedty.supabase.co`).
-  Añadir `NEXT_PUBLIC_SUPABASE_UR` y `SUPABASE_KEY_PASSWORD` los encuentas en `.env` y envialos a `.env.example` vacios como ejemplos( los dev lo llenen manualmente )

**Fuera de alcance (explícitamente NO se hace):**

- Conectar `submitScore` a ningún juego real — los juegos (`AsteroidsGame.tsx`, `BreakoutGame.tsx`, etc. en `app/src/games/`) no están portados a `app/` todavía; eso es un spec futuro de "gameplay real".
- Migrar las puntuaciones mock (`NEO_VIPER`, `PIXELQUEEN`, etc.) a la tabla real — se descartan; la tabla `scores` empieza vacía.
- Login social (Google, GitHub, etc.) — solo email/contraseña, igual que el mock actual.
- Recuperación de contraseña ("olvidé mi contraseña") — no existe en el mock actual, no se agrega aquí.
- Editar perfil (cambiar username/avatar después del registro) — `profiles` se crea en signup y no se edita en este spec.
- Confirmación de email por UI (pantalla "revisa tu correo") — se desactiva la confirmación en el dashboard de Supabase en vez de construir esa pantalla.
- Rate limiting o protección anti-abuso más allá de las políticas RLS de Supabase Auth por defecto.
- Cualquier cambio a `app/components/Navbar.tsx` más allá de que siga funcionando con la nueva forma de `useAuth()` (no se le agrega UI nueva).

## Modelo de datos

### Tablas nuevas en Supabase (Postgres, esquema `public`)

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  created_at timestamptz not null default now()
);

create table public.scores (
  id uuid primary key default gen_random_uuid(),
  game_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  score integer not null check (score >= 0),
  created_at timestamptz not null default now()
);

create index scores_game_id_score_idx on public.scores (game_id, score desc);
```

Trigger para poblar `profiles` automáticamente al registrarse (lee `username` de `raw_user_meta_data`, el mismo campo que llena `signUp(email, password, { options: { data: { username } } })`):

```sql
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

RLS:

```sql
alter table public.profiles enable row level security;
create policy "profiles_select_public" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

alter table public.scores enable row level security;
create policy "scores_select_public" on public.scores for select using (true);
create policy "scores_insert_own" on public.scores for insert with check (auth.uid() = user_id);
```

### Tipos TypeScript (`app/lib/scores.ts`)

```ts
type ScoreRow = {
  id: string;
  game_id: string;
  user_id: string;
  score: number;
  created_at: string;
  player_name: string; // resuelto vía join a profiles.username
};
```

### Forma de `useAuth()` (sin cambios respecto al mock, `app/lib/auth.tsx`)

```ts
type SupabaseUser = { id: string; email: string; username: string };
type GuestProfile = { id: string; name: string; isGuest: true };

type AuthContextType = {
  user: SupabaseUser | null;
  guest: GuestProfile | null;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    username: string,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  playAsGuest: (name: string) => void;
  displayName: string;
};
```

`user` ahora se construye combinando la sesión de Supabase Auth (`id`, `email`) con la fila correspondiente de `profiles` (`username`), en vez de venir de `localStorage`. `guest` no cambia: sigue siendo puramente local.

## Plan de implementación

1. **Dependencias y variables de entorno.** Instalar `@supabase/supabase-js` y `@supabase/ssr` (`npm install`). Actualizar `.env.example` con `NEXT_PUBLIC_SUPABASE_URL=` y `NEXT_PUBLIC_SUPABASE_ANON_KEY=` vacíos, documentando que van en `.env.local` con los valores del proyecto `jmnrxworahnuzuvjedty`. El sistema sigue funcional (nada usa estas variables todavía).

2. **Migración de base de datos.** Aplicar la migración SQL (tablas `profiles`/`scores`, trigger `handle_new_user`, políticas RLS) vía `mcp__supabase__apply_migration` contra el proyecto ya conectado. Verificar con `mcp__supabase__list_tables` que ambas tablas y sus políticas quedaron creadas. El sistema sigue funcional (la app todavía usa los mocks).

3. **Clientes de Supabase.** Crear `app/lib/supabase/client.ts` (`createBrowserClient` de `@supabase/ssr`) y `app/lib/supabase/server.ts` (`createServerClient` con cookies de `next/headers`). Crear `proxy.ts` en la raíz para refrescar la sesión en cada request, siguiendo el patrón oficial de `@supabase/ssr` para Next.js adaptado al archivo `proxy.ts` (no `middleware.ts`, deprecado en esta versión de Next). El sistema sigue funcional (clientes creados pero aún no usados por `auth.tsx`).

4. **Reescribir `app/lib/auth.tsx`.** Reemplazar la implementación de `localStorage` por llamadas reales: `signIn` → `supabase.auth.signInWithPassword`; `signUp` → `supabase.auth.signUp({ email, password, options: { data: { username } } })`; `signOut` → `supabase.auth.signOut()`; se suscribe a `supabase.auth.onAuthStateChange` para mantener `user` sincronizado, resolviendo `username` con una consulta a `profiles` por `id`. `playAsGuest` no se toca (sigue en `localStorage`). Mapear errores de Supabase (`Invalid login credentials`, `User already registered`, etc.) a los mismos strings que ya esperan `AuthModal.tsx`. El sistema sigue funcional: signup/login/logout reales ya operan contra Supabase.

5. **Reescribir `app/lib/scores.ts`.** Reemplazar `MOCK_SCORES` por `getLeaderboard(gameId, limit)` y `getUserBest(gameId, userId)` como funciones `async` que consultan `scores` con join a `profiles.username`, ordenando por `score desc`. Agregar `submitScore(gameId, userId, score)` (INSERT real), sin conectarla a ningún juego todavía. El sistema sigue funcional (tabla vacía, leaderboard real mostrará "SIN PUNTUACIONES AÚN").

6. **Actualizar `HallOfFame.tsx`.** Adaptar el componente para manejar las nuevas funciones async (estado de carga mientras resuelve la consulta a Supabase), manteniendo el resto de la UI (tabs de juego, medallas, fila "tu mejor marca") igual. El sistema sigue funcional y visualmente equivalente al mock, ahora contra datos reales (vacíos).

7. **Verificación funcional con Playwright.** Levantar `npm run dev`. Con el MCP de Playwright: registrar un usuario nuevo (signup sin confirmación de email, sesión activa inmediata), verificar que aparece en `profiles` (vía `mcp__supabase__execute_sql`), cerrar sesión, volver a iniciar sesión con las mismas credenciales, y confirmar que `/salon-de-la-fama` muestra "SIN PUNTUACIONES AÚN" para los 3 juegos sin lanzar errores. Confirmar también que "Jugar como invitado" sigue funcionando sin crear ninguna fila en Supabase.

## Criterios de aceptación

- [ ] `npm run dev` levanta la app sin errores con las nuevas variables `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` en `.env.local`.
- [ ] Las tablas `profiles` y `scores` existen en el proyecto Supabase conectado, con RLS habilitado y las políticas descritas en el modelo de datos (verificable con `mcp__supabase__list_tables` / `mcp__supabase__get_advisors`).
- [ ] Registrar un usuario nuevo desde `AuthModal` (tab "Crear cuenta") crea una sesión activa inmediatamente (sin pantalla de "revisa tu correo") y una fila correspondiente en `profiles` con el `username` ingresado.
- [ ] Intentar registrarse con un correo ya usado muestra el mismo mensaje "Este correo ya está registrado" que mostraba el mock.
- [ ] Cerrar sesión y volver a iniciar sesión con las mismas credenciales (tab "Iniciar sesión") funciona y restaura `displayName` con el username correcto.
- [ ] Iniciar sesión con credenciales inválidas muestra "Credenciales inválidas", igual que el mock.
- [ ] Recargar la página (F5) con una sesión activa mantiene al usuario logueado (la sesión persiste vía cookies, no se pierde por SSR).
- [ ] "Jugar como invitado" sigue funcionando exactamente igual que antes (nombre local, `displayName` lo refleja) y no crea ninguna fila en `profiles` ni `scores`.
- [ ] `/salon-de-la-fama` para cada uno de los 3 juegos (Snake, Breakout, Tetris) muestra el estado "SIN PUNTUACIONES AÚN" sin errores en consola, leyendo la tabla `scores` real (vacía).
- [ ] `submitScore(gameId, userId, score)` existe en `app/lib/scores.ts`, compila sin errores de tipos, y no está importada/usada por ningún componente de juego todavía.
- [ ] Un `INSERT` manual de prueba en `scores` con un `user_id` distinto al autenticado es rechazado por RLS (verificable vía `mcp__supabase__execute_sql` simulando el intento, o revisando que la política `scores_insert_own` existe y referencia `auth.uid() = user_id`).
- [ ] `RESEND_API_KEY`/`CONTACT_EMAIL_TO` (spec 03) siguen funcionando sin cambios — este spec no toca `app/lib/actions/contact.ts`.
- [ ] `npm run lint` pasa sin errores nuevos.
- [ ] Verificación funcional con Playwright realizada: signup → sesión activa → logout → login → estado vacío del leaderboard, todo contra el proyecto Supabase real, antes de cerrar el spec.

## Decisiones tomadas y descartadas

- **`@supabase/ssr` (browser + server client) en vez de un único `createClient` tipo Vite.** Justificación: decisión explícita del usuario — es el patrón oficial de Supabase para Next.js App Router y necesario para que la sesión persista correctamente vía cookies con SSR/Server Components.
- **`proxy.ts` en vez de `middleware.ts`.** Justificación: en Next.js 16 (la versión instalada) `middleware.ts` fue renombrado a `proxy.ts` — la funcionalidad es la misma, pero el nombre de archivo cambió (ver `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`). Usar el nombre viejo simplemente no sería reconocido por el framework.
- **Tabla `profiles` separada en vez de `user_metadata` en `auth.users`.** Justificación: decisión explícita del usuario — permite que el leaderboard haga join por SQL directo (`scores.user_id → profiles.username`) sin depender de llamadas admin a `auth.users`, que no es accesible desde el cliente anónimo.
- **Confirmación de email desactivada (config del dashboard, no código).** Justificación: decisión explícita del usuario para simplificar el MVP — el signup deja sesión activa de inmediato, igual que el mock actual. Se documenta como paso manual porque no es una migración SQL ni código de la app.
- **Modo invitado se mantiene 100% local, sin tocar Supabase.** Justificación: decisión explícita del usuario — el invitado no compite por el Salón de la Fama hoy (mensaje ya existente en `AuthModal`), así que no necesita sesión ni fila en `profiles`/`scores`.
- **`submitScore` se crea pero no se conecta a ningún juego.** Justificación: los juegos reales (`app/src/games/*.tsx`) no están portados a `app/` todavía — `GamePlayer.tsx` sigue mostrando "PRÓXIMAMENTE". Conectar el guardado real de puntuación es responsabilidad de un spec futuro de gameplay.
- **Datos mock de `scores.ts` se descartan, no se migran como seed.** Justificación: decisión explícita del usuario — evita poblar la base real con jugadores ficticios (`NEO_VIPER`, etc.) que no representan usuarios reales del sistema de auth.
- **RLS: INSERT en `scores` solo si `auth.uid() = user_id`, sin inserción anónima.** Justificación: decisión explícita del usuario — evita que cualquiera falsifique el leaderboard llamando directamente a la API de Supabase sin pasar por una sesión autenticada real.
- **Se mantiene la interfaz pública de `useAuth()` sin cambios.** Justificación: minimiza el blast radius del spec — `AuthModal`, `Navbar`, `GameDetail`, `GamePlayer` y `HallOfFame` no necesitan tocarse en su lógica de consumo, solo `HallOfFame` cambia por la naturaleza async de las nuevas consultas.

## Riesgos identificados

| Riesgo                                                                                                                                                                                                                  | Mitigación                                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| El trigger `handle_new_user` falla silenciosamente si `raw_user_meta_data` no trae `username` (ej. si `signUp` se llama sin `options.data.username`).                                                                   | `app/lib/auth.tsx` siempre pasa `username` en el `signUp`; se verifica en el paso 7 (Playwright) que la fila en `profiles` se crea con el valor correcto antes de cerrar el spec.                            |
| Confirmación de email queda activada por defecto en un proyecto Supabase nuevo — si no se desactiva manualmente en el dashboard, el signup no dejará sesión activa y el criterio de aceptación correspondiente fallará. | Paso explícito documentado en Scope/Plan: desactivar "Confirm email" en Authentication → Providers → Email antes de la verificación funcional.                                                               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` es pública por diseño (va al bundle del cliente) — si RLS está mal configurado, cualquiera podría leer/escribir de más.                                                                 | Las políticas RLS del modelo de datos son explícitas y mínimas (SELECT público, INSERT solo del propio usuario); se verifica con `mcp__supabase__get_advisors` antes de cerrar el spec.                      |
| Pérdida de sesión al recargar si las cookies no se propagan bien entre `proxy.ts` y los Server Components.                                                                                                              | Seguir el patrón oficial de `@supabase/ssr` para App Router (browser client + server client + refresh en proxy); se verifica explícitamente en el criterio de aceptación de "recargar con sesión activa".    |
| `SUPABASE_KEY_PASSWORD` ya presente en `.env` (contraseña de la base de datos) podría confundirse con las nuevas variables `NEXT_PUBLIC_SUPABASE_*`.                                                                    | Solo se agregan `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` a `.env.example`; `SUPABASE_KEY_PASSWORD` no se toca ni se usa en código de la app (es de acceso directo a Postgres, no del SDK). |
