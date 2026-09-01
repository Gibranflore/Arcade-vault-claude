# Spec — Cañones a Babor

- **Estado:** Draft
- **Dependencias:** Spec 04 (Supabase Auth + Scores — `submitScore`, `getLeaderboard`), Spec 05 (Asteroids jugable — patrón de referencia técnica `app/games/types.ts` + `GAME_COMPONENTS`, y el patrón de nave con inercia/invencibilidad parpadeante que se reutiliza parcialmente)
- **Fecha:** 2026-09-01

**Objetivo:** Diseñar un juego nuevo `canones-a-babor` — un barco pirata navega un mar acotado con movimiento inercial y dispara cañones por babor/estribor (perpendiculares a la proa, no hacia adelante) para hundir oleadas de barcos enemigos mientras esquiva cañonazos y recoge botín flotante — como componente Canvas jugable siguiendo el contrato `GameProps`/`GameHandle` ya establecido en la plataforma.

## Scope

**Dentro del alcance:**

- Nuevo componente `app/games/CanonesABaborGame.tsx`, diseño original sin referencia en `Proyectos/` (se construye desde cero siguiendo el patrón técnico de `AsteroidsGame.tsx`/`TetrisGame.tsx`/`BreakoutGame.tsx`/`FroggerGame.tsx`: `stateRef` con todo el estado mutable, loop vía `requestAnimationFrame`, `keysRef` para input, canvas de resolución lógica fija escalado por CSS).
- Arena de mar rectangular **acotada** (a diferencia del wrap toroidal de `AsteroidsGame.tsx`): bordes visibles tipo costa/límite de mapa; el barco del jugador no puede salir del área — al tocar el borde se frena/rebota suavemente en vez de reaparecer del lado opuesto.
- Barco del jugador con movimiento inercial (mismo patrón de física que la nave de Asteroids): `ArrowUp` aplica empuje en la dirección de la proa, `ArrowLeft`/`ArrowRight` rotan el timón, fricción/drag frena gradualmente el barco al soltar controles.
- Disparo de cañones **por costado**, nunca hacia adelante: tecla `Z` dispara la batería de babor (izquierda, perpendicular a la proa), tecla `X` dispara la batería de estribor (derecha). Cada costado tiene su propio cooldown de recarga independiente (no se puede disparar ambos lados sin límite).
- Barcos enemigos: aparecen en oleadas desde los bordes del mapa, patrullan hacia el jugador y, al estar dentro de rango, giran para exponer su costado y disparan cañonazos hacia la posición del jugador (con dispersión/imprecisión, no puntería perfecta). Cada barco enemigo tiene puntos de casco que aumentan con el nivel.
- Colisiones: un cañonazo que impacta un casco (jugador o enemigo) resta 1 punto de casco al objetivo. Un barco enemigo cuyo casco llega a 0 se hunde (animación simple + suelta un ítem de botín flotante). La embestida directa barco-contra-barco a velocidad relativa alta también resta casco a ambos.
- Botín flotante: al hundirse un barco enemigo, suelta un ítem que permanece un tiempo limitado antes de hundirse en el mar; el jugador lo recoge pasando sobre él:
  - `gold` (doblón de oro): solo puntos.
  - `rum` (barril de ron): aumenta temporalmente la velocidad de recarga de ambos costados (buff de tiempo limitado).
  - `repair` (kit de reparación): restaura 1 vida (hasta el máximo de 3).
- Vidas del jugador: 3 iniciales, reportadas vía `onLives`. Al llegar el casco del jugador a 0, pierde 1 vida, el barco reaparece en el centro del mapa con casco restaurado al máximo y un breve parpadeo de invencibilidad (mismo patrón que la reaparición de la nave en Asteroids).
- Sistema de puntaje: puntos por cada impacto de cañón sobre un barco enemigo, bonus mayor al hundirlo, puntos por recoger doblones. Reportado vía `onScore`, siempre creciente.
- Nivel/oleadas: al hundir un número fijo de barcos (ej. 5) se completa la oleada, sube el nivel (`onLevel`), aumentan casco/velocidad/cadencia de disparo de los enemigos y la cantidad simultánea en pantalla, con un tope máximo de dificultad.
- Game over cuando se agotan las 3 vidas (`onGameOver`).
- Sin HUD propio dibujado en canvas (nada de score/vidas/nivel pintado por el propio juego) — vidas/score/nivel se reportan por callbacks, igual que Asteroids/Tetris/Breakout/Frogger. Se permite dibujar en canvas indicadores puramente tácticos (cooldown de recarga por costado, casco actual del barco del jugador como barra corta sobre su silueta) porque no duplican datos que ya vive el HUD del marco.
- `start`/`pause`/`resume`/`reset` expuestos vía `onReady` como `GameHandle`; loop detenido mientras `isPaused` sea `true`.
- Wireo en `app/components/GamePlayer.tsx`: import de `CanonesABaborGame`, entrada `"canones-a-babor": CanonesABaborGame` en `GAME_COMPONENTS`.
- Entrada `canones-a-babor` en `app/lib/games.ts`, dentro de `GAMES` (jugable de inmediato, no `COMING_SOON_GAMES`), con `category: "Acción"`, `controls: "Flechas + Z/X"`.
- Verificación funcional: navegar a `/juegos/canones-a-babor`, iniciar, confirmar barco moviéndose con inercia dentro de los límites del mapa, disparo por ambos costados con cooldown visible, enemigos apareciendo/patrullando/hundiéndose, probar pausa y salir.

**Fuera de alcance (explícitamente NO se hace):**

- Sonido/música.
- Soporte táctil/móvil específico para este juego (más allá de lo que la plataforma ya soporte de forma genérica).
- Viento o corrientes marinas como mecánica de física adicional (considerado, ver Decisiones).
- Cámara con scroll — el mar es un área acotada visible por completo en todo momento, sin desplazamiento de cámara.
- Múltiples tipos de barco jugable, mejoras permanentes entre partidas, o progresión guardada más allá del puntaje.
- Barcos "jefe" (enemigos únicos con mecánicas especiales) — solo oleadas de barcos regulares con estadísticas escaladas por nivel.
- Cambios a `app/lib/scores.ts`, esquema de `scores`, o RLS — se reutiliza tal cual.
- Modificar `AsteroidsGame.tsx`, `TetrisGame.tsx`, `BreakoutGame.tsx`, `FroggerGame.tsx` o `SnakeGame.tsx`.

## Modelo de datos

No se introducen estructuras de persistencia nuevas — se reutiliza `GameDef`/`GAMES` (`app/lib/games.ts`) y `GameProps`/`GameHandle` (`app/games/types.ts`) tal cual.

Estructuras internas nuevas, privadas de `CanonesABaborGame.tsx` (viven en `stateRef`, no se exportan ni se persisten):

```ts
type Vec2 = { x: number; y: number };

type PlayerShip = {
  pos: Vec2;
  heading: number; // radianes
  vel: Vec2;
  hull: number;
  maxHull: number;
  reloadPortMs: number; // cooldown restante de la batería de babor
  reloadStarboardMs: number; // cooldown restante de la batería de estribor
  invulnerableMs: number; // parpadeo tras reaparecer
  speedBuffMs: number; // buff activo de barril de ron
};

type EnemyShip = {
  id: number;
  pos: Vec2;
  heading: number;
  vel: Vec2;
  hull: number;
  maxHull: number;
  reloadMs: number;
};

type Cannonball = {
  pos: Vec2;
  vel: Vec2;
  owner: "player" | "enemy";
};

type Pickup = {
  kind: "gold" | "rum" | "repair";
  pos: Vec2;
  ttlMs: number; // tiempo antes de hundirse en el mar
};

type NavalState = {
  status: "idle" | "running" | "paused" | "gameover";
  player: PlayerShip;
  enemies: EnemyShip[];
  cannonballs: Cannonball[];
  pickups: Pickup[];
  sunkThisWave: number;
  lives: number;
  score: number;
  level: number;
};
```

## Plan de implementación

1. **Constantes y esqueleto estático.** Definir dentro de `CanonesABaborGame.tsx` las constantes de arena (tamaño lógico del mapa, límites de costa, fricción/aceleración del barco) y crear el esqueleto de componente (`useRef` para canvas, `stateRef`, `keysRef`, `useEffect` de inicialización) con `draw()` pintando mar/costa/barco del jugador quieto en el centro. El sistema sigue funcional (componente aún no usado en ninguna ruta).

2. **Movimiento inercial y límites del mapa.** Implementar `update(dt)` con `requestAnimationFrame`: empuje/rotación/fricción del barco del jugador según input (`ArrowUp`/`ArrowLeft`/`ArrowRight`), y clamp de posición a los límites del mapa con frenado/rebote suave al tocar el borde (nunca sale del área visible). Loop respeta `isPaused`. El sistema sigue funcional.

3. **Cañones y proyectiles.** Implementar disparo por costado: `Z` crea un `Cannonball` perpendicular a `heading` desde el lado de babor, `X` desde estribor, cada uno sujeto a su propio `reloadPortMs`/`reloadStarboardMs`. Los `Cannonball` viajan en línea recta con alcance máximo (se eliminan al expirar o al impactar). El sistema sigue funcional.

4. **Barcos enemigos y oleadas.** Implementar spawn de `EnemyShip` desde los bordes del mapa, IA simple (patrulla hacia el jugador, gira para exponer costado dentro de rango, dispara con cooldown propio y dispersión), y escalado de `maxHull`/velocidad/cadencia de disparo según `level`, con tope máximo. El sistema sigue funcional.

5. **Colisiones, vidas y reaparición.** Implementar detección `Cannonball`-`EnemyShip`/`PlayerShip` (resta 1 de casco al objetivo), embestida barco-barco por velocidad relativa alta (resta casco a ambos), hundimiento de un `EnemyShip` a 0 de casco (elimina el barco, genera `Pickup`, incrementa `sunkThisWave`), y pérdida de vida del jugador cuando su casco llega a 0 (decrementa `lives`, invoca `onLives`, restaura casco, reposiciona en el centro con `invulnerableMs` activo). A 0 vidas, `stateRef.status = "gameover"` e invoca `onGameOver()`. El sistema sigue funcional.

6. **Pickups, puntaje y progresión de nivel.** Implementar recolección de `Pickup` por colisión con el barco del jugador (aplica el efecto según `kind`, elimina el pickup), expiración de `Pickup` por `ttlMs`, suma de puntos en cada impacto de cañón sobre un enemigo y bonus mayor al hundirlo (invoca `onScore`), y transición de nivel cuando `sunkThisWave` alcanza el umbral de oleada (reinicia el contador, incrementa `level`, invoca `onLevel`). El sistema sigue funcional.

7. **`GameHandle` vía `onReady`.** Exponer `start`/`pause`/`resume`/`reset` que manipulan `stateRef.status` y reinician el estado completo (barco, enemigos, proyectiles, pickups, vidas, score, nivel) en `reset()`. El sistema sigue funcional (componente completo, listo para wireo).

8. **Wireo en `GamePlayer.tsx`.** Agregar `import { CanonesABaborGame } from "@/app/games/CanonesABaborGame";` y la entrada `"canones-a-babor": CanonesABaborGame` en `GAME_COMPONENTS`. El sistema sigue funcional para cualquier otro `game.id`.

9. **Catálogo.** Agregar el objeto `canones-a-babor` a `GAMES` en `app/lib/games.ts` (título, descripción, `category: "Acción"`, `controls: "Flechas + Z/X"`, `year: "2026"` — juego original de esta jam, sin equivalente histórico real, ícono libre de `lucide-react` no usado por otro juego, ej. `Anchor` o `Compass`, a confirmar disponibilidad durante `/spec-impl`). El sistema queda funcional: Cañones a Babor aparece jugable en la Biblioteca (`/`), con detalle (`/juegos/canones-a-babor`) y leaderboard real.

10. **Verificación funcional.** Levantar `npm run dev`, navegar a `/juegos/canones-a-babor/jugar`, confirmar overlay idle, iniciar y verificar movimiento inercial del barco dentro de los límites del mapa, disparo por babor y estribor con cooldown independiente, aparición/patrulla/hundimiento de barcos enemigos y recolección de botín, probar PAUSA/CONTINUAR y SALIR. Documentar que el ciclo completo de vidas/game-over/guardado de puntaje se verifica manualmente jugando.

## Criterios de aceptación

- [ ] `/` muestra la tarjeta de CAÑONES A BABOR en el grid jugable (categoría Acción).
- [ ] `/juegos/canones-a-babor` muestra info, controles (`Flechas + Z/X`) y leaderboard real vía Supabase.
- [ ] `/juegos/canones-a-babor/jugar` renderiza el canvas con el mar, la costa/límite del mapa y el barco del jugador tras presionar INICIAR.
- [ ] El barco del jugador se mueve con inercia (acelera con `ArrowUp`, gira con `ArrowLeft`/`ArrowRight`, frena gradualmente al soltar) y nunca sale de los límites del mapa.
- [ ] `Z` dispara la batería de babor y `X` la de estribor, cada una de forma perpendicular a la proa del barco, con un cooldown independiente visible por lado.
- [ ] Los barcos enemigos aparecen desde los bordes, patrullan hacia el jugador y disparan al estar en rango; un impacto de cañón resta casco al objetivo y un barco enemigo sin casco restante se hunde y suelta un ítem de botín.
- [ ] Recoger un `gold` suma puntos, un `rum` acelera temporalmente la recarga de cañones, y un `repair` restaura 1 vida sin superar el máximo de 3.
- [ ] Al perder todo el casco, el jugador pierde 1 vida (`onLives` decrementa), reaparece en el centro del mapa con casco restaurado y un breve parpadeo de invencibilidad.
- [ ] Al hundir el número de barcos configurado para completar una oleada, sube el nivel (`onLevel`), y los enemigos siguientes son perceptiblemente más resistentes/rápidos/agresivos.
- [ ] Al agotar las 3 vidas, se invoca `onGameOver()` exactamente una vez.
- [ ] El canvas no dibuja un HUD numérico de score/vidas/nivel (esos datos viven solo en el HUD del marco de `GamePlayer.tsx`, vía los callbacks); los indicadores tácticos en canvas (cooldown por costado, casco del jugador) no duplican esos números.
- [ ] `isPaused === true` congela movimiento del barco, enemigos, proyectiles y pickups; al volver a `false` continúa desde el mismo estado.
- [ ] Snake, Breakout, Tetris, Asteroids y Frogger no cambian de comportamiento.
- [ ] `npm run lint` pasa sin errores nuevos.

## Decisiones tomadas y descartadas

- **Arena de mar acotada (sin wraparound toroidal) en vez de replicar el wrap de `AsteroidsGame.tsx`.** Justificación: da sentido narrativo a los límites (costa) y evita que el jugador escape indefinidamente de las oleadas escondiéndose fuera de rango; también diferencia la sensación espacial del juego frente a Asteroids.
- **Cañones disparan perpendicular a la proa (broadside) en vez de hacia adelante como en Asteroids.** Justificación: es la mecánica distintiva del combate naval de vela histórico y obliga a un patrón de movimiento propio (posicionarse de costado al enemigo) en vez de apuntar y disparar de frente, diferenciando claramente el input/ritmo de juego de Asteroids.
- **Sin viento ni corrientes marinas como mecánica de física adicional.** Justificación: se consideró para dar más profundidad táctica, pero se descartó para mantener el scope acotado a un componente Canvas simple; puede proponerse como iteración futura si se aprueba este spec primero.
- **Pickups con vida útil limitada (se hunden tras `ttlMs`) en vez de permanentes.** Justificación: crea una decisión táctica real (perseguir botín vs. mantener posición de combate) sin introducir inventario persistente ni estado fuera de la partida.
- **Sin barcos "jefe" ni tipos de barco jugable alternativos.** Justificación: mantiene el scope mínimo jugable para una sola sesión de jam; iteración futura posible sobre este mismo spec.
- **Reutiliza el patrón de inercia y de invencibilidad parpadeante tras reaparecer de `AsteroidsGame.tsx` en vez de inventar un sistema nuevo.** Justificación: consistencia técnica con un patrón ya validado y aprobado en la plataforma (spec 05).
- **No se usa ninguna referencia en `Proyectos/` porque no existe una implementación previa de este juego.** Justificación: diseño original que sigue el patrón técnico (`stateRef` + `requestAnimationFrame` + canvas fijo escalado por CSS) igual que Frogger, sin portar código existente.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Balancear cooldown de cañones y casco/velocidad de enemigos por nivel puede volver el juego injusto o trivial en niveles altos. | Aplicar topes máximos de dificultad (casco/velocidad/cadencia de disparo enemiga) al calcular el escalado por `level`, ajustables como constantes durante `/spec-impl`. |
| El disparo por costado (perpendicular a la proa) puede no ser intuitivo sin una guía visual clara de qué lado va a disparar cada tecla. | Dibujar indicadores visuales persistentes de babor/estribor en el barco del jugador (ej. marcadores de color a cada lado) y el estado de cooldown de cada batería como parte del `draw()`, sin que cuenten como HUD numérico duplicado. |
| La colisión por embestida barco-barco puede sentirse injusta si el jugador pierde casco solo por acercarse a un enemigo a baja velocidad. | Aplicar un umbral mínimo de velocidad relativa de impacto para que la embestida cause daño, evitando penalizar el simple contacto a baja velocidad. |
| Generar oleadas con demasiados barcos enemigos simultáneos en niveles altos puede saturar la arena acotada y volver imposible esquivar cañonazos. | Definir un tope máximo de barcos enemigos simultáneos en pantalla (constante `MAX_ENEMIES_ON_SCREEN`), independiente del nivel alcanzado. |
