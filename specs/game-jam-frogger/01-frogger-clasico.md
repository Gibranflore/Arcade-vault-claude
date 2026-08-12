# Spec — Frogger Clásico

- **Estado:** Draft
- **Dependencias:** Spec 04 (Supabase Auth + Scores — `submitScore`, `getLeaderboard`), Spec 05 (Asteroids jugable — patrón de referencia técnica `app/games/types.ts` + `GAME_COMPONENTS`)
- **Fecha:** 2026-08-12

**Objetivo:** Diseñar un juego nuevo `frogger` — una rana que cruza carretera y río en carriles de scroll horizontal, esquivando tráfico y saltando sobre troncos/cocodrilos, hasta llegar a una de varias "casas" meta — como componente Canvas jugable siguiendo el contrato `GameProps`/`GameHandle` ya establecido en la plataforma.

## Scope

**Dentro del alcance:**

- Nuevo componente `app/games/FroggerGame.tsx`: puerto original (no hay referencia en `Proyectos/` para este juego — se construye desde cero siguiendo el patrón técnico de `AsteroidsGame.tsx`/`TetrisGame.tsx`/`BreakoutGame.tsx`: `stateRef` con todo el estado mutable, loop vía `requestAnimationFrame`, `keysRef` para input, canvas de resolución lógica fija escalado por CSS).
- Tablero en carriles horizontales fijos, de arriba hacia abajo:
  - Fila de meta ("casas"): 5 huecos, cada uno se ocupa una sola vez por ronda.
  - Zona segura intermedia (franja de césped sin obstáculos, sirve de checkpoint visual).
  - Zona de río: 4-5 carriles con troncos (seguros, se puede parar encima) y cocodrilos (visualmente similares a troncos pero con "boca" al frente — pisar la boca = muerte), cada carril se desplaza a velocidad y dirección propia; la rana se mueve solidaria con la plataforma bajo sus pies.
  - Zona segura central (franja de césped).
  - Zona de carretera: 4-5 carriles de vehículos (autos, camiones de distinto largo) a velocidad y dirección propia por carril; colisión con cualquier vehículo = pierde una vida.
  - Fila de salida (inicio, césped seguro).
- Movimiento de la rana por saltos discretos de una celda (arriba/abajo/izquierda/derecha), sin movimiento continuo — input por flechas o WASD, un salto por pulsación (con debounce/cooldown corto para evitar saltos dobles accidentales).
- Río: si la rana cae al agua (ningún tronco bajo ella tras el desplazamiento del carril) o se sale del canvas arrastrada por un tronco, pierde una vida y reaparece en la fila de salida.
- Cocodrilos: mismo comportamiento de plataforma que un tronco (la rana se mueve con él) excepto en la celda de la "boca", donde pisar cuenta como colisión letal.
- Sistema de vidas (3 iniciales), reportado vía `onLives`.
- Sistema de puntaje: puntos por cada avance de fila hacia adelante (no se otorgan puntos por retroceder), bonus grande por llegar a una casa vacía, penalización de tiempo (un contador regresivo visual simple por ronda; si llega a 0 sin llegar a una casa, pierde una vida) que también otorga bonus de puntos si sobra tiempo al llegar. Reportado vía `onScore`.
- Nivel: cada vez que las 5 casas quedan ocupadas, sube de nivel (`onLevel`), se reinician las casas vacías y aumenta la velocidad de carriles de tráfico y río.
- Game over cuando se agotan las 3 vidas (`onGameOver`).
- Sin HUD propio dibujado en canvas (nada de score/vidas/nivel/tiempo pintado por el propio juego más allá de un indicador visual del contador de ronda si se decide, ver Riesgos) — vidas/score/nivel se reportan por callbacks, igual que Asteroids/Tetris/Breakout.
- `start`/`pause`/`resume`/`reset` expuestos vía `onReady` como `GameHandle`; loop detenido mientras `isPaused` sea `true`.
- Wireo en `app/components/GamePlayer.tsx`: import de `FroggerGame`, entrada `frogger: FroggerGame` en `GAME_COMPONENTS`.
- Entrada `frogger` en `app/lib/games.ts`, dentro de `GAMES` (jugable de inmediato, no `COMING_SOON_GAMES`), con `category: "Arcade"`, `controls: "Flechas o WASD"`.
- Verificación funcional: navegar a `/juegos/frogger`, iniciar, confirmar render de carriles/rana/tráfico/troncos en movimiento, probar pausa y salir.

**Fuera de alcance (explícitamente NO se hace):**

- Sonido/música.
- Soporte táctil/swipe para móvil — solo teclado, igual que el resto del catálogo.
- Power-ups, ítems bonus (moscas, diamantes) u otros elementos no descritos arriba.
- Multiplayer o modos alternativos (contrarreloj puro, endless sin vidas, etc.).
- Editor de niveles o carriles configurables por el jugador.
- Animaciones de sprite detalladas (arte pixel-art complejo) — se usan formas geométricas simples (rectángulos/polígonos) coloreadas, mismo nivel de fidelidad visual que `BreakoutGame.tsx`/`TetrisGame.tsx`.
- Cambios a `app/lib/scores.ts`, esquema de `scores`, o RLS — se reutiliza tal cual.
- Modificar `AsteroidsGame.tsx`, `TetrisGame.tsx` o `BreakoutGame.tsx`.

## Modelo de datos

No se introducen estructuras de persistencia nuevas — se reutiliza `GameDef`/`GAMES` (`app/lib/games.ts`) y `GameProps`/`GameHandle` (`app/games/types.ts`) tal cual.

Estructuras internas nuevas, privadas de `FroggerGame.tsx` (viven en `stateRef`, no se exportan ni se persisten):

```ts
type LaneType = "safe" | "road" | "river" | "goal";

type Lane = {
  type: LaneType;
  y: number; // fila lógica, de arriba (meta) a abajo (salida)
  direction: 1 | -1;
  speed: number; // px/seg lógico
  entities: LaneEntity[]; // vehículos, troncos o cocodrilos de este carril
};

type LaneEntity = {
  kind: "car" | "truck" | "log" | "crocodile";
  x: number; // px lógico, centro
  width: number; // px lógico
};

type Frog = {
  col: number; // celda lógica 0..N-1
  row: number; // fila lógica (índice de Lane)
  x: number; // px lógico, para animación suave del salto
  y: number;
  jumping: boolean;
  ridingLane: number | null; // índice de Lane si está sobre tronco/cocodrilo
};

type FroggerState = {
  status: "idle" | "running" | "paused" | "gameover";
  frog: Frog;
  lanes: Lane[];
  goals: boolean[]; // 5 casas, true = ocupada
  lives: number;
  score: number;
  level: number;
  roundTimeMs: number; // contador regresivo de la ronda actual
};
```

## Plan de implementación

1. **Diseño de carriles y constantes.** Definir dentro de `FroggerGame.tsx` las constantes de grilla (número de columnas, alto de celda, número de carriles por zona) y la función `buildLanes(level: number): Lane[]` que genera los carriles de río/carretera con velocidad creciente según `level`. El sistema sigue funcional (archivo aún no importado en ninguna ruta).

2. **Componente base y render estático.** Crear `app/games/FroggerGame.tsx` con el esqueleto de componente (`useRef` para canvas, `stateRef`, `keysRef`, `useEffect` de inicialización), implementando `draw()` para pintar césped/carriles/rana/tráfico/troncos en una posición estática (sin loop de update aún). El sistema sigue funcional (componente aún no usado en ninguna ruta).

3. **Loop y movimiento de la rana.** Implementar `update(dt)` con `requestAnimationFrame`: desplazamiento de vehículos/troncos por carril según `direction`/`speed`, input de salto discreto de la rana (flechas/WASD) con cooldown, detección de "rana sobre tronco" (arrastre solidario) vs "rana sobre carril de agua sin tronco bajo" (muerte). Loop respeta `isPaused` (congela `update`, sigue `draw` si se desea overlay de pausa fuera del canvas, igual que Asteroids). El sistema sigue funcional.

4. **Colisiones, vidas y reaparición.** Implementar detección de colisión rana-vehículo (muerte inmediata), rana-cocodrilo-boca (muerte inmediata), caída al agua (muerte), salida de rana arrastrada fuera del canvas por un tronco (muerte). Cada muerte decrementa `lives`, invoca `onLives`, reposiciona la rana en la fila de salida; si `lives` llega a 0, `stateRef.status = "gameover"` e invoca `onGameOver()`. El sistema sigue funcional.

5. **Puntaje, casas meta y nivel.** Implementar suma de puntos por avance de fila (invoca `onScore` en cada incremento), detección de llegada a una casa vacía (marca `goals[i] = true`, bonus de puntos, reposiciona rana en salida), y transición de nivel cuando las 5 casas quedan ocupadas (reinicia `goals`, regenera `lanes` con `buildLanes(level + 1)`, invoca `onLevel`). Contador regresivo de ronda: si llega a 0 sin llegar a una casa, cuenta como muerte (decrementa vida). El sistema sigue funcional.

6. **`GameHandle` vía `onReady`.** Exponer `start`/`pause`/`resume`/`reset` que manipulan `stateRef.status` y reinician el estado completo en `reset()`. El sistema sigue funcional (componente completo y listo para wireo).

7. **Wireo en `GamePlayer.tsx`.** Agregar `import { FroggerGame } from "@/app/games/FroggerGame";` y la entrada `frogger: FroggerGame` en `GAME_COMPONENTS`. El sistema sigue funcional: cualquier otro `game.id` sin entrada sigue mostrando el placeholder "Próximamente".

8. **Catálogo.** Agregar el objeto `frogger` a `GAMES` en `app/lib/games.ts` (título, descripción, `category: "Arcade"`, `controls: "Flechas o WASD"`, `year: "1981"`, ícono disponible de `lucide-react` — ej. `Bug` ya usado por Pac-Man, elegir uno libre como `Car` o `Waves`). El sistema queda funcional: Frogger aparece jugable en la Biblioteca (`/`), con detalle (`/juegos/frogger`) y leaderboard real.

9. **Verificación funcional.** Levantar `npm run dev`, navegar a `/juegos/frogger/jugar`, confirmar overlay idle, iniciar y verificar render de carriles con tráfico/río en movimiento y la rana respondiendo a input, probar PAUSA/CONTINUAR y SALIR. Documentar que el ciclo completo de vidas/game-over/guardado de puntaje se verifica manualmente jugando.

## Criterios de aceptación

- [ ] `/` muestra la tarjeta de FROGGER en el grid jugable (categoría Arcade).
- [ ] `/juegos/frogger` muestra info, controles (`Flechas o WASD`) y leaderboard real vía Supabase.
- [ ] `/juegos/frogger/jugar` renderiza el canvas con césped, carriles de carretera (vehículos en movimiento horizontal) y carriles de río (troncos/cocodrilos en movimiento horizontal) tras presionar INICIAR.
- [ ] La rana se mueve en saltos discretos de una celda con flechas o WASD, nunca de forma continua.
- [ ] Al colisionar con un vehículo, caer al agua, pisar la boca de un cocodrilo, o salir arrastrada del canvas por un tronco, se pierde una vida (`onLives` decrementa) y la rana reaparece en la fila de salida.
- [ ] Al llegar a una casa vacía, se suma un bonus de puntos (`onScore` incrementa) y esa casa queda marcada ocupada.
- [ ] Al ocupar las 5 casas, sube el nivel (`onLevel` incrementa), las casas se reinician vacías y la velocidad de carriles aumenta perceptiblemente.
- [ ] Al agotar las 3 vidas, se invoca `onGameOver()` exactamente una vez.
- [ ] El canvas no dibuja su propio HUD de score/vidas/nivel (esos datos viven solo en el HUD del marco de `GamePlayer.tsx`, vía los callbacks).
- [ ] `isPaused === true` congela el movimiento de tráfico, río y rana; al volver a `false` continúa desde el mismo estado.
- [ ] Snake, Breakout, Tetris, Asteroids, Space Invaders y Pac-Man no cambian de comportamiento.
- [ ] `npm run lint` pasa sin errores nuevos.

## Decisiones tomadas y descartadas

- **Movimiento por saltos discretos de celda, no continuo.** Justificación: es la mecánica reconocible del Frogger original; un movimiento continuo tipo Snake rompería la lectura del tablero por carriles y complicaría la detección de "sobre tronco" vs "en agua".
- **La rana se mueve solidaria con el tronco/cocodrilo bajo sus pies (arrastre).** Justificación: mecánica core del juego original — sin arrastre, el río pierde su desafío distintivo frente a solo "no caer".
- **Sin power-ups ni ítems bonus.** Justificación: mantiene el scope acotado a un componente Canvas simple; puede proponerse como iteración futura si se aprueba este spec primero.
- **Contador de tiempo por ronda simple (sin barra visual elaborada), delegado como decisión de implementación menor.** Justificación: evita sobre-especificar UI de detalle que no cambia la mecánica; se resuelve durante `/spec-impl` como cualquier otro detalle visual no crítico.
- **No se usa ninguna referencia en `Proyectos/` porque no existe una implementación previa de Frogger.** Justificación: a diferencia de Asteroids/Breakout/Tetris, este es un diseño original que sigue el _patrón técnico_ (stateRef + rAF + canvas fijo escalado) pero no porta código existente.

## Riesgos identificados

| Riesgo                                                                                                                                                                                                                                      | Mitigación                                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| La detección de "rana sobre tronco" requiere sincronizar la posición continua del tronco (que se mueve en px) con la posición discreta de la rana (en celdas) cada frame; un desajuste puede causar falsos positivos/negativos de colisión. | Calcular la colisión por rango de solape de rectángulos (posición px real de la rana vs. posición px real del tronco) en cada frame, no por índice de celda, igual que la detección de colisión rana-vehículo. |
| Aumentar la velocidad de carriles por nivel sin límite puede volver el juego injugable en niveles altos.                                                                                                                                    | Aplicar un tope máximo de velocidad por carril (constante `MAX_LANE_SPEED`) al calcular `buildLanes(level)`.                                                                                                   |
| Cocodrilos y troncos visualmente similares pueden confundir al jugador sobre dónde está la "boca" letal.                                                                                                                                    | Dar al cocodrilo un color/forma claramente distinta en el extremo de la boca (ej. triángulo rojo) al dibujar, decisión de implementación durante `/spec-impl`.                                                 |
