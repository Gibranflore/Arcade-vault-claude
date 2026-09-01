# Spec — Duelo de Espadas al Atardecer

- **Estado:** Draft
- **Dependencias:** Spec 04 (Supabase Auth + Scores — `submitScore`, `getLeaderboard`), Spec 05 (Asteroids jugable — patrón de referencia técnica `app/games/types.ts` + `GAME_COMPONENTS`)
- **Fecha:** 2026-09-01

**Objetivo:** Diseñar un juego nuevo `duelo-de-espadas` — un duelo de esgrima pirata de reacción y patrones contra una sucesión de capitanes enemigos, donde el jugador bloquea ataques telegrafiados por zona y contraataca en ventanas de tiempo cortas — como componente Canvas jugable siguiendo el contrato `GameProps`/`GameHandle` ya establecido en la plataforma.

## Scope

**Dentro del alcance:**

- Nuevo componente `app/games/DueloDeEspadasGame.tsx`, diseño original sin referencia en `Proyectos/` (se construye desde cero siguiendo el patrón técnico de `AsteroidsGame.tsx`/`TetrisGame.tsx`/`BreakoutGame.tsx`/`FroggerGame.tsx`: `stateRef` con todo el estado mutable, loop vía `requestAnimationFrame`, `keysRef` para input, canvas de resolución lógica fija escalado por CSS).
- Mecánica core distinta a la de un shooter/plataformero continuo: **duelo de reacción por patrones**, basado en ventanas de tiempo discretas, no en movimiento libre por el escenario. El jugador y el capitán enemigo permanecen en posiciones fijas de la cubierta al atardecer; todo el juego ocurre en el ciclo de intercambios descrito abajo.
- Tres zonas de combate: `alto`, `medio`, `bajo`, representadas por íconos visibles sobre la silueta del capitán enemigo.
- Controles: teclas `1`/`2`/`3` (alternativamente `Q`/`W`/`E`) seleccionan la zona alta/media/baja respectivamente; la **misma** tecla de zona se usa tanto para bloquear como para contraatacar, según el contexto visual del intercambio (rojo = defender, verde = atacar).
- Ciclo de intercambio (máquina de estados por duelo):
  1. **Telegraph:** el capitán enemigo señala una zona con un ícono rojo parpadeante durante una ventana de tiempo (`windowMs`, decreciente con el nivel). Puede ser un ataque real o una **finta** (probabilidad `feintChance`, creciente con el nivel, con tope máximo).
  2. Si es un ataque real: presionar la tecla de esa zona antes de que expire la ventana bloquea el golpe sin daño. No presionar, presionar la zona equivocada, o dejar expirar la ventana causa que el jugador reciba el golpe (pierde 1 vida).
  3. Si es una finta: el ícono rojo parpadea pero no hay golpe real. Si el jugador no presiona nada, no pasa nada. Si presiona cualquier tecla de zona durante la ventana de la finta, cuenta como golpe en el vacío y el capitán conecta un golpe gratuito inmediato (pierde 1 vida).
  4. Tras un bloqueo exitoso (paso 2), se abre una **ventana de contraataque** (`counterWindow`) breve con una zona abierta resaltada en verde (`counterZone`, elegida al azar). Si el jugador presiona esa misma zona dentro de la ventana, conecta un golpe (resta salud interna al capitán) y suma puntos. Si la ventana expira sin input, no hay penalización y el duelo continúa con el siguiente intercambio.
- Salud interna del capitán enemigo (`enemyHealth`, no expuesta como HUD numérico del marco): se reduce con cada golpe de contraataque conectado. Al llegar a 0, el capitán es derrotado: bonus grande de puntos, sube el nivel (`onLevel`), aparece el siguiente capitán con `windowMs` base más corto y `feintChance` mayor (ambos con tope máximo).
- Vidas del jugador: 3 iniciales, reportadas vía `onLives`. Cada golpe recibido (fallo de bloqueo, timeout de ventana, o golpe en vacío por caer en una finta) resta 1 vida.
- Game over cuando se agotan las 3 vidas (`onGameOver`).
- Sistema de puntaje: bonus pequeño por cada bloqueo exitoso, bonus mayor por cada golpe de contraataque conectado, bonus grande por derrotar a un capitán. Reportado vía `onScore`, siempre creciente.
- Sin HUD propio de score/vidas/nivel dibujado en canvas (esos se reportan vía callbacks, igual que el resto del catálogo). Se permite un indicador visual simple de la salud del capitán enemigo actual (ej. una barra corta sobre su silueta) porque forma parte del escenario del duelo, no duplica los datos numéricos que ya vive el HUD del marco.
- `start`/`pause`/`resume`/`reset` expuestos vía `onReady` como `GameHandle`; loop detenido (countdowns de `windowMs`/`counterWindow` congelados) mientras `isPaused` sea `true`.
- Wireo en `app/components/GamePlayer.tsx`: import de `DueloDeEspadasGame`, entrada `"duelo-de-espadas": DueloDeEspadasGame` en `GAME_COMPONENTS`.
- Entrada `duelo-de-espadas` en `app/lib/games.ts`, dentro de `GAMES` (jugable de inmediato, no `COMING_SOON_GAMES`), con `category: "Arcade"`, `controls: "1/2/3 o Q/W/E"`.
- Verificación funcional: navegar a `/juegos/duelo-de-espadas`, iniciar, confirmar aparición de telegraphs por zona, bloqueo/contraataque respondiendo a input, transición de capitán al derrotarlo, probar pausa y salir.

**Fuera de alcance (explícitamente NO se hace):**

- Sonido/música.
- Soporte táctil/móvil específico para este juego (más allá de lo que la plataforma ya soporte de forma genérica).
- Múltiples personajes/skins jugables o desbloqueables.
- Modo historia/narrativa con diálogos entre duelos — solo la sucesión mecánica de capitanes.
- Multijugador local (dos jugadores humanos) — el jugador siempre dueña contra un capitán controlado por IA/patrones.
- Movimiento libre por el escenario (avanzar/retroceder, esquivar físicamente) — el duelo ocurre íntegramente por el ciclo de intercambios de zona.
- Animaciones de sprite detalladas (arte pixel-art complejo) — se usan formas geométricas simples (siluetas/polígonos) coloreadas, mismo nivel de fidelidad visual que `BreakoutGame.tsx`/`TetrisGame.tsx`.
- Cambios a `app/lib/scores.ts`, esquema de `scores`, o RLS — se reutiliza tal cual.
- Modificar `AsteroidsGame.tsx`, `TetrisGame.tsx`, `BreakoutGame.tsx`, `FroggerGame.tsx`, `SnakeGame.tsx`, o `CanonesABaborGame.tsx` (spec 01 de esta jam).

## Modelo de datos

No se introducen estructuras de persistencia nuevas — se reutiliza `GameDef`/`GAMES` (`app/lib/games.ts`) y `GameProps`/`GameHandle` (`app/games/types.ts`) tal cual.

Estructuras internas nuevas, privadas de `DueloDeEspadasGame.tsx` (viven en `stateRef`, no se exportan ni se persisten):

```ts
type Zone = "alto" | "medio" | "bajo";

type ExchangePhase =
  | "telegraph" // el capitán señala una zona (real o finta)
  | "counterWindow" // ventana de contraataque tras un bloqueo exitoso
  | "resolving" // pausa breve entre intercambios
  | "victory" // capitán derrotado, transición de nivel
  | "gameover";

type Exchange = {
  zone: Zone;
  isFeint: boolean;
  windowMs: number; // tiempo restante de la ventana activa
  windowDurationMs: number; // duración total configurada (baja con el nivel, con piso mínimo)
};

type DuelState = {
  status: "idle" | "running" | "paused" | "gameover";
  phase: ExchangePhase;
  exchange: Exchange | null;
  counterZone: Zone | null; // zona resaltada durante counterWindow
  counterWindowMs: number; // tiempo restante de la ventana de contraataque activa
  playerLives: number;
  enemyHealth: number;
  enemyMaxHealth: number;
  score: number;
  level: number; // número de capitán actual
  feintChance: number; // probabilidad de finta del capitán actual (con tope máximo)
};
```

## Plan de implementación

1. **Esqueleto y render estático.** Definir constantes base de timing (`windowDurationMs` inicial, `MIN_WINDOW_MS`, `counterWindowMs` fijo, `feintChance` inicial y su tope máximo) y crear el esqueleto de componente (`useRef` para canvas, `stateRef`, `keysRef`, `useEffect` de inicialización) con `draw()` pintando el escenario (cubierta al atardecer), la silueta del jugador, la silueta del capitán enemigo y los tres íconos de zona en reposo. El sistema sigue funcional (componente aún no usado en ninguna ruta).

2. **Ciclo de intercambio: telegraph y bloqueo.** Implementar `update(dt)` con `requestAnimationFrame`: generación de un `Exchange` (zona aleatoria + `isFeint` según `feintChance`), fase `telegraph` con `windowMs` decreciente dibujado como countdown visual del ícono de zona, y evaluación de input de teclado (`1`/`2`/`3` o `Q`/`W`/`E`, ignorando `event.repeat === true`) contra `zone`/`isFeint` para determinar bloqueo exitoso, fallo de bloqueo, o golpe en el vacío por finta. Loop respeta `isPaused` (congela `windowMs`). El sistema sigue funcional.

3. **Ventana de contraataque.** Tras un bloqueo exitoso, transicionar a fase `counterWindow`: elegir `counterZone` al azar, iniciar `counterWindowMs` decreciente, y evaluar el input del jugador dentro de esa ventana para conectar un golpe (resta `enemyHealth`) o dejarla expirar sin penalización, volviendo a fase `resolving` y luego a un nuevo `telegraph`. El sistema sigue funcional.

4. **Vidas, golpes recibidos y game over.** Centralizar la resta de `playerLives` en un único punto (fallo de bloqueo, timeout de `windowMs`, o golpe en vacío por finta), invocando `onLives` en cada cambio. Cuando `playerLives` llega a 0, `stateRef.status = "gameover"`, `phase = "gameover"`, e invoca `onGameOver()`. El sistema sigue funcional.

5. **Puntaje, derrota de capitán y progresión de nivel.** Sumar puntos en bloqueo exitoso, en cada golpe de contraataque conectado, y bonus grande al derrotar a un capitán (invoca `onScore` en cada incremento, siempre creciente). Cuando `enemyHealth` llega a 0: fase `victory` con una transición breve, incrementar `level` (invoca `onLevel`), reiniciar `enemyHealth` a `enemyMaxHealth`, reducir `windowDurationMs` base (sin bajar de `MIN_WINDOW_MS`) y aumentar `feintChance` (sin superar el tope máximo) para el siguiente capitán. El sistema sigue funcional.

6. **`GameHandle` vía `onReady`.** Exponer `start`/`pause`/`resume`/`reset` que manipulan `stateRef.status` y reinician el estado completo (vidas, score, nivel, salud del primer capitán, dificultad base) en `reset()`. El sistema sigue funcional (componente completo, listo para wireo).

7. **Wireo en `GamePlayer.tsx`.** Agregar `import { DueloDeEspadasGame } from "@/app/games/DueloDeEspadasGame";` y la entrada `"duelo-de-espadas": DueloDeEspadasGame` en `GAME_COMPONENTS`. El sistema sigue funcional para cualquier otro `game.id`.

8. **Catálogo.** Agregar el objeto `duelo-de-espadas` a `GAMES` en `app/lib/games.ts` (título, descripción, `category: "Arcade"`, `controls: "1/2/3 o Q/W/E"`, `year: "2026"` — juego original de esta jam, sin equivalente histórico real, ícono libre de `lucide-react` no usado por otro juego, ej. `Swords` o `Skull`, a confirmar disponibilidad durante `/spec-impl`). El sistema queda funcional: Duelo de Espadas al Atardecer aparece jugable en la Biblioteca (`/`), con detalle (`/juegos/duelo-de-espadas`) y leaderboard real.

9. **Verificación funcional.** Levantar `npm run dev`, navegar a `/juegos/duelo-de-espadas/jugar`, confirmar overlay idle, iniciar y verificar aparición de telegraphs rojos por zona, bloqueo exitoso al presionar la tecla correcta a tiempo, apertura de ventana de contraataque verde tras un bloqueo, comportamiento correcto de fintas, transición de capitán al vaciar su salud, probar PAUSA/CONTINUAR y SALIR. Documentar que el ciclo completo de vidas/game-over/guardado de puntaje se verifica manualmente jugando.

## Criterios de aceptación

- [ ] `/` muestra la tarjeta de DUELO DE ESPADAS AL ATARDECER en el grid jugable (categoría Arcade).
- [ ] `/juegos/duelo-de-espadas` muestra info, controles (`1/2/3 o Q/W/E`) y leaderboard real vía Supabase.
- [ ] `/juegos/duelo-de-espadas/jugar` renderiza el canvas con el jugador, el capitán enemigo y los tres íconos de zona (alto/medio/bajo) tras presionar INICIAR.
- [ ] Ante un telegraph real (no finta), presionar la tecla de la zona señalada dentro de la ventana evita daño (bloqueo exitoso); no presionar, presionar la zona equivocada, o dejar expirar la ventana resta 1 vida (`onLives`).
- [ ] Tras un bloqueo exitoso, se abre una ventana de contraataque con una zona resaltada en verde; presionar esa zona dentro de la ventana conecta un golpe y aumenta el puntaje (`onScore`); dejar pasar la ventana no penaliza.
- [ ] Ante una finta, presionar cualquier tecla de zona durante esa ventana resta 1 vida; no presionar nada no penaliza.
- [ ] Al conectar suficientes golpes de contraataque para vaciar la salud interna del capitán actual, se otorga un bonus de puntos, sube el nivel (`onLevel`), y aparece un nuevo capitán con ventanas de tiempo más cortas y mayor probabilidad de finta.
- [ ] Al agotar las 3 vidas del jugador, se invoca `onGameOver()` exactamente una vez.
- [ ] El canvas no dibuja un HUD numérico de vidas/score/nivel del jugador (esos datos viven solo en el HUD del marco de `GamePlayer.tsx`, vía los callbacks); el indicador visual de salud del capitán no duplica esos números.
- [ ] `isPaused === true` congela cualquier countdown activo (`windowMs` de telegraph o `counterWindowMs` de contraataque); al reanudar continúa desde el mismo tiempo restante.
- [ ] Snake, Breakout, Tetris, Asteroids, Frogger, Space Invaders y Pac-Man no cambian de comportamiento.
- [ ] Cañones a Babor (spec 01 de esta jam, si se implementa) no cambia de comportamiento.
- [ ] `npm run lint` pasa sin errores nuevos.

## Decisiones tomadas y descartadas

- **Duelo de reacción por patrones (bloqueo + contraataque por zonas discretas) en vez de combate físico continuo o movimiento libre.** Justificación: da al segundo concepto un género, un input y un ritmo de juego completamente distintos al de Cañones a Babor (spec 01, físico/continuo) y al resto del catálogo, cumpliendo el requisito de mecánica core claramente diferente.
- **Las mismas tres teclas de zona (`1`/`2`/`3` o `Q`/`W`/`E`) se reutilizan para bloqueo y contraataque, en vez de teclas separadas por acción.** Justificación: reduce la superficie de controles a memorizar y refuerza que el jugador lea el contexto visual (rojo = defender, verde = atacar) en vez de aprender mapeos de teclas distintos por acción.
- **Fintas (telegraphs falsos) como mecánica de dificultad creciente.** Justificación: introduce lectura de patrones más allá de solo velocidad de reacción pura, dando profundidad sin agregar más zonas ni más teclas.
- **Salud del capitán enemigo (`enemyHealth`) como estado interno, sin exponerse vía `onLives`/HUD numérico del marco — solo un indicador visual simple en el escenario.** Justificación: `onLives` está reservado para las vidas del jugador (consistente con el resto del catálogo); mostrar la salud del capitán como parte del escenario (barra sobre su silueta) da feedback sin introducir un segundo sistema de "vidas" en el contrato `GameProps`.
- **Sin movimiento libre por el escenario (avanzar/retroceder/esquivar físicamente).** Justificación: mantiene el foco mecánico en la lectura de patrones y el tiempo de reacción; agregar posicionamiento libre diluiría la diferencia de género respecto a Cañones a Babor y complicaría el scope sin aportar profundidad proporcional.
- **Sin múltiples personajes/skins ni modo historia/narrativa.** Justificación: mantiene el scope acotado a un componente Canvas simple; puede proponerse como iteración futura si se aprueba este spec primero.
- **No se usa ninguna referencia en `Proyectos/` porque no existe una implementación previa de este juego.** Justificación: diseño original que sigue el patrón técnico (`stateRef` + `requestAnimationFrame` + canvas fijo escalado por CSS) igual que Frogger y Cañones a Babor, sin portar código existente.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Ventanas de tiempo (`windowMs`) muy cortas en niveles altos pueden volver el juego injugable o frustrante en vez de desafiante. | Aplicar un piso mínimo (`MIN_WINDOW_MS`) al reducir `windowDurationMs` por nivel, igual que el tope `MAX_LANE_SPEED` usado en el spec de Frogger Clásico. |
| Distinguir un telegraph real de una finta depende de un cue visual sutil (parpadeo/color); si no es lo bastante claro, el resultado se percibirá como aleatorio en vez de leíble por el jugador. | Usar un cue visual persistente y distintivo más allá del color (ej. borde sólido para telegraph real, borde punteado o "tiemble" visual para finta), definido con precisión durante `/spec-impl`. |
| El manejo de input por teclado durante ventanas de tiempo cortas puede sufrir problemas de repetición si el usuario mantiene la tecla presionada (`keydown` repetido). | Ignorar eventos `keydown` con `event.repeat === true` y evaluar solo la primera pulsación dentro de cada ventana activa, igual que el cooldown de salto discreto de `FroggerGame.tsx`. |
| Sin barra de vida enemiga numérica en el HUD del marco, el jugador podría no tener suficiente feedback de cuánto falta para derrotar al capitán actual. | El indicador visual permitido en canvas (barra corta sobre la silueta del capitán, ver Scope) cubre este feedback sin introducir un HUD numérico duplicado. |
