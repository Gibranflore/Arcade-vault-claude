# Spec — Hoppy Hazard (variación temática de Frogger)

- **Estado:** Draft
- **Dependencias:** Spec 04 (Supabase Auth + Scores — `submitScore`, `getLeaderboard`), Spec 05 (Asteroids jugable — patrón de referencia técnica `app/games/types.ts` + `GAME_COMPONENTS`)
- **Fecha:** 2026-08-12

**Objetivo:** Diseñar `hoppy-hazard` — variación de scroll vertical continuo del núcleo esquivar-y-cruzar de Frogger, donde una rana sube sin parar por un cañón inundado que se desplaza hacia abajo, saltando entre plataformas flotantes (troncos, nenúfares, lomos de cocodrilo) mientras el agua sube y el fondo desaparece — como componente Canvas jugable siguiendo el contrato `GameProps`/`GameHandle` ya establecido en la plataforma.

## Scope

**Dentro del alcance:**

- Nuevo componente `app/games/HoppyHazardGame.tsx`, diseño original sin referencia en `Proyectos/` (se construye desde cero siguiendo el patrón técnico de `AsteroidsGame.tsx`/`TetrisGame.tsx`/`BreakoutGame.tsx`: `stateRef` con todo el estado mutable, loop vía `requestAnimationFrame`, `keysRef` para input, canvas de resolución lógica fija escalado por CSS).
- Mecánica core distinta a la del cruce carretera+río clásico: scroll vertical infinito (estilo "Doodle Jump" pero con temática de río/cocodrilos) en vez de tablero fijo de carriles horizontales con meta.
- Generación procedural de plataformas por filas, apareciendo desde arriba del canvas y desplazándose hacia abajo a velocidad creciente (representa el "nivel del agua subiendo"):
  - `lily` (nenúfar): plataforma estática, segura, tamaño fijo.
  - `log` (tronco flotante): se desplaza horizontalmente dentro de su fila (rebota en los bordes del canvas), seguro para pararse.
  - `croc` (lomo de cocodrilo): visualmente similar a un tronco pero se hunde un instante después de que la rana salta sobre él (parpadeo de aviso antes de hundirse) — si la rana no vuelve a saltar a tiempo, cae al agua.
  - `fly` (mosca, opcional, ver Fuera de alcance — no se incluye en esta versión).
- Input: la rana salta automáticamente hacia arriba en un arco parabólico cada vez que aterriza (salto automático, estilo Doodle Jump), y el jugador solo controla el desplazamiate horizontal con flechas izquierda/derecha o A/D mientras está en el aire, para dirigir el aterrizaje hacia la siguiente plataforma.
- El agua (borde inferior del canvas) sube de forma constante y ligeramente acelerada con el tiempo/nivel; si la rana cae al agua (ninguna plataforma bajo ella al llegar al fondo visible) o el agua alcanza su posición Y, pierde una vida.
- Sistema de vidas (3 iniciales), reportado vía `onLives`; al perder una vida con vidas restantes, la rana reaparece en la plataforma segura más cercana a la posición de cámara actual (no reinicia el scroll desde cero).
- Sistema de puntaje: puntos proporcionales a la altura máxima alcanzada (equivalente a "cuántas filas subió", igual que Doodle Jump/juegos de scroll infinito), con bonus extra por aterrizar consecutivamente sin caer al agua (combo de plataformas seguidas). Reportado vía `onScore`.
- Nivel: cada cierto umbral de altura alcanzada, sube de nivel (`onLevel`), aumenta la velocidad de subida del agua y la proporción de plataformas `croc` frente a `lily`/`log`.
- Game over cuando se agotan las 3 vidas (`onGameOver`).
- Sin HUD propio dibujado en canvas — vidas/score/nivel se reportan por callbacks, igual que el resto del catálogo.
- `start`/`pause`/`resume`/`reset` expuestos vía `onReady` como `GameHandle`; loop detenido mientras `isPaused` sea `true`.
- Wireo en `app/components/GamePlayer.tsx`: import de `HoppyHazardGame`, entrada `hoppy-hazard: HoppyHazardGame` en `GAME_COMPONENTS`.
- Entrada `hoppy-hazard` en `app/lib/games.ts`, dentro de `GAMES` (jugable de inmediato), con `category: "Acción"`, `controls: "Flechas o A/D"`.
- Verificación funcional: navegar a `/juegos/hoppy-hazard`, iniciar, confirmar scroll vertical, plataformas generándose, salto automático y control horizontal, probar pausa y salir.

**Fuera de alcance (explícitamente NO se hace):**

- Moscas/ítems bonus recolectables (`fly` mencionado arriba queda descartado para esta versión, ver Decisiones).
- Sonido/música.
- Soporte táctil/swipe/acelerómetro para móvil — solo teclado.
- Múltiples personajes/skins seleccionables.
- Modo "sin vidas, solo altura" (endless puro) — se mantiene el sistema de 3 vidas para consistencia con el resto del catálogo y con el spec 01 (Frogger Clásico).
- Cambios a `app/lib/scores.ts`, esquema de `scores`, o RLS.
- Modificar `AsteroidsGame.tsx`, `TetrisGame.tsx`, `BreakoutGame.tsx` o `FroggerGame.tsx` (del spec 01, si llegara a implementarse).

## Modelo de datos

No se introducen estructuras de persistencia nuevas — se reutiliza `GameDef`/`GAMES` (`app/lib/games.ts`) y `GameProps`/`GameHandle` (`app/games/types.ts`) tal cual.

Estructuras internas nuevas, privadas de `HoppyHazardGame.tsx` (viven en `stateRef`, no se exportan ni se persisten):

```ts
type PlatformKind = "lily" | "log" | "croc";

type Platform = {
  kind: PlatformKind;
  x: number; // px lógico, centro
  y: number; // px lógico, coordenada de mundo (scroll)
  width: number;
  vx: number; // solo "log": velocidad horizontal de rebote
  sinking: boolean; // solo "croc": true tras ser pisado
  sinkTimerMs: number; // solo "croc": tiempo restante antes de hundirse del todo
};

type Frog = {
  x: number; // px lógico
  y: number; // px lógico, coordenada de mundo
  vy: number; // velocidad vertical del arco de salto
  vx: number; // velocidad horizontal controlada por input
  onPlatform: Platform | null;
};

type HoppyState = {
  status: "idle" | "running" | "paused" | "gameover";
  frog: Frog;
  platforms: Platform[];
  cameraY: number; // desplazamiento de cámara = altura alcanzada
  waterY: number; // coordenada de mundo del nivel del agua, sube con el tiempo
  maxHeightReached: number;
  combo: number; // aterrizajes consecutivos sin caer
  lives: number;
  score: number;
  level: number;
};
```

## Plan de implementación

1. **Generador de plataformas y cámara.** Definir constantes de espaciado vertical/horizontal entre plataformas y la función `spawnPlatformRow(worldY: number, level: number): Platform[]` que decide tipo (`lily`/`log`/`croc`) por probabilidad ponderada según `level`. Implementar el esqueleto de `HoppyHazardGame.tsx` (canvas, `stateRef`, `useEffect` de inicialización) con `draw()` estático (cámara fija, plataformas dibujadas en sus posiciones iniciales). El sistema sigue funcional (componente aún no usado en ninguna ruta).

2. **Movimiento de la rana y cámara de scroll.** Implementar `update(dt)` con `requestAnimationFrame`: física del salto automático (arco parabólico, aterrizaje dispara el siguiente salto), input horizontal (flechas/A-D) que modifica `frog.vx` mientras está en el aire, y desplazamiento de `cameraY` para seguir a la rana cuando sube por encima de cierto umbral de pantalla (patrón estándar de scroller vertical: la cámara no baja, solo sube). Loop respeta `isPaused`. El sistema sigue funcional.

3. **Comportamiento por tipo de plataforma.** Implementar lógica de colisión aterrizaje-plataforma (rectángulo bajo los pies de la rana en el frame de caída), rebote horizontal de `log` en los bordes del canvas, y el ciclo de `croc` (aterrizaje dispara `sinking = true` con `sinkTimerMs` regresivo; si la rana ya saltó de nuevo antes de que llegue a 0, no pasa nada; si `sinkTimerMs` llega a 0 con la rana aún encima, cuenta como caída). El sistema sigue funcional.

4. **Agua, vidas y reaparición.** Implementar el ascenso constante de `waterY` (acelerado por `level`), detección de "rana alcanzada por el agua" o "caída sin plataforma bajo los pies" como pérdida de vida: decrementa `lives`, invoca `onLives`, reposiciona la rana en la plataforma segura visible más cercana a `cameraY` (no en el fondo absoluto). Si `lives` llega a 0, `stateRef.status = "gameover"` e invoca `onGameOver()`. El sistema sigue funcional.

5. **Puntaje, combo y nivel.** Implementar cálculo de `score` proporcional a `maxHeightReached` (invoca `onScore` cuando la altura máxima aumenta), incremento de `combo` en cada aterrizaje seguro consecutivo (se resetea a 0 al caer al agua) con bonus de puntos al combo, y transición de nivel cada umbral de altura (invoca `onLevel`, ajusta velocidad de `waterY` y proporción de `croc` en `spawnPlatformRow`). El sistema sigue funcional.

6. **`GameHandle` vía `onReady`.** Exponer `start`/`pause`/`resume`/`reset` que manipulan `stateRef.status` y reinician el estado completo (incluida regeneración de plataformas iniciales) en `reset()`. El sistema sigue funcional (componente completo, listo para wireo).

7. **Wireo en `GamePlayer.tsx`.** Agregar `import { HoppyHazardGame } from "@/app/games/HoppyHazardGame";` y la entrada `"hoppy-hazard": HoppyHazardGame` en `GAME_COMPONENTS`. El sistema sigue funcional para cualquier otro `game.id`.

8. **Catálogo.** Agregar el objeto `hoppy-hazard` a `GAMES` en `app/lib/games.ts` (título, descripción, `category: "Acción"`, `controls: "Flechas o A/D"`, `year` con el año de esta variación original — usar el año actual del jam o dejar como decisión de implementación, ícono libre de `lucide-react` distinto al usado por Frogger Clásico). El sistema queda funcional: Hoppy Hazard aparece jugable en la Biblioteca (`/`), con detalle y leaderboard real.

9. **Verificación funcional.** Levantar `npm run dev`, navegar a `/juegos/hoppy-hazard/jugar`, confirmar overlay idle, iniciar y verificar scroll vertical continuo, salto automático con control horizontal respondiendo a input, plataformas `log`/`croc` comportándose distinto entre sí, probar PAUSA/CONTINUAR y SALIR. Documentar que el ciclo completo de vidas/game-over/guardado de puntaje se verifica manualmente jugando.

## Criterios de aceptación

- [ ] `/` muestra la tarjeta de HOPPY HAZARD en el grid jugable (categoría Acción).
- [ ] `/juegos/hoppy-hazard` muestra info, controles (`Flechas o A/D`) y leaderboard real vía Supabase.
- [ ] `/juegos/hoppy-hazard/jugar` renderiza el canvas con la rana saltando automáticamente y plataformas apareciendo por arriba y desplazándose hacia abajo tras presionar INICIAR.
- [ ] El input horizontal (flechas o A/D) mueve a la rana lateralmente solo mientras está en el aire, sin producir saltos manuales adicionales.
- [ ] Las plataformas `log` rebotan de un borde a otro del canvas de forma visible; las plataformas `croc` parpadean y se hunden un instante después de ser pisadas.
- [ ] Caer al agua o ser alcanzado por el nivel de agua ascendente decrementa una vida (`onLives`) y reposiciona a la rana en la plataforma segura más cercana visible, sin reiniciar el scroll desde cero.
- [ ] El puntaje (`onScore`) aumenta de forma monótona con la altura máxima alcanzada, nunca disminuye.
- [ ] Al superar el umbral de altura por nivel, sube el nivel (`onLevel`) y la velocidad de ascenso del agua aumenta perceptiblemente.
- [ ] Al agotar las 3 vidas, se invoca `onGameOver()` exactamente una vez.
- [ ] El canvas no dibuja su propio HUD de score/vidas/nivel/altura.
- [ ] `isPaused === true` congela el scroll, el salto y el agua; al volver a `false` continúa desde el mismo estado.
- [ ] Snake, Breakout, Tetris, Asteroids, Space Invaders, Pac-Man y Frogger Clásico (si existe) no cambian de comportamiento.
- [ ] `npm run lint` pasa sin errores nuevos.

## Decisiones tomadas y descartadas

- **Scroll vertical infinito con salto automático (estilo Doodle Jump) en vez de tablero fijo de carriles.** Justificación: da al segundo concepto un ritmo y una mecánica de input claramente distintos al spec 01 (input continuo/direccional en el aire vs. saltos discretos por celda), cumpliendo el requisito de mecánica core diferente entre los dos conceptos generados.
- **Sin meta fija (casas) — el objetivo es la altura, no "llegar a un lugar".** Justificación: coherente con el género de scroller infinito elegido; una meta fija no tiene sentido si la cámara nunca deja de subir.
- **Sistema de vidas (3) igual al resto del catálogo, en vez de endless puro de una sola vida.** Justificación: mantiene consistencia de HUD (`onLives`) y de expectativa de juego con el resto de la plataforma; se descartó "endless sin vidas" para no introducir un patrón de scoring distinto al ya establecido.
- **Se descarta el ítem `fly` (mosca bonus) para esta versión.** Justificación: mantiene el scope mínimo jugable; puede proponerse como iteración futura sobre este mismo spec una vez aprobado e implementado.
- **Sin referencia en `Proyectos/`, diseño original que solo reutiliza el patrón técnico.** Justificación: no existe implementación previa de este concepto en el repo; se sigue el mismo patrón `stateRef` + `requestAnimationFrame` + canvas fijo escalado por CSS que Asteroids/Tetris/Breakout.

## Riesgos identificados

| Riesgo                                                                                                                                                                                                                | Mitigación                                                                                                                                                                                                                                           |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El salto automático con control horizontal (estilo Doodle Jump) es una física distinta a cualquier juego ya portado en la plataforma; hay riesgo de que el arco de salto se sienta "flotante" o impreciso sin tuning. | Aceptar tuning iterativo de constantes de gravedad/impulso durante `/spec-impl` como ajuste de implementación, no bloqueante para el spec.                                                                                                           |
| Generar el mundo proceduralmente por filas hacia arriba (en vez de un tablero fijo) puede dejar huecos injugables (ninguna plataforma alcanzable desde la posición de aterrizaje anterior).                           | `spawnPlatformRow` debe garantizar que el rango horizontal de la nueva fila se solape con el rango alcanzable desde la fila anterior dado el impulso máximo de salto, verificado como parte del paso 1 del plan.                                     |
| El combo de puntaje y el nivel dependen de tracking continuo de altura máxima; un bug de reseteo incorrecto tras perder una vida podría inflar o corromper el score reportado a `onScore`.                            | El paso 5 del plan implementa el combo y la altura máxima como cálculos derivados de `stateRef` verificables de forma aislada antes de conectarlos a `onScore`, siguiendo el mismo cuidado que spec 05 aplicó a sincronizar `score`/`lives`/`level`. |
