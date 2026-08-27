# Spec — Abordaje en Alta Mar

- **Estado:** Draft
- **Dependencias:** Spec 04 (Supabase Auth + Scores — `submitScore`, `getLeaderboard`), Spec 05 (Asteroids jugable — patrón de referencia técnica `app/games/types.ts` + `GAME_COMPONENTS`)
- **Fecha:** 2026-08-27

**Objetivo:** Diseñar `abordaje-alta-mar` — un shooter arcade naval donde el jugador controla un galeón pirata que se desplaza sobre el oleaje disparando cañonazos contra barcos enemigos y un kraken que emerge del fondo del mar, esquivando fuego enemigo y recogiendo cofres de tesoro a la deriva — como componente Canvas jugable siguiendo el contrato `GameProps`/`GameHandle` ya establecido en la plataforma.

## Scope

**Dentro del alcance:**

- Nuevo componente `app/games/AbordajeAltaMarGame.tsx`, diseño original sin referencia en `Proyectos/` (se construye desde cero siguiendo el patrón técnico de `AsteroidsGame.tsx`/`TetrisGame.tsx`/`BreakoutGame.tsx`/`FroggerGame.tsx`: `stateRef` con todo el estado mutable, loop vía `requestAnimationFrame`, `keysRef` para input, canvas de resolución lógica fija escalado por CSS).
- Vista fija (sin scroll de cámara): el jugador controla un barco que ocupa la franja inferior del canvas, con movimiento horizontal libre (flechas izquierda/derecha o A/D) y un balanceo vertical sinusoidal automático y continuo que simula el oleaje (el barco nunca deja de mecerse, el jugador no controla el eje vertical).
- Disparo de cañonazos hacia arriba con `Espacio`, con cooldown fijo entre disparos (no disparo automático continuo mantenido).
- Oleadas de enemigos que aparecen por la parte superior del canvas y descienden/se desplazan lateralmente según patrón propio de su tipo:
  - `sloop` (balandra): 1 impacto para hundir, dispara cañonazos ocasionales hacia abajo, movimiento lateral simple.
  - `galeon` (galeón enemigo): 3 impactos para hundir, dispara en ráfagas de 2 cañonazos, movimiento lateral más lento pero con mayor cadencia de fuego.
  - `kraken` (jefe de oleada, aparece cada cierto número de enemigos hundidos o umbral de nivel): no dispara cañonazos, en su lugar ataca con "tentáculos" — franjas verticales de advertencia que aparecen 1 segundo antes de golpear una columna del canvas; tiene múltiples puntos de vida (más que un galeón) y al ser derrotado otorga un bonus grande de puntos.
- Cofres de tesoro (`treasure`) que aparecen ocasionalmente flotando y descienden lentamente por el canvas sin atacar; recogerlos (colisión barco-cofre) otorga puntos bonus y no cuenta como enemigo hundido.
- Colisión cañonazo-enemigo (resta HP al enemigo, lo destruye si llega a 0), colisión cañonazo enemigo-barco o colisión directa barco-enemigo (resta una vida al jugador), con breve invencibilidad parpadeante tras cada impacto recibido (mismo patrón que la invencibilidad de reaparición de `Proyectos/07-AsteroidGame/game.js`, citado como referencia de patrón, no de código a portar).
- Sistema de vidas (3 iniciales), reportado vía `onLives`.
- Sistema de puntaje: puntos por cada enemigo hundido (variable según tipo: `sloop` < `galeon` < `kraken`), puntos bonus por cofre recogido. Reportado vía `onScore`.
- Nivel: sube (`onLevel`) cada cierto número de enemigos hundidos; aumenta la frecuencia de aparición de enemigos, la proporción de `galeon` frente a `sloop`, y reduce ligeramente el cooldown de disparo enemigo, hasta un tope máximo.
- Game over cuando se agotan las 3 vidas (`onGameOver`).
- Sin HUD propio dibujado en canvas (nada de score/vidas/nivel pintado por el propio juego) — vidas/score/nivel se reportan por callbacks, igual que el resto del catálogo.
- `start`/`pause`/`resume`/`reset` expuestos vía `onReady` como `GameHandle`; loop detenido mientras `isPaused` sea `true`.
- Wireo en `app/components/GamePlayer.tsx`: import de `AbordajeAltaMarGame`, entrada `"abordaje-alta-mar": AbordajeAltaMarGame` en `GAME_COMPONENTS`.
- Entrada `abordaje-alta-mar` en `app/lib/games.ts`, dentro de `GAMES` (jugable de inmediato, no `COMING_SOON_GAMES`), con `category: "Acción"`, `controls: "Flechas o A/D + Espacio"`.
- Verificación funcional: navegar a `/juegos/abordaje-alta-mar`, iniciar, confirmar render del barco meciéndose sobre el oleaje, enemigos apareciendo y disparando, cañonazos propios impactando, cofres flotando, probar pausa y salir.

**Fuera de alcance (explícitamente NO se hace):**

- Sonido/música.
- Soporte táctil/swipe para móvil — solo teclado, igual que el resto del catálogo.
- Power-ups de armamento (disparo triple, escudo, etc.) — el barco siempre dispara un único cañonazo por pulsación con el mismo cooldown durante toda la partida.
- Múltiples barcos jugables o selección de clase de barco.
- Movimiento vertical controlado por el jugador — el balanceo del barco es puramente automático/visual con leve efecto en la hitbox (ver Modelo de datos), nunca input directo.
- Multiplayer o modos alternativos (contrarreloj, cooperativo, etc.).
- Animaciones de sprite detalladas (arte pixel-art complejo) — se usan formas geométricas simples (rectángulos/polígonos/triángulos) coloreadas, mismo nivel de fidelidad visual que `BreakoutGame.tsx`/`TetrisGame.tsx`.
- Cambios a `app/lib/scores.ts`, esquema de `scores`, o RLS — se reutiliza tal cual.
- Modificar `AsteroidsGame.tsx`, `TetrisGame.tsx`, `BreakoutGame.tsx`, `FroggerGame.tsx` o `SnakeGame.tsx`.

## Modelo de datos

No se introducen estructuras de persistencia nuevas — se reutiliza `GameDef`/`GAMES` (`app/lib/games.ts`) y `GameProps`/`GameHandle` (`app/games/types.ts`) tal cual.

Estructuras internas nuevas, privadas de `AbordajeAltaMarGame.tsx` (viven en `stateRef`, no se exportan ni se persisten):

```ts
type EnemyKind = "sloop" | "galeon" | "kraken";

type Enemy = {
  kind: EnemyKind;
  x: number; // px lógico, centro
  y: number;
  hp: number;
  maxHp: number;
  vx: number; // px/seg lógico, movimiento lateral
  fireCooldownMs: number;
  tentacleWarning?: { col: number; timerMs: number } | null; // solo "kraken"
};

type Cannonball = {
  x: number;
  y: number;
  vy: number; // negativo = sube (jugador), positivo = baja (enemigo)
  owner: "player" | "enemy";
};

type Treasure = {
  x: number;
  y: number;
  vy: number;
  value: number;
};

type Ship = {
  x: number; // controlado por input horizontal
  y: number; // resultante del balanceo sinusoidal (baseY + amplitud * sin(t))
  bobPhase: number; // fase acumulada del oleaje
  invulnerableMs: number; // > 0 tras recibir daño
  fireCooldownMs: number;
};

type NavalState = {
  status: "idle" | "running" | "paused" | "gameover";
  ship: Ship;
  enemies: Enemy[];
  cannonballs: Cannonball[];
  treasures: Treasure[];
  spawnTimerMs: number;
  sunkCount: number; // enemigos hundidos, dispara subida de nivel
  lives: number;
  score: number;
  level: number;
};
```

## Plan de implementación

1. **Diseño de oleadas y constantes.** Definir dentro de `AbordajeAltaMarGame.tsx` las constantes de balanceo (amplitud/frecuencia del oleaje), cooldowns de disparo y la función `buildSpawnTable(level: number)` que determina la probabilidad de `sloop`/`galeon`/`kraken` y la frecuencia de aparición según `level`. El sistema sigue funcional (archivo aún no importado en ninguna ruta).

2. **Componente base y render estático.** Crear `app/games/AbordajeAltaMarGame.tsx` con el esqueleto de componente (`useRef` para canvas, `stateRef`, `keysRef`, `useEffect` de inicialización), implementando `draw()` para pintar el mar, el barco del jugador y formas base de enemigos/cofres en posiciones estáticas (sin loop de update aún). El sistema sigue funcional (componente aún no usado en ninguna ruta).

3. **Loop, balanceo y disparo del jugador.** Implementar `update(dt)` con `requestAnimationFrame`: movimiento horizontal del barco por input, cálculo continuo del balanceo sinusoidal (`ship.y`), disparo de `Cannonball` con `owner: "player"` al pulsar `Espacio` respetando `fireCooldownMs`. Loop respeta `isPaused`. El sistema sigue funcional.

4. **Enemigos: movimiento, disparo y colisiones.** Implementar spawn de `Enemy` según `buildSpawnTable(level)`, movimiento lateral por tipo, disparo de `Cannonball` con `owner: "enemy"` respetando `fireCooldownMs` por enemigo, y detección de colisión cañonazo jugador-enemigo (resta `hp`, destruye si llega a 0, incrementa `sunkCount` y `score`), cañonazo enemigo-barco y colisión directa barco-enemigo (resta vida al barco con `invulnerableMs` tras el impacto). El sistema sigue funcional.

5. **Kraken (jefe de oleada) y tentáculos.** Implementar la aparición condicional de `kraken` (umbral de `sunkCount`/`level`), su patrón de ataque de advertencia por columna (`tentacleWarning`) seguido de un golpe que impacta cualquier posición del barco dentro de esa columna al expirar el timer, y su HP elevado con bonus de puntos al derrotarlo. El sistema sigue funcional.

6. **Cofres de tesoro y puntaje.** Implementar spawn periódico de `Treasure`, su descenso lento, y la colisión barco-cofre (suma `value` a `score` vía `onScore`, elimina el cofre). El sistema sigue funcional.

7. **Vidas, nivel y game over.** Conectar decremento de `lives` con `onLives` en cada impacto recibido por el barco; si `lives` llega a 0, `stateRef.status = "gameover"` e invoca `onGameOver()`. Conectar subida de nivel (`onLevel`) cada umbral de `sunkCount`, regenerando la tabla de spawn con `buildSpawnTable(level + 1)`. El sistema sigue funcional.

8. **`GameHandle` vía `onReady`.** Exponer `start`/`pause`/`resume`/`reset` que manipulan `stateRef.status` y reinician el estado completo en `reset()`. El sistema sigue funcional (componente completo y listo para wireo).

9. **Wireo en `GamePlayer.tsx`.** Agregar `import { AbordajeAltaMarGame } from "@/app/games/AbordajeAltaMarGame";` y la entrada `"abordaje-alta-mar": AbordajeAltaMarGame` en `GAME_COMPONENTS`. El sistema sigue funcional: cualquier otro `game.id` sin entrada sigue mostrando el placeholder "Próximamente".

10. **Catálogo.** Agregar el objeto `abordaje-alta-mar` a `GAMES` en `app/lib/games.ts` (título, descripción, `category: "Acción"`, `controls: "Flechas o A/D + Espacio"`, `year: "2026"` por tratarse de diseño original del jam, ícono a elegir de `lucide-react` — candidatos a verificar disponibilidad durante `/spec-impl`: `Anchor`, `Skull`, `Waves`, `Sword`). El sistema queda funcional: Abordaje en Alta Mar aparece jugable en la Biblioteca (`/`), con detalle (`/juegos/abordaje-alta-mar`) y leaderboard real.

11. **Verificación funcional.** Levantar `npm run dev`, navegar a `/juegos/abordaje-alta-mar/jugar`, confirmar overlay idle, iniciar y verificar el barco meciéndose y respondiendo a input horizontal, enemigos apareciendo/disparando/hundiéndose al impactarlos, aparición ocasional del kraken con advertencia de tentáculos, cofres flotando y siendo recogidos, probar PAUSA/CONTINUAR y SALIR. Documentar que el ciclo completo de vidas/game-over/guardado de puntaje se verifica manualmente jugando.

## Criterios de aceptación

- [ ] `/` muestra la tarjeta de ABORDAJE EN ALTA MAR en el grid jugable (categoría Acción).
- [ ] `/juegos/abordaje-alta-mar` muestra info, controles (`Flechas o A/D + Espacio`) y leaderboard real vía Supabase.
- [ ] `/juegos/abordaje-alta-mar/jugar` renderiza el canvas con el barco meciéndose continuamente sobre el oleaje tras presionar INICIAR, sin necesidad de input para que el balanceo ocurra.
- [ ] El barco se mueve horizontalmente con flechas o A/D; el eje vertical nunca responde a input del jugador, solo al balanceo automático.
- [ ] `Espacio` dispara un cañonazo respetando el cooldown (no se puede disparar en ráfaga ilimitada manteniendo la tecla).
- [ ] Los enemigos `sloop` y `galeon` aparecen, se mueven y disparan; impactarlos con un cañonazo propio los daña y los destruye al llegar su HP a 0, sumando puntos (`onScore`) proporcionales al tipo.
- [ ] El `kraken` aparece tras el umbral definido, muestra advertencia visual antes de golpear con un tentáculo, y requiere múltiples impactos para ser derrotado, otorgando un bonus de puntos mayor al de cualquier enemigo regular.
- [ ] Recoger un cofre de tesoro suma puntos (`onScore`) sin contar como enemigo hundido.
- [ ] Recibir un cañonazo enemigo o colisionar con un enemigo decrementa una vida (`onLives`) y activa invencibilidad temporal visible (parpadeo) tras el impacto.
- [ ] Al alcanzar el umbral de enemigos hundidos, sube el nivel (`onLevel`) y la frecuencia/dificultad de aparición de enemigos aumenta perceptiblemente.
- [ ] Al agotar las 3 vidas, se invoca `onGameOver()` exactamente una vez.
- [ ] El canvas no dibuja su propio HUD de score/vidas/nivel (esos datos viven solo en el HUD del marco de `GamePlayer.tsx`, vía los callbacks).
- [ ] `isPaused === true` congela balanceo, movimiento de enemigos, cañonazos y spawns; al volver a `false` continúa desde el mismo estado.
- [ ] Snake, Breakout, Tetris, Asteroids, Frogger, Space Invaders y Pac-Man no cambian de comportamiento.
- [ ] `npm run lint` pasa sin errores nuevos.

## Decisiones tomadas y descartadas

- **Balanceo vertical automático del barco, sin control directo del jugador sobre el eje Y.** Justificación: mantiene el input reducido a un solo eje + disparo (igual de simple que Space Invaders/Breakout), evitando un shooter de scroll libre en 2 ejes que complicaría el balance de dificultad; el oleaje aporta identidad temática sin agregar complejidad de control.
- **El kraken como jefe periódico con patrón de advertencia por columna, en vez de un enemigo más del pool regular.** Justificación: da variedad de ritmo (momentos de tensión/telegrafía) sin requerir IA de pathing compleja — el ataque es una franja de tiempo antes del golpe, patrón simple de implementar y leer visualmente.
- **Cofres de tesoro sin penalización por no recogerlos (simplemente desaparecen al salir del canvas).** Justificación: mantiene el foco del riesgo/recompensa en el combate, no en gestionar un temporizador adicional de recolección.
- **Sin power-ups de armamento.** Justificación: mantiene el scope acotado a un componente Canvas simple, consistente con la decisión equivalente tomada en Frogger Clásico (spec `game-jam-frogger/01`); puede proponerse como iteración futura si se aprueba este spec primero.
- **Sin referencia en `Proyectos/`, diseño original que solo reutiliza el patrón técnico.** Justificación: no existe implementación previa de este concepto en el repo; se sigue el mismo patrón `stateRef` + `requestAnimationFrame` + canvas fijo escalado por CSS que Asteroids/Tetris/Breakout/Frogger.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| El balanceo sinusoidal continuo del barco puede hacer que la hitbox de colisión sea difícil de predecir para el jugador, sintiéndose "injusta" en impactos cercanos al borde. | Usar una hitbox de colisión ligeramente más pequeña que el sprite visual del barco (mismo patrón de tolerancia visual usado habitualmente en shooters arcade), y limitar la amplitud del balanceo a un rango pequeño respecto al alto del canvas. |
| El patrón de ataque del kraken (advertencia por columna + golpe) es una mecánica nueva sin precedente en el catálogo; hay riesgo de que el tiempo de advertencia sea muy corto o muy largo y rompa el ritmo de la pelea de jefe. | Aceptar tuning iterativo de `tentacleWarning.timerMs` durante `/spec-impl` como ajuste de implementación, no bloqueante para el spec; usar un valor inicial conservador (~1000ms) documentado en el modelo de datos. |
| Aumentar la frecuencia de spawn y proporción de `galeon`/`kraken` por nivel sin límite puede volver el juego injugable en niveles altos (saturación de cañonazos enemigos en pantalla). | Aplicar un tope máximo de frecuencia de spawn y de cañonazos enemigos simultáneos (constante `MAX_ENEMY_CANNONBALLS`) al calcular `buildSpawnTable(level)`. |
