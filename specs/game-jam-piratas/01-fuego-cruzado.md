# Spec — Fuego Cruzado (batalla naval pirata)

- **Estado:** Draft
- **Dependencias:** Spec 04 (Supabase Auth + Scores — `submitScore`, `getLeaderboard`), Spec 05 (Asteroids jugable — patrón de referencia técnica `app/games/types.ts` + `GAME_COMPONENTS`)
- **Fecha:** 2026-08-28

**Objetivo:** Diseñar `fuego-cruzado` — un bergantín pirata con movimiento de inercia (rotación + impulso) que dispara cañonazos por babor/estribor contra oleadas de barcos enemigos, esquiva islas y recoge cofres de tesoro flotante de los barcos hundidos — como componente Canvas jugable siguiendo el contrato `GameProps`/`GameHandle` ya establecido en la plataforma.

## Scope

**Dentro del alcance:**

- Nuevo componente `app/games/FuegoCruzadoGame.tsx`, diseño original sin referencia en `Proyectos/` (se construye desde cero siguiendo el patrón técnico de `AsteroidsGame.tsx`/`TetrisGame.tsx`/`BreakoutGame.tsx`: `stateRef` con todo el estado mutable, loop vía `requestAnimationFrame`, `keysRef` para input, canvas de resolución lógica fija escalado por CSS).
- Control de la nave del jugador con inercia (rotación con flechas izquierda/derecha o A/D, impulso adelante/atrás con flecha arriba/abajo o W/S, fricción que frena gradualmente), similar en espíritu al control de la nave de `AsteroidsGame.tsx` pero **sin wrap de pantalla**: el océano tiene bordes fijos; chocar contra el borde rebota levemente la nave y aplica un pequeño daño (representa encallar).
- Disparo de cañones por costado: una tecla para babor (izquierda de la nave) y otra para estribor (derecha), cada una dispara una salva de cañonazos perpendicular a la proa en el instante del disparo, con cooldown independiente por costado. No existe disparo frontal — es la diferencia de mecánica central frente a `AsteroidsGame.tsx`.
- Islas: obstáculos estáticos (círculos/polígonos simples) distribuidos en el mapa; bloquean el movimiento de cualquier nave (sólidas) y detienen los cañonazos que las atraviesan (se puede usar una isla como cobertura).
- Barcos enemigos: aparecen por oleadas, con una IA simple de estados (`patrol` → navega en una ruta simple cuando no ve al jugador; `chase` → se acerca al jugador; `broadside` → intenta alinearse en paralelo para disparar su propia salva con cooldown propio). Cada barco enemigo tiene puntos de vida (impactos de cañón necesarios para hundirlo).
- Al hundir un barco enemigo, suelta un cofre de tesoro flotante que deriva lentamente por el agua; pasar la nave del jugador sobre el cofre lo recoge (bonus de puntos) antes de que expire tras un tiempo.
- Sistema de vidas (3 iniciales), reportado vía `onLives`: el casco del jugador acumula impactos (`hullHits`) hasta un máximo por vida (`maxHullHits`); al alcanzarlo, se pierde una vida, se reinicia `hullHits` y la nave reaparece en un punto seguro lejos de enemigos. La colisión física directa contra un barco enemigo también suma impactos de casco.
- Sistema de puntaje: puntos por cada impacto de cañón propio sobre un enemigo, bonus grande al hundir un barco, bonus adicional al recoger un cofre. Reportado vía `onScore`.
- Nivel: al hundir todos los barcos de la oleada actual, sube de nivel (`onLevel`), se genera una nueva oleada con más barcos y/o mayor agresividad/velocidad.
- Game over cuando se agotan las 3 vidas (`onGameOver`).
- Sin HUD propio dibujado en canvas (nada de score/vidas/nivel pintado por el propio juego) — se reportan por callbacks, igual que el resto del catálogo.
- `start`/`pause`/`resume`/`reset` expuestos vía `onReady` como `GameHandle`; loop detenido mientras `isPaused` sea `true`.
- Wireo en `app/components/GamePlayer.tsx`: import de `FuegoCruzadoGame`, entrada `"fuego-cruzado": FuegoCruzadoGame` en `GAME_COMPONENTS`.
- Entrada `fuego-cruzado` en `app/lib/games.ts`, dentro de `GAMES` (jugable de inmediato, no `COMING_SOON_GAMES`), con `category: "Acción"`, `controls: "Flechas o WASD + Q/E"`.
- Verificación funcional: navegar a `/juegos/fuego-cruzado`, iniciar, confirmar render de nave, islas, barcos enemigos y cañonazos en movimiento, probar pausa y salir.

**Fuera de alcance (explícitamente NO se hace):**

- Sonido/música.
- Multijugador, barcos aliados o modo cooperativo.
- Progresión persistente entre partidas (mejoras de nave, compra de cañones) — cada partida arranca desde cero, solo el score final se guarda en el leaderboard genérico.
- Clima dinámico (viento que curve la trayectoria de los cañonazos, tormentas, oleaje que afecte el control) — los cañonazos viajan en línea recta constante.
- Mapas de múltiples "mundos" o transición entre océanos distintos — un único océano continuo por partida, con islas regeneradas por nivel.
- Soporte táctil/swipe para móvil — solo teclado, igual que el resto del catálogo.
- Cambios a `app/lib/scores.ts`, esquema de `scores`, o RLS — se reutiliza tal cual.
- Modificar `AsteroidsGame.tsx`, `TetrisGame.tsx`, `BreakoutGame.tsx` o `FroggerGame.tsx`.

## Modelo de datos

No se introducen estructuras de persistencia nuevas — se reutiliza `GameDef`/`GAMES` (`app/lib/games.ts`) y `GameProps`/`GameHandle` (`app/games/types.ts`) tal cual.

Estructuras internas nuevas, privadas de `FuegoCruzadoGame.tsx` (viven en `stateRef`, no se exportan ni se persisten):

```ts
type Vec2 = { x: number; y: number };

type PlayerShip = {
  pos: Vec2;
  vel: Vec2;
  angle: number; // radianes, dirección de la proa
  hullHits: number; // impactos acumulados en la vida actual
  maxHullHits: number; // impactos que aguanta antes de perder una vida
  reloadPortMs: number; // cooldown restante del cañón de babor
  reloadStarboardMs: number; // cooldown restante del cañón de estribor
};

type ShipAiState = "patrol" | "chase" | "broadside";

type EnemyShip = {
  id: number;
  pos: Vec2;
  vel: Vec2;
  angle: number;
  hp: number; // impactos restantes para hundir
  maxHp: number;
  reloadMs: number;
  state: ShipAiState;
};

type Cannonball = {
  pos: Vec2;
  vel: Vec2;
  ttl: number;
  owner: "player" | "enemy";
  dead: boolean;
};

type Island = {
  pos: Vec2;
  radius: number; // obstáculo circular simplificado
};

type TreasureChest = {
  pos: Vec2;
  vel: Vec2; // deriva lenta en el agua
  value: number;
  ttl: number; // desaparece si no se recoge a tiempo
  collected: boolean;
};

type FuegoCruzadoState = {
  status: "idle" | "running" | "paused" | "gameover";
  player: PlayerShip;
  enemies: EnemyShip[];
  cannonballs: Cannonball[];
  islands: Island[];
  chests: TreasureChest[];
  lives: number;
  score: number;
  level: number;
  waveEnemiesRemaining: number;
};
```

## Plan de implementación

1. **Constantes, islas y esqueleto del componente.** Definir dentro de `FuegoCruzadoGame.tsx` las constantes de mapa (dimensiones lógicas `W`/`H`, límites del océano) y la función `buildIslands(level: number): Island[]` que coloca islas pseudoaleatorias sin solaparse con la posición inicial del jugador. Crear el esqueleto del componente (`useRef` para canvas, `stateRef`, `keysRef`, `useEffect` de inicialización) con `draw()` pintando océano/islas/nave en posición estática. El sistema sigue funcional (archivo aún no importado en ninguna ruta).

2. **Movimiento con inercia.** Implementar `update(dt)` con `requestAnimationFrame`: rotación por input, impulso con fricción (mismo espíritu físico que la nave de `AsteroidsGame.tsx`), colisión sólida contra islas (detiene la nave) y contra los bordes del mapa (rebote leve + daño de casco pequeño, sin wrap). Loop respeta `isPaused`. El sistema sigue funcional.

3. **Disparo de cañones y cannonballs.** Implementar disparo de babor/estribor con cooldown independiente por costado, generación de `Cannonball` con velocidad perpendicular a la proa en el instante del disparo, actualización de posición/`ttl`, despawn al expirar o al colisionar contra una isla. El sistema sigue funcional.

4. **Barcos enemigos e IA de combate.** Implementar `buildWave(level: number): EnemyShip[]`, la máquina de estados `patrol`/`chase`/`broadside` (persigue al jugador, intenta alinearse en paralelo, dispara su propia salva con cooldown), colisión `cannonball` (owner `"player"`) contra `EnemyShip` (resta `hp`, invoca `onScore` por impacto, hunde y elimina el barco al llegar a 0, suma bonus de hundimiento). El sistema sigue funcional.

5. **Vidas, colisión de casco y reaparición.** Implementar colisión `cannonball` (owner `"enemy"`) contra el jugador y colisión física directa nave-nave, ambas incrementan `hullHits`; al alcanzar `maxHullHits`, decrementa `lives` (invoca `onLives`), reinicia `hullHits` y reposiciona al jugador en un punto seguro lejos de enemigos; si `lives` llega a 0, `stateRef.status = "gameover"` e invoca `onGameOver()`. El sistema sigue funcional.

6. **Cofres de tesoro y progresión de oleadas.** Al hundir un enemigo, generar un `TreasureChest` con deriva lenta en la posición del hundimiento; colisión jugador-cofre lo recolecta (suma puntos, invoca `onScore`), cofres no recogidos expiran por `ttl`. Cuando `waveEnemiesRemaining` llega a 0, invoca `onLevel` y regenera la oleada vía `buildWave(level + 1)` (más barcos y/o más agresivos), opcionalmente redistribuye islas. El sistema sigue funcional.

7. **`GameHandle` vía `onReady`.** Exponer `start`/`pause`/`resume`/`reset` que manipulan `stateRef.status` y reinician el estado completo (nave, oleada, islas, cofres) en `reset()`. El sistema sigue funcional (componente completo, listo para wireo).

8. **Wireo en `GamePlayer.tsx`.** Agregar `import { FuegoCruzadoGame } from "@/app/games/FuegoCruzadoGame";` y la entrada `"fuego-cruzado": FuegoCruzadoGame` en `GAME_COMPONENTS`. El sistema sigue funcional: cualquier otro `game.id` sin entrada sigue mostrando el placeholder "Próximamente".

9. **Catálogo.** Agregar el objeto `fuego-cruzado` a `GAMES` en `app/lib/games.ts` (título, descripción, `category: "Acción"`, `controls: "Flechas o WASD + Q/E"`, `year: "2026"`, ícono libre de `lucide-react` no usado aún, ej. `Anchor`). El sistema queda funcional: Fuego Cruzado aparece jugable en la Biblioteca (`/`), con detalle (`/juegos/fuego-cruzado`) y leaderboard real.

10. **Verificación funcional.** Levantar `npm run dev`, navegar a `/juegos/fuego-cruzado/jugar`, confirmar overlay idle, iniciar y verificar movimiento con inercia, disparo de cañones por ambos costados, IA enemiga reaccionando, hundimiento de barcos, aparición y recolección de cofres, probar PAUSA/CONTINUAR y SALIR. Documentar que el ciclo completo de vidas/game-over/guardado de puntaje se verifica manualmente jugando.

## Criterios de aceptación

- [ ] `/` muestra la tarjeta de FUEGO CRUZADO en el grid jugable (categoría Acción).
- [ ] `/juegos/fuego-cruzado` muestra info, controles (`Flechas o WASD + Q/E`) y leaderboard real vía Supabase.
- [ ] `/juegos/fuego-cruzado/jugar` renderiza el canvas con océano, islas, la nave del jugador y barcos enemigos tras presionar INICIAR.
- [ ] La nave del jugador se mueve con inercia (rotación + impulso + fricción), nunca de forma instantánea, y no atraviesa islas ni los bordes del mapa.
- [ ] Las teclas de babor y estribor disparan cañonazos perpendiculares a la proa hacia el costado correspondiente, cada una con su propio cooldown independiente.
- [ ] Los barcos enemigos cambian de comportamiento (patrullan, persiguen, se alinean para disparar) según su cercanía y alineación con el jugador.
- [ ] Un barco enemigo se hunde y desaparece al acumular suficientes impactos de cañón del jugador (`onScore` incrementa por impacto y por hundimiento).
- [ ] Al hundir un barco enemigo aparece un cofre de tesoro que el jugador puede recoger pasando sobre él, sumando puntos adicionales (`onScore`).
- [ ] Al acumular suficientes impactos de casco (por cañón enemigo o colisión física), se pierde una vida (`onLives` decrementa) y la nave reaparece en un punto seguro.
- [ ] Al hundir todos los barcos de la oleada actual, sube el nivel (`onLevel` incrementa) y aparece una nueva oleada perceptiblemente más numerosa o agresiva.
- [ ] Al agotar las 3 vidas, se invoca `onGameOver()` exactamente una vez.
- [ ] El canvas no dibuja su propio HUD de score/vidas/nivel (esos datos viven solo en el HUD del marco de `GamePlayer.tsx`, vía los callbacks).
- [ ] `isPaused === true` congela nave, enemigos, cañonazos y cofres; al volver a `false` continúa desde el mismo estado.
- [ ] Snake, Breakout, Tetris, Asteroids, Space Invaders, Pac-Man y Frogger no cambian de comportamiento.
- [ ] `npm run lint` pasa sin errores nuevos.

## Decisiones tomadas y descartadas

- **Combate por salvas de costado (babor/estribor) en vez de disparo frontal.** Justificación: es la mecánica distintiva del combate naval a vela y diferencia claramente el input/ritmo de este juego frente a `AsteroidsGame.tsx` (que ya usa inercia + disparo frontal) — obliga a maniobrar en paralelo al enemigo en vez de apuntar y disparar hacia adelante.
- **Mapa con bordes fijos (sin wrap), a diferencia de Asteroids.** Justificación: las islas como obstáculos y cobertura solo tienen sentido táctico si el espacio es finito; el wrap de pantalla rompería la lectura de "dónde está la costa".
- **Vidas basadas en impactos acumulados (`hullHits`/`maxHullHits`) en vez de una barra de vida continua.** Justificación: mantiene el reporte a `onLives` como un contador entero simple, consistente con el resto del catálogo (Asteroids, Frogger), sin introducir un HUD de barra de vida que el juego no debe dibujar.
- **Sin viento ni clima dinámico afectando la trayectoria de los cañonazos.** Justificación: mantiene el scope de física acotado (línea recta constante); puede proponerse como iteración futura sobre este mismo spec una vez aprobado e implementado.
- **Sin barcos aliados ni progresión persistente entre partidas.** Justificación: cada partida es autocontenida y su único registro persistente es el score final vía el flujo genérico de `app/lib/scores.ts`, igual que el resto del catálogo.
- **Sin referencia en `Proyectos/`, diseño original que solo reutiliza el patrón técnico.** Justificación: no existe implementación previa de combate naval en el repo; se sigue el mismo patrón `stateRef` + `requestAnimationFrame` + canvas fijo escalado por CSS que Asteroids/Tetris/Breakout, tomando prestado el modelo de inercia de `AsteroidsGame.tsx` como referencia de física, no de código.

## Riesgos identificados

| Riesgo                                                                                                                                                                                        | Mitigación                                                                                                                                                                                          |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| La IA de estados (`patrol`/`chase`/`broadside`) puede volverse trivial (enemigos que nunca disparan) o injugable (enemigos que siempre se alinean perfectamente) sin tuning cuidadoso.       | Aceptar tuning iterativo de umbrales de distancia/ángulo de alineación durante `/spec-impl`, verificando manualmente ambos extremos antes de cerrar el paso 4 del plan.                             |
| Detectar si un cañonazo es bloqueado por una isla (línea de tiro) agrega una comprobación de colisión adicional por proyectil y por isla en cada frame, con riesgo de costo de cómputo.        | Limitar el número de islas simultáneas a una constante pequeña (ej. 3-5 por partida) y usar una comprobación de colisión círculo-círculo simple (cannonball como punto, isla como círculo), igual de barata que las ya usadas en Asteroids. |
| Balancear la dificultad de oleadas crecientes (más barcos + más agresividad) puede volverse injugable en niveles altos si ambos factores escalan sin tope.                                    | Aplicar un tope máximo de barcos simultáneos por oleada (constante `MAX_WAVE_SIZE`) y un tope de velocidad/cooldown mínimo de disparo enemigo al calcular `buildWave(level)`.                       |
