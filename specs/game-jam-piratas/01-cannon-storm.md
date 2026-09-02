# Spec — Cannon Storm

- **Estado:** Draft
- **Dependencias:** Spec 04 (Supabase Auth + Scores — `submitScore`, `getLeaderboard`), Spec 05 (Asteroids jugable — patrón de referencia técnica `app/games/types.ts` + `GAME_COMPONENTS`)
- **Fecha:** 2026-09-02

**Objetivo:** Diseñar un juego nuevo `cannon-storm` — combate naval pirata top-down con inercia de barco y disparo de cañones exclusivamente a babor/estribor (broadside), oleadas de barcos enemigos y ataques periódicos de un Kraken — como componente Canvas jugable siguiendo el contrato `GameProps`/`GameHandle` ya establecido en la plataforma.

## Scope

**Dentro del alcance:**

- Nuevo componente `app/games/CannonStormGame.tsx`: diseño original sin referencia en `Proyectos/` — se construye desde cero siguiendo el patrón técnico de `AsteroidsGame.tsx`/`TetrisGame.tsx`/`BreakoutGame.tsx` (`stateRef` con todo el estado mutable, loop vía `requestAnimationFrame`, `keysRef` para input, canvas de resolución lógica fija escalado por CSS).
- Arena de mar acotada (rectángulo fijo, no infinita, sin scroll de cámara ni wrap toroidal): los bordes representan arrecifes/límite de navegación — el barco del jugador rebota suavemente al tocarlos en vez de atravesarlos.
- Barco del jugador con movimiento con inercia (rotación con `ArrowLeft`/`ArrowRight` o `A`/`D`, propulsión con `ArrowUp`/`W`, arrastre/fricción que frena gradualmente al soltar), igual en espíritu al modelo de nave de `AsteroidsGame.tsx` pero sin wrap de pantalla.
- Disparo de cañones **exclusivamente lateral** (broadside): tecla `Q` dispara la batería de babor, tecla `E` dispara la de estribor, cada una con su propio cooldown independiente; no existe disparo frontal/omnidireccional. Esto obliga al jugador a maniobrar de costado frente al objetivo antes de poder impactarlo — mecánica core distinta al disparo omnidireccional de Asteroids.
- Munición ilimitada (sin recurso a gestionar) — el límite de daño por segundo lo impone el cooldown de cada batería, no un contador de balas.
- Casco del barco del jugador con 3 puntos de vida (`hull`), reportado vía `onLives`; recibir un impacto de cañón enemigo o de un tentáculo del Kraken resta 1 punto, con una breve ventana de invulnerabilidad parpadeante tras cada impacto (evita perder varias vidas en el mismo frame/colisión prolongada).
- Barcos enemigos de tres tipos con distinto tamaño/vida/comportamiento: `sloop` (balandro, 1 punto de vida, rápido), `frigate` (fragata, 2 puntos de vida, velocidad media), `galleon` (galeón, 3 puntos de vida, lento pero dispara más fuerte). IA simple por barco: se acerca al jugador, gira para quedar de costado (broadside) y dispara con su propio cooldown, luego reposiciona.
- Cofres del tesoro flotantes (animación de balanceo simple) dispersos en el mapa; recogerlos (colisión barco-cofre) suma puntos directamente, sin mecánica de banking ni recurso — son bonus puro, a diferencia del recurso gestionado en el segundo concepto de esta jam.
- Kraken como amenaza periódica, no un enemigo controlable: cada cierto intervalo (que se acorta por nivel) emerge un tentáculo con telegraph visual (fase `rising`, radio de colisión creciente y visible antes de hacer daño), luego una fase `sweeping` donde el tentáculo se desplaza por una franja del mapa (colisión = 1 punto de casco), y finalmente `sinking` (desaparece). El telegraph da tiempo de reacción justo para esquivar.
- Sistema de puntaje: puntos por hundir cada tipo de barco enemigo (proporcional a su dificultad) y por recoger cofres, reportado vía `onScore`.
- Sistema de oleadas/nivel: cada nivel define una cuota de barcos enemigos a hundir (`waveKillsRemaining`); al llegar a 0, sube el nivel (`onLevel`), se genera la siguiente oleada con más barcos y proporción mayor de fragatas/galeones, y el intervalo de aparición del Kraken se reduce (tope mínimo para no volverlo injugable, ver Riesgos).
- Game over inmediato cuando `hull` llega a 0 (`onGameOver`) — sin sistema de reaparición ni vidas adicionales más allá del casco.
- Sin HUD propio dibujado en canvas (nada de score/vidas/nivel pintado por el propio juego) — se reportan por callbacks, igual que el resto del catálogo.
- `start`/`pause`/`resume`/`reset` expuestos vía `onReady` como `GameHandle`; loop detenido mientras `isPaused` sea `true`.
- Wireo en `app/components/GamePlayer.tsx`: import de `CannonStormGame`, entrada `"cannon-storm": CannonStormGame` en `GAME_COMPONENTS`.
- Entrada `cannon-storm` en `app/lib/games.ts`, dentro de `GAMES` (jugable de inmediato, no `COMING_SOON_GAMES`), con `category: "Acción"`, `controls: "Flechas o WASD + Q/E para cañones"`.
- Verificación funcional: navegar a `/juegos/cannon-storm`, iniciar, confirmar render del barco maniobrando con inercia, barcos enemigos aproximándose y disparando, cofres visibles, aparición telegráfica del Kraken, probar pausa y salir.

**Fuera de alcance (explícitamente NO se hace):**

- Sonido/música.
- Soporte táctil/swipe para móvil — solo teclado, igual que el resto del catálogo.
- Recurso de munición limitada, reparación de casco, o power-ups (triple disparo, escudo, etc.).
- Reaparición del jugador tras perder todo el casco — el juego termina directo (a diferencia de Frogger, que sí reaparece con vidas).
- Scroll de cámara o mapa infinito — la arena es un rectángulo fijo con bordes de rebote.
- Multiplayer o modos alternativos (cooperativo, contrarreloj puro).
- Cambios a `app/lib/scores.ts`, esquema de `scores`, o RLS — se reutiliza tal cual.
- Modificar `AsteroidsGame.tsx`, `TetrisGame.tsx`, `BreakoutGame.tsx`, `FroggerGame.tsx` o `HoppyHazardGame.tsx` (specs de jams previas, si llegaran a implementarse).

## Modelo de datos

No se introducen estructuras de persistencia nuevas — se reutiliza `GameDef`/`GAMES` (`app/lib/games.ts`) y `GameProps`/`GameHandle` (`app/games/types.ts`) tal cual.

Estructuras internas nuevas, privadas de `CannonStormGame.tsx` (viven en `stateRef`, no se exportan ni se persisten):

```ts
type PlayerShip = {
  x: number;
  y: number; // px lógico, centro
  angle: number; // radianes, rumbo actual
  vx: number;
  vy: number; // velocidad con inercia/arrastre
  hull: number; // vidas del casco, inicia en 3
  cooldownLeftMs: number; // ms restantes para próximo disparo de babor
  cooldownRightMs: number; // ms restantes para próximo disparo de estribor
  invulnerableMs: number; // parpadeo tras impacto, evita daño en cadena
};

type EnemyShip = {
  kind: "sloop" | "frigate" | "galleon";
  x: number;
  y: number;
  angle: number;
  vx: number;
  vy: number;
  hull: number; // 1 (sloop), 2 (frigate) o 3 (galleon)
  fireCooldownMs: number;
  aiState: "approaching" | "broadside" | "retreating";
};

type CannonBall = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  owner: "player" | "enemy";
  damage: number;
  ttlMs: number; // tiempo de vida antes de hundirse en el agua
};

type TreasureChest = {
  x: number;
  y: number;
  value: number; // puntos al recoger
  bobPhase: number; // fase de animación de flotación senoidal
};

type KrakenTentacle = {
  x: number;
  y: number;
  phase: "rising" | "sweeping" | "sinking";
  timerMs: number;
  radius: number; // radio de colisión, crece durante "rising"
};

type CannonStormState = {
  status: "idle" | "running" | "paused" | "gameover";
  player: PlayerShip;
  enemies: EnemyShip[];
  balls: CannonBall[];
  chests: TreasureChest[];
  tentacles: KrakenTentacle[];
  score: number;
  level: number;
  waveKillsRemaining: number; // enemigos a hundir para subir de nivel
  krakenTimerMs: number; // cuenta regresiva a la próxima aparición
};
```

## Plan de implementación

1. **Constantes de arena y físico del barco.** Definir dentro de `CannonStormGame.tsx` las constantes de arena (ancho/alto lógico, margen de rebote), físico de inercia (aceleración, fricción/drag, velocidad angular) y la función `spawnWave(level: number): EnemyShip[]` que genera la oleada inicial. Crear el esqueleto de componente (`useRef` para canvas, `stateRef`, `keysRef`, `useEffect` de inicialización) con `draw()` estático (mar, barco del jugador, barcos enemigos y cofres en posiciones iniciales). El sistema sigue funcional (componente aún no usado en ninguna ruta).

2. **Movimiento del jugador.** Implementar `update(dt)` con `requestAnimationFrame`: rotación por input, propulsión con inercia y fricción, rebote suave contra los bordes de la arena. Loop respeta `isPaused`. El sistema sigue funcional.

3. **Disparo broadside.** Implementar el spawn de `CannonBall` al presionar `Q`/`E`, con velocidad perpendicular al `angle` actual del barco (babor = -90°, estribor = +90° respecto al rumbo), respetando el cooldown independiente de cada batería. Las balas viajan en línea recta y se eliminan al expirar `ttlMs` o salir de la arena. El sistema sigue funcional.

4. **IA de barcos enemigos.** Implementar las tres transiciones de `aiState` (`approaching`: se acerca al jugador; `broadside`: gira para exponer el costado y dispara según su propio `fireCooldownMs`; `retreating`: se aleja brevemente antes de volver a aproximarse) para cada `EnemyShip`, generando sus propios `CannonBall` con `owner: "enemy"`. El sistema sigue funcional.

5. **Colisiones y casco.** Implementar detección bala-barco (jugador y enemigos), resta de `hull` correspondiente, invulnerabilidad temporal tras cada impacto del jugador, remoción de `EnemyShip` al llegar `hull` a 0 (suma de puntos según `kind`, decremento de `waveKillsRemaining`), y recolección de `TreasureChest` (colisión barco-cofre, suma de puntos, remoción del cofre). Si `player.hull` llega a 0, `stateRef.status = "gameover"` e invoca `onGameOver()` inmediatamente (sin reaparición). El sistema sigue funcional.

6. **Kraken.** Implementar el ciclo de `KrakenTentacle` controlado por `krakenTimerMs`: al llegar a 0, spawnea un tentáculo en fase `rising` (radio de colisión creciente, visualmente distinguible como aviso), transición a `sweeping` (desplazamiento por una franja del mapa, colisión = 1 punto de casco vía la misma ruta de invulnerabilidad del paso 5), y `sinking` (desaparece, se reinicia `krakenTimerMs` con el intervalo del nivel actual). El sistema sigue funcional.

7. **Puntaje y nivel.** Confirmar que cada suma de puntos (hundimiento, cofre) invoca `onScore`. Al llegar `waveKillsRemaining` a 0: invocar `onLevel`, regenerar la oleada con `spawnWave(level + 1)` (más barcos, mayor proporción de fragatas/galeones), y reducir el intervalo base de `krakenTimerMs` respetando un tope mínimo (`MIN_KRAKEN_INTERVAL_MS`, ver Riesgos). El sistema sigue funcional.

8. **`GameHandle` vía `onReady`.** Exponer `start`/`pause`/`resume`/`reset` que manipulan `stateRef.status` y reinician el estado completo (casco, oleada, cofres, Kraken) en `reset()`. El sistema sigue funcional (componente completo, listo para wireo).

9. **Wireo en `GamePlayer.tsx`.** Agregar `import { CannonStormGame } from "@/app/games/CannonStormGame";` y la entrada `"cannon-storm": CannonStormGame` en `GAME_COMPONENTS`. El sistema sigue funcional para cualquier otro `game.id`.

10. **Catálogo.** Agregar el objeto `cannon-storm` a `GAMES` en `app/lib/games.ts` (título "CANNON STORM", descripción, `category: "Acción"`, `controls: "Flechas o WASD + Q/E para cañones"`, `year` de esta obra original — decisión menor de implementación, ícono libre de `lucide-react` como `Anchor` o `Ship`). El sistema queda funcional: Cannon Storm aparece jugable en la Biblioteca (`/`), con detalle (`/juegos/cannon-storm`) y leaderboard real.

11. **Verificación funcional.** Levantar `npm run dev`, navegar a `/juegos/cannon-storm/jugar`, confirmar overlay idle, iniciar y verificar que el barco maniobra con inercia, que `Q`/`E` disparan cañones solo lateralmente, que los barcos enemigos se aproximan/giran/disparan, que los cofres se recogen, y que el Kraken telegrafía antes de golpear. Probar PAUSA/CONTINUAR y SALIR. Documentar que el ciclo completo de game-over/guardado de puntaje se verifica manualmente jugando.

## Criterios de aceptación

- [ ] `/` muestra la tarjeta de CANNON STORM en el grid jugable (categoría Acción).
- [ ] `/juegos/cannon-storm` muestra info, controles (`Flechas o WASD + Q/E para cañones`) y leaderboard real vía Supabase.
- [ ] `/juegos/cannon-storm/jugar` renderiza el canvas con el barco del jugador, barcos enemigos y cofres tras presionar INICIAR.
- [ ] El barco del jugador se mueve con inercia (acelera y frena gradualmente, no instantáneo) y rebota suavemente al tocar los bordes de la arena.
- [ ] `Q` dispara únicamente hacia el costado de babor y `E` únicamente hacia estribor — ningún disparo sale hacia adelante/atrás del barco.
- [ ] Cada tipo de barco enemigo (`sloop`/`frigate`/`galleon`) requiere distinto número de impactos para hundirse, y su IA se aproxima, gira de costado y dispara de vuelta.
- [ ] Recibir un impacto de cañón enemigo o de un tentáculo del Kraken decrementa `onLives` en 1, con una ventana breve de invulnerabilidad visible tras cada impacto.
- [ ] Recoger un cofre suma puntos (`onScore`) inmediatamente.
- [ ] Al hundir la cuota de barcos de la oleada actual, sube el nivel (`onLevel`), aparece una oleada nueva más difícil y el Kraken aparece con mayor frecuencia.
- [ ] El Kraken muestra una fase de aviso visualmente distinta (radio de colisión creciente) antes de poder hacer daño.
- [ ] Al llegar el casco del jugador a 0, se invoca `onGameOver()` exactamente una vez, sin reaparición.
- [ ] El canvas no dibuja su propio HUD de score/vidas/nivel.
- [ ] `isPaused === true` congela el movimiento del barco, enemigos, balas y Kraken; al volver a `false` continúa desde el mismo estado.
- [ ] Snake, Breakout, Tetris, Asteroids, Frogger (si existe), Space Invaders y Pac-Man no cambian de comportamiento.
- [ ] `npm run lint` pasa sin errores nuevos.

## Decisiones tomadas y descartadas

- **Disparo exclusivamente broadside (Q/E lateral) en vez de disparo omnidireccional tipo Asteroids.** Justificación: es la mecánica que distingue a este concepto del resto del catálogo — obliga a pensar en maniobra y posicionamiento, no solo en apuntar y disparar.
- **Arena acotada con rebote en los bordes, sin wrap toroidal ni scroll de cámara.** Justificación: mantiene el scope simple (sin generación procedural de mar infinito) y deja clara la lectura espacial del combate; el wrap de Asteroids no encaja bien con la idea de "límite de navegación/arrecife".
- **Casco del jugador (3 puntos) sin reaparición al perderlo todo — game over directo.** Justificación: da tensión distinta a la de Frogger (que sí reaparece); simplifica el manejo de estado (no hay que decidir dónde reaparece un barco en movimiento con inercia).
- **Munición ilimitada, solo limitada por cooldown por batería.** Justificación: mantiene el foco en la maniobra de posicionamiento (mecánica core) en vez de introducir gestión de recursos, que se reserva como diferenciador del segundo concepto de esta jam (`treasure-diver`).
- **Cofres como bonus de puntos directo, sin mecánica de banking.** Justificación: mismo motivo — la gestión de riesgo/recurso es el diferenciador del segundo concepto; aquí el tesoro es solo un incentivo secundario al combate.
- **Kraken con telegraph obligatorio (fase `rising` visible) antes de poder dañar.** Justificación: sin aviso, un hazard de área grande y periódico se sentiría injusto; el telegraph lo convierte en una amenaza esquivable con reflejos, no en una lotería de daño.
- **Sin referencia en `Proyectos/`, diseño original que solo reutiliza el patrón técnico.** Justificación: no existe implementación previa de este concepto en el repo; se sigue el mismo patrón `stateRef` + `requestAnimationFrame` + canvas fijo escalado por CSS que Asteroids/Tetris/Breakout.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Detectar si un cañón impacta requiere saber si el objetivo está dentro del "arco de costado" del barco que dispara; una implementación ingenua (solo distancia) permitiría impactos imposibles (ej. de frente). | Calcular el arco válido de disparo como un cono/rectángulo relativo al `angle` del barco disparador (perpendicular ±umbral), verificado en el paso 3 del plan antes de conectarlo a la IA enemiga del paso 4. |
| Reducir el intervalo del Kraken indefinidamente por nivel puede volver el juego injugable en niveles altos (Kraken casi constante). | Aplicar un tope mínimo de intervalo (`MIN_KRAKEN_INTERVAL_MS`) al calcular el nuevo `krakenTimerMs` por nivel, igual que el tope de velocidad aplicado en `HoppyHazardGame` (spec de jam previa). |
| Con varios barcos enemigos aproximándose al mismo tiempo, la IA simple (`approaching`/`broadside`/`retreating`) puede hacer que se amontonen unos sobre otros de forma poco creíble. | Aceptado como riesgo menor de pulido visual — no bloqueante para el spec; se puede ajustar durante `/spec-impl` con una separación mínima entre barcos si el amontonamiento resulta muy notorio. |
