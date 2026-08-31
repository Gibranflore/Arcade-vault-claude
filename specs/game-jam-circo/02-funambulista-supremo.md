# Spec — Funambulista Supremo

- **Estado:** Draft
- **Dependencias:** Spec 04 (Supabase Auth + Scores — `submitScore`, `getLeaderboard`), Spec 05 (Asteroids jugable — patrón de referencia técnica `app/games/types.ts` + `GAME_COMPONENTS`)
- **Fecha:** 2026-08-31

**Objetivo:** Diseñar un juego nuevo `funambulista` — un equilibrista de cuerda floja que avanza automáticamente sobre la carpa del circo mientras el jugador contrarresta ráfagas de viento para mantener el equilibrio y salta obstáculos en la cuerda, acumulando puntaje por distancia recorrida — como componente Canvas jugable siguiendo el contrato `GameProps`/`GameHandle` ya establecido en la plataforma.

## Scope

**Dentro del alcance:**

- Nuevo componente `app/games/FunambulistaGame.tsx`: diseño original (no hay referencia en `Proyectos/` para este juego — se construye desde cero siguiendo el patrón técnico de `AsteroidsGame.tsx`/`TetrisGame.tsx`/`BreakoutGame.tsx`: `stateRef` con todo el estado mutable, loop vía `requestAnimationFrame`, `keysRef` para input, canvas de resolución lógica fija escalado por CSS).
- Mecánica core distinta a un catcher de objetos: el equilibrista avanza automáticamente hacia adelante a velocidad constante (scroll horizontal del fondo — carpa, torres, público — simulando progreso), sin que el jugador controle el avance en sí.
- Barra de equilibrio (`balance`, rango `-100..100`, `0` = centrado) que se ve empujada por:
  - Ráfagas de viento periódicas (`gust`) que aplican un impulso aleatorio a `balance` cada cierto intervalo, con intensidad creciente por nivel.
  - Tropiezos al no saltar a tiempo un obstáculo en la cuerda (ver más abajo), que aplican un impulso extra hacia un lado aleatorio.
- Input del jugador: flechas izquierda/derecha (o A/D) aplican una fuerza de corrección continua sobre `balance` en la dirección presionada, mientras se mantenga la tecla — el jugador debe "leer" el estado de la barra y corregir a tiempo, no solo reaccionar a eventos puntuales.
- Si `|balance|` supera un umbral de caída (ej. 100), el equilibrista cae de la cuerda: pierde una vida, reporta vía `onLives`, y reaparece sobre la cuerda en el mismo punto de distancia recorrida con `balance` reseteado a `0` y una breve invencibilidad (parpadeo, sin penalización de posición) para evitar una racha de caídas instantáneas repetidas.
- Obstáculos en la cuerda (`bird`, un ave posada) que aparecen a intervalos según el nivel; el jugador debe saltar (flecha arriba o Espacio) para franquearlos. No saltar a tiempo cuenta como tropiezo: no resta vida directamente, pero aplica un impulso fuerte y repentino a `balance` (puede derivar en caída si el jugador ya estaba desequilibrado).
- Sistema de vidas (3 iniciales), reportado vía `onLives`; game over cuando llegan a 0 (`onGameOver`).
- Sistema de puntaje: puntos proporcionales a la distancia máxima recorrida (crece de forma monótona, nunca disminuye, igual que un contador de progreso), más un bono fijo por cada obstáculo saltado con éxito. Reportado vía `onScore`.
- Nivel: cada cierto umbral de distancia recorrida, sube de nivel (`onLevel`): aumenta la velocidad de avance, la frecuencia/intensidad de las ráfagas de viento, y la frecuencia de obstáculos.
- Sin HUD propio dibujado en canvas (nada de score/vidas/nivel/distancia/balance pintado por el propio juego más allá de la barra de equilibrio en sí, que es un elemento de juego —no de HUD informativo— y por tanto sí se dibuja como parte de la escena) — score/vidas/nivel se reportan por callbacks, igual que el resto del catálogo.
- `start`/`pause`/`resume`/`reset` expuestos vía `onReady` como `GameHandle`; loop detenido mientras `isPaused` sea `true`.
- Wireo en `app/components/GamePlayer.tsx`: import de `FunambulistaGame`, entrada `funambulista: FunambulistaGame` en `GAME_COMPONENTS`.
- Entrada `funambulista` en `app/lib/games.ts`, dentro de `GAMES` (jugable de inmediato, no `COMING_SOON_GAMES`), con `category: "Acción"`, `controls: "Flechas o A/D + Espacio"`, ícono libre de `lucide-react` (a confirmar durante `/spec-impl` que no choque con íconos ya usados).
- Verificación funcional: navegar a `/juegos/funambulista`, iniciar, confirmar avance automático, respuesta de la barra de equilibrio al input y al viento, salto de obstáculos, probar pausa y salir.

**Fuera de alcance (explícitamente NO se hace):**

- Sonido/música.
- Soporte táctil/swipe para móvil — solo teclado, igual que el resto del catálogo.
- Trucos/combos de teclas bajo presión de tiempo (ej. "presiona X-Y-Z rápido para un bono de acrobacia") — se descarta para esta versión, ver Decisiones.
- Múltiples tipos de obstáculo más allá de `bird` (ej. objetos lanzados por el público, otro equilibrista cruzando en sentido contrario).
- Power-ups (ej. pértiga de equilibrio temporal que reduce el efecto del viento).
- Animaciones de sprite detalladas (arte pixel-art complejo) — se usan formas geométricas simples (rectángulos/círculos/líneas) coloreadas, mismo nivel de fidelidad visual que `BreakoutGame.tsx`/`TetrisGame.tsx`.
- Cambios a `app/lib/scores.ts`, esquema de `scores`, o RLS — se reutiliza tal cual.
- Modificar `AsteroidsGame.tsx`, `TetrisGame.tsx`, `BreakoutGame.tsx`, `FroggerGame.tsx` o `MalabaresGame.tsx` (del spec 01, si llegara a implementarse).

## Modelo de datos

No se introducen estructuras de persistencia nuevas — se reutiliza `GameDef`/`GAMES` (`app/lib/games.ts`) y `GameProps`/`GameHandle` (`app/games/types.ts`) tal cual.

Estructuras internas nuevas, privadas de `FunambulistaGame.tsx` (viven en `stateRef`, no se exportan ni se persisten):

```ts
type Obstacle = {
  kind: "bird";
  worldX: number; // posición en el mundo (coordenada de distancia recorrida)
  cleared: boolean; // true si ya fue saltado con éxito o ya tropezó
};

type FunambulistaState = {
  status: "idle" | "running" | "paused" | "gameover";
  distance: number; // px lógico recorridos = progreso acumulado, nunca decrece
  speed: number; // px/seg lógico de avance automático, aumenta con el nivel
  balance: number; // -100..100, 0 = centrado
  balanceVelocity: number; // "impulso" instantáneo aplicado por viento/tropiezo/input
  jumping: boolean;
  jumpTimeMs: number; // tiempo restante del arco de salto actual
  invulnerableMs: number; // parpadeo tras reaparecer, 0 = vulnerable normal
  obstacles: Obstacle[]; // próximos obstáculos generados por delante de la posición actual
  nextGustTimerMs: number;
  nextObstacleWorldX: number; // siguiente punto del mundo donde generar un obstáculo
  lives: number;
  score: number;
  level: number;
};
```

## Plan de implementación

1. **Constantes de física de balance y generador de mundo.** Definir dentro de `FunambulistaGame.tsx` las constantes de fuerza de corrección por input, fuerza/intervalo de ráfagas de viento, umbral de caída, y la función `spawnObstacle(level: number, fromWorldX: number): number` que decide el siguiente punto del mundo donde aparece un `bird`, con separación mínima garantizada. Implementar el esqueleto de componente (`useRef` para canvas, `stateRef`, `keysRef`, `useEffect` de inicialización) con `draw()` estático (equilibrista centrado, cuerda, torres/carpa de fondo, barra de equilibrio en su estado neutro). El sistema sigue funcional (componente aún no usado en ninguna ruta).

2. **Avance automático y balance.** Implementar `update(dt)` con `requestAnimationFrame`: incremento constante de `distance`/desplazamiento de parallax de fondo según `speed`, aplicación de fuerza de corrección continua sobre `balance` mientras el jugador mantiene izquierda/derecha (o A/D) presionada, y disparo periódico de ráfagas de viento (`nextGustTimerMs`) que aplican un impulso aleatorio a `balance`. Loop respeta `isPaused`. El sistema sigue funcional.

3. **Salto y obstáculos.** Implementar el salto (flecha arriba o Espacio dispara un arco simple mientras `jumping` es `false`), la generación de obstáculos `bird` por delante de la posición actual según `spawnObstacle`, y la detección de colisión equilibrista-obstáculo: si el equilibrista está saltando al cruzar la posición del obstáculo, se marca `cleared = true` (éxito, bono de puntos); si no está saltando, cuenta como tropiezo (impulso fuerte y repentino a `balance` en dirección aleatoria, sin resta directa de vida). El sistema sigue funcional.

4. **Caídas, vidas y reaparición.** Implementar la detección de `|balance| > umbral` como caída: decrementa `lives`, invoca `onLives`, reposiciona `balance = 0` y activa `invulnerableMs` (parpadeo, sin perder progreso de `distance`). Si `lives` llega a 0, `stateRef.status = "gameover"` e invoca `onGameOver()`. El sistema sigue funcional.

5. **Puntaje y nivel.** Implementar el cálculo de `score` proporcional a `distance` (invoca `onScore` cuando el valor entero de puntaje aumenta) más el bono fijo por cada obstáculo `cleared` exitoso, y la transición de nivel cada umbral de distancia recorrida (invoca `onLevel`, aumenta `speed`, la frecuencia/intensidad de ráfagas, y la frecuencia de obstáculos vía `spawnObstacle`). El sistema sigue funcional.

6. **`GameHandle` vía `onReady`.** Exponer `start`/`pause`/`resume`/`reset` que manipulan `stateRef.status` y reinician el estado completo (incluida `distance`, `balance` y obstáculos) en `reset()`. El sistema sigue funcional (componente completo, listo para wireo).

7. **Wireo en `GamePlayer.tsx`.** Agregar `import { FunambulistaGame } from "@/app/games/FunambulistaGame";` y la entrada `funambulista: FunambulistaGame` en `GAME_COMPONENTS`. El sistema sigue funcional para cualquier otro `game.id`.

8. **Catálogo.** Agregar el objeto `funambulista` a `GAMES` en `app/lib/games.ts` (título, descripción, `category: "Acción"`, `controls: "Flechas o A/D + Espacio"`, `year` con el año de esta creación original, ícono libre de `lucide-react` distinto a los ya usados). El sistema queda funcional: Funambulista Supremo aparece jugable en la Biblioteca (`/`), con detalle y leaderboard real.

9. **Verificación funcional.** Levantar `npm run dev`, navegar a `/juegos/funambulista/jugar`, confirmar overlay idle, iniciar y verificar el avance automático, la respuesta de la barra de equilibrio al input y a las ráfagas de viento, el salto de obstáculos, y una caída con reaparición sin perder distancia. Probar PAUSA/CONTINUAR y SALIR. Documentar que el ciclo completo de vidas/game-over/guardado de puntaje se verifica manualmente jugando.

## Criterios de aceptación

- [ ] `/` muestra la tarjeta de FUNAMBULISTA SUPREMO en el grid jugable (categoría Acción).
- [ ] `/juegos/funambulista` muestra info, controles (`Flechas o A/D + Espacio`) y leaderboard real vía Supabase.
- [ ] `/juegos/funambulista/jugar` renderiza el canvas con el equilibrista avanzando automáticamente sobre la cuerda tras presionar INICIAR.
- [ ] Mantener izquierda o derecha (o A/D) aplica una corrección visible y continua sobre la barra de equilibrio; soltar la tecla deja que el viento y el impulso residual sigan afectándola.
- [ ] Las ráfagas de viento periódicas desplazan la barra de equilibrio de forma perceptible sin input del jugador.
- [ ] Saltar (flecha arriba o Espacio) justo al cruzar un obstáculo `bird` lo franquea sin penalización y otorga un bono de puntos; no saltar a tiempo produce un tropiezo que desequilibra fuertemente al personaje.
- [ ] Superar el umbral de caída de la barra de equilibrio decrementa una vida (`onLives`) y reposiciona al equilibrista con `balance` en 0 en el mismo punto de `distance`, sin retroceder el progreso.
- [ ] El puntaje (`onScore`) aumenta de forma monótona con la distancia recorrida, nunca disminuye.
- [ ] Al superar el umbral de distancia por nivel, sube el nivel (`onLevel`) y la velocidad de avance y/o la intensidad de las ráfagas aumentan perceptiblemente.
- [ ] Al agotar las 3 vidas, se invoca `onGameOver()` exactamente una vez.
- [ ] El canvas no dibuja HUD informativo de score/vidas/nivel/distancia (la barra de equilibrio sí se dibuja, por ser un elemento de juego, no de HUD).
- [ ] `isPaused === true` congela el avance, el balance, el viento y los obstáculos; al volver a `false` continúa desde el mismo estado.
- [ ] Snake, Breakout, Tetris, Asteroids, Frogger, Malabares Extremos (si existe), Space Invaders y Pac-Man no cambian de comportamiento.
- [ ] `npm run lint` pasa sin errores nuevos.

## Decisiones tomadas y descartadas

- **Avance automático constante en vez de control manual de velocidad.** Justificación: aísla la mecánica core (gestión de equilibrio bajo presión continua) del control de movimiento, dando al concepto un ritmo de "supervivencia/resistencia" claramente distinto al catcher de posicionamiento del spec 01 y al salto discreto por celda de Frogger.
- **Corrección de balance por input continuo (mantener tecla) en vez de "toques" puntuales que apliquen un impulso fijo.** Justificación: refuerza la sensación de estar "leyendo y corrigiendo en tiempo real" en vez de reaccionar a eventos discretos, coherente con la fantasía de caminar sobre una cuerda floja.
- **El tropiezo por no saltar un obstáculo no resta vida directamente, solo desequilibra fuertemente.** Justificación: evita que el juego combine dos penalizaciones simultáneas por el mismo evento (perder vida y además quedar desequilibrado), dejando que sea la gestión de equilibrio resultante la que decida si esa vida se pierde o no — mantiene una única fuente de verdad para la pérdida de vidas (`|balance| > umbral`).
- **Reaparición en el mismo punto de distancia tras una caída, sin retroceder progreso.** Justificación: mismo patrón ya usado en `HoppyHazardGame` (spec game-jam-frogger 02) de no penalizar el progreso acumulado al perder una vida, evitando frustración de "empezar de cero" en un juego de resistencia/distancia.
- **Se descartan los combos de teclas bajo presión de tiempo para acrobacias bonus.** Justificación: mantiene el scope acotado a una sola mecánica core (equilibrio + salto); puede proponerse como iteración futura sobre este mismo spec una vez aprobado e implementado.
- **Sin referencia en `Proyectos/` porque no existe una implementación previa de este concepto.** Justificación: diseño original que sigue el patrón técnico (`stateRef` + `requestAnimationFrame` + canvas fijo escalado por CSS) de los juegos ya portados, sin código fuente que portar.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Una física de balance mal calibrada (fuerza de corrección insuficiente o ráfagas demasiado agresivas) puede hacer el juego injugable o trivial según el tuning de constantes. | Aceptar tuning iterativo de constantes de corrección/viento durante `/spec-impl` como ajuste de implementación, no bloqueante para el spec — mismo tratamiento que el riesgo de física de salto de `HoppyHazardGame`. |
| Generar ráfagas de viento totalmente aleatorias podría, por mala suerte, producir dos impulsos consecutivos en la misma dirección justo tras una reaparición con `balance = 0`, causando una caída injusta durante la ventana de invencibilidad o justo después de ella. | La ventana de `invulnerableMs` tras reaparecer debe también suspender la aplicación de nuevos impulsos de viento (no solo la colisión), reanudándose ambos al mismo tiempo cuando expira. |
| Aumentar `speed` y la frecuencia de obstáculos/ráfagas sin límite por nivel puede volver el juego injugable en niveles altos. | Aplicar un tope máximo por constante (`MAX_SPEED`, `MIN_GUST_INTERVAL_MS`) al calcular la progresión de nivel, igual que el patrón ya usado en `FroggerGame` (`MAX_LANE_SPEED`). |
