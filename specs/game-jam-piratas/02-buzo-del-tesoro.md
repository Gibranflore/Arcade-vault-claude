# Spec — Buzo del Tesoro

- **Estado:** Draft
- **Dependencias:** Spec 04 (Supabase Auth + Scores — `submitScore`, `getLeaderboard`), Spec 05 (Asteroids jugable — patrón de referencia técnica `app/games/types.ts` + `GAME_COMPONENTS`)
- **Fecha:** 2026-08-27

**Objetivo:** Diseñar un juego nuevo `buzo-del-tesoro` — un buzo pirata que explora un arrecife/laberinto submarino recogiendo cofres de tesoro de uno en uno y entregándolos en el ancla de superficie antes de que se le acabe el oxígeno, esquivando los tentáculos del Kraken y anguilas patrulleras — como componente Canvas jugable siguiendo el contrato `GameProps`/`GameHandle` ya establecido en la plataforma.

## Scope

**Dentro del alcance:**

- Nuevo componente `app/games/BuzoDelTesoroGame.tsx`: diseño original, no hay referencia en `Proyectos/` para este juego — se construye desde cero siguiendo el patrón técnico de `AsteroidsGame.tsx`/`TetrisGame.tsx`/`BreakoutGame.tsx`/`FroggerGame.tsx` (`stateRef` con todo el estado mutable, loop vía `requestAnimationFrame`, `keysRef` para input, canvas de resolución lógica fija escalado por CSS).
- Mecánica core distinta a un combate en tiempo real (spec 01, `batalla-naval`): exploración de un laberinto submarino en vista cenital con movimiento continuo por corredores (grilla de celdas `wall`/`floor`/`surface`), gestión de un recurso que decae con el tiempo (oxígeno) y una restricción de "cargar un solo objeto a la vez" que obliga a recorridos de ida y vuelta.
- Movimiento del buzo por los corredores del laberinto con flechas/WASD: desplazamiento continuo en píxeles (no saltos discretos por celda como Frogger), con colisión contra las paredes del grid y un pequeño buffer de "próximo giro" para que el input se sienta responsivo en las esquinas.
- Una única celda `surface` (ancla del barco) marca el punto de entrada/salida y de recarga de oxígeno.
- Oxígeno (`oxygenMs`): decae de forma constante mientras el buzo está fuera de la celda `surface`; se recarga por completo al instante en que el buzo pisa `surface`. Si `oxygenMs` llega a 0 en cualquier otra celda, cuenta como pérdida de vida.
- Cofres de tesoro (`Chest`): distribuidos en el laberinto, cada uno con un valor de puntos. El buzo solo puede cargar **un cofre a la vez** (restricción explícita); mientras `carrying !== null`, su velocidad de movimiento se reduce ligeramente (peso del cofre). El cofre se entrega (banking del puntaje, vía `onScore`) al pisar `surface` mientras se carga uno.
- Tentáculos del Kraken (`TentacleSocket`): emergen desde puntos fijos del laberinto en ciclos temporizados de extensión/retracción; durante la fase de extensión ocupan un área de celdas alcanzada por su longitud actual, y el contacto del buzo con esa área cuenta como daño.
- Anguilas (`Eel`): patrullan una ruta fija de waypoints dentro del laberinto a velocidad constante (sin IA de persecución); el contacto del buzo con una anguila cuenta como daño.
- Sistema de vidas (3 iniciales), reportado vía `onLives`. Al recibir daño (tentáculo, anguila, o oxígeno agotado fuera de `surface`), decrementa una vida; si el buzo cargaba un cofre en ese momento, el cofre cae en su posición actual (queda disponible de nuevo para recogerse, no se pierde permanentemente); el buzo reaparece en `surface` con oxígeno lleno y una breve invulnerabilidad.
- Sistema de puntaje: puntos otorgados únicamente al entregar un cofre en `surface` (no al simple recogerlo), reportado vía `onScore`.
- Nivel: al entregar todos los cofres del laberinto actual (`chestsDelivered === chestsTotal`), sube de nivel (`onLevel`), se regenera el laberinto con más cofres y más tentáculos/anguilas, y se reduce el oxígeno máximo o aumenta su velocidad de consumo para mayor dificultad.
- Game over cuando se agotan las 3 vidas (`onGameOver`).
- Sin HUD propio dibujado en canvas (score/vidas/nivel/oxígeno se reportan por callbacks o se infieren del propio render del juego — sin overlays de texto de score/vidas/nivel pintados por el componente, igual que el resto del catálogo).
- `start`/`pause`/`resume`/`reset` expuestos vía `onReady` como `GameHandle`; loop detenido mientras `isPaused` sea `true`.
- Wireo en `app/components/GamePlayer.tsx`: import de `BuzoDelTesoroGame`, entrada `"buzo-del-tesoro": BuzoDelTesoroGame` en `GAME_COMPONENTS`.
- Entrada `buzo-del-tesoro` en `app/lib/games.ts`, dentro de `GAMES` (jugable de inmediato, no `COMING_SOON_GAMES`), con `category: "Arcade"`, `controls: "Flechas o WASD"`.
- Verificación funcional: navegar a `/juegos/buzo-del-tesoro`, iniciar, confirmar movimiento por el laberinto, recogida/entrega de cofres, decaimiento y recarga de oxígeno, tentáculos y anguilas activos, probar pausa y salir.

**Fuera de alcance (explícitamente NO se hace):**

- Sonido/música.
- Soporte táctil/swipe para móvil — solo teclado, igual que el resto del catálogo.
- Generación procedural del laberinto — se usa un conjunto pequeño de plantillas de laberinto fijas (o una única plantilla con dificultad escalada por nivel), no un generador aleatorio de corredores.
- Cargar más de un cofre a la vez, inventario, o power-ups (tanques de oxígeno extra, velocidad, etc.).
- IA de persecución para el Kraken o las anguilas — ambos siguen patrones fijos (ciclo temporizado / ruta de waypoints), nunca reaccionan a la posición del buzo.
- Multiplayer o modos alternativos (contrarreloj puro, endless sin vidas, etc.).
- Animaciones de sprite detalladas (arte pixel-art complejo) — se usan formas geométricas simples (rectángulos/círculos/líneas para tentáculos) coloreadas, mismo nivel de fidelidad visual que `BreakoutGame.tsx`/`TetrisGame.tsx`.
- Cambios a `app/lib/scores.ts`, esquema de `scores`, o RLS — se reutiliza tal cual.
- Modificar `AsteroidsGame.tsx`, `TetrisGame.tsx`, `BreakoutGame.tsx`, `FroggerGame.tsx` o `BatallaNavalGame.tsx` (spec 01, si llegara a implementarse).

## Modelo de datos

No se introducen estructuras de persistencia nuevas — se reutiliza `GameDef`/`GAMES` (`app/lib/games.ts`) y `GameProps`/`GameHandle` (`app/games/types.ts`) tal cual.

Estructuras internas nuevas, privadas de `BuzoDelTesoroGame.tsx` (viven en `stateRef`, no se exportan ni se persisten):

```ts
type Tile = "wall" | "floor" | "surface";

type Chest = {
  col: number;
  row: number;
  value: number;
  carried: boolean;
  delivered: boolean;
};

type TentacleSocket = {
  col: number;
  row: number;
  angle: number; // dirección en la que se extiende
  length: number; // longitud actual, en celdas
  maxLength: number;
  phaseMs: number; // temporizador del ciclo extender/retraer
  extending: boolean;
};

type Eel = {
  path: { col: number; row: number }[]; // waypoints de patrulla, ciclo cerrado
  pathIndex: number;
  x: number; // px lógico
  y: number;
  speed: number;
};

type Diver = {
  x: number; // px lógico
  y: number;
  col: number; // celda actual (derivada de x/y)
  row: number;
  dir: "up" | "down" | "left" | "right";
  nextDir: "up" | "down" | "left" | "right" | null; // buffer de próximo giro
  oxygenMs: number;
  maxOxygenMs: number;
  carrying: Chest | null;
  invulnerableMs: number;
};

type DiveState = {
  status: "idle" | "running" | "paused" | "gameover";
  grid: Tile[][];
  diver: Diver;
  chests: Chest[];
  tentacles: TentacleSocket[];
  eels: Eel[];
  surfaceCell: { col: number; row: number };
  lives: number;
  score: number;
  level: number;
  chestsDelivered: number;
  chestsTotal: number;
};
```

## Plan de implementación

1. **Laberinto y esqueleto de componente.** Definir dentro de `BuzoDelTesoroGame.tsx` las constantes de grilla (tamaño de celda, dimensiones del laberinto) y una o más plantillas fijas de `Tile[][]` (con al menos una celda `surface`). Crear el esqueleto del componente (`useRef` para canvas, `stateRef`, `keysRef`, `useEffect` de inicialización) con `draw()` pintando el grid, el ancla de superficie, el buzo y los cofres en sus posiciones iniciales, sin loop de update aún. El sistema sigue funcional (componente aún no usado en ninguna ruta).

2. **Loop y movimiento del buzo.** Implementar `update(dt)` con `requestAnimationFrame`: movimiento continuo del buzo por los corredores según input de flechas/WASD, con colisión contra `wall` y buffer de `nextDir` para permitir giros anticipados en las intersecciones; decaimiento continuo de `oxygenMs` mientras el buzo no está en `surfaceCell`, recarga instantánea a `maxOxygenMs` al llegar a `surfaceCell`. Loop respeta `isPaused`. El sistema sigue funcional.

3. **Cofres: recoger y entregar.** Implementar recogida de un `Chest` no cargado ni entregado al pasar el buzo sobre su celda (solo si `carrying === null`), aplicando una reducción de velocidad mientras `carrying !== null`; al pisar `surfaceCell` con un cofre cargado, se marca `delivered = true`, se suma su `value` al score (`onScore`), se incrementa `chestsDelivered` y `carrying` vuelve a `null`. El sistema sigue funcional.

4. **Tentáculos y anguilas.** Implementar el ciclo de cada `TentacleSocket` (temporizador `phaseMs` alternando `extending` entre `true`/`false`, `length` creciendo/decreciendo hacia `maxLength`/0) y el cálculo de las celdas ocupadas por el tentáculo extendido; implementar el recorrido cíclico de cada `Eel` por su lista de `path` a velocidad constante. Detección de colisión del buzo con el área activa de un tentáculo o con una `Eel`. El sistema sigue funcional.

5. **Vidas y respawn.** Al detectar colisión con tentáculo/anguila o `oxygenMs` llegando a 0 fuera de `surfaceCell`, decrementar `lives` (`onLives`) con un breve `invulnerableMs` posterior; si `diver.carrying !== null`, el cofre se marca `carried = false` y queda en la celda donde murió el buzo (disponible de nuevo); el buzo se reposiciona en `surfaceCell` con `oxygenMs = maxOxygenMs`. Si `lives` llega a 0, `stateRef.status = "gameover"` e invoca `onGameOver()`. El sistema sigue funcional.

6. **Nivel y `GameHandle`.** Al cumplirse `chestsDelivered === chestsTotal`, invocar `onLevel`, regenerar el laberinto (nueva plantilla o la misma con más `chests`/`tentacles`/`eels`) y ajustar `maxOxygenMs`/velocidad de consumo para mayor dificultad. Exponer `start`/`pause`/`resume`/`reset` vía `onReady`, reiniciando el estado completo (incluido el laberinto inicial) en `reset()`. El sistema sigue funcional (componente completo, listo para wireo).

7. **Wireo en `GamePlayer.tsx`.** Agregar `import { BuzoDelTesoroGame } from "@/app/games/BuzoDelTesoroGame";` y la entrada `"buzo-del-tesoro": BuzoDelTesoroGame` en `GAME_COMPONENTS`. El sistema sigue funcional: cualquier otro `game.id` sin entrada sigue mostrando el placeholder "Próximamente".

8. **Catálogo.** Agregar el objeto `buzo-del-tesoro` a `GAMES` en `app/lib/games.ts` (título, descripción, `category: "Arcade"`, `controls: "Flechas o WASD"`, `year` del año de esta versión original, ícono libre de `lucide-react` — ej. `Waves`, `Gem` o `Compass`, a confirmar disponibilidad durante `/spec-impl`). El sistema queda funcional: Buzo del Tesoro aparece jugable en la Biblioteca (`/`), con detalle (`/juegos/buzo-del-tesoro`) y leaderboard real.

9. **Verificación funcional.** Levantar `npm run dev`, navegar a `/juegos/buzo-del-tesoro/jugar`, confirmar overlay idle, iniciar y verificar movimiento fluido por los corredores, decaimiento/recarga de oxígeno, recogida y entrega de un cofre a la vez, ciclos de tentáculos y patrulla de anguilas activos, probar PAUSA/CONTINUAR y SALIR. Documentar que el ciclo completo de vidas/game-over/guardado de puntaje se verifica manualmente jugando.

## Criterios de aceptación

- [ ] `/` muestra la tarjeta de BUZO DEL TESORO en el grid jugable (categoría Arcade).
- [ ] `/juegos/buzo-del-tesoro` muestra info, controles (`Flechas o WASD`) y leaderboard real vía Supabase.
- [ ] `/juegos/buzo-del-tesoro/jugar` renderiza el canvas con el laberinto submarino, el ancla de superficie, el buzo y los cofres tras presionar INICIAR.
- [ ] El buzo se mueve de forma continua por los corredores del laberinto sin atravesar paredes, con los giros respondiendo en las intersecciones.
- [ ] El oxígeno decae de forma constante mientras el buzo no está en la celda de superficie, y se recarga por completo al instante de pisarla.
- [ ] Quedarse sin oxígeno fuera de la superficie decrementa una vida (`onLives`) igual que el contacto con un tentáculo o una anguila.
- [ ] El buzo solo puede cargar un cofre a la vez; mientras carga uno, no puede recoger otro y se mueve visiblemente más lento.
- [ ] El puntaje (`onScore`) solo aumenta al entregar un cofre en la superficie, nunca al simplemente recogerlo.
- [ ] Si el buzo muere cargando un cofre, este queda disponible de nuevo en la posición de la muerte (no se pierde ni se descuenta puntaje ya entregado).
- [ ] Los tentáculos del Kraken se extienden y retraen en ciclos visibles desde puntos fijos, y las anguilas patrullan una ruta fija sin perseguir al buzo.
- [ ] Al entregar todos los cofres del nivel actual, sube el nivel (`onLevel`), aparece un laberinto con más cofres/hazards y el oxígeno se vuelve perceptiblemente más exigente.
- [ ] Al agotar las 3 vidas, se invoca `onGameOver()` exactamente una vez.
- [ ] El canvas no dibuja su propio HUD de score/vidas/nivel/oxígeno como overlay de texto (esos datos viven en el HUD del marco de `GamePlayer.tsx`, vía los callbacks).
- [ ] `isPaused === true` congela el movimiento del buzo, el oxígeno, los tentáculos y las anguilas; al volver a `false` continúa desde el mismo estado.
- [ ] Snake, Breakout, Tetris, Asteroids, Space Invaders, Pac-Man, Frogger y Batalla Naval (spec 01, si existe) no cambian de comportamiento.
- [ ] `npm run lint` pasa sin errores nuevos.

## Decisiones tomadas y descartadas

- **Restricción de "un solo cofre a la vez" con entrega obligatoria en superficie para anotar puntos.** Justificación: es la mecánica distintiva de este concepto frente a una simple recolección tipo Pac-Man — obliga a recorridos de ida y vuelta y convierte el oxígeno en un recurso que hay que administrar activamente en cada viaje, en vez de solo evitar enemigos.
- **Movimiento continuo por corredores (no saltos discretos por celda como Frogger).** Justificación: el ritmo de exploración/huida de este concepto se siente mejor con desplazamiento fluido; diferencia además el esquema de input de este juego frente al de Frogger (saltos discretos) dentro del mismo catálogo.
- **Kraken (tentáculos) y anguilas con patrones fijos, sin IA de persecución.** Justificación: mantiene el scope acotado a un componente Canvas simple y hace el peligro predecible/aprendible, coherente con la idea de "hazard de área" ya usada para el Kraken en el spec 01 (`batalla-naval`), reforzando la identidad temática del jam sin duplicar mecánica de combate.
- **Laberinto de plantillas fijas en vez de generación procedural.** Justificación: evita el riesgo de generar layouts injugables (cofres inalcanzables, tentáculos bloqueando el único camino) y mantiene el spec acotado a "un único componente Canvas" razonable para el jam; puede proponerse generación procedural como iteración futura.
- **El cofre perdido al morir se recupera en el lugar de la muerte en vez de desaparecer.** Justificación: evita que una sola colisión desperdicie por completo el progreso de un recorrido largo, manteniendo el juego justo sin eliminar el riesgo (el jugador igual pierde tiempo/oxígeno al tener que volver por él).
- **Sin referencia en `Proyectos/`, diseño original que solo reutiliza el patrón técnico.** Justificación: no existe implementación previa de este concepto en el repo; se sigue el mismo patrón `stateRef` + `requestAnimationFrame` + canvas fijo escalado por CSS que Asteroids/Tetris/Breakout/Frogger.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Un layout de laberinto mal diseñado puede dejar un cofre inalcanzable sin pasar por el área de un tentáculo, volviendo el nivel injusto o imposible. | Diseñar y revisar manualmente cada plantilla fija de laberinto como parte del paso 1 del plan, verificando al menos un camino de ida y vuelta a cada cofre que no dependa de cruzar un tentáculo en su fase extendida. |
| El buffer de "próximo giro" (`nextDir`) mal calibrado puede sentirse impreciso en las esquinas del laberinto (el buzo no gira cuando el jugador lo espera, o gira antes de tiempo). | Calcular el punto de giro con una tolerancia de proximidad al centro de la celda (no solo alineación exacta de píxel), ajustable durante `/spec-impl`, siguiendo el mismo cuidado que el spec 01 de Frogger aplicó a la sincronización de colisión rana-tronco. |
| Balancear la velocidad de consumo de oxígeno y la distancia a la superficie es delicado: muy generoso trivializa la mecánica de recurso, muy agresivo hace el juego frustrante. | Definir `maxOxygenMs` y la tasa de consumo como constantes explícitas por nivel, con valores iniciales conservadores documentados en el propio código como punto de partida para tuning iterativo. |
