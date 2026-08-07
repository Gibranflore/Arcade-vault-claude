# Spec 06 — Leaderboard mejorado y tabla de juegos

- **Estado:** Implementado
- **Dependencias:** Spec 01 (catálogo de juegos, GameCard), Spec 04 (Supabase Auth + Scores, tabla `scores`, `getLeaderboard`/`getUserBest`), Spec 05 (Asteroids jugable)
- **Fecha:** 2026-07-31

**Objetivo:** Agregar un filtro de rango de fecha y el rango global del usuario al leaderboard existente (`/salon-de-la-fama`), y agregar una vista alternativa en tabla (con toggle) al catálogo de juegos en `/`.

## Scope

**Dentro del alcance:**

- `getLeaderboard(gameId, limit, range?)` en `app/lib/scores.ts`: nuevo parámetro opcional `range: 'today' | 'week' | 'month' | 'all'` (default `'all'`), que filtra los resultados por `created_at` antes de ordenar por `score desc`.
- Nueva función `getUserRank(gameId, userId)` en `app/lib/scores.ts`: calcula el puesto global histórico (sin filtro de fecha) del mejor puntaje del usuario para ese juego, contando cuántos puntajes son estrictamente mayores y sumando 1.
- `HallOfFame.tsx`: agrega botones de filtro de rango de fecha ("Hoy" / "Semana" / "Mes" / "Siempre", default "Siempre") junto a los tabs de juego. El filtro solo afecta la tabla top-10 visible.
- `HallOfFame.tsx`: el bloque "TU MEJOR MARCA" ahora siempre muestra el rango global histórico del usuario (vía `getUserRank`), incluso si su mejor puntaje no aparece en el top-10 filtrado visible.
- Nuevo componente `app/components/GameTable.tsx`: vista de tabla de los juegos jugables (`GAMES`), con columnas Título / Categoría / Año / Controles / Mejor puntaje (mismo dato que ya calcula `GameCard` vía `getLeaderboard(game.id, 1)`). Cada fila es clickeable y navega a `/juegos/[id]`.
- `app/page.tsx`: agrega un toggle "Cards / Tabla" sobre la sección de juegos jugables. El toggle respeta la búsqueda y el filtro de categoría ya existentes (misma lista `filtered` alimenta ambas vistas).
- Verificación funcional con Playwright: alternar el toggle Cards/Tabla y confirmar que la tabla muestra los juegos filtrados; en `/salon-de-la-fama`, cambiar el filtro de fecha y confirmar que la tabla top-10 cambia; confirmar que el rango global del usuario se muestra aunque no esté en el top-10 visible.

**Fuera de alcance (explícitamente NO se hace):**

- Ranking global combinado entre todos los juegos (leaderboard agregado por jugador) — se descarta explícitamente, el leaderboard sigue siendo por-juego.
- CRUD/administración de juegos (agregar/editar/eliminar) — `GAMES`/`COMING_SOON_GAMES` siguen hardcodeados en `app/lib/games.ts`.
- Paginación o "ver más" para ver más de las 10 posiciones del leaderboard — solo se agrega el filtro de fecha y el rango global, no más posiciones visibles.
- Ordenar la tabla de juegos por columna (click en encabezado) — no se pidió, el orden es el mismo que usa el grid de cards.
- La sección "Próximamente" no se ve afectada por el toggle — se mantiene siempre en cards.
- Cambios al esquema de la tabla `scores`, RLS, o a `submitScore`.
- Rediseño específico para móvil de la tabla más allá de scroll horizontal responsivo estándar.

## Modelo de datos

No se introducen tablas nuevas. Se extiende la firma de funciones ya existentes en `app/lib/scores.ts`:

```ts
export type DateRange = "today" | "week" | "month" | "all";

export async function getLeaderboard(
  gameId: string,
  limit = 10,
  range: DateRange = "all",
): Promise<ScoreRow[]>;
// range filtra por created_at >= inicio del período correspondiente (hora local),
// 'all' no aplica filtro (comportamiento actual sin cambios).

export async function getUserRank(
  gameId: string,
  userId: string,
): Promise<number | null>;
// Cuenta scores.game_id = gameId AND score > (mejor score del usuario para ese juego),
// devuelve count + 1. Devuelve null si el usuario no tiene ningún score en ese juego.
// Siempre histórico (range='all' implícito, no acepta parámetro de fecha).
```

`GameTable.tsx` no introduce tipos nuevos: consume `GameDef` (`app/lib/games.ts`) y `ScoreRow` (`app/lib/scores.ts`), igual que `GameCard.tsx`.

`app/page.tsx` agrega únicamente estado de UI local (`const [view, setView] = useState<'cards' | 'table'>('cards')`), no persistido.

## Plan de implementación

1. **Filtro de fecha en `getLeaderboard`.** Agregar el parámetro `range: DateRange = 'all'` a `getLeaderboard` en `app/lib/scores.ts`, calculando el timestamp de corte según `'today'/'week'/'month'` y añadiendo `.gte('created_at', cutoff)` a la query cuando `range !== 'all'`. El sistema sigue funcional: todos los llamadores actuales (`HallOfFame`, `GameCard`) no pasan el parámetro y mantienen el comportamiento actual.

2. **Rango global del usuario.** Agregar `getUserRank(gameId, userId)` en `app/lib/scores.ts`: primero resuelve el mejor score del usuario (reutilizando `getUserBest`), luego cuenta cuántas filas de `scores` tienen `game_id = gameId AND score > mejorScore`, devuelve `count + 1` (o `null` si no tiene score). El sistema sigue funcional (función nueva, aún no usada).

3. **Filtro de fecha en `HallOfFame.tsx`.** Agregar botones "Hoy / Semana / Mes / Siempre" (estado local `range`, default `'all'`) junto a los tabs de juego. Al cambiar `selectedGame` o `range`, volver a llamar `getLeaderboard(selectedGame.id, 10, range)`. El sistema sigue funcional: la tabla top-10 ahora respeta el filtro elegido.

4. **Rango global en "TU MEJOR MARCA".** Reemplazar el cálculo actual de `userRank` (que solo busca dentro de `scores` ya cargado) por una llamada a `getUserRank(selectedGame.id, user.id)`, mostrando el resultado aunque el usuario no aparezca en el top-10 visible. El sistema sigue funcional.

5. **Componente `GameTable.tsx`.** Crear `app/components/GameTable.tsx`: recibe una lista de `GameDef[]` (misma lista filtrada que ya usa el grid de cards) y renderiza una tabla con columnas Título / Categoría / Año / Controles / Mejor puntaje (usando `getLeaderboard(game.id, 1)` por fila, igual que `GameCard`). Cada fila navega a `/juegos/[id]` con `Link`. El sistema sigue funcional (componente nuevo, aún no importado en ninguna ruta).

6. **Toggle Cards/Tabla en `app/page.tsx`.** Agregar estado `view: 'cards' | 'table'` con dos botones de alternancia sobre la sección de juegos jugables. Cuando `view === 'table'`, renderizar `<GameTable games={filtered} />` en vez del grid de `GameCard`; la sección "Próximamente" no cambia (siempre cards). El sistema sigue funcional: ambas vistas comparten la misma lista `filtered` (búsqueda + categoría).

7. **Verificación funcional con Playwright.** Levantar `npm run dev`. En `/`, alternar el toggle Cards/Tabla, confirmar que la tabla muestra los mismos juegos que el grid filtrado (probar con búsqueda/categoría activa) y que hacer click en una fila navega a `/juegos/[id]`. En `/salon-de-la-fama`, cambiar el filtro de fecha y confirmar que la tabla visible cambia (o queda vacía si no hay puntajes en el rango); si hay un usuario con puntaje fuera del top-10, confirmar que su rango global se muestra en "TU MEJOR MARCA".

## Criterios de aceptación

- [x] `npm run dev` levanta la app sin errores.
- [x] `/salon-de-la-fama` muestra botones de filtro "Hoy / Semana / Mes / Siempre" junto a los tabs de juego, con "Siempre" seleccionado por defecto.
- [x] Cambiar el filtro de fecha vuelve a consultar el leaderboard y actualiza la tabla top-10 mostrada (o muestra "SIN PUNTUACIONES AÚN" si no hay puntajes en ese rango).
- [x] Cambiar de juego (tabs) resetea o reconsulta correctamente el filtro de fecha activo, sin mezclar resultados del juego anterior.
- [ ] Con sesión iniciada, el bloque "TU MEJOR MARCA" muestra el rango global histórico del usuario (`Rango #N`) aunque su mejor puntaje no esté entre las 10 filas visibles del filtro de fecha actual. **(Pendiente de verificación manual — requiere sesión con un usuario real; lógica implementada vía `getUserRank`.)**
- [x] Si el usuario no tiene ningún puntaje registrado para el juego seleccionado, no se muestra el bloque "TU MEJOR MARCA" (comportamiento actual, sin cambios).
- [x] `/` muestra un toggle "Cards / Tabla" sobre la sección de juegos jugables, con "Cards" como vista inicial por defecto.
- [x] Al seleccionar "Tabla", se reemplaza el grid de cards por una tabla con columnas Título, Categoría, Año, Controles y Mejor puntaje, para los mismos juegos que mostraría el grid (respetando búsqueda y filtro de categoría activos).
- [x] Hacer click en una fila de la tabla navega a `/juegos/[id]` del juego correspondiente.
- [x] La sección "PRÓXIMAMENTE" se mantiene siempre en cards, sin importar el toggle seleccionado.
- [x] Alternar el toggle no rompe ni duplica las consultas de "mejor puntaje" por juego (cada vista dispara sus propias consultas de forma independiente).
- [x] `npm run lint` pasa sin errores nuevos.
- [x] Verificación funcional con Playwright realizada: toggle Cards/Tabla con navegación de fila, y filtro de fecha en `/salon-de-la-fama`, antes de cerrar el spec. Rango global queda documentado como verificación manual (ver ítem anterior).

## Decisiones tomadas y descartadas

- **Filtro de fecha solo afecta la tabla top-10 visible; el rango global del usuario siempre es histórico.** Justificación: decisión explícita del usuario — evita la confusión de "por qué mi rango cambia si mi puntaje no cambió" cuando en realidad solo cambiaría por el filtro de fecha.
- **No se agrega un leaderboard global combinado entre juegos.** Justificación: decisión explícita del usuario — el leaderboard sigue siendo por-juego (`selectedGame`), un ranking agregado de jugadores es una feature distinta que merece su propio spec si se decide construir.
- **La tabla de juegos no reemplaza el grid de cards, sino que convive como vista alternable (toggle).** Justificación: decisión explícita del usuario — conserva el diseño visual actual (cards con thumbnail/hover 3D) como default y agrega la tabla como opción de densidad de información, sin descartar trabajo ya hecho en `GameCard.tsx`.
- **La tabla de juegos no es un CRUD/admin de juegos.** Justificación: decisión explícita del usuario — `GAMES`/`COMING_SOON_GAMES` siguen hardcodeados en `app/lib/games.ts`; gestionar juegos dinámicamente desde Supabase es un cambio de arquitectura mayor, fuera de alcance de este spec.
- **La tabla no soporta ordenar por columna (click en encabezado).** Justificación: no se solicitó; mantiene el mismo orden que ya usa el grid de cards (orden de `GAMES` filtrado), evitando estado adicional de sorting sin un caso de uso claro.
- **"Próximamente" se mantiene siempre en cards, sin toggle.** Justificación: decisión explícita del usuario — son juegos no jugables (sin leaderboard, sin `/juegos/[id]` real), una tabla con columna "Mejor puntaje" siempre vacía no aporta valor ahí.
- **No se agrega paginación ni "ver más" al leaderboard (solo filtro de fecha + rango global).** Justificación: de las mejoras posibles ofrecidas, el usuario eligió explícitamente estas dos y no la de "más posiciones + paginación"; mantiene el cambio acotado.

## Riesgos identificados

| Riesgo                                                                                                                                                                                                                                                                 | Mitigación                                                                                                                                                                                                     |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `getUserRank` ejecuta dos consultas (mejor score + conteo de mayores) por render de `HallOfFame`; si se dispara en cada cambio de `selectedGame`/`range` sin cancelación, puede generar carreras de datos (race conditions) mostrando el rango de un juego incorrecto. | Seguir el mismo patrón `cancelled` ya usado en el `useEffect` actual de `HallOfFame.tsx` para descartar respuestas de consultas obsoletas.                                                                     |
| El cálculo de "cutoff" de fecha (`today`/`week`/`month`) depende de la zona horaria del cliente vs. `created_at` en UTC de Postgres, pudiendo mostrar puntajes de "ayer" como "hoy" o viceversa cerca de la medianoche.                                                | Aceptado como riesgo conocido menor — no se implementa lógica de zona horaria del servidor; el corte se calcula en el cliente con `Date` estándar, consistente con `formatDate` ya existente en el componente. |
| Agregar una consulta de "mejor puntaje" por fila en `GameTable.tsx` (igual que ya hace `GameCard.tsx`) duplica el número de requests a Supabase si ambas vistas se montan simultáneamente.                                                                             | Solo una vista (`cards` o `table`) se monta a la vez según el estado `view` en `app/page.tsx`; la vista no activa no se renderiza (sin doble consulta).                                                        |
