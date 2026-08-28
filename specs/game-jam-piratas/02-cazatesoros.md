# Spec — Cazatesoros: Isla Maldita

- **Estado:** Draft
- **Dependencias:** Spec 04 (Supabase Auth + Scores — `submitScore`, `getLeaderboard`), Spec 05 (Asteroids jugable — patrón de referencia técnica `app/games/types.ts` + `GAME_COMPONENTS`)
- **Fecha:** 2026-08-28

**Objetivo:** Diseñar `cazatesoros` — un pirata que excava celda a celda la arena de una isla generada por partida para desenterrar cofres, evitando arena movediza y rivales cazatesoros, mientras la marea inunda el mapa progresivamente desde los bordes — como componente Canvas jugable siguiendo el contrato `GameProps`/`GameHandle` ya establecido en la plataforma.

## Scope

**Dentro del alcance:**

- Nuevo componente `app/games/CazatesorosGame.tsx`, diseño original sin referencia en `Proyectos/` (se construye desde cero siguiendo el patrón técnico de `AsteroidsGame.tsx`/`TetrisGame.tsx`/`BreakoutGame.tsx`: `stateRef` con todo el estado mutable, loop vía `requestAnimationFrame` para timers/marea/rivales, `keysRef` para input, canvas de resolución lógica fija escalado por CSS).
- Mecánica core distinta a un shooter/combate: grid lógico fijo (ej. 15x11 celdas) representando la isla, con movimiento del jugador **discreto por celda** (flechas o WASD, un paso por pulsación con cooldown), en vez de física continua.
- Tipos de terreno por celda: `"sand"` (arena sin cavar, se puede atravesar cavando), `"dug"` (ya cavada, transitable libremente y más rápido), `"rock"` (obstáculo sólido, nunca transitable), `"chest"` (cofre enterrado bajo arena, se revela y se recoge al cavar esa celda), `"quicksand"` (arena movediza: entrar penaliza con un cooldown de movimiento mayor mientras el jugador permanezca ahí), `"water"` (letal, borde inicial del mapa y zona ya cubierta por la marea).
- Cavar: moverse hacia una celda `"sand"` la convierte en `"dug"` con un costo de tiempo (cooldown de movimiento mayor que moverse sobre una celda ya `"dug"`), dando una decisión táctica real entre cavar en línea recta (más lento, revela tesoro) o rodear por celdas ya cavadas (más rápido, sin garantía de tesoro).
- Cofres: valor de puntos variable por cofre; al cavar la celda que contiene un cofre se suma el puntaje de inmediato (`onScore`) y decrementa el contador de cofres restantes de la isla.
- Rivales cazatesoros: 1 a 3 enemigos con IA simple (se mueven una celda por tick hacia el jugador si existe una celda transitable adyacente que acorte la distancia; sin ruta directa, se mueven a una celda transitable adyacente al azar) — no cavan arena nueva, solo se desplazan por celdas ya transitables (`"dug"`, o `"sand"` si deciden cavar también, a definir en implementación como variante de dificultad). El contacto del jugador con un rival cuesta una vida.
- Marea progresiva: cada cierto intervalo de tiempo, el anillo de celdas más externo aún no inundado se convierte en `"water"`, reduciendo el área jugable desde los bordes hacia el centro; si el jugador queda en una celda que se inunda, pierde una vida y reaparece en un punto seguro del área restante (o se fuerza fin de nivel si no queda área jugable).
- Sistema de vidas (3 iniciales), reportado vía `onLives`: se pierde una vida al ser tocado por un rival o al ser alcanzado por la marea.
- Sistema de puntaje: puntos por cada cofre desenterrado (valor variable) más un bonus grande por recoger todos los cofres de la isla actual antes de que la marea la cubra por completo. Reportado vía `onScore`.
- Nivel: al recoger todos los cofres de la isla actual, sube de nivel (`onLevel`), se genera una isla nueva (más grande y/o con más rivales y marea más rápida).
- Game over cuando se agotan las 3 vidas (`onGameOver`).
- Sin HUD propio dibujado en canvas (nada de score/vidas/nivel/cofres restantes pintado por el propio juego) — se reportan por callbacks, igual que el resto del catálogo.
- `start`/`pause`/`resume`/`reset` expuestos vía `onReady` como `GameHandle`; loop detenido mientras `isPaused` sea `true`.
- Wireo en `app/components/GamePlayer.tsx`: import de `CazatesorosGame`, entrada `"cazatesoros": CazatesorosGame` en `GAME_COMPONENTS`.
- Entrada `cazatesoros` en `app/lib/games.ts`, dentro de `GAMES` (jugable de inmediato, no `COMING_SOON_GAMES`), con `category: "Arcade"`, `controls: "Flechas o WASD"`.
- Verificación funcional: navegar a `/juegos/cazatesoros`, iniciar, confirmar render de la isla, excavación al moverse sobre arena, rivales persiguiendo y marea avanzando, probar pausa y salir.

**Fuera de alcance (explícitamente NO se hace):**

- Sonido/música.
- Inventario de ítems, herramientas o power-ups para el jugador (palas mejoradas, detectores de tesoro, etc.).
- Pathfinding avanzado (A\* o similar) para los rivales — se usa un enfoque simple de aproximación greedy célula a célula.
- Progresión persistente entre partidas (islas guardadas, desbloqueables) — cada partida genera una isla nueva desde cero; solo el score final se guarda en el leaderboard genérico.
- Soporte táctil/swipe para móvil — solo teclado, igual que el resto del catálogo.
- Editor de niveles o islas configurables por el jugador.
- Animaciones de sprite detalladas — se usan formas geométricas simples (rectángulos por celda) coloreadas por tipo de terreno, mismo nivel de fidelidad visual que `BreakoutGame.tsx`/`TetrisGame.tsx`.
- Cambios a `app/lib/scores.ts`, esquema de `scores`, o RLS — se reutiliza tal cual.
- Modificar `AsteroidsGame.tsx`, `TetrisGame.tsx`, `BreakoutGame.tsx`, `FroggerGame.tsx` o `FuegoCruzadoGame.tsx` (spec 01, si llegara a implementarse).

## Modelo de datos

No se introducen estructuras de persistencia nuevas — se reutiliza `GameDef`/`GAMES` (`app/lib/games.ts`) y `GameProps`/`GameHandle` (`app/games/types.ts`) tal cual.

Estructuras internas nuevas, privadas de `CazatesorosGame.tsx` (viven en `stateRef`, no se exportan ni se persisten):

```ts
type TerrainKind = "sand" | "dug" | "rock" | "chest" | "quicksand" | "water";

type Cell = {
  kind: TerrainKind;
  chestValue: number | null; // solo relevante mientras kind === "chest"
};

type Grid = Cell[][]; // grid[row][col]

type Player = {
  row: number;
  col: number;
  moveCooldownMs: number; // tiempo restante antes del próximo movimiento válido
};

type Rival = {
  id: number;
  row: number;
  col: number;
  moveCooldownMs: number;
};

type CazatesorosState = {
  status: "idle" | "running" | "paused" | "gameover";
  grid: Grid;
  player: Player;
  rivals: Rival[];
  chestsRemaining: number;
  tideStep: number; // cuántos anillos concéntricos desde el borde ya son agua
  tideTimerMs: number; // cuenta regresiva para el próximo avance de marea
  lives: number;
  score: number;
  level: number;
};
```

## Plan de implementación

1. **Generación de la isla.** Definir dentro de `CazatesorosGame.tsx` las constantes de grid (filas, columnas, tamaño de celda lógico) y la función `buildIsland(level: number): Grid` que coloca `rock`/`chest`/`quicksand`/`sand` pseudoaleatoriamente, garantizando mediante un flood-fill de validación que todos los cofres sean alcanzables desde la posición inicial del jugador, y dejando el anillo exterior como `water` desde el inicio (representa el mar). Crear el esqueleto del componente (`useRef` para canvas, `stateRef`, `keysRef`, `useEffect` de inicialización) con `draw()` pintando la isla en estado estático. El sistema sigue funcional (archivo aún no importado en ninguna ruta).

2. **Movimiento discreto y excavación.** Implementar `update(dt)` con `requestAnimationFrame`, input por flechas/WASD que mueve al jugador una celda por pulsación respetando `moveCooldownMs` (mayor si la celda destino es `"sand"` sin cavar, menor si ya es `"dug"`, movimiento bloqueado si es `"rock"`), conversión de `"sand"` a `"dug"` al entrar, recolección inmediata si la celda es `"chest"` (suma `score`, invoca `onScore`, decrementa `chestsRemaining`, la celda pasa a `"dug"`). Loop respeta `isPaused`. El sistema sigue funcional.

3. **Arena movediza y agua.** Implementar la penalización de `"quicksand"` (mientras el jugador permanece en una celda de este tipo, su `moveCooldownMs` efectivo aumenta, representando el esfuerzo de salir) y la detección de entrar a una celda `"water"` (muerte inmediata: decrementa `lives`, invoca `onLives`, reposiciona al jugador en un punto de inicio seguro dentro del área aún jugable). El sistema sigue funcional.

4. **Rivales cazatesoros.** Implementar `spawnRivals(level: number): Rival[]` (1 a 3 rivales) y su IA por tick: se desplazan una celda hacia el jugador si existe una celda transitable adyacente que reduzca la distancia Manhattan, o a una celda transitable adyacente aleatoria si no la hay. Colisión rival-jugador (misma celda) decrementa `lives` (invoca `onLives`) y reposiciona a ambos. El sistema sigue funcional.

5. **Marea progresiva.** Implementar `tideTimerMs` regresivo por frame; al llegar a 0, incrementa `tideStep` y convierte a `"water"` el anillo de celdas correspondiente (a distancia `tideStep` del borde exterior), reinicia `tideTimerMs` (progresivamente más corto según `level`). Si el jugador queda en una celda recién inundada, se aplica la misma pérdida de vida que el paso 3; si toda la isla queda cubierta antes de recoger todos los cofres, se fuerza el fin de la ronda actual (decisión de implementación: pérdida de vida y regeneración de isla, o game over directo si es la última vida). El sistema sigue funcional.

6. **Vidas, nivel y game over.** Centralizar el decremento de vidas (rival, marea) en una única función que invoca `onLives` y reposiciona al jugador; detectar `chestsRemaining === 0` para invocar `onLevel`, sumar el bonus de isla completada y regenerar una isla nueva vía `buildIsland(level + 1)` (más grande y/o con más rivales y marea más rápida); si `lives` llega a 0, `stateRef.status = "gameover"` e invoca `onGameOver()`. El sistema sigue funcional.

7. **`GameHandle` vía `onReady`.** Exponer `start`/`pause`/`resume`/`reset` que manipulan `stateRef.status` y reinician el estado completo (isla, jugador, rivales, marea) en `reset()`. El sistema sigue funcional (componente completo, listo para wireo).

8. **Wireo en `GamePlayer.tsx`.** Agregar `import { CazatesorosGame } from "@/app/games/CazatesorosGame";` y la entrada `"cazatesoros": CazatesorosGame` en `GAME_COMPONENTS`. El sistema sigue funcional para cualquier otro `game.id` sin entrada.

9. **Catálogo.** Agregar el objeto `cazatesoros` a `GAMES` en `app/lib/games.ts` (título, descripción, `category: "Arcade"`, `controls: "Flechas o WASD"`, `year: "2026"`, ícono libre de `lucide-react` no usado aún, ej. `Gem`). El sistema queda funcional: Cazatesoros aparece jugable en la Biblioteca (`/`), con detalle (`/juegos/cazatesoros`) y leaderboard real.

10. **Verificación funcional.** Levantar `npm run dev`, navegar a `/juegos/cazatesoros/jugar`, confirmar overlay idle, iniciar y verificar movimiento discreto con excavación visible, recolección de cofres, rivales persiguiendo, arena movediza penalizando el movimiento y la marea avanzando desde los bordes, probar PAUSA/CONTINUAR y SALIR. Documentar que el ciclo completo de vidas/game-over/guardado de puntaje se verifica manualmente jugando.

## Criterios de aceptación

- [ ] `/` muestra la tarjeta de CAZATESOROS en el grid jugable (categoría Arcade).
- [ ] `/juegos/cazatesoros` muestra info, controles (`Flechas o WASD`) y leaderboard real vía Supabase.
- [ ] `/juegos/cazatesoros/jugar` renderiza el canvas con la isla (arena, roca, agua en el borde) y el pirata jugador tras presionar INICIAR.
- [ ] El jugador se mueve en pasos discretos de una celda con flechas o WASD, nunca de forma continua, y no puede atravesar celdas `"rock"`.
- [ ] Moverse hacia una celda de arena sin cavar la convierte en celda cavada visible y tarda perceptiblemente más que moverse sobre una celda ya cavada.
- [ ] Cavar la celda que contiene un cofre suma puntos de inmediato (`onScore` incrementa) y esa celda queda marcada como cavada sin cofre.
- [ ] Al menos un rival cazatesoros se desplaza por el tablero acercándose al jugador cuando existe una ruta transitable.
- [ ] El contacto entre el jugador y un rival, o el ingreso del jugador a una celda de agua (por borde inicial o por avance de marea), decrementa una vida (`onLives`) y reposiciona al jugador en una celda segura.
- [ ] El anillo de celdas más externo aún no inundado se convierte en agua tras un intervalo de tiempo, de forma visible y repetida durante la partida.
- [ ] Al recoger todos los cofres de la isla actual, sube el nivel (`onLevel` incrementa) y se genera una isla nueva perceptiblemente distinta (tamaño y/o cantidad de rivales).
- [ ] Al agotar las 3 vidas, se invoca `onGameOver()` exactamente una vez.
- [ ] El canvas no dibuja su propio HUD de score/vidas/nivel/cofres restantes (esos datos viven solo en el HUD del marco de `GamePlayer.tsx`, vía los callbacks).
- [ ] `isPaused === true` congela al jugador, los rivales y el avance de la marea; al volver a `false` continúa desde el mismo estado.
- [ ] Snake, Breakout, Tetris, Asteroids, Space Invaders, Pac-Man, Frogger y Fuego Cruzado no cambian de comportamiento.
- [ ] `npm run lint` pasa sin errores nuevos.

## Decisiones tomadas y descartadas

- **Movimiento discreto por celda con costo de excavación variable, en vez de física continua.** Justificación: es la mecánica core que diferencia a este concepto del combate naval continuo de "Fuego Cruzado" (spec 01) — convierte el juego en uno de decisiones tácticas de ruta (cavar vs. rodear) en vez de reflejos de puntería/maniobra.
- **Marea que avanza en anillos concéntricos predecibles desde el borde, en vez de inundación aleatoria por celda.** Justificación: da al jugador información legible sobre cuánto tiempo le queda en cada zona del mapa, evitando que la pérdida de vida por marea se sienta injusta o impredecible.
- **IA de rivales greedy simple (sin A\*), moviéndose una celda por tick hacia el jugador cuando hay ruta directa.** Justificación: mantiene el scope de implementación acotado a un componente Canvas simple; un pathfinding óptimo no aporta valor de juego proporcional a su complejidad para un cazatesoros arcade.
- **Vidas (3) en vez de un límite de tiempo global único.** Justificación: consistencia con el resto del catálogo (`onLives` como contador entero); el "límite de tiempo" ya existe de forma implícita vía la marea, que actúa como presión creciente sin duplicar mecánicas de temporizador.
- **Sin herramientas ni power-ups (pala mejorada, detector de tesoro).** Justificación: mantiene el loop core mínimo y jugable; puede proponerse como iteración futura sobre este mismo spec una vez aprobado e implementado.
- **Sin referencia en `Proyectos/`, diseño original que solo reutiliza el patrón técnico.** Justificación: no existe implementación previa de excavación en grid en el repo; se sigue el mismo patrón `stateRef` + `requestAnimationFrame` + canvas fijo escalado por CSS que Asteroids/Tetris/Breakout/Frogger, aplicado a un loop de actualización por tiempo en vez de por frame de animación continua.

## Riesgos identificados

| Riesgo                                                                                                                                                                              | Mitigación                                                                                                                                                                                                        |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `buildIsland(level)` podría generar, por azar, una configuración de `rock` que deje uno o más `chest` inalcanzables, bloqueando el nivel de forma permanente.                     | El paso 1 del plan exige validar con flood-fill desde la posición inicial del jugador que todo `chest` sea alcanzable antes de aceptar la isla generada; si falla, regenerar con otra semilla hasta cumplir la condición. |
| La marea avanzando en anillos fijos podría, en niveles altos con mapas más grandes, cubrir toda la isla antes de que el jugador pueda razonablemente recoger todos los cofres.     | Escalar `tideTimerMs` y el tamaño de la isla de forma conjunta al definir `buildIsland(level)`, verificando manualmente en el paso 10 que al menos un nivel bajo y uno alto sean completables dentro del tiempo. |
| La IA de rivales moviéndose por celdas ya `"dug"` podría quedar completamente inmóvil en islas con poca arena cavada al inicio de una ronda, dando una falsa sensación de "bug". | Permitir que los rivales también puedan cavar `"sand"` como parte de su movimiento (mismo costo de cooldown que el jugador), documentado como variante de dificultad a decidir en `/spec-impl` según el paso 4 del plan. |
