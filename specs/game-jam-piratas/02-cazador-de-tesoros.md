# Spec — Cazador de Tesoros

- **Estado:** Draft
- **Dependencias:** Spec 04 (Supabase Auth + Scores — `submitScore`, `getLeaderboard`), Spec 05 (Asteroids jugable — patrón de referencia técnica `app/games/types.ts` + `GAME_COMPONENTS`)
- **Fecha:** 2026-08-27

**Objetivo:** Diseñar `cazador-de-tesoros` — un juego de exploración por cuadrícula donde un pirata recorre una isla envuelta en niebla, desentierra cofres marcados en su mapa mediante un minijuego de precisión, esquiva esqueletos guardianes y arenas movedizas, contrarreloj antes de que la marea inunde la isla — como componente Canvas jugable siguiendo el contrato `GameProps`/`GameHandle` ya establecido en la plataforma.

## Scope

**Dentro del alcance:**

- Nuevo componente `app/games/CazadorDeTesorosGame.tsx`, diseño original sin referencia en `Proyectos/` (se construye desde cero siguiendo el patrón técnico de `AsteroidsGame.tsx`/`TetrisGame.tsx`/`BreakoutGame.tsx`/`FroggerGame.tsx`: `stateRef` con todo el estado mutable, loop vía `requestAnimationFrame`, `keysRef` para input, canvas de resolución lógica fija escalado por CSS).
- Mecánica core distinta a un shooter arcade: movimiento discreto por celdas sobre una cuadrícula fija (isla), niebla de guerra que se revela alrededor del pirata a medida que se desplaza, un minijuego de precisión (barra de temporización) para desenterrar tesoros, y un temporizador de "marea" que inunda progresivamente la isla desde los bordes hacia el centro.
- Generación de la isla por nivel: función `buildIsland(level: number)` que produce una cuadrícula de celdas (`sand`, `quicksand`, `treasureSpot`) de tamaño fijo, con una cantidad de `treasureSpot` proporcional al nivel y distribuidas de forma alcanzable.
- Movimiento del pirata por saltos discretos de una celda (arriba/abajo/izquierda/derecha) con flechas o WASD, un movimiento por pulsación (con cooldown corto), igual de discreto que el movimiento de la rana en Frogger Clásico pero sin restricción de carriles — el pirata puede moverse en cualquier dirección libre del tablero.
- Niebla de guerra: cada celda tiene un estado `revealed`; al entrar el pirata a una celda, se revelan las celdas dentro de un radio fijo alrededor de su posición (ej. radio 2). Las celdas no reveladas se dibujan oscurecidas/ocultas, ocultando la posición real de los `treasureSpot` y guardias hasta acercarse.
- Minijuego de cavado: al presionar `Espacio` estando el pirata sobre una celda `treasureSpot` no excavada, se activa una barra de temporización (`DigMinigame`) que oscila automáticamente entre 0 y 1; una segunda pulsación de `Espacio` detiene la barra — si el valor cae dentro de la zona objetivo (`targetStart`..`targetEnd`), el cofre se excava con éxito (suma puntos, marca la celda como resuelta); si falla, la celda queda disponible para reintentar pero se pierde tiempo (no se penaliza con pérdida de vida).
- Esqueletos guardianes (`Guard`): patrullan rutas fijas predefinidas por celda dentro de la isla (waypoints precalculados al generar el nivel, no pathfinding dinámico); colisionar con un guardián resta una vida al jugador y reposiciona al pirata en la celda de inicio de la isla.
- Arenas movedizas (`quicksand`): pisar una celda de este tipo inmoviliza temporalmente al pirata (no puede moverse durante un `quicksandTimerMs`), sin costar una vida, pero exponiéndolo a guardianes cercanos o a la marea.
- Marea ascendente: a partir de un temporizador de nivel, las celdas del anillo más externo de la isla se marcan como `flooded` de forma progresiva hacia el centro (anillo por anillo); pisar o quedar atrapado (por arena movediza) en una celda inundada resta una vida y reposiciona al pirata en la celda de inicio.
- Sistema de vidas (3 iniciales), reportado vía `onLives`.
- Sistema de puntaje: puntos por cada tesoro excavado con éxito (mayor bonus cuanto más ajustado el acierto en la barra de temporización), penalización leve de tiempo (no de puntos) por intento fallido de cavado. Reportado vía `onScore`.
- Nivel: al excavar todos los `treasureSpot` de la isla actual, sube de nivel (`onLevel`), se genera una nueva isla con `buildIsland(level + 1)` (más celdas, más guardianes, marea más rápida).
- Game over cuando se agotan las 3 vidas (`onGameOver`).
- Sin HUD propio dibujado en canvas (nada de score/vidas/nivel/temporizador de marea pintado por el propio juego más allá de la barra de temporización del minijuego de cavado, que es parte de la mecánica jugable, no un HUD informativo) — vidas/score/nivel se reportan por callbacks, igual que el resto del catálogo.
- `start`/`pause`/`resume`/`reset` expuestos vía `onReady` como `GameHandle`; loop detenido mientras `isPaused` sea `true`.
- Wireo en `app/components/GamePlayer.tsx`: import de `CazadorDeTesorosGame`, entrada `"cazador-de-tesoros": CazadorDeTesorosGame` en `GAME_COMPONENTS`.
- Entrada `cazador-de-tesoros` en `app/lib/games.ts`, dentro de `GAMES` (jugable de inmediato, no `COMING_SOON_GAMES`), con `category: "Arcade"`, `controls: "Flechas o WASD + Espacio (cavar)"`.
- Verificación funcional: navegar a `/juegos/cazador-de-tesoros`, iniciar, confirmar revelado de niebla al moverse, guardianes patrullando, arenas movedizas inmovilizando, minijuego de cavado activándose sobre un `treasureSpot`, marea avanzando, probar pausa y salir.

**Fuera de alcance (explícitamente NO se hace):**

- Sonido/música.
- Soporte táctil/swipe para móvil — solo teclado, igual que el resto del catálogo.
- Pathfinding dinámico de guardianes (persecución activa del jugador) — las rutas de patrulla son fijas y precalculadas por nivel, sin reaccionar a la posición del pirata.
- Mapa/minimapa persistente entre partidas o entre niveles — la niebla se reinicia por completo al generar cada nueva isla.
- Ítems bonus adicionales (brújulas, pistolas, pociones) fuera de tesoros/arena/marea/guardianes descritos arriba.
- Multiplayer o modos alternativos (isla infinita, sin marea, etc.).
- Editor de niveles o islas configurables por el jugador.
- Animaciones de sprite detalladas (arte pixel-art complejo) — se usan formas geométricas simples (rectángulos/polígonos) coloreadas, mismo nivel de fidelidad visual que `BreakoutGame.tsx`/`TetrisGame.tsx`.
- Cambios a `app/lib/scores.ts`, esquema de `scores`, o RLS — se reutiliza tal cual.
- Modificar `AsteroidsGame.tsx`, `TetrisGame.tsx`, `BreakoutGame.tsx`, `FroggerGame.tsx` o `SnakeGame.tsx`.

## Modelo de datos

No se introducen estructuras de persistencia nuevas — se reutiliza `GameDef`/`GAMES` (`app/lib/games.ts`) y `GameProps`/`GameHandle` (`app/games/types.ts`) tal cual.

Estructuras internas nuevas, privadas de `CazadorDeTesorosGame.tsx` (viven en `stateRef`, no se exportan ni se persisten):

```ts
type TileKind = "sand" | "quicksand" | "treasureSpot";

type Tile = {
  kind: TileKind;
  revealed: boolean;
  flooded: boolean;
  dug: boolean; // solo relevante si kind === "treasureSpot"
};

type Waypoint = { col: number; row: number };

type Guard = {
  col: number;
  row: number;
  path: Waypoint[]; // ruta cerrada precalculada al generar el nivel
  pathIndex: number;
  moveCooldownMs: number;
};

type DigMinigame = {
  active: boolean;
  col: number;
  row: number;
  barPos: number; // 0..1, oscila con el tiempo
  barDir: 1 | -1;
  targetStart: number; // 0..1
  targetEnd: number; // 0..1, targetEnd > targetStart
};

type Pirate = {
  col: number;
  row: number;
  x: number; // px lógico, para animación suave entre celdas
  y: number;
  moveCooldownMs: number;
  quicksandTimerMs: number; // > 0 mientras está inmovilizado
};

type TreasureHuntState = {
  status: "idle" | "running" | "paused" | "gameover";
  grid: Tile[][];
  pirate: Pirate;
  guards: Guard[];
  dig: DigMinigame | null;
  treasuresRemaining: number;
  floodTimerMs: number; // cuenta regresiva hasta el próximo avance de marea
  floodRing: number; // anillo (desde el borde) ya inundado
  startCell: Waypoint;
  lives: number;
  score: number;
  level: number;
};
```

## Plan de implementación

1. **Generación de isla, niebla y rutas de guardianes.** Definir dentro de `CazadorDeTesorosGame.tsx` las constantes de grilla (columnas/filas, radio de niebla, número de anillos) y la función `buildIsland(level: number)` que genera `grid`, posiciones de `treasureSpot`/`quicksand`, rutas cerradas de `Guard` (waypoints) y la celda de inicio, con dificultad creciente según `level`. El sistema sigue funcional (archivo aún no importado en ninguna ruta).

2. **Componente base y render estático.** Crear `app/games/CazadorDeTesorosGame.tsx` con el esqueleto de componente (`useRef` para canvas, `stateRef`, `keysRef`, `useEffect` de inicialización), implementando `draw()` para pintar la cuadrícula (celdas reveladas vs. niebla oscurecida), el pirata y los guardianes en una posición estática (sin loop de update aún). El sistema sigue funcional (componente aún no usado en ninguna ruta).

3. **Loop y movimiento discreto del pirata.** Implementar `update(dt)` con `requestAnimationFrame`: input de movimiento discreto de una celda (flechas/WASD) con cooldown, actualización de `revealed` en las celdas dentro del radio de niebla tras cada movimiento, y animación suave de `x`/`y` entre celda origen y destino. Loop respeta `isPaused`. El sistema sigue funcional.

4. **Guardianes y colisión.** Implementar el desplazamiento de cada `Guard` a lo largo de su `path` por celda con `moveCooldownMs` propio, y detección de colisión pirata-guardián (misma celda tras el movimiento de cualquiera de los dos): resta una vida, invoca `onLives`, reposiciona al pirata en `startCell`. El sistema sigue funcional.

5. **Arenas movedizas y marea.** Implementar la inmovilización temporal al pisar `quicksand` (`quicksandTimerMs` regresivo, bloquea input de movimiento mientras es > 0) y el avance de la marea: `floodTimerMs` regresivo por nivel: al llegar a 0, marca como `flooded` el siguiente anillo hacia el centro (empezando por el borde) y reinicia el temporizador para el próximo anillo. Pisar o quedar atrapado en una celda `flooded` resta una vida y reposiciona al pirata en `startCell`. El sistema sigue funcional.

6. **Minijuego de cavado y puntaje.** Implementar la activación de `DigMinigame` al presionar `Espacio` sobre un `treasureSpot` no excavado (`dug === false`), la oscilación automática de `barPos` entre 0 y 1, y la resolución al presionar `Espacio` de nuevo: si `barPos` cae dentro de `[targetStart, targetEnd]`, marca `dug = true`, suma puntos vía `onScore` (bonus mayor cuanto más centrado el acierto), decrementa `treasuresRemaining`; si falla, cierra el minijuego sin marcar `dug` y sin penalización de vidas. El sistema sigue funcional.

7. **Nivel y game over.** Conectar la transición de nivel cuando `treasuresRemaining` llega a 0 (invoca `onLevel`, regenera la isla completa con `buildIsland(level + 1)`, reposiciona al pirata en la nueva `startCell`). Conectar el fin de partida: si `lives` llega a 0, `stateRef.status = "gameover"` e invoca `onGameOver()`. El sistema sigue funcional.

8. **`GameHandle` vía `onReady`.** Exponer `start`/`pause`/`resume`/`reset` que manipulan `stateRef.status` y reinician el estado completo (incluida regeneración de la isla inicial) en `reset()`. El sistema sigue funcional (componente completo y listo para wireo).

9. **Wireo en `GamePlayer.tsx`.** Agregar `import { CazadorDeTesorosGame } from "@/app/games/CazadorDeTesorosGame";` y la entrada `"cazador-de-tesoros": CazadorDeTesorosGame` en `GAME_COMPONENTS`. El sistema sigue funcional: cualquier otro `game.id` sin entrada sigue mostrando el placeholder "Próximamente".

10. **Catálogo.** Agregar el objeto `cazador-de-tesoros` a `GAMES` en `app/lib/games.ts` (título, descripción, `category: "Arcade"`, `controls: "Flechas o WASD + Espacio (cavar)"`, `year: "2026"` por tratarse de diseño original del jam, ícono a elegir de `lucide-react` — candidatos a verificar disponibilidad durante `/spec-impl`: `MapPin`, `Compass`, `Skull`, `Shovel`). El sistema queda funcional: Cazador de Tesoros aparece jugable en la Biblioteca (`/`), con detalle (`/juegos/cazador-de-tesoros`) y leaderboard real.

11. **Verificación funcional.** Levantar `npm run dev`, navegar a `/juegos/cazador-de-tesoros/jugar`, confirmar overlay idle, iniciar y verificar el revelado de niebla al moverse, guardianes patrullando sus rutas, arenas movedizas inmovilizando al pisarlas, activación y resolución del minijuego de cavado sobre un `treasureSpot`, avance visible de la marea desde los bordes, probar PAUSA/CONTINUAR y SALIR. Documentar que el ciclo completo de vidas/game-over/guardado de puntaje se verifica manualmente jugando.

## Criterios de aceptación

- [ ] `/` muestra la tarjeta de CAZADOR DE TESOROS en el grid jugable (categoría Arcade).
- [ ] `/juegos/cazador-de-tesoros` muestra info, controles (`Flechas o WASD + Espacio (cavar)`) y leaderboard real vía Supabase.
- [ ] `/juegos/cazador-de-tesoros/jugar` renderiza el canvas con la isla mayormente oculta por niebla tras presionar INICIAR, revelándose progresivamente alrededor del pirata al moverse.
- [ ] El pirata se mueve en saltos discretos de una celda con flechas o WASD, nunca de forma continua, y no puede moverse mientras está inmovilizado por arena movediza.
- [ ] Los guardianes se desplazan por sus rutas de patrulla de forma visible y continua incluso sobre celdas no reveladas por el jugador (la niebla oculta la vista, no detiene la simulación).
- [ ] Colisionar con un guardián o quedar atrapado en una celda inundada por la marea decrementa una vida (`onLives`) y reposiciona al pirata en la celda de inicio de la isla.
- [ ] Al presionar `Espacio` sobre un `treasureSpot` no excavado se activa una barra de temporización oscilante visible; una segunda pulsación la detiene y resuelve éxito o fallo según la zona objetivo.
- [ ] Un cavado exitoso suma puntos (`onScore`) y marca esa celda como resuelta permanentemente para el resto del nivel; un cavado fallido no resta vidas ni puntos, y la celda sigue disponible para reintentar.
- [ ] La marea inunda anillos de celdas progresivamente desde el borde de la isla hacia el centro conforme pasa el tiempo, de forma visible.
- [ ] Al excavar con éxito todos los `treasureSpot` de la isla actual, sube el nivel (`onLevel`), se genera una isla nueva (niebla reiniciada por completo) y aumenta perceptiblemente la dificultad (más guardianes y/o marea más rápida).
- [ ] Al agotar las 3 vidas, se invoca `onGameOver()` exactamente una vez.
- [ ] El canvas no dibuja HUD de score/vidas/nivel (esos datos viven solo en el HUD del marco de `GamePlayer.tsx`, vía los callbacks); la barra del minijuego de cavado es la única UI dibujada en canvas, por ser parte de la mecánica jugable, no informativa.
- [ ] `isPaused === true` congela movimiento del pirata, guardianes, arena movediza, avance de marea y la barra de cavado; al volver a `false` continúa desde el mismo estado.
- [ ] Snake, Breakout, Tetris, Asteroids, Frogger, Space Invaders y Pac-Man no cambian de comportamiento.
- [ ] `npm run lint` pasa sin errores nuevos.

## Decisiones tomadas y descartadas

- **Movimiento por saltos discretos de celda con niebla de guerra revelada por radio, en vez de movimiento continuo o mapa totalmente visible.** Justificación: da al segundo concepto un ritmo y una mecánica de exploración/tensión claramente distintos al shooter de reflejos del concepto 1 (Abordaje en Alta Mar), cumpliendo el requisito de mecánica core diferente entre los dos conceptos generados.
- **Minijuego de barra de temporización para el cavado, en vez de excavar instantáneamente al pisar el tesoro.** Justificación: introduce un momento de habilidad/precisión (input de un solo botón, fácil de aprender) que da peso a cada tesoro sin requerir un sistema de combate o inventario.
- **Guardianes con rutas de patrulla fijas precalculadas, sin pathfinding dinámico ni persecución activa.** Justificación: mantiene el scope de IA simple y predecible (equivalente en complejidad a los carriles de tráfico de Frogger Clásico), evitando la complejidad de un grafo de pathfinding para un componente Canvas único.
- **Fallo en el minijuego de cavado no cuesta vidas, solo tiempo.** Justificación: evita que el juego combine dos fuentes de castigo (colisión física + minijuego de precisión) sobre la misma vida compartida, manteniendo el minijuego como mecánica de score/eficiencia en vez de mecánica de riesgo de muerte.
- **La niebla se reinicia por completo en cada nivel nuevo, sin mapa persistente.** Justificación: mantiene el scope acotado — un sistema de memoria de exploración entre niveles agregaría complejidad de estado sin aportar a la mecánica core; puede proponerse como iteración futura si se aprueba este spec primero.
- **Sin referencia en `Proyectos/`, diseño original que solo reutiliza el patrón técnico.** Justificación: no existe implementación previa de este concepto en el repo; se sigue el mismo patrón `stateRef` + `requestAnimationFrame` + canvas fijo escalado por CSS que Asteroids/Tetris/Breakout/Frogger.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| `buildIsland(level)` podría generar una distribución de `treasureSpot` o `quicksand` que deje un tesoro inalcanzable (rodeado de arena movediza o fuera del área navegable), bloqueando la progresión de nivel. | Al generar la isla, validar con un recorrido simple (flood-fill sobre celdas transitables) que todos los `treasureSpot` son alcanzables desde `startCell`; si no, regenerar la isla con una nueva semilla antes de asignarla a `stateRef`. |
| La marea que avanza por anillos podría inundar un `treasureSpot` aún no excavado antes de que el jugador llegue a él, dejando el nivel matemáticamente imposible de completar (`treasuresRemaining` nunca llega a 0). | Excluir del avance de marea cualquier anillo que contenga un `treasureSpot` con `dug === false`; ese anillo queda pendiente de inundar hasta que su tesoro se resuelva (excavado con éxito, no solo intentado), garantizando que siempre exista una ruta de finalización. |
| El minijuego de cavado depende de `barPos` oscilando en tiempo real; si se implementa por incremento fijo por frame en vez de por `dt`, la velocidad de la barra variaría según el framerate del dispositivo, afectando la justicia del minijuego. | Implementar la oscilación de `barPos` como función de `dt` (delta acumulado, no conteo de frames), mismo patrón que el resto de `update(dt)` en Asteroids/Frogger. |
| Los guardianes se siguen moviendo bajo la niebla (fuera de la vista revelada); si su lógica de colisión solo se evalúa cuando la celda está revelada, un guardián podría "aparecer" encima del pirata sin telegrafía, sintiéndose injusto. | La colisión pirata-guardián se evalúa siempre por posición real de celda, independientemente de si está revelada o no (la niebla es puramente visual); esto ya es el comportamiento descrito en el criterio de aceptación correspondiente, se documenta aquí como riesgo de implementación incorrecta a evitar. |
