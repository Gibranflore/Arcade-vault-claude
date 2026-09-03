# Spec — Rex Run

- **Estado:** Draft
- **Dependencias:** Spec 04 (Supabase Auth + Scores — `submitScore`, `getLeaderboard`), Spec 05 (Asteroids jugable — patrón de referencia técnica `app/games/types.ts` + `GAME_COMPONENTS`)
- **Fecha:** 2026-09-03

**Objetivo:** Diseñar `rex-run` — un endless runner de scroll horizontal donde un T-Rex corre automáticamente por un paisaje prehistórico y el jugador salta o se agacha para esquivar obstáculos terrestres y aéreos, con velocidad y densidad de obstáculos crecientes — como componente Canvas jugable siguiendo el contrato `GameProps`/`GameHandle` ya establecido en la plataforma.

## Scope

**Dentro del alcance:**

- Nuevo componente `app/games/RexRunGame.tsx`, diseño original sin referencia en `Proyectos/` — se construye desde cero siguiendo el patrón técnico de `AsteroidsGame.tsx`/`TetrisGame.tsx`/`BreakoutGame.tsx`: `stateRef` con todo el estado mutable, loop vía `requestAnimationFrame`, `keysRef` para input, canvas de resolución lógica fija escalado por CSS.
- Escenario de scroll horizontal continuo hacia la izquierda a velocidad constante y creciente (el T-Rex permanece fijo en X, solo se mueve en Y al saltar/agacharse; el terreno y los obstáculos son los que se desplazan).
- Tres estados del dino: `running` (default, sobre el suelo), `jumping` (arco parabólico tras pulsar salto — flecha arriba o Espacio — con gravedad simple, no se puede saltar de nuevo hasta aterrizar), `ducking` (hitbox reducida en altura mientras se mantiene pulsada flecha abajo o S, vuelve a `running` al soltar).
- Generación procedural de obstáculos que aparecen por el borde derecho del canvas a intervalos variables:
  - `cactus`/`rock` (terrestres, sobre el suelo): requieren salto para esquivar.
  - `pterodactyl` (aéreo, a una altura fija que coincide con la cabeza del dino de pie): requiere agacharse para esquivar; saltar sobre él también colisiona si el arco de salto no alcanza suficiente altura.
  - Separación mínima horizontal entre obstáculos consecutivos garantizada en función de la velocidad de scroll actual, para que siempre exista una ventana de reacción válida.
- Velocidad de scroll aumenta de forma constante y gradual con la distancia recorrida (no por saltos discretos de nivel en la velocidad, sino interpolación continua con un tope máximo).
- Sistema de vidas (3 iniciales), reportado vía `onLives`: cada colisión con un obstáculo decrementa una vida y otorga una breve invulnerabilidad parpadeante (ventana de tiempo sin nuevas colisiones), igual patrón que la reaparición de la nave en Asteroids — sin reposicionar nada (el scroll no se reinicia), el juego continúa de inmediato.
- Sistema de puntaje: incremento continuo proporcional a la distancia recorrida (igual que el runner de referencia del navegador), más bonus fijo por cada obstáculo esquivado con éxito. Reportado vía `onScore`, monótono creciente, nunca disminuye.
- Nivel: cada umbral de distancia recorrida, sube de nivel (`onLevel`), aumenta el tope de velocidad de scroll y la proporción de obstáculos aéreos (`pterodactyl`) frente a terrestres.
- Game over cuando se agotan las 3 vidas (`onGameOver`).
- Sin HUD propio dibujado en canvas (nada de score/vidas/nivel/distancia pintado por el propio juego) — se reportan por callbacks, igual que el resto del catálogo.
- `start`/`pause`/`resume`/`reset` expuestos vía `onReady` como `GameHandle`; loop detenido mientras `isPaused` sea `true`.
- Wireo en `app/components/GamePlayer.tsx`: import de `RexRunGame`, entrada `"rex-run": RexRunGame` en `GAME_COMPONENTS`.
- Entrada `rex-run` en `app/lib/games.ts`, dentro de `GAMES` (jugable de inmediato, no `COMING_SOON_GAMES`), con `category: "Arcade"`, `controls: "Espacio o flecha arriba para saltar, flecha abajo para agacharse"`.
- Verificación funcional: navegar a `/juegos/rex-run`, iniciar, confirmar scroll continuo, obstáculos terrestres y aéreos apareciendo, salto/agachado respondiendo a input, probar pausa y salir.

**Fuera de alcance (explícitamente NO se hace):**

- Ciclo visual día/noche u otros efectos ambientales dinámicos — se usa un único fondo/paleta fija.
- Power-ups (invencibilidad temporal, doble salto, imán de puntos) u otros ítems bonus.
- Sonido/música.
- Soporte táctil/swipe para móvil — solo teclado, igual que el resto del catálogo.
- Modos alternativos (contrarreloj, endless de una sola vida al estilo del dino del navegador, selección de personaje).
- Cambios a `app/lib/scores.ts`, esquema de `scores`, o RLS — se reutiliza tal cual.
- Modificar `AsteroidsGame.tsx`, `TetrisGame.tsx`, `BreakoutGame.tsx` o cualquier otro juego existente.

## Modelo de datos

No se introducen estructuras de persistencia nuevas — se reutiliza `GameDef`/`GAMES` (`app/lib/games.ts`) y `GameProps`/`GameHandle` (`app/games/types.ts`) tal cual.

Estructuras internas nuevas, privadas de `RexRunGame.tsx` (viven en `stateRef`, no se exportan ni se persisten):

```ts
type ObstacleKind = "cactus" | "rock" | "pterodactyl";

type Obstacle = {
  kind: ObstacleKind;
  x: number; // px lógico, borde izquierdo
  y: number; // px lógico, base del obstáculo
  width: number;
  height: number;
  passed: boolean; // true una vez que cruzó al dino sin colisionar, para el bonus de puntos
};

type DinoMotionState = "running" | "jumping" | "ducking";

type Dino = {
  y: number; // px lógico, offset vertical respecto al suelo (0 = en el suelo)
  vy: number; // velocidad vertical durante el salto
  state: DinoMotionState;
  invulnerableMs: number; // > 0 tras una colisión, ignora nuevas colisiones
};

type RexRunState = {
  status: "idle" | "running" | "paused" | "gameover";
  dino: Dino;
  obstacles: Obstacle[];
  scrollSpeed: number; // px/seg lógico, crece con la distancia hasta un tope
  distance: number; // acumulador de distancia recorrida, base del score
  spawnTimerMs: number; // cuenta regresiva hasta el próximo spawn de obstáculo
  lives: number;
  score: number;
  level: number;
};
```

## Plan de implementación

1. **Constantes y generador de obstáculos.** Definir dentro de `RexRunGame.tsx` las constantes de física (gravedad, impulso de salto, altura de agachado, velocidad base/tope de scroll) y la función `spawnObstacle(level: number, scrollSpeed: number): Obstacle` que decide tipo (`cactus`/`rock`/`pterodactyl`) por probabilidad ponderada según `level`, respetando la separación mínima horizontal en función de `scrollSpeed`. Implementar el esqueleto de componente (`useRef` para canvas, `stateRef`, `keysRef`, `useEffect` de inicialización) con `draw()` estático (suelo, dino de pie, un obstáculo de ejemplo). El sistema sigue funcional (componente aún no usado en ninguna ruta).

2. **Loop y física del dino.** Implementar `update(dt)` con `requestAnimationFrame`: scroll continuo del terreno y los obstáculos hacia la izquierda, salto parabólico (impulso al pulsar salto, gravedad hasta volver a `y = 0`, sin doble salto), transición a `ducking` mientras se mantiene la tecla de agacharse (hitbox de altura reducida), incremento continuo de `distance` y de `scrollSpeed` (con tope). Loop respeta `isPaused`. El sistema sigue funcional.

3. **Spawning y limpieza de obstáculos.** Integrar `spawnObstacle` al loop vía `spawnTimerMs` regresivo (se reinicia con un intervalo aleatorio dependiente de `scrollSpeed` tras cada spawn), y remover del arreglo `obstacles` los que salen del canvas por la izquierda. El sistema sigue funcional.

4. **Colisiones, vidas e invulnerabilidad.** Implementar detección de colisión por rectángulos entre la hitbox del dino (según `state`: de pie, saltando o agachado) y cada `Obstacle`, ignorando obstáculos mientras `dino.invulnerableMs > 0`. Cada colisión decrementa `lives`, invoca `onLives`, activa `invulnerableMs` (parpadeo visual durante ese lapso) sin reiniciar el scroll ni la posición. Si `lives` llega a 0, `stateRef.status = "gameover"` e invoca `onGameOver()`. El sistema sigue funcional.

5. **Puntaje, bonus y nivel.** Implementar incremento de `score` proporcional a `distance` cada frame (invoca `onScore` cuando el valor entero visible cambia), marca `obstacle.passed = true` y suma un bonus fijo la primera vez que un obstáculo cruza completamente al dino sin colisión, y transición de nivel cada umbral de `distance` (invoca `onLevel`, sube el tope de `scrollSpeed` y la proporción de `pterodactyl` en `spawnObstacle`). El sistema sigue funcional.

6. **`GameHandle` vía `onReady`.** Exponer `start`/`pause`/`resume`/`reset` que manipulan `stateRef.status` y reinician el estado completo (incluida la limpieza de `obstacles` y reinicio de `distance`/`scrollSpeed`) en `reset()`. El sistema sigue funcional (componente completo y listo para wireo).

7. **Wireo en `GamePlayer.tsx`.** Agregar `import { RexRunGame } from "@/app/games/RexRunGame";` y la entrada `"rex-run": RexRunGame` en `GAME_COMPONENTS`. El sistema sigue funcional: cualquier otro `game.id` sin entrada sigue mostrando el placeholder "Próximamente".

8. **Catálogo.** Agregar el objeto `rex-run` a `GAMES` en `app/lib/games.ts` (título, descripción, `category: "Arcade"`, `controls: "Espacio o flecha arriba para saltar, flecha abajo para agacharse"`, `year` con el año de esta creación original, ícono libre de `lucide-react` no usado por otro juego del catálogo — por ejemplo `Footprints` — a confirmar como decisión menor durante `/spec-impl`). El sistema queda funcional: Rex Run aparece jugable en la Biblioteca (`/`), con detalle (`/juegos/rex-run`) y leaderboard real.

9. **Verificación funcional.** Levantar `npm run dev`, navegar a `/juegos/rex-run/jugar`, confirmar overlay idle, iniciar y verificar el scroll continuo del terreno, obstáculos terrestres y aéreos apareciendo con separación jugable, salto y agachado respondiendo a input, probar PAUSA/CONTINUAR y SALIR. Documentar que el ciclo completo de vidas/game-over/guardado de puntaje se verifica manualmente jugando.

## Criterios de aceptación

- [ ] `/` muestra la tarjeta de REX RUN en el grid jugable (categoría Arcade).
- [ ] `/juegos/rex-run` muestra info, controles y leaderboard real vía Supabase.
- [ ] `/juegos/rex-run/jugar` renderiza el canvas con el T-Rex, el suelo desplazándose y obstáculos apareciendo por la derecha tras presionar INICIAR.
- [ ] Pulsar salto (Espacio o flecha arriba) produce un arco parabólico completo antes de que el dino pueda saltar de nuevo, sin doble salto.
- [ ] Mantener presionada la tecla de agacharse reduce visiblemente la hitbox del dino mientras se mantiene pulsada, y vuelve a `running` al soltarla.
- [ ] Los obstáculos terrestres (`cactus`/`rock`) requieren salto y los aéreos (`pterodactyl`) requieren agacharse para esquivarse sin colisionar.
- [ ] Al colisionar con un obstáculo, se pierde una vida (`onLives` decrementa) y el dino queda brevemente invulnerable (parpadeo visual) sin reiniciar el scroll ni la posición.
- [ ] El puntaje (`onScore`) aumenta de forma monótona y continua con la distancia recorrida, nunca disminuye.
- [ ] Al superar el umbral de distancia por nivel, sube el nivel (`onLevel`), la velocidad de scroll aumenta perceptiblemente y aparecen más pterodáctilos.
- [ ] Al agotar las 3 vidas, se invoca `onGameOver()` exactamente una vez.
- [ ] El canvas no dibuja su propio HUD de score/vidas/nivel/distancia.
- [ ] `isPaused === true` congela el scroll, el salto y el spawn de obstáculos; al volver a `false` continúa desde el mismo estado.
- [ ] Snake, Breakout, Tetris, Asteroids, Frogger (si existe), Space Invaders y Pac-Man no cambian de comportamiento.
- [ ] `npm run lint` pasa sin errores nuevos.

## Decisiones tomadas y descartadas

- **Sistema de 3 vidas con invulnerabilidad breve tras colisión, en vez de una sola vida (muerte instantánea al estilo del dino del navegador).** Justificación: mantiene consistencia con el resto del catálogo (`onLives` con valor inicial distinto de 1) y da al jugador margen de reacción, sin perder la tensión del género.
- **Velocidad de scroll interpolada de forma continua con un tope, en vez de saltos discretos de velocidad por nivel.** Justificación: sensación de aceleración más fiel al género endless runner; los saltos de nivel (`onLevel`) sí existen pero afectan sobre todo la composición de obstáculos, no un cambio brusco de velocidad.
- **Sin power-ups ni ciclo día/noche.** Justificación: mantiene el scope acotado a un componente Canvas simple; puede proponerse como iteración futura si se aprueba este spec primero.
- **Puntaje basado en distancia continua más bonus por obstáculo esquivado, en vez de solo puntos por obstáculo.** Justificación: replica la sensación de progreso constante característica del género, mientras el bonus recompensa la habilidad de esquivar con precisión.
- **Sin referencia en `Proyectos/` porque no existe una implementación previa de este concepto.** Justificación: diseño original que sigue el patrón técnico (`stateRef` + `requestAnimationFrame` + canvas fijo escalado por CSS) igual que Asteroids/Tetris/Breakout, sin portar código existente.

## Riesgos identificados

| Riesgo                                                                                                                                                                          | Mitigación                                                                                                                                                                     |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| La separación mínima entre obstáculos depende de `scrollSpeed`, que crece con el tiempo; si no se recalcula correctamente, niveles altos pueden generar obstáculos imposibles de esquivar. | `spawnObstacle` calcula el intervalo mínimo de spawn como función directa de `scrollSpeed` actual (no un valor fijo), verificado como parte del paso 1 del plan.              |
| La hitbox variable del dino (de pie/saltando/agachado) frente a obstáculos de distinta altura puede generar colisiones "injustas" si los rectángulos no reflejan la silueta real. | Definir hitboxes ligeramente más pequeñas que el sprite visual dibujado (margen de tolerancia), mismo criterio ya aceptado implícitamente en juegos de colisión por rectángulo del catálogo. |
| Aumentar `scrollSpeed` sin límite puede volver el juego injugable en niveles altos.                                                                                              | Aplicar un tope máximo de velocidad (constante `MAX_SCROLL_SPEED`) definido en el paso 1 del plan.                                                                            |
