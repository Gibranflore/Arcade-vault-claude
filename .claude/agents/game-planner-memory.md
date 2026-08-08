# Historial de sugerencias — game-planner

Registro de juegos sugeridos por el agente `@game-planner`, para evitar repetir ideas entre sesiones.

<!-- Formato por entrada:
## <Nombre del juego> (<fecha YYYY-MM-DD>)
- Categoría: ...
- Estado: sugerido | rechazado | implementado
- Justificación: ...
-->

## 2048 (2026-08-08)

- Categoría: Puzzle
- Estado: sugerido
- Justificación: complementa a Tetris (única entrada de Puzzle en el catálogo) sin solaparse: mecánica de turnos discretos sobre grid fijo con fusión de casillas, en vez de piezas cayendo en tiempo real. Score = suma de valores fusionados, compatible directo con el leaderboard genérico (`app/lib/scores.ts`). Muy baja complejidad como Canvas único (grid 4x4, sin física ni colisiones continuas, 4 inputs direccionales), y aporta variedad de ritmo de juego (pausado/estratégico) frente al resto del catálogo (Breakout, Tetris, Asteroids, Snake, Invaders, Pac-Maze), todos de reflejos o caída continua.

## Minesweeper (2026-08-08)

- Categoría: Puzzle
- Estado: sugerido
- Justificación: deducción lógica sin reloj de caída, score = tiempo/celdas reveladas. Canvas trivial (grid estático, sin física).

## Memory Match (2026-08-08)

- Categoría: Puzzle
- Estado: sugerido
- Justificación: memoria visual pura, score = rapidez + eficiencia de intentos. Implementación trivial (rectángulos con estado de volteo).

## Sokoban (2026-08-08)

- Categoría: Puzzle
- Estado: sugerido
- Justificación: razonamiento espacial por niveles secuenciales (progresión por niveles fijos, ausente en el catálogo). Grid con movimiento discreto en 4 direcciones.

## Bubble Shooter (2026-08-08)

- Categoría: Puzzle
- Estado: sugerido
- Justificación: match-3 de acción reactiva, score por combos en cadena. Complejidad moderada (flood-fill, trayectoria con rebote) pero manejable en un solo Canvas.

## Lights Out (2026-08-08)

- Categoría: Puzzle
- Estado: sugerido
- Justificación: lógica de paridad/álgebra booleana, categoría inexplorada. Canvas trivial (grid de toggle), rejugabilidad infinita con tableros aleatorios.

## Galaga (2026-08-08)

- Categoría: Acción
- Estado: sugerido
- Justificación: formaciones dinámicas con movimiento curvo, distinto de Asteroids (sin gravedad cero) y de Invaders pendiente (grid estático). Colisiones AABB simples, spawners con timers.

## Centipede (2026-08-08)

- Categoría: Acción
- Estado: sugerido
- Justificación: movimiento libre en 2D (vs. horizontal de Invaders/Galaga), lógica de segmentos independientes al fragmentar el ciempiés. Complejidad moderada pero contenida.

## Frogger (2026-08-08)

- Categoría: Acción
- Estado: sugerido
- Justificación: esquivar/temporizar en carriles de velocidad variable, mecánica ausente en el catálogo (no dispara). Carriles como arrays con velocidad constante, colisión AABB.

## Pong (2026-08-08)

- Categoría: Acción
- Estado: sugerido
- Justificación: arcade clásico de "raqueta vs. oponente" (vs. Breakout que es raqueta vs. ladrillos). Física trivial, quick win de baja complejidad. Requiere adaptar puntaje a "puntos antes de game over" para leaderboard de high-score.

## Missile Command (2026-08-08)

- Categoría: Acción
- Estado: sugerido
- Justificación: apuntar-y-disparar con mouse hacia objetivos que caen, defensa de posiciones fijas (vs. nave móvil). Trayectorias lineales y explosiones por colisión de distancia, sin motor de físicas.

## Flappy Void (2026-08-08)

- Categoría: Arcade / Habilidad
- Estado: sugerido
- Justificación: timing de un solo botón con gravedad continua, hueco no cubierto por el catálogo. Física trivial (una partícula, gravedad, generación procedural de obstáculos).

## Doodle Ascent (2026-08-08)

- Categoría: Arcade / Habilidad
- Estado: sugerido
- Justificación: único "endless vertical climber" del catálogo, score = altura máxima. Cámara con scroll vertical y generación procedural de plataformas.

## Neon Runner (2026-08-08)

- Categoría: Arcade / Habilidad
- Estado: sugerido
- Justificación: reflejos por patrón repetitivo creciente (lateral runner), ausente en un catálogo hoy dominado por space/grid. Loop mínimo: auto-scroll + salto + spawn de obstáculos.

## Pong Duel vs CPU (2026-08-08)

- Categoría: Arcade / Habilidad
- Estado: sugerido
- Justificación: variante de Pong contra IA con dificultad progresiva; reutiliza física de rebote similar a Breakout, bajo riesgo de implementación. (Nota: solapa en concepto con "Pong" sugerido en el lote de Acción — evaluar cuál versión priorizar si se implementa.)

## Reflex Grid (2026-08-08)

- Categoría: Arcade / Habilidad
- Estado: sugerido
- Justificación: reaction/timing game de precisión bajo presión de tiempo, categoría sin representante actual. Implementación de más bajo riesgo del lote (solo estado de grid + timers).

## Minesweeper Blitz (2026-08-08)

- Categoría: Puzzle
- Estado: sugerido
- Justificación: variante de Buscaminas con score por velocidad/casillas reveladas en vez de tiempo mínimo. (Nota: solapa con "Minesweeper" del lote de Puzzle — mismo concepto base, diferenciarse solo por el sistema de puntaje si se implementa.)

## Solitario Klondike Arcade (2026-08-08)

- Categoría: Clásico
- Estado: sugerido
- Justificación: primer juego de cartas puro del catálogo (hoy 100% arcade/acción/puzzle de grid). Reto principal: layout de cartas superpuestas y detección de zonas válidas vía drag-and-drop.

## Conecta 4 contra IA (2026-08-08)

- Categoría: Puzzle / Clásico
- Estado: sugerido
- Justificación: estrategia por turnos contra IA con puntaje progresivo por racha, evita el problema de "1v1 sin score". Grid simple 7x6, lógica de líneas reutilizable conceptualmente.

## Word Cascade (2026-08-08)

- Categoría: Puzzle
- Estado: sugerido
- Justificación: primer juego de "Palabras" del catálogo, ritmo cognitivo/verbal distinto a los de reflejos. Solo requiere input de teclado y diccionario embebido, sin física.

## Damas Blitz (2026-08-08)

- Categoría: Puzzle / Clásico
- Estado: sugerido
- Justificación: profundidad estratégica real contra IA con reloj de turno, complementa a Conecta 4 sin solaparse (captura/jerarquía de piezas vs. alineación simple). Más complejo de implementar (reglas de captura obligatoria) pero factible en un solo componente.
