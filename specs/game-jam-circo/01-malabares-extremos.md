# Spec — Malabares Extremos

- **Estado:** Draft
- **Dependencias:** Spec 04 (Supabase Auth + Scores — `submitScore`, `getLeaderboard`), Spec 05 (Asteroids jugable — patrón de referencia técnica `app/games/types.ts` + `GAME_COMPONENTS`)
- **Fecha:** 2026-08-31

**Objetivo:** Diseñar un juego nuevo `malabares` — un malabarista de circo que atrapa en el aire una cantidad creciente de objetos (pelotas, antorchas, cuchillos) que caen en trayectorias variables, moviéndose horizontalmente para posicionarse bajo cada objeto justo a tiempo — como componente Canvas jugable siguiendo el contrato `GameProps`/`GameHandle` ya establecido en la plataforma.

## Scope

**Dentro del alcance:**

- Nuevo componente `app/games/MalabaresGame.tsx`: diseño original (no hay referencia en `Proyectos/` para este juego — se construye desde cero siguiendo el patrón técnico de `AsteroidsGame.tsx`/`TetrisGame.tsx`/`BreakoutGame.tsx`: `stateRef` con todo el estado mutable, loop vía `requestAnimationFrame`, `keysRef` para input, canvas de resolución lógica fija escalado por CSS).
- Un malabarista (representado como un rectángulo/silueta simple con dos "manos") en la parte inferior del canvas, controlado con movimiento horizontal continuo (flechas izquierda/derecha o A/D), igual de fluido que la paleta de `BreakoutGame.tsx` pero sin rebote de pelota — su función es "atrapar", no golpear.
- Objetos de malabarismo que el propio juego lanza hacia arriba y caen de vuelta en una posición X fija (definida al generarse, sin arco lateral aleatorio adicional una vez en caída), a una velocidad vertical que aumenta con el nivel:
  - `ball` (pelota): objeto base, ventana de captura ancha (tolerante), puntaje bajo.
  - `torch` (antorcha encendida): puntaje medio-alto, ventana de captura intermedia; si se deja caer, además de perder una vida rompe el combo con una penalización visual mayor (parpadeo/aviso) — no hay daño adicional de "fuego" más allá de la pérdida de vida estándar.
  - `knife` (cuchillo): puntaje más alto, ventana de captura estrecha (exige posicionarse con precisión), cae más rápido que los otros dos tipos al mismo nivel.
- Captura exitosa: cuando un objeto llega a la línea de captura (zona fija cerca de las manos del malabarista) y el centro del malabarista está dentro de la `catchWindow` del objeto, se cuenta como atrapado, se suman puntos según `kind`, se incrementa el combo, y el objeto se recicla (vuelve a aparecer arriba del canvas como un nuevo lanzamiento) en vez de desaparecer — esto sostiene la sensación de "acto de malabares continuo" en vez de un solo intento por objeto.
- Objeto no atrapado (llega al suelo/línea de captura sin que el malabarista esté en la `catchWindow`): decrementa una vida, reporta vía `onLives`, resetea el combo a 0, y el objeto se recicla igual que una captura (vuelve a caer desde arriba) para no interrumpir el ritmo del acto.
- Sistema de vidas (3 iniciales), reportado vía `onLives`; game over cuando llegan a 0 (`onGameOver`).
- Sistema de puntaje: puntos base por captura según `kind` (mayor para `knife`, medio para `torch`, menor para `ball`), multiplicados por un multiplicador de combo que sube con capturas consecutivas sin fallar y se resetea a 1 en cada fallo. Reportado vía `onScore`.
- Nivel: cada cierto umbral de puntaje acumulado, sube de nivel (`onLevel`): aumenta la velocidad de caída de los objetos y el número máximo de objetos simultáneos en el aire (`maxSimultaneous`, empieza en 1, sube hasta un tope — ver Riesgos), y aumenta gradualmente la proporción de `torch`/`knife` frente a `ball`.
- Generador de lanzamientos (`spawnTimerMs`) que decide cuándo introducir un nuevo objeto en el aire, respetando `maxSimultaneous` y garantizando separación mínima horizontal/temporal entre objetos que lleguen a la línea de captura casi al mismo tiempo (ver Riesgos).
- Sin HUD propio dibujado en canvas (nada de score/vidas/nivel/combo pintado por el propio juego) — todo se reporta por callbacks, igual que Asteroids/Tetris/Breakout/Frogger.
- `start`/`pause`/`resume`/`reset` expuestos vía `onReady` como `GameHandle`; loop detenido mientras `isPaused` sea `true`.
- Wireo en `app/components/GamePlayer.tsx`: import de `MalabaresGame`, entrada `malabares: MalabaresGame` en `GAME_COMPONENTS`.
- Entrada `malabares` en `app/lib/games.ts`, dentro de `GAMES` (jugable de inmediato, no `COMING_SOON_GAMES`), con `category: "Arcade"`, `controls: "Flechas o A/D"`, ícono libre de `lucide-react` (ej. `Flame` o `Sparkles`, a confirmar durante `/spec-impl` que no choque con íconos ya usados).
- Verificación funcional: navegar a `/juegos/malabares`, iniciar, confirmar render del malabarista y objetos cayendo/reciclándose, probar pausa y salir.

**Fuera de alcance (explícitamente NO se hace):**

- Sonido/música.
- Soporte táctil/swipe para móvil — solo teclado, igual que el resto del catálogo.
- Power-ups o ítems bonus adicionales a `ball`/`torch`/`knife` (ej. comodines que dupliquen puntos, tiempo lento, etc.).
- Que el jugador controle el momento del lanzamiento (el juego lanza los objetos automáticamente; el jugador solo controla dónde atrapar) — un modo donde el jugador presiona para "lanzar" queda fuera de esta versión.
- Animaciones de sprite detalladas (arte pixel-art complejo) — se usan formas geométricas simples (rectángulos/círculos/triángulos) coloreadas, mismo nivel de fidelidad visual que `BreakoutGame.tsx`/`TetrisGame.tsx`.
- Cambios a `app/lib/scores.ts`, esquema de `scores`, o RLS — se reutiliza tal cual.
- Modificar `AsteroidsGame.tsx`, `TetrisGame.tsx`, `BreakoutGame.tsx` o `FroggerGame.tsx`.

## Modelo de datos

No se introducen estructuras de persistencia nuevas — se reutiliza `GameDef`/`GAMES` (`app/lib/games.ts`) y `GameProps`/`GameHandle` (`app/games/types.ts`) tal cual.

Estructuras internas nuevas, privadas de `MalabaresGame.tsx` (viven en `stateRef`, no se exportan ni se persisten):

```ts
type ObjectKind = "ball" | "torch" | "knife";

type JuggleObject = {
  kind: ObjectKind;
  x: number; // px lógico, posición horizontal fija durante toda la caída
  y: number; // px lógico, posición vertical actual
  vy: number; // velocidad de caída, aumenta con el nivel y según kind
  catchWindow: number; // px lógico de tolerancia horizontal para atrapar, según kind
};

type Juggler = {
  x: number; // px lógico, centro del malabarista
  width: number; // ancho lógico de la zona de manos
};

type MalabaresState = {
  status: "idle" | "running" | "paused" | "gameover";
  juggler: Juggler;
  objects: JuggleObject[];
  spawnTimerMs: number;
  maxSimultaneous: number; // 1..tope, aumenta con el nivel
  combo: number;
  comboMultiplier: number; // derivado de combo, aplicado al puntaje de cada captura
  lives: number;
  score: number;
  level: number;
};
```

## Plan de implementación

1. **Constantes y generador de objetos.** Definir dentro de `MalabaresGame.tsx` las constantes de velocidad base y `catchWindow` por `kind`, y la función `spawnObject(level: number): JuggleObject` que elige `kind`, `x` y `vy` con probabilidad ponderada según `level` (más `torch`/`knife` en niveles altos), garantizando separación mínima respecto a objetos ya en el aire. El sistema sigue funcional (archivo aún no importado en ninguna ruta).

2. **Componente base y render estático.** Crear `app/games/MalabaresGame.tsx` con el esqueleto de componente (`useRef` para canvas, `stateRef`, `keysRef`, `useEffect` de inicialización), implementando `draw()` para pintar al malabarista, la línea de captura y los objetos en una posición estática (sin loop de update aún). El sistema sigue funcional (componente aún no usado en ninguna ruta).

3. **Loop y movimiento.** Implementar `update(dt)` con `requestAnimationFrame`: movimiento horizontal continuo del malabarista según input (flechas/A-D, con límites de canvas), caída vertical de cada `JuggleObject` según su `vy`, y el generador de lanzamientos (`spawnTimerMs`) introduciendo nuevos objetos respetando `maxSimultaneous`. Loop respeta `isPaused` (congela `update`, `draw` puede seguir corriendo si se desea overlay de pausa fuera del canvas, igual que Asteroids). El sistema sigue funcional.

4. **Captura, fallos y vidas.** Implementar la detección de captura cuando `object.y` cruza la línea de captura: solape de `juggler.x ± juggler.width/2` contra `object.x ± object.catchWindow/2` decide captura exitosa (suma puntos, incrementa combo, recicla el objeto arriba) o fallo (decrementa `lives`, invoca `onLives`, resetea combo, recicla el objeto arriba). Si `lives` llega a 0, `stateRef.status = "gameover"` e invoca `onGameOver()`. El sistema sigue funcional.

5. **Puntaje, combo y nivel.** Implementar el cálculo de puntos por captura (base según `kind` × `comboMultiplier`), invocando `onScore` en cada incremento, y la transición de nivel al superar un umbral acumulado de puntaje (invoca `onLevel`, aumenta velocidad base de caída, `maxSimultaneous` hasta un tope, y la proporción de `torch`/`knife` en `spawnObject`). El sistema sigue funcional.

6. **`GameHandle` vía `onReady`.** Exponer `start`/`pause`/`resume`/`reset` que manipulan `stateRef.status` y reinician el estado completo en `reset()`. El sistema sigue funcional (componente completo y listo para wireo).

7. **Wireo en `GamePlayer.tsx`.** Agregar `import { MalabaresGame } from "@/app/games/MalabaresGame";` y la entrada `malabares: MalabaresGame` en `GAME_COMPONENTS`. El sistema sigue funcional: cualquier otro `game.id` sin entrada sigue mostrando el placeholder "Próximamente".

8. **Catálogo.** Agregar el objeto `malabares` a `GAMES` en `app/lib/games.ts` (título, descripción, `category: "Arcade"`, `controls: "Flechas o A/D"`, `year` con el año de esta creación original, ícono libre de `lucide-react` distinto a los ya usados). El sistema queda funcional: Malabares Extremos aparece jugable en la Biblioteca (`/`), con detalle (`/juegos/malabares`) y leaderboard real.

9. **Verificación funcional.** Levantar `npm run dev`, navegar a `/juegos/malabares/jugar`, confirmar overlay idle, iniciar y verificar render del malabarista respondiendo a input horizontal y de los objetos (`ball`/`torch`/`knife`) cayendo y reciclándose tras captura o fallo, probar PAUSA/CONTINUAR y SALIR. Documentar que el ciclo completo de vidas/game-over/guardado de puntaje se verifica manualmente jugando.

## Criterios de aceptación

- [ ] `/` muestra la tarjeta de MALABARES EXTREMOS en el grid jugable (categoría Arcade).
- [ ] `/juegos/malabares` muestra info, controles (`Flechas o A/D`) y leaderboard real vía Supabase.
- [ ] `/juegos/malabares/jugar` renderiza el canvas con el malabarista y al menos un objeto cayendo tras presionar INICIAR.
- [ ] El malabarista se mueve horizontalmente de forma continua y fluida con flechas o A/D, respetando los límites del canvas.
- [ ] Atrapar un objeto dentro de su `catchWindow` en la línea de captura suma puntos (`onScore`) según su `kind` y aumenta el combo; el objeto se recicla y vuelve a caer desde arriba.
- [ ] Dejar caer un objeto fuera de su `catchWindow` decrementa una vida (`onLives`), resetea el combo a 1x, y el objeto se recicla igual que una captura.
- [ ] Al superar el umbral de puntaje por nivel, sube el nivel (`onLevel`), la velocidad de caída aumenta perceptiblemente y puede aumentar la cantidad máxima de objetos simultáneos en el aire.
- [ ] Al agotar las 3 vidas, se invoca `onGameOver()` exactamente una vez.
- [ ] El canvas no dibuja su propio HUD de score/vidas/nivel/combo (esos datos viven solo en el HUD del marco de `GamePlayer.tsx`, vía los callbacks).
- [ ] `isPaused === true` congela el movimiento del malabarista y la caída de todos los objetos; al volver a `false` continúa desde el mismo estado.
- [ ] Snake, Breakout, Tetris, Asteroids, Frogger, Space Invaders y Pac-Man no cambian de comportamiento.
- [ ] `npm run lint` pasa sin errores nuevos.

## Decisiones tomadas y descartadas

- **El juego lanza los objetos automáticamente; el jugador solo controla dónde atrapar.** Justificación: mantiene el input acotado a una sola dimensión (movimiento horizontal), evitando duplicar la complejidad de un "lanzar + atrapar" manual que requeriría un segundo esquema de input; el reto queda en la lectura de múltiples trayectorias y la precisión de posicionamiento, no en la sincronización de un lanzamiento propio.
- **Objetos fallidos y atrapados se reciclan (vuelven a caer) en vez de desaparecer.** Justificación: sostiene la ilusión de un acto de malabares continuo — un juego donde cada objeto es un evento aislado y desaparece se sentiría más como Frogger/Breakout que como malabarismo real, donde los objetos están siempre en el aire.
- **Movimiento horizontal continuo del malabarista (estilo paleta), no posiciones discretas de "manos".** Justificación: da precisión de posicionamiento fino, coherente con la fantasía de "atrapar justo a tiempo"; posiciones discretas (ej. 3 carriles fijos) reducirían el juego a un patrón de reacción binario menos interesante.
- **Sin ítems bonus adicionales a `ball`/`torch`/`knife`.** Justificación: mantiene el scope acotado a un componente Canvas simple; puede proponerse como iteración futura si se aprueba este spec primero.
- **Sin referencia en `Proyectos/` porque no existe una implementación previa de este concepto.** Justificación: diseño original que sigue el patrón técnico (`stateRef` + `requestAnimationFrame` + canvas fijo escalado por CSS) de los juegos ya portados, sin código fuente que portar.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Con varios objetos simultáneos (`maxSimultaneous` alto en niveles avanzados), dos o más podrían llegar a la línea de captura en posiciones X muy distintas al mismo tiempo, haciendo la captura de ambos físicamente imposible con un solo malabarista. | `spawnObject` debe verificar, al generar un nuevo objeto, que su tiempo estimado de llegada a la línea de captura no coincida (dentro de un margen mínimo configurable) con el de otro objeto cuya distancia horizontal exceda el rango de movimiento alcanzable por el malabarista en ese margen de tiempo. |
| Subir `maxSimultaneous` sin límite puede volver el juego ilegible/injugable en niveles altos. | Aplicar un tope máximo (constante `MAX_SIMULTANEOUS`, ej. 4-5) al calcular la progresión de nivel. |
| Reciclar objetos fallidos igual que los atrapados podría hacer que el jugador no perciba con claridad cuándo perdió una vida, ya que visualmente el objeto simplemente "vuelve a aparecer arriba" en ambos casos. | Añadir una señal visual breve y distinta al fallo (ej. destello rojo del objeto o de su trayectoria) al momento de reciclarlo por fallo, como decisión de implementación durante `/spec-impl`, sin cambiar la mecánica de reciclaje en sí. |
