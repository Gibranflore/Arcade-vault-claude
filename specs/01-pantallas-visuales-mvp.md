# Spec 01 — Pantallas visuales del MVP (Arcade Vault)

- **Estado:** implementado
- **Dependencias:** Ninguna (primer spec del proyecto)
- **Fecha:** 2026-07-16

**Objetivo:** Portar al proyecto Next.js (App Router) todas las pantallas visuales de la app de referencia en `app/src/` —biblioteca con los 6 juegos (Snake, Breakout, Space Invaders, Tetris, Pac-Maze, Asteroids), detalle de juego, reproductor y salón de la fama— con navegación real por rutas y datos/auth simulados, sin implementar la lógica de ningún juego.

## Scope

**Dentro del alcance:**
- Ruteo real con Next.js App Router:
  - `/` — Biblioteca (grid de los juegos del MVP, buscador, filtro por categoría, más una sección/tarjetas "Próximamente" para los juegos aún no incluidos).
  - `/juegos/[id]` — Detalle del juego (info, controles, botón "Jugar ahora", leaderboard del juego).
  - `/juegos/[id]/jugar` — Reproductor: mismo marco/HUD de la referencia pero con placeholder "Próximamente" en vez de un juego real.
  - `/salon-de-la-fama` — Tabla de mejores puntuaciones por juego (tabs por juego, solo para los juegos del MVP).
- Navbar con navegación entre Biblioteca y Salón de la Fama, y estado de sesión (autenticado / invitado / sin sesión).
- Modal de autenticación (login, registro, jugar como invitado) con lógica simulada en memoria/localStorage — sin botones de login social (se quitan).
- Fondo animado (grid perspectiva, scanlines, glow) portado de `Background.tsx`.
- Datos de puntuaciones/leaderboard con arreglos de ejemplo hardcodeados por juego del MVP (no hay backend).
- Catálogo de un subconjunto de juegos (entre 3 y 6, de los 6 disponibles en `app/src/lib/games.ts`; nombres exactos pendientes de confirmar), reutilizando textos, colores, iconos y metadatos existentes.
- Página/sección "Próximamente" que lista los juegos restantes (los que no entraron en el subconjunto del MVP) como tarjetas no jugables — sin detalle, sin leaderboard, sin botón activo.

**Fuera del alcance (explícitamente NO se hace):**
- Lógica jugable de cualquier juego (los 6 archivos en `app/src/games/*.tsx` no se portan).
- Integración real con Supabase (auth, tabla `scores`) — no se instala `@supabase/supabase-js` ni se configuran variables de entorno.
- Persistencia real de puntuaciones nuevas (guardar un puntaje en el placeholder del reproductor no hace nada funcional más allá de una simulación visual, si la hay).
- Recuperación de contraseña, verificación de email, o cualquier flujo de auth más allá de login/registro/invitado simulados.
- Responsive/accesibilidad exhaustiva más allá de lo que ya trae la referencia (se hereda tal cual, no se audita de nuevo).
- Leaderboard o detalle para los juegos "Próximamente" (solo aparecen como tarjeta informativa).

## Modelo de datos

No se introduce backend ni base de datos real; los siguientes son estructuras en memoria/localStorage para soportar la UI.

**`GameDef`** (ya existe en `app/src/lib/games.ts`, se reutiliza tal cual):
```ts
type GameCategory = 'Clásico' | 'Acción' | 'Puzzle' | 'Arcade';

type GameDef = {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  category: GameCategory;
  color: string;
  accent: 'cyan' | 'magenta' | 'yellow' | 'green';
  icon: LucideIcon;
  controls: string;
  year: string;
};
```

**`GAMES: GameDef[]`** — se divide en dos listas exportadas desde `lib/games.ts`:
- `GAMES` (subconjunto de 3–6 juegos del MVP, jugables/navegables).
- `COMING_SOON_GAMES` (el resto, solo para la sección "Próximamente").

**`ScoreRow`** (mock, mismo shape que la referencia para no romper componentes):
```ts
type ScoreRow = {
  id: string;
  game_id: string;
  player_name: string;
  score: number;
  user_id: string | null;
  created_at: string;
};
```

**`MOCK_SCORES: Record<string, ScoreRow[]>`** — arreglo hardcodeado de ~5–10 filas de ejemplo por cada juego del MVP, ordenado por score descendente, viviendo en `lib/scores.ts` (reemplaza las llamadas a Supabase por lectura directa de este objeto).

**Auth mock** (`lib/auth.tsx`, mismo contrato público que la referencia — `user`, `guest`, `signIn`, `signUp`, `signOut`, `playAsGuest`, `displayName` — pero:
- `signIn`/`signUp` no llaman a Supabase: simulan éxito siempre (o error si el email/username no cumple validaciones básicas ya existentes) y guardan un "usuario" falso en memoria + localStorage.
- `guest` sigue funcionando igual que en la referencia (ya es local).

## Plan de implementación

1. **Base de datos mock y catálogo.** Crear `app/lib/games.ts` (adaptado de `app/src/lib/games.ts`) exportando `GAMES` (subconjunto MVP) y `COMING_SOON_GAMES`. Crear `app/lib/scores.ts` con `MOCK_SCORES` y funciones `getLeaderboard(gameId)` / `getUserBest(gameId, userId)` que leen del mock en vez de Supabase. El sistema sigue funcional (Home actual no se rompe).

2. **Auth mock.** Crear `app/lib/auth.tsx` con `AuthProvider`/`useAuth` (contrato igual a la referencia) simulando login/registro/invitado en memoria + localStorage, sin `@supabase/supabase-js`. Envolver el layout raíz (`app/layout.tsx`) con `AuthProvider`.

3. **Componentes compartidos.** Portar `Background.tsx`, `Navbar.tsx` y `AuthModal.tsx` a `app/components/` (quitando los botones de login social de `AuthModal`), adaptando `Navbar` para usar `next/link`/`usePathname` en vez del estado `Page` manual.

4. **Ruta `/` (Biblioteca).** Reescribir `app/page.tsx` con el grid de `GameCard` (buscador, filtro por categoría) para los juegos del MVP, más una sección "Próximamente" con tarjetas de `COMING_SOON_GAMES` (no clicables o que llevan a un estado deshabilitado).

5. **Ruta `/juegos/[id]` (Detalle).** Crear `app/juegos/[id]/page.tsx` portando `GameDetail.tsx`: info del juego, leaderboard (desde el mock) y botón "Jugar ahora" que navega a `/juegos/[id]/jugar`. Si el `id` no existe en `GAMES`, `notFound()`.

6. **Ruta `/juegos/[id]/jugar` (Reproductor placeholder).** Crear `app/juegos/[id]/jugar/page.tsx` portando el marco CRT/HUD de `GamePlayer.tsx`, reemplazando el `renderGame()` real por un panel "Próximamente" (icono + texto), manteniendo botón "Salir" funcional hacia el detalle.

7. **Ruta `/salon-de-la-fama`.** Crear `app/salon-de-la-fama/page.tsx` portando `HallOfFame.tsx` con tabs solo para los juegos del MVP, leyendo del mock de puntuaciones.

8. **Limpieza.** Actualizar `app/layout.tsx`/`app/page.tsx` si quedó código de scaffold sin usar; verificar que no queden imports a `app/src/` desde el código nuevo (la carpeta de referencia se deja intacta, sin borrar).

## Criterios de aceptación

- [x] `npm run dev` levanta la app y `/` muestra el grid de juegos del MVP (3–6 tarjetas) más una sección "Próximamente" con el resto de juegos.
- [x] El buscador y el filtro por categoría en `/` filtran correctamente las tarjetas del catálogo MVP.
- [x] Clic en una tarjeta o en "Jugar" navega a `/juegos/[id]` mostrando info, controles y leaderboard mock de ese juego.
- [x] Botón "Jugar ahora" en `/juegos/[id]` navega a `/juegos/[id]/jugar`, que muestra el marco CRT/HUD con un panel "Próximamente" en vez de un juego jugable.
- [x] Botón "Salir" en `/juegos/[id]/jugar` regresa a `/juegos/[id]`.
- [x] Visitar `/juegos/id-invalido` muestra la página 404 de Next (`notFound()`).
- [x] `/salon-de-la-fama` muestra tabs solo de los juegos del MVP, cada uno con su tabla de puntuaciones mock ordenada de mayor a menor.
- [x] El modal de autenticación permite: iniciar sesión (simulado), registrarse (simulado) y jugar como invitado; no muestra botones de Google/GitHub.
- [x] Tras "iniciar sesión" o "jugar como invitado", el Navbar muestra el nombre del usuario y un botón de salir; al recargar la página, la sesión simulada persiste (localStorage).
- [x] `npm run lint` pasa sin errores nuevos.
- [x] No hay ninguna llamada de red a Supabase ni variables de entorno de Supabase requeridas para que la app funcione.
- [x] Las tarjetas "Próximamente" en `/` no navegan a ninguna ruta de detalle/juego.

## Decisiones tomadas y descartadas

- **Rutas reales de Next.js App Router** en vez de una sola página con estado (como en la referencia Vite). Justificación: es el patrón nativo de Next, da URLs compartibles/back-forward del navegador, y es más fiel al alcance real del proyecto (no un SPA embebido).
- **Auth simulada en memoria/localStorage** en vez de Supabase real. Justificación: el spec es explícitamente "solo la parte visual"; conectar Supabase real requeriría credenciales, esquema de base de datos y quedaría fuera de un MVP visual.
- **Puntuaciones mock hardcodeadas** en vez de estado vacío. Justificación: las pantallas de leaderboard se ven mejor y son más demostrables con datos de ejemplo; se descarta "siempre vacío" porque no permite validar visualmente el ranking, medallas, etc.
- **Reproductor como placeholder "Próximamente"** en vez de simular todos los estados de juego (idle/jugando/pausa/game over) con puntaje falso. Justificación: decisión explícita del usuario — mantiene el MVP simple y evita construir una simulación que luego habría que desechar al implementar juegos reales.
- **Botón "Jugar ahora" queda activo** y navega al placeholder, en vez de deshabilitarse. Justificación: permite demostrar el flujo de navegación completo biblioteca → detalle → reproductor.
- **Se quitan los botones de login social (Google/GitHub)** del modal de auth. Justificación: no hay auth real, y dejarlos decorativos sería confuso para un MVP.
- **Catálogo reducido a un subconjunto de 3–6 juegos** (nombres exactos pendientes) más una sección "Próximamente" para el resto. Justificación: decisión explícita del usuario para acotar el MVP inicial sin descartar los demás juegos del catálogo de referencia.
- **Se descarta borrar `app/src/`.** Justificación: sigue siendo la referencia visual/funcional completa (incluye los juegos reales); se mantiene intacta como material de consulta para specs futuros que sí implementen juegos.

## Riesgos identificados

- **Confusión futura entre auth/puntuaciones mock y las reales.** Si un spec futuro implementa Supabase de verdad, el localStorage mock actual (`arcade_vault_guest`, sesión simulada) puede chocar con claves o suposiciones nuevas. Mitigación: usar un prefijo de clave distinto (p. ej. `mock_`) y documentarlo en el propio código.
- **El subconjunto de juegos del MVP aún no tiene nombres confirmados.** Hasta que se definan, no se puede fijar qué entra en `GAMES` vs `COMING_SOON_GAMES`. Esto bloquea el paso 1 del plan de implementación hasta recibir esa lista.
- **Divergencia visual con la referencia con el tiempo.** Al vivir dos copias del diseño (`app/src/` y `app/`), un cambio de estilo futuro en una puede no reflejarse en la otra. Se acepta como riesgo conocido dado que `app/src/` se conserva solo como referencia, no como código activo.
