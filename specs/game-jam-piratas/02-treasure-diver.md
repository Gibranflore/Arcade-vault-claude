# Spec — Treasure Diver

- **Estado:** Draft
- **Dependencias:** Spec 04 (Supabase Auth + Scores — `submitScore`, `getLeaderboard`), Spec 05 (Asteroids jugable — patrón de referencia técnica `app/games/types.ts` + `GAME_COMPONENTS`)
- **Fecha:** 2026-09-02

**Objetivo:** Diseñar un juego nuevo `treasure-diver` — un buzo pirata desciende en scroll vertical hacia el fondo del mar para recoger tesoro con oxígeno limitado, debe decidir cuándo regresar a la superficie para "bancar" lo recogido antes de quedarse sin aire, con criaturas marinas y un Kraken como amenazas de las profundidades — como componente Canvas jugable siguiendo el contrato `GameProps`/`GameHandle` ya establecido en la plataforma.

## Scope

**Dentro del alcance:**

- Nuevo componente `app/games/TreasureDiverGame.tsx`: diseño original sin referencia en `Proyectos/` — se construye desde cero siguiendo el patrón técnico de `AsteroidsGame.tsx`/`TetrisGame.tsx`/`BreakoutGame.tsx` (`stateRef` con todo el estado mutable, loop vía `requestAnimationFrame`, `keysRef` para input, canvas de resolución lógica fija escalado por CSS).
- Mecánica core de **riesgo/recompensa tipo "push your luck"**: el buzo desciende libremente (movimiento continuo con inercia leve, flechas o WASD en las 4 direcciones dentro de la columna visible), recogiendo tesoro que se acumula como "cargado" (`carriedValue`) pero **no cuenta como puntaje hasta regresar a la superficie**. Esta mecánica de banking es la que distingue este concepto del combate continuo del primer concepto de la jam (`cannon-storm`).
- Scroll de cámara vertical descendente: la cámara sigue al buzo cuando baja más allá de lo ya alcanzado (`cameraDepth` solo aumenta, nunca retrocede al subir), generando procedimentalmente bandas de profundidad con tesoro y criaturas vía `spawnDepthBand(depth, level)`.
- Oxígeno como recurso interno del buceo actual (`oxygenMs`), consumido continuamente por tiempo; **no se expone vía un callback nuevo** (no se modifica `GameProps`) — es estado privado de `stateRef`. Se muestra mediante un indicador visual simple dibujado en el propio canvas (barra u óvalo pequeño, esquina del área de juego), como excepción justificada a la convención de "sin HUD propio": esa convención existe para no duplicar score/vidas/nivel (que sí vive en el marco de `GamePlayer.tsx`), no para prohibir retroalimentación diegética de un recurso que el contrato actual no contempla.
- Tesoro (`coin`, `gem`, `chest`) disperso en las bandas de profundidad, con valor creciente cuanto más profundo aparece — recogerlo (colisión buzo-item) suma a `carriedValue`, sin sumar a `onScore` todavía.
- Criaturas marinas con movimiento simple por tipo: `jellyfish` (deriva lenta, pasiva), `eel` (patrulla un tramo horizontal), `shark` (persigue al buzo dentro de un radio de detección). El contacto con cualquiera resta una penalización de oxígeno (`oxygenPenaltyMs`) en vez de quitar una vida directamente — invita a esquivar sin castigar con dureza excesiva un roce puntual.
- Kraken como amenaza exclusiva de zonas profundas (aparece solo tras cruzar un umbral de profundidad): telegraph obligatorio (`warnTimerMs` visible) antes de activar un "agarre"; si el buzo sigue dentro del radio de agarre al terminar el aviso, pierde una vida directamente (`onLives`), pierde todo el `carriedValue` de ese buceo (no bancado, se descarta) y es reposicionado en la superficie con oxígeno lleno.
- Retorno a superficie ("banking"): al llegar el buzo a la posición del barco de superficie, `score += carriedValue` (`onScore`), `carriedValue` vuelve a 0, `oxygenMs` se rellena a `oxygenMaxMs`. Si `maxDepthReached` superó el umbral de la zona actual, sube el nivel (`onLevel`), aumenta `oxygenMaxMs` levemente (mejora de equipo) y se habilita la siguiente banda de profundidad con tesoro más valioso y más criaturas.
- Blackout por oxígeno agotado: si `oxygenMs` llega a 0 mientras el buzo está bajo el agua (no en superficie), pierde una vida (`onLives`), descarta el `carriedValue` no bancado del buceo actual, y reaparece en la superficie con oxígeno lleno.
- Sistema de vidas (3 iniciales), reportado vía `onLives`; game over cuando llegan a 0 (`onGameOver`).
- `start`/`pause`/`resume`/`reset` expuestos vía `onReady` como `GameHandle`; loop detenido mientras `isPaused` sea `true`.
- Wireo en `app/components/GamePlayer.tsx`: import de `TreasureDiverGame`, entrada `"treasure-diver": TreasureDiverGame` en `GAME_COMPONENTS`.
- Entrada `treasure-diver` en `app/lib/games.ts`, dentro de `GAMES` (jugable de inmediato, no `COMING_SOON_GAMES`), con `category: "Arcade"`, `controls: "Flechas o WASD"`.
- Verificación funcional: navegar a `/juegos/treasure-diver`, iniciar, confirmar scroll vertical al descender, recolección de tesoro, consumo visible de oxígeno, retorno a superficie con banking del puntaje, probar pausa y salir.

**Fuera de alcance (explícitamente NO se hace):**

- Modificar `GameProps`/`GameHandle` para agregar un callback de oxígeno (`onOxygen` o similar) — el oxígeno se resuelve como estado interno + indicador dibujado en canvas, según lo descrito arriba.
- Sonido/música.
- Soporte táctil/swipe para móvil — solo teclado, igual que el resto del catálogo.
- Mejoras/equipo comprables entre partidas, inventario persistente, o cualquier progreso que sobreviva a un `reset()`.
- Múltiples buzos/personajes seleccionables.
- Combate: el buzo no tiene ninguna forma de atacar criaturas ni al Kraken — la única interacción con amenazas es esquivar o huir.
- Cambios a `app/lib/scores.ts`, esquema de `scores`, o RLS — se reutiliza tal cual.
- Modificar `AsteroidsGame.tsx`, `TetrisGame.tsx`, `BreakoutGame.tsx`, `FroggerGame.tsx`, `HoppyHazardGame.tsx` o `CannonStormGame.tsx` (specs de jams previas o del primer concepto de esta jam, si llegaran a implementarse).

## Modelo de datos

No se introducen estructuras de persistencia nuevas — se reutiliza `GameDef`/`GAMES` (`app/lib/games.ts`) y `GameProps`/`GameHandle` (`app/games/types.ts`) tal cual, **sin extenderlos**.

Estructuras internas nuevas, privadas de `TreasureDiverGame.tsx` (viven en `stateRef`, no se exportan ni se persisten):

```ts
type Vec2 = { x: number; y: number };

type Diver = {
  x: number;
  y: number; // coordenada de mundo; crece hacia abajo (mayor profundidad)
  vx: number;
  vy: number;
  oxygenMs: number; // oxígeno restante del buceo actual
  carriedValue: number; // tesoro recogido sin bancar en este buceo
  state: "diving" | "returning" | "at-surface";
};

type TreasureItem = {
  x: number;
  y: number; // coordenada de mundo
  kind: "coin" | "gem" | "chest";
  value: number; // crece con la profundidad de aparición
  collected: boolean;
};

type SeaCreature = {
  kind: "jellyfish" | "eel" | "shark";
  x: number;
  y: number;
  vx: number;
  vy: number;
  patrolRange: [number, number]; // límites horizontales de patrulla (eel/jellyfish)
  oxygenPenaltyMs: number; // oxígeno que quita al tocar al buzo
};

type KrakenGrab = {
  x: number;
  y: number;
  warnTimerMs: number; // telegraph antes de poder agarrar
  grabRadius: number;
  active: boolean; // false = solo telegraph, true = ya puede agarrar
};

type TreasureDiverState = {
  status: "idle" | "running" | "paused" | "gameover";
  diver: Diver;
  cameraDepth: number; // cuánto ha descendido la cámara, nunca retrocede
  maxDepthReached: number;
  items: TreasureItem[];
  creatures: SeaCreature[];
  kraken: KrakenGrab | null; // solo existe pasado el umbral de profundidad de Kraken
  score: number; // tesoro ya bancado
  lives: number;
  level: number; // zona de profundidad actual
  oxygenMaxMs: number; // capacidad máxima de oxígeno, crece levemente por nivel
};
```

## Plan de implementación

1. **Constantes de profundidad y generador de bandas.** Definir dentro de `TreasureDiverGame.tsx` las constantes de mundo (posición Y de la superficie, umbral de profundidad del Kraken, `oxygenMaxMs` inicial) y la función `spawnDepthBand(depth: number, level: number): { items: TreasureItem[]; creatures: SeaCreature[] }` que genera tesoro/criaturas por banda según profundidad y nivel. Crear el esqueleto de componente (`useRef` para canvas, `stateRef`, `keysRef`, `useEffect` de inicialización) con `draw()` estático (barco de superficie, buzo, agua, indicador de oxígeno). El sistema sigue funcional (componente aún no usado en ninguna ruta).

2. **Movimiento del buzo y cámara.** Implementar `update(dt)` con `requestAnimationFrame`: input direccional continuo con inercia leve (flechas/WASD), actualización de `cameraDepth` cuando `diver.y` supera lo ya alcanzado (patrón estándar de scroller vertical), y generación de nuevas bandas vía `spawnDepthBand` a medida que la cámara avanza. Loop respeta `isPaused`. El sistema sigue funcional.

3. **Oxígeno e indicador visual.** Implementar el consumo continuo de `oxygenMs` mientras `diver.state !== "at-surface"`, y el dibujo del indicador de oxígeno en el canvas (barra/óvalo simple, sin duplicar información de score/vidas/nivel). El sistema sigue funcional.

4. **Recolección de tesoro.** Implementar colisión buzo-`TreasureItem`: suma a `diver.carriedValue` (no a `score`), marca el ítem como `collected` y lo remueve del render. El sistema sigue funcional.

5. **Criaturas marinas.** Implementar movimiento por tipo (`jellyfish` deriva lenta, `eel` patrulla entre `patrolRange`, `shark` persigue al buzo dentro de un radio de detección) y colisión buzo-criatura: resta `oxygenPenaltyMs` a `diver.oxygenMs` (con una breve invulnerabilidad tras cada contacto, mismo patrón que la invulnerabilidad de impacto en `CannonStormGame`) en vez de decrementar vidas directamente. El sistema sigue funcional.

6. **Kraken.** Implementar la aparición de `KrakenGrab` solo cuando `maxDepthReached` supera el umbral configurado: fase de telegraph (`warnTimerMs` regresivo, `active: false`, visualmente distinguible), y al llegar a 0 pasa a `active: true` por una ventana breve — si el buzo está dentro de `grabRadius` durante esa ventana, decrementa `lives` (`onLives`), descarta `carriedValue` (se pierde, no se banca) y reposiciona al buzo en la superficie con `oxygenMs = oxygenMaxMs`. El sistema sigue funcional.

7. **Retorno a superficie y banking.** Implementar la detección de "buzo alcanza la posición del barco de superficie" (`diver.state` pasa a `"at-surface"`): `score += carriedValue` (invoca `onScore`), `carriedValue = 0`, `oxygenMs = oxygenMaxMs`. Si `maxDepthReached` cruza el umbral de la zona actual, incrementa `level` (invoca `onLevel`), aumenta `oxygenMaxMs` levemente y habilita la siguiente banda de profundidad en `spawnDepthBand`. El sistema sigue funcional.

8. **Blackout por oxígeno agotado.** Implementar la detección de `oxygenMs <= 0` mientras `diver.state !== "at-surface"`: decrementa `lives` (`onLives`), descarta `carriedValue`, reposiciona al buzo en la superficie con oxígeno lleno. Si `lives` llega a 0, `stateRef.status = "gameover"` e invoca `onGameOver()`. El sistema sigue funcional.

9. **`GameHandle` vía `onReady`.** Exponer `start`/`pause`/`resume`/`reset` que manipulan `stateRef.status` y reinician el estado completo (buzo en superficie, `cameraDepth`, bandas, oxígeno, vidas, nivel) en `reset()`. El sistema sigue funcional (componente completo, listo para wireo).

10. **Wireo en `GamePlayer.tsx`.** Agregar `import { TreasureDiverGame } from "@/app/games/TreasureDiverGame";` y la entrada `"treasure-diver": TreasureDiverGame` en `GAME_COMPONENTS`. El sistema sigue funcional para cualquier otro `game.id`.

11. **Catálogo.** Agregar el objeto `treasure-diver` a `GAMES` en `app/lib/games.ts` (título "TREASURE DIVER", descripción, `category: "Arcade"`, `controls: "Flechas o WASD"`, `year` de esta obra original — decisión menor de implementación, ícono libre de `lucide-react` como `Gem` o `Waves`). El sistema queda funcional: Treasure Diver aparece jugable en la Biblioteca (`/`), con detalle (`/juegos/treasure-diver`) y leaderboard real.

12. **Verificación funcional.** Levantar `npm run dev`, navegar a `/juegos/treasure-diver/jugar`, confirmar overlay idle, iniciar y verificar el descenso con scroll de cámara, recolección de tesoro sin sumar puntaje inmediato, consumo visible del indicador de oxígeno, retorno a superficie bancando el puntaje acumulado, y pérdida de vida tanto por oxígeno agotado como por el Kraken. Probar PAUSA/CONTINUAR y SALIR. Documentar que el ciclo completo de game-over/guardado de puntaje se verifica manualmente jugando.

## Criterios de aceptación

- [ ] `/` muestra la tarjeta de TREASURE DIVER en el grid jugable (categoría Arcade).
- [ ] `/juegos/treasure-diver` muestra info, controles (`Flechas o WASD`) y leaderboard real vía Supabase.
- [ ] `/juegos/treasure-diver/jugar` renderiza el canvas con el buzo, el barco de superficie y el indicador de oxígeno tras presionar INICIAR.
- [ ] El buzo se mueve libremente en las 4 direcciones y la cámara desciende siguiéndolo solo cuando supera la profundidad ya alcanzada, nunca retrocede al subir.
- [ ] Recoger un ítem de tesoro incrementa el tesoro cargado del buzo pero **no** incrementa `onScore` de inmediato.
- [ ] Solo al llegar el buzo a la superficie se invoca `onScore` con el tesoro cargado acumulado, y el tesoro cargado vuelve a 0.
- [ ] El indicador de oxígeno dibujado en el canvas disminuye de forma continua mientras el buzo está bajo el agua y se rellena al llegar a la superficie.
- [ ] El contacto con una criatura marina (`jellyfish`/`eel`/`shark`) reduce el oxígeno restante pero no decrementa `onLives` directamente.
- [ ] Si el oxígeno llega a 0 bajo el agua, se decrementa `onLives`, se descarta el tesoro cargado no bancado, y el buzo reaparece en la superficie con oxígeno lleno.
- [ ] El Kraken solo aparece tras superar el umbral de profundidad configurado, muestra una fase de aviso visible antes de poder agarrar, y un agarre exitoso decrementa `onLives` y descarta el tesoro cargado.
- [ ] Al superar el umbral de profundidad de la zona actual y regresar a superficie, sube el nivel (`onLevel`) y la siguiente banda de profundidad ofrece tesoro más valioso.
- [ ] Al agotar las 3 vidas, se invoca `onGameOver()` exactamente una vez.
- [ ] El canvas no dibuja su propio HUD de score/vidas/nivel — solo el indicador diegético de oxígeno, que no duplica esos tres datos.
- [ ] `isPaused === true` congela el descenso, el consumo de oxígeno, las criaturas y el Kraken; al volver a `false` continúa desde el mismo estado.
- [ ] `GameProps`/`GameHandle` (`app/games/types.ts`) no cambian de forma — ningún campo nuevo se agrega al contrato para soportar el oxígeno.
- [ ] Snake, Breakout, Tetris, Asteroids, Frogger, Cannon Storm (si existen), Space Invaders y Pac-Man no cambian de comportamiento.
- [ ] `npm run lint` pasa sin errores nuevos.

## Decisiones tomadas y descartadas

- **Mecánica de banking (el tesoro solo cuenta al volver a la superficie) en vez de puntaje inmediato al recoger.** Justificación: es la mecánica que distingue este concepto del resto del catálogo — convierte cada decisión de "¿sigo bajando o regreso?" en la tensión central del juego, algo que ningún otro juego de la plataforma ofrece.
- **Oxígeno como estado interno con indicador dibujado en canvas, sin extender `GameProps`.** Justificación: agregar un callback nuevo (`onOxygen`) rompería el contrato estable que usan todos los juegos existentes y complicaría `GamePlayer.tsx` con un caso especial; un indicador diegético dentro del propio canvas resuelve la necesidad de feedback sin tocar la plataforma.
- **Contacto con criaturas resta oxígeno en vez de quitar una vida directamente.** Justificación: un roce accidental con una medusa no debería sentirse tan punitivo como un agarre del Kraken; escalona el riesgo (criaturas = presión de tiempo, Kraken = pérdida directa) reforzando la decisión de cuándo regresar.
- **Sin combate/ataque para el buzo.** Justificación: mantiene la identidad del concepto centrada en evasión y gestión de riesgo, evitando solaparse mecánicamente con el combate de `cannon-storm` (el otro concepto de esta jam).
- **Kraken exclusivo de zonas profundas, con telegraph obligatorio.** Justificación: refuerza la curva de riesgo/recompensa (más profundo = más valioso pero el Kraken empieza a ser una amenaza real) y evita que se sienta como un castigo aleatorio sin aviso, igual que la decisión equivalente en `cannon-storm`.
- **Sin referencia en `Proyectos/`, diseño original que solo reutiliza el patrón técnico.** Justificación: no existe implementación previa de este concepto en el repo; se sigue el mismo patrón `stateRef` + `requestAnimationFrame` + canvas fijo escalado por CSS que Asteroids/Tetris/Breakout.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| El indicador de oxígeno dibujado en canvas es una excepción a la convención "sin HUD propio"; mal ejecutado podría confundirse visualmente con el HUD de score/vidas/nivel del marco. | Mantenerlo pequeño, posicionado en una esquina del área de juego, con un estilo claramente distinto (ej. gota/burbuja) al HUD del marco; documentado explícitamente como excepción justificada en Scope, no como precedente general para otros juegos. |
| La mecánica de banking depende de que el jugador entienda que el tesoro recogido no cuenta hasta volver a superficie; sin comunicación clara, puede sentirse como un bug ("¿por qué no sube mi puntaje?"). | El indicador visual de "tesoro cargado" (distinto del score real) se resuelve como parte del mismo indicador diegético del paso 3 del plan — no requiere nuevo callback, solo una segunda cifra pequeña dibujada junto al oxígeno. |
| Generar bandas de profundidad proceduralmente sin límite puede volver la dificultad desbalanceada en niveles muy altos (demasiadas criaturas, tesoro inalcanzable). | Aplicar topes máximos de densidad de criaturas y de valor de tesoro por banda al calcular `spawnDepthBand(depth, level)`, mismo patrón de tope aplicado a `MAX_LANE_SPEED` en `HoppyHazardGame` (spec de jam previa). |
| Perder todo el `carriedValue` no bancado (por oxígeno agotado o Kraken) puede sentirse muy punitivo si ocurre cerca de la superficie, desincentivando el riesgo por completo. | Aceptado como tensión de diseño intencional del género push-your-luck — ajustable durante `/spec-impl` (ej. bancar un porcentaje parcial en vez de todo) si el playtesting inicial lo muestra demasiado duro; no bloqueante para el spec. |
