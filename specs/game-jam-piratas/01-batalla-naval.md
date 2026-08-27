# Spec — Batalla Naval

- **Estado:** Draft
- **Dependencias:** Spec 04 (Supabase Auth + Scores — `submitScore`, `getLeaderboard`), Spec 05 (Asteroids jugable — patrón de referencia técnica `app/games/types.ts` + `GAME_COMPONENTS`)
- **Fecha:** 2026-08-27

**Objetivo:** Diseñar un juego nuevo `batalla-naval` — un barco pirata que navega libremente por un mar de vista cenital y combate a costado (babor/estribor) contra oleadas de naves enemigas, esquivando cañonazos y al Kraken, mientras recoge el tesoro de los barcos hundidos — como componente Canvas jugable siguiendo el contrato `GameProps`/`GameHandle` ya establecido en la plataforma.

## Scope

**Dentro del alcance:**

- Nuevo componente `app/games/BatallaNavalGame.tsx`: diseño original, no hay referencia en `Proyectos/` para este juego — se construye desde cero siguiendo el patrón técnico de `AsteroidsGame.tsx`/`TetrisGame.tsx`/`BreakoutGame.tsx` (`stateRef` con todo el estado mutable, loop vía `requestAnimationFrame`, `keysRef` para input, canvas de resolución lógica fija escalado por CSS).
- Vista cenital (top-down) de un mar delimitado por los bordes del canvas (sin scroll, escenario cerrado, a diferencia de Asteroids que envuelve los bordes — aquí el barco del jugador queda contenido dentro del área de juego mediante clamp).
- Movimiento del barco del jugador: aceleración continua en las 4/8 direcciones según input de flechas/WASD, con fricción/desaceleración al soltar teclas, **sin control de rotación** (a diferencia del barco de Asteroids que rota y acelera hacia adelante) — el barco mantiene su orientación fija (proa hacia arriba) y se desplaza libremente por el mar.
- Combate a costado (broadside), mecánica core distinta a un disparo frontal: el barco del jugador solo puede disparar cañones hacia su izquierda (babor) o hacia su derecha (estribor), nunca hacia adelante/atrás. Input dedicado para cada costado (ej. `Q` = babor, `E` = estribor), cada uno con su propio cooldown de recarga independiente.
- Oleadas de naves enemigas (`sloop`, `frigate`, `galleon`, con HP creciente) que entran desde los bordes laterales del canvas, navegan en línea recta o zigzag simple y disparan cañonazos ocasionales hacia la posición del jugador.
- Colisión de cañonazo del jugador contra una nave enemiga reduce su HP; al llegar a 0, la nave se hunde, otorga puntos y genera un tesoro flotante en su posición.
- Colisión de cañonazo enemigo contra el barco del jugador reduce su casco (`hull`, representado como vidas), con una breve invulnerabilidad tras cada impacto para evitar pérdidas múltiples en el mismo frame.
- Tesoro flotante: aparece al hundir una nave, tiene un tiempo de vida (`ttlMs`) antes de hundirse y desaparecer; el jugador lo recoge navegando sobre él, otorgando un bonus de puntos adicional al valor base de hundir la nave.
- El Kraken: aparece periódicamente en el centro del mar (cooldown regresivo entre apariciones), extiende tentáculos durante una ventana de tiempo activa; si el barco del jugador se acerca dentro de un radio de peligro mientras el Kraken está activo, recibe daño (mismo sistema de `hull`/invulnerabilidad que el daño de cañonazo). El Kraken no dispara ni persigue, es un hazard de área que obliga a mantener distancia.
- Sistema de vidas (casco, 3 golpes iniciales), reportado vía `onLives`.
- Sistema de puntaje: puntos por impacto de cañón, bonus mayor por hundir una nave, bonus adicional por recoger el tesoro flotante antes de que expire. Reportado vía `onScore`.
- Nivel: al vaciar la oleada de naves enemigas actual (todas hundidas), sube de nivel (`onLevel`), se genera una nueva oleada más numerosa/rápida/con más HP y aumenta la frecuencia de aparición del Kraken.
- Game over cuando el casco llega a 0 golpes restantes (`onGameOver`).
- Sin HUD propio dibujado en canvas (score/vidas/nivel se reportan solo por callbacks, igual que Asteroids/Tetris/Breakout/Frogger).
- `start`/`pause`/`resume`/`reset` expuestos vía `onReady` como `GameHandle`; loop detenido mientras `isPaused` sea `true`.
- Wireo en `app/components/GamePlayer.tsx`: import de `BatallaNavalGame`, entrada `"batalla-naval": BatallaNavalGame` en `GAME_COMPONENTS`.
- Entrada `batalla-naval` en `app/lib/games.ts`, dentro de `GAMES` (jugable de inmediato, no `COMING_SOON_GAMES`), con `category: "Acción"`, `controls: "Flechas/WASD + Q/E"`.
- Verificación funcional: navegar a `/juegos/batalla-naval`, iniciar, confirmar movimiento libre del barco, disparo a ambos costados, naves enemigas entrando y hundiéndose, aparición del Kraken, probar pausa y salir.

**Fuera de alcance (explícitamente NO se hace):**

- Sonido/música.
- Soporte táctil/swipe para móvil — solo teclado, igual que el resto del catálogo.
- Boss fight completo del Kraken con barra de vida propia — el Kraken es un hazard de área temporal, no un enemigo con HP ni con el que se combata directamente.
- Power-ups, mejoras de barco persistentes entre partidas, o selección de tipo de barco jugable.
- Multiplayer o modos alternativos (cooperativo, contrarreloj puro, etc.).
- Mapas/niveles con distinta geografía (islas, arrecifes como obstáculos físicos) — el mar es un área abierta rectangular sin obstáculos de terreno en esta versión.
- Animaciones de sprite detalladas (arte pixel-art complejo) — se usan formas geométricas simples (rectángulos/polígonos/triángulos) coloreadas, mismo nivel de fidelidad visual que `BreakoutGame.tsx`/`TetrisGame.tsx`.
- Cambios a `app/lib/scores.ts`, esquema de `scores`, o RLS — se reutiliza tal cual.
- Modificar `AsteroidsGame.tsx`, `TetrisGame.tsx`, `BreakoutGame.tsx` o `FroggerGame.tsx`.

## Modelo de datos

No se introducen estructuras de persistencia nuevas — se reutiliza `GameDef`/`GAMES` (`app/lib/games.ts`) y `GameProps`/`GameHandle` (`app/games/types.ts`) tal cual.

Estructuras internas nuevas, privadas de `BatallaNavalGame.tsx` (viven en `stateRef`, no se exportan ni se persisten):

```ts
type EnemyKind = "sloop" | "frigate" | "galleon";

type EnemyShip = {
  kind: EnemyKind;
  x: number; // px lógico, centro
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  fireCooldownMs: number;
};

type Cannonball = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  owner: "player" | "enemy";
  damage: number;
};

type Treasure = {
  x: number;
  y: number;
  value: number;
  ttlMs: number; // tiempo restante antes de hundirse sin recoger
};

type Kraken = {
  active: boolean;
  x: number;
  y: number;
  dangerRadius: number;
  spawnCooldownMs: number; // cuenta regresiva hasta la próxima aparición
  activeTimeMs: number; // tiempo restante de la aparición actual
};

type PlayerShip = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hull: number; // golpes restantes, 3 iniciales
  invulnerableMs: number;
  fireCooldownPortMs: number; // babor
  fireCooldownStarboardMs: number; // estribor
};

type BattleState = {
  status: "idle" | "running" | "paused" | "gameover";
  player: PlayerShip;
  enemies: EnemyShip[];
  cannonballs: Cannonball[];
  treasures: Treasure[];
  kraken: Kraken;
  score: number;
  lives: number; // espejo de player.hull, reportado vía onLives
  level: number;
  waveEnemiesRemaining: number;
};
```

## Plan de implementación

1. **Constantes y esqueleto de componente.** Definir dentro de `BatallaNavalGame.tsx` las constantes del mar (dimensiones lógicas del canvas, límites de clamp del jugador, velocidades base) y crear el esqueleto del componente (`useRef` para canvas, `stateRef`, `keysRef`, `useEffect` de inicialización) con `draw()` pintando el mar y el barco del jugador en una posición estática, sin loop de update aún. El sistema sigue funcional (componente aún no usado en ninguna ruta).

2. **Movimiento libre del barco del jugador.** Implementar `update(dt)` con `requestAnimationFrame`: aceleración continua según input de flechas/WASD, fricción al soltar teclas, clamp de posición a los límites del mar (sin rotación, proa fija hacia arriba). Loop respeta `isPaused`. El sistema sigue funcional.

3. **Oleadas de naves enemigas.** Implementar `buildWave(level): EnemyShip[]` que genera una oleada con cantidad/tipo/HP crecientes según `level`; las naves entran desde los bordes laterales, navegan en línea recta o zigzag y disparan `Cannonball` ocasionales (`owner: "enemy"`) hacia la posición del jugador con cooldown propio. El sistema sigue funcional.

4. **Combate a costado (broadside).** Implementar disparo de cañones a babor/estribor (input dedicado, ej. `Q`/`E`) con cooldown independiente por lado, generando `Cannonball` (`owner: "player"`) perpendicular al eje del barco hacia el lado correspondiente. Detección de colisión bala-nave enemiga (`hp--`, remueve la bala) y bala enemiga-jugador (`hull--` con `invulnerableMs` tras el impacto, remueve la bala). El sistema sigue funcional.

5. **Hundimiento y tesoro.** Al `hp` de una nave enemiga llegar a 0, se elimina de `enemies`, suma puntos base (`onScore`) y genera un `Treasure` en su posición con `ttlMs` regresivo. El jugador lo recoge navegando sobre su posición antes de que `ttlMs` llegue a 0 (bonus adicional de puntos vía `onScore`); si expira sin recogerse, se elimina sin bonus. El sistema sigue funcional.

6. **Kraken.** Implementar el ciclo de aparición: `spawnCooldownMs` regresivo hasta activar el Kraken en el centro del mar; mientras `active === true` y `activeTimeMs > 0`, si la distancia entre el jugador y el Kraken es menor a `dangerRadius`, aplica daño (mismo sistema de `hull`/`invulnerableMs` que el daño de cañonazo); al agotarse `activeTimeMs`, el Kraken se desactiva y reinicia `spawnCooldownMs`. El sistema sigue funcional.

7. **Vidas, nivel y `GameHandle`.** Sincronizar `lives` con `player.hull` (invoca `onLives` en cada cambio); al llegar a 0, `stateRef.status = "gameover"` e invoca `onGameOver()`. Al vaciar `waveEnemiesRemaining` (todas las naves de la oleada hundidas), invoca `onLevel`, regenera la oleada con `buildWave(level + 1)` y reduce el `spawnCooldownMs` base del Kraken. Exponer `start`/`pause`/`resume`/`reset` vía `onReady`, reiniciando el estado completo en `reset()`. El sistema sigue funcional (componente completo, listo para wireo).

8. **Wireo en `GamePlayer.tsx`.** Agregar `import { BatallaNavalGame } from "@/app/games/BatallaNavalGame";` y la entrada `"batalla-naval": BatallaNavalGame` en `GAME_COMPONENTS`. El sistema sigue funcional: cualquier otro `game.id` sin entrada sigue mostrando el placeholder "Próximamente".

9. **Catálogo y verificación funcional.** Agregar el objeto `batalla-naval` a `GAMES` en `app/lib/games.ts` (título, descripción, `category: "Acción"`, `controls: "Flechas/WASD + Q/E"`, `year` del año de esta versión original, ícono libre de `lucide-react` — ej. `Anchor`, `Sailboat` o `Waves`, a confirmar disponibilidad durante `/spec-impl`). Levantar `npm run dev`, navegar a `/juegos/batalla-naval/jugar`, confirmar overlay idle, iniciar y verificar movimiento libre del barco, disparo a ambos costados, naves entrando/hundiéndose, recogida de tesoro y aparición periódica del Kraken; probar PAUSA/CONTINUAR y SALIR. Documentar que el ciclo completo de vidas/game-over/guardado de puntaje se verifica manualmente jugando.

## Criterios de aceptación

- [ ] `/` muestra la tarjeta de BATALLA NAVAL en el grid jugable (categoría Acción).
- [ ] `/juegos/batalla-naval` muestra info, controles (`Flechas/WASD + Q/E`) y leaderboard real vía Supabase.
- [ ] `/juegos/batalla-naval/jugar` renderiza el canvas con el mar, el barco del jugador y naves enemigas entrando desde los bordes tras presionar INICIAR.
- [ ] El barco del jugador se mueve libremente por aceleración/fricción en las direcciones de flechas/WASD, sin control de rotación, y queda contenido dentro de los límites del mar.
- [ ] El input de babor (`Q`) dispara únicamente hacia la izquierda del barco y el de estribor (`E`) únicamente hacia la derecha; nunca se dispara hacia adelante/atrás.
- [ ] Al impactar una nave enemiga con suficientes cañonazos, esta se hunde, otorga puntos (`onScore`) y genera un tesoro flotante recogible.
- [ ] Recoger el tesoro flotante antes de que expire otorga un bonus adicional de puntos (`onScore`); dejarlo expirar lo elimina sin bonus.
- [ ] Recibir un cañonazo enemigo o acercarse al Kraken activo dentro de su radio de peligro decrementa una vida (`onLives`) y aplica una breve invulnerabilidad visible.
- [ ] El Kraken aparece y desaparece de forma periódica y predecible (cooldown), sin perseguir activamente al jugador.
- [ ] Al hundir todas las naves de la oleada actual, sube el nivel (`onLevel`), aparece una nueva oleada más numerosa/rápida y el Kraken aparece con más frecuencia.
- [ ] Al agotar las 3 vidas de casco, se invoca `onGameOver()` exactamente una vez.
- [ ] El canvas no dibuja su propio HUD de score/vidas/nivel (esos datos viven solo en el HUD del marco de `GamePlayer.tsx`, vía los callbacks).
- [ ] `isPaused === true` congela el movimiento del barco, las naves enemigas, los cañonazos y el Kraken; al volver a `false` continúa desde el mismo estado.
- [ ] Snake, Breakout, Tetris, Asteroids, Space Invaders, Pac-Man y Frogger no cambian de comportamiento.
- [ ] `npm run lint` pasa sin errores nuevos.

## Decisiones tomadas y descartadas

- **Combate exclusivamente a costado (babor/estribor), sin disparo frontal.** Justificación: es la mecánica distintiva de este concepto — obliga a posicionarse lateralmente respecto al enemigo en vez de apuntar y disparar libremente como en Asteroids, dando al jugador un desafío de maniobra distinto.
- **Barco del jugador sin rotación, con aceleración/fricción en las 4/8 direcciones cardinales.** Justificación: diferencia deliberadamente el control de este juego del esquema rotar+empujar de `AsteroidsGame.tsx`, evitando que el concepto se sienta como una reskin del juego ya implementado.
- **El Kraken es un hazard de área temporal, no un boss con HP.** Justificación: mantiene el scope acotado a un componente Canvas simple; un boss fight con barra de vida propia y fases añadiría complejidad de estado y de UI que no encaja en "un único componente" razonable para este jam.
- **Mar como área abierta sin obstáculos de terreno (islas/arrecifes).** Justificación: simplifica la detección de colisiones y el pathing de las naves enemigas; puede proponerse como iteración futura sobre este mismo spec una vez aprobado e implementado.
- **Sin referencia en `Proyectos/`, diseño original que solo reutiliza el patrón técnico.** Justificación: no existe implementación previa de este concepto en el repo; se sigue el mismo patrón `stateRef` + `requestAnimationFrame` + canvas fijo escalado por CSS que Asteroids/Tetris/Breakout/Frogger.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| El combate a costado requiere que el jugador se alinee lateralmente con el enemigo; una hitbox de disparo demasiado estrecha puede volver el juego frustrante en vez de desafiante. | Usar una banda de tolerancia vertical/horizontal generosa al calcular la trayectoria del cañonazo (no exigir alineación pixel-perfect), ajustable durante `/spec-impl`. |
| Balancear la frecuencia y el radio de peligro del Kraken es delicado: muy agresivo se siente injusto, muy pasivo se vuelve irrelevante. | Definir `dangerRadius` y `spawnCooldownMs` como constantes explícitas ajustables por nivel, con valores iniciales conservadores documentados en el propio código como punto de partida para tuning iterativo. |
| El tiempo de vida (`ttlMs`) del tesoro flotante puede ser demasiado corto (inalcanzable) o demasiado largo (trivial), afectando el balance de puntaje. | Fijar `ttlMs` inicial generoso (varios segundos) y dejar el ajuste fino como parte de `/spec-impl`, sin bloquear la aprobación del spec. |
