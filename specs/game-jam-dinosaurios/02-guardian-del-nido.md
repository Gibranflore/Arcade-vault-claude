# Spec — Guardián del Nido

- **Estado:** Draft
- **Dependencias:** Spec 04 (Supabase Auth + Scores — `submitScore`, `getLeaderboard`), Spec 05 (Asteroids jugable — patrón de referencia técnica `app/games/types.ts` + `GAME_COMPONENTS`)
- **Fecha:** 2026-09-03

**Objetivo:** Diseñar `guardian-del-nido` — un shooter de defensa fija donde un raptor se mueve horizontalmente en la parte baja del canvas y dispara hacia arriba para destruir amenazas que caen (rocas volcánicas y pterodáctilos rivales) antes de que lleguen a una fila de huevos custodiados, con oleadas de dificultad creciente — como componente Canvas jugable siguiendo el contrato `GameProps`/`GameHandle` ya establecido en la plataforma.

## Scope

**Dentro del alcance:**

- Nuevo componente `app/games/GuardianDelNidoGame.tsx`, diseño original sin referencia en `Proyectos/` — se construye desde cero siguiendo el patrón técnico de `AsteroidsGame.tsx`/`TetrisGame.tsx`/`BreakoutGame.tsx`: `stateRef` con todo el estado mutable, loop vía `requestAnimationFrame`, `keysRef` para input, canvas de resolución lógica fija escalado por CSS.
- Mecánica core distinta a un runner de reflejos: shooter de defensa de objetivo fijo (el jugador no protege su propia vida al esquivar, protege una fila de huevos estáticos disparando hacia las amenazas).
- Escenario: fila fija de 5 huevos en la franja inferior del canvas (el "nido"), y el raptor moviéndose horizontalmente justo encima de ellos, controlado con flechas izquierda/derecha o A/D (movimiento continuo, sin inercia, con límites en los bordes del canvas).
- Disparo: el raptor lanza un proyectil hacia arriba con Espacio, con un cooldown corto entre disparos (evita disparo continuo sin límite); el proyectil se mueve en línea recta hacia arriba hasta salir del canvas o impactar una amenaza.
- Amenazas que caen desde el borde superior del canvas, generadas proceduralmente en oleadas:
  - `rock` (roca volcánica): cae en línea recta vertical a velocidad constante, requiere un solo impacto para destruirse.
  - `ptero` (pterodáctilo rival): cae con un patrón de zigzag horizontal (oscilación senoidal mientras desciende), se mueve más rápido y vale más puntos al destruirse.
- Colisión proyectil-amenaza: destruye la amenaza (elimina de `threats`, elimina el proyectil), suma puntos según el tipo destruido (`rock` menos, `ptero` más). Reportado vía `onScore`.
- Colisión amenaza-huevo o amenaza-raptor sin ser destruida a tiempo: la amenaza llega a la franja del nido, se considera impacto — rompe un huevo vivo (marca `eggs[i].alive = false`), reportado vía `onLives` (vidas = huevos vivos restantes).
- Sistema de vidas: 5 huevos iniciales (distinto del estándar de 3 vidas de otros juegos del catálogo, justificado por la temática de "nido"), reportado vía `onLives`.
- Sistema de puntaje: puntos por cada amenaza destruida (valor distinto por tipo). Reportado vía `onScore`.
- Nivel/oleadas: cada cierto número de amenazas destruidas o tiempo transcurrido dentro de la oleada actual, sube de nivel (`onLevel`), aumenta la frecuencia de spawn, la velocidad de caída y la proporción de `ptero` frente a `rock`.
- Game over cuando los 5 huevos se rompen (`onGameOver`).
- Sin HUD propio dibujado en canvas (nada de score/vidas/nivel/huevos restantes pintado por el propio juego más allá de la representación visual de los huevos como parte de la escena, ver Riesgos) — se reportan por callbacks, igual que el resto del catálogo.
- `start`/`pause`/`resume`/`reset` expuestos vía `onReady` como `GameHandle`; loop detenido mientras `isPaused` sea `true`.
- Wireo en `app/components/GamePlayer.tsx`: import de `GuardianDelNidoGame`, entrada `"guardian-del-nido": GuardianDelNidoGame` en `GAME_COMPONENTS`.
- Entrada `guardian-del-nido` en `app/lib/games.ts`, dentro de `GAMES` (jugable de inmediato, no `COMING_SOON_GAMES`), con `category: "Acción"`, `controls: "Flechas o A/D + Espacio"`.
- Verificación funcional: navegar a `/juegos/guardian-del-nido`, iniciar, confirmar movimiento del raptor, disparo, amenazas cayendo (recto y en zigzag), huevos reaccionando al ser impactados, probar pausa y salir.

**Fuera de alcance (explícitamente NO se hace):**

- Power-ups (disparo múltiple, escudo temporal, ralentizar amenazas) u otros ítems bonus.
- Múltiples armas o mejoras de disparo seleccionables.
- Sonido/música.
- Soporte táctil para móvil — solo teclado, igual que el resto del catálogo.
- Multiplayer o modos alternativos (oleadas infinitas sin huevos, contrarreloj puro).
- Reconstrucción o reparación de huevos rotos durante la partida.
- Cambios a `app/lib/scores.ts`, esquema de `scores`, o RLS — se reutiliza tal cual.
- Modificar `AsteroidsGame.tsx`, `TetrisGame.tsx`, `BreakoutGame.tsx`, `RexRunGame.tsx` (del spec 01, si llegara a implementarse) o cualquier otro juego existente.

## Modelo de datos

No se introducen estructuras de persistencia nuevas — se reutiliza `GameDef`/`GAMES` (`app/lib/games.ts`) y `GameProps`/`GameHandle` (`app/games/types.ts`) tal cual.

Estructuras internas nuevas, privadas de `GuardianDelNidoGame.tsx` (viven en `stateRef`, no se exportan ni se persisten):

```ts
type ThreatKind = "rock" | "ptero";

type Threat = {
  kind: ThreatKind;
  x: number; // px lógico, centro
  y: number; // px lógico
  vx: number; // solo "ptero": componente horizontal del zigzag
  vy: number; // velocidad de caída
  width: number;
  height: number;
  zigzagPhase: number; // solo "ptero": fase de la oscilación senoidal
};

type Projectile = {
  x: number; // px lógico, centro
  y: number;
  width: number;
  height: number;
};

type Raptor = {
  x: number; // px lógico, centro
  width: number;
  cooldownMs: number; // > 0 mientras no puede disparar de nuevo
};

type Egg = {
  alive: boolean;
};

type GuardianState = {
  status: "idle" | "running" | "paused" | "gameover";
  raptor: Raptor;
  projectiles: Projectile[];
  threats: Threat[];
  eggs: Egg[]; // longitud fija 5
  score: number;
  level: number;
  waveSpawnTimerMs: number; // cuenta regresiva hasta el próximo spawn de amenaza
  threatsDestroyedInWave: number; // trigger de subida de nivel
};
```

## Plan de implementación

1. **Constantes y generador de amenazas.** Definir dentro de `GuardianDelNidoGame.tsx` las constantes de velocidad/spawn (velocidad base de caída, amplitud/frecuencia del zigzag de `ptero`, cooldown de disparo, umbral de amenazas destruidas por nivel) y la función `spawnThreat(level: number): Threat` que decide tipo (`rock`/`ptero`) por probabilidad ponderada según `level`. Implementar el esqueleto de componente (`useRef` para canvas, `stateRef`, `keysRef`, `useEffect` de inicialización) con `draw()` estático (nido con 5 huevos, raptor centrado, una amenaza de ejemplo). El sistema sigue funcional (componente aún no usado en ninguna ruta).

2. **Movimiento del raptor y disparo.** Implementar `update(dt)` con `requestAnimationFrame`: movimiento horizontal continuo del raptor según input (flechas/A-D) acotado a los límites del canvas, y disparo con Espacio que agrega un `Projectile` cuando `raptor.cooldownMs <= 0` (reinicia el cooldown). Loop respeta `isPaused`. El sistema sigue funcional.

3. **Caída de amenazas y spawning.** Integrar `spawnThreat` al loop vía `waveSpawnTimerMs` regresivo, implementar el descenso vertical de `rock` (línea recta) y `ptero` (línea recta en Y más oscilación senoidal en X según `zigzagPhase`), y remover del arreglo `threats` las que salen del canvas por los costados (solo `ptero`, si su oscilación las saca del área jugable). El sistema sigue funcional.

4. **Colisiones, destrucción e impacto en huevos.** Implementar detección de colisión por rectángulos proyectil-amenaza (destruye ambos, dispara el cálculo de puntos según `kind`) y amenaza-franja del nido (la amenaza llega a la altura de los huevos o del raptor sin haber sido destruida): selecciona el primer huevo vivo restante y lo marca `alive = false`, invoca `onLives` con el conteo de huevos vivos restantes. Si todos los huevos quedan `alive = false`, `stateRef.status = "gameover"` e invoca `onGameOver()`. El sistema sigue funcional.

5. **Puntaje y oleadas.** Implementar suma de puntos por amenaza destruida (invoca `onScore` en cada incremento, con valor distinto para `rock` y `ptero`), incremento de `threatsDestroyedInWave`, y transición de nivel al superar el umbral de la oleada actual (invoca `onLevel`, reinicia el contador, aumenta velocidad de caída y proporción de `ptero` en `spawnThreat`). El sistema sigue funcional.

6. **`GameHandle` vía `onReady`.** Exponer `start`/`pause`/`resume`/`reset` que manipulan `stateRef.status` y reinician el estado completo (incluida la restauración de los 5 huevos a `alive = true` y limpieza de `threats`/`projectiles`) en `reset()`. El sistema sigue funcional (componente completo y listo para wireo).

7. **Wireo en `GamePlayer.tsx`.** Agregar `import { GuardianDelNidoGame } from "@/app/games/GuardianDelNidoGame";` y la entrada `"guardian-del-nido": GuardianDelNidoGame` en `GAME_COMPONENTS`. El sistema sigue funcional: cualquier otro `game.id` sin entrada sigue mostrando el placeholder "Próximamente".

8. **Catálogo.** Agregar el objeto `guardian-del-nido` a `GAMES` en `app/lib/games.ts` (título, descripción, `category: "Acción"`, `controls: "Flechas o A/D + Espacio"`, `year` con el año de esta creación original, ícono libre de `lucide-react` no usado por otro juego del catálogo — por ejemplo `Egg` — a confirmar como decisión menor durante `/spec-impl`). El sistema queda funcional: Guardián del Nido aparece jugable en la Biblioteca (`/`), con detalle (`/juegos/guardian-del-nido`) y leaderboard real.

9. **Verificación funcional.** Levantar `npm run dev`, navegar a `/juegos/guardian-del-nido/jugar`, confirmar overlay idle, iniciar y verificar el movimiento horizontal del raptor, el disparo con cooldown, la caída de `rock` en línea recta y `ptero` en zigzag, la destrucción de amenazas al ser impactadas y la ruptura de huevos al no interceptarlas, probar PAUSA/CONTINUAR y SALIR. Documentar que el ciclo completo de vidas/game-over/guardado de puntaje se verifica manualmente jugando.

## Criterios de aceptación

- [ ] `/` muestra la tarjeta de GUARDIÁN DEL NIDO en el grid jugable (categoría Acción).
- [ ] `/juegos/guardian-del-nido` muestra info, controles (`Flechas o A/D + Espacio`) y leaderboard real vía Supabase.
- [ ] `/juegos/guardian-del-nido/jugar` renderiza el canvas con los 5 huevos, el raptor y amenazas cayendo desde arriba tras presionar INICIAR.
- [ ] El raptor se mueve horizontalmente en respuesta a flechas o A/D, acotado a los bordes del canvas, y dispara con Espacio respetando un cooldown perceptible (no se puede disparar sin límite).
- [ ] Las amenazas `rock` caen en línea recta; las amenazas `ptero` caen con un movimiento de zigzag horizontal claramente distinto.
- [ ] Un proyectil que impacta una amenaza la destruye y suma puntos (`onScore` incrementa), con valor distinto para `rock` y `ptero`.
- [ ] Una amenaza que llega a la franja del nido sin ser destruida rompe un huevo vivo (`onLives` decrementa) y ese huevo queda visualmente marcado como roto.
- [ ] Al superar el umbral de amenazas destruidas de la oleada actual, sube el nivel (`onLevel`), la velocidad de caída aumenta perceptiblemente y aparecen más `ptero`.
- [ ] Al romperse los 5 huevos, se invoca `onGameOver()` exactamente una vez.
- [ ] El canvas no dibuja su propio HUD de score/vidas/nivel (los huevos como escena del nido no cuentan como HUD, son parte del campo de juego).
- [ ] `isPaused === true` congela el movimiento del raptor, los proyectiles y la caída de amenazas; al volver a `false` continúa desde el mismo estado.
- [ ] Snake, Breakout, Tetris, Asteroids, Rex Run (si existe), Frogger, Space Invaders y Pac-Man no cambian de comportamiento.
- [ ] `npm run lint` pasa sin errores nuevos.

## Decisiones tomadas y descartadas

- **Shooter de defensa de objetivo fijo (proteger huevos disparando hacia arriba) en vez de un juego de reflejos de esquivar/correr.** Justificación: da a este segundo concepto una mecánica de input y de objetivo claramente distinta al spec 01 (disparo activo contra amenazas que caen vs. saltar/agacharse para esquivar), cumpliendo el requisito de mecánica core diferente entre los dos conceptos generados.
- **5 huevos como sistema de vidas, en vez de las 3 vidas estándar del resto del catálogo.** Justificación: temáticamente el "nido" pide una fila visual de objetos custodiados; 5 encaja mejor con una fila horizontal legible en pantalla que 3, y el contrato `onLives` no exige un valor inicial específico.
- **Cooldown de disparo en vez de disparo libre sin límite.** Justificación: evita que la estrategia óptima sea "mantener presionado Espacio", forzando timing y priorización de amenazas, coherente con la dificultad creciente por oleadas.
- **`ptero` con movimiento en zigzag y `rock` en línea recta, en vez de dos tipos de amenaza idénticos en movimiento.** Justificación: da variedad de lectura y dificultad sin necesitar un tercer tipo de amenaza; mantiene el scope de dos tipos acotado y simple.
- **Sin power-ups ni mejoras de arma.** Justificación: mantiene el scope acotado a un componente Canvas simple; puede proponerse como iteración futura si se aprueba este spec primero.
- **Sin referencia en `Proyectos/` porque no existe una implementación previa de este concepto.** Justificación: diseño original que sigue el patrón técnico (`stateRef` + `requestAnimationFrame` + canvas fijo escalado por CSS) igual que Asteroids/Tetris/Breakout, sin portar código existente.

## Riesgos identificados

| Riesgo                                                                                                                                                                                       | Mitigación                                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Determinar qué huevo se rompe cuando una amenaza llega al nido (¿el más cercano en X, el primero vivo por índice?) puede producir un comportamiento poco intuitivo si no se define un criterio claro. | El paso 4 del plan fija el criterio explícito: se rompe el huevo vivo cuya posición X esté más cerca del punto de impacto de la amenaza; si hay empate, el de menor índice.                        |
| El zigzag senoidal de `ptero` combinado con el movimiento del raptor puede hacer que ciertas amenazas sean matemáticamente imposibles de interceptar en niveles altos, frustrando al jugador. | Acotar la amplitud máxima del zigzag y la velocidad de caída con constantes tope (`MAX_ZIGZAG_AMPLITUDE`, `MAX_THREAT_FALL_SPEED`) definidas en el paso 1 del plan, verificado jugando en niveles altos durante `/spec-impl`. |
| El cooldown de disparo mal calibrado puede hacer el juego demasiado fácil (spam efectivo) o demasiado difícil (no se alcanza a defender el nido).                                              | Tratar el valor de `cooldownMs` como constante ajustable de tuning durante `/spec-impl`, no bloqueante para el spec; validar jugando que se puede sostener al menos 2-3 oleadas con juego razonable. |
