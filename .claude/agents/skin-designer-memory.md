# Memoria de skin-designer

## Breakout (2026-08-12)

- Elementos visuales identificados: fondo negro, bloques por fila (`ROW_COLORS` 5 colores), bloque indestructible, borde de bloque, paleta del jugador, pelota.
- Skins propuestas:
  - Clásico: fondo `#000`, bloques `#ff2bd6/#00f5ff/#39ff14/#f5ff00/#ff8c1a`, indestructible `#666`, paleta `#fff`, pelota `#00f5ff`.
  - Neon: fondo `#05010a`, bloques duotono cian/magenta con acento amarillo, paleta y pelota con glow `#00f5ff`/`#ff2bd6`.
  - Retro: bandas planas homenaje Atari 1976 (`#ffb000`, `#e0d000`, `#4caf50`), paleta/pelota blancas.
- Estado: propuesto

## Tetris (2026-08-12)

- Elementos visuales identificados: fondo negro, grilla `#22222e`, 7 colores de pieza (`COLORS`), overlay pieza fija, texto sidebar `#888`.
- Skins propuestas:
  - Clásico: paleta pastel actual (I `#4dd0e1`, O `#ffd54f`, T `#ba68c8`, S `#81c784`, Z `#e57373`, J `#7986cb`, L `#ffb74d`).
  - Neon: mismas 7 piezas llevadas a saturación máxima (`#00f5ff`, `#f5ff00`, `#ff2bd6`, `#39ff14`, `#ff1744`, `#7c4dff`, `#ff8c1a`), grilla con glow cian.
  - Retro: paleta Game Boy de 4 tonos verdes (`#0f380f`, `#306230`, `#8bac0f`, `#9bbc0f`) agrupando piezas por forma.
- Estado: propuesto

## Asteroids (2026-08-12)

- Elementos visuales identificados: fondo negro, nave (contorno blanco), llama del propulsor (`rgba(255,130,0,0.85)`), balas, asteroides, partículas, power-up triple (blanco), power-up bomba (`#f66`).
- Skins propuestas:
  - Clásico: wireframe blanco `#fff` sobre negro, llama naranja, bomba `#ff6666`.
  - Neon: fondo `#0a0014`, nave cian `#00f5ff`, asteroides magenta `#ff2bd6`, balas verde ácido `#39ff14`, bomba `#ff003c`.
  - Retro: monocromo fósforo verde `#33ff33` para todos los elementos (homenaje a monitores vectoriales de 1979).
- Estado: propuesto

## Asteroids — revisión detallada (2026-08-12)

- Nota: expande la entrada breve de Asteroids ya existente arriba (misma fecha, misma sesión), con detalle elemento-por-elemento y confirmación de que no hay HUD dibujado en canvas.
- Elementos visuales identificados: fondo (`fillRect` negro), nave (contorno), llama del propulsor, asteroides (contorno + cráteres), proyectiles/balas, partículas de explosión (fade por alpha), power-up triple shot, power-up bomba. Sin HUD en canvas (score/vidas/nivel los maneja `GamePlayer.tsx` fuera del canvas).
- Skins propuestas:
  - Clásico: fondo `#000000`, nave `#ffffff`, llama `#ff8200`, asteroides `#ffffff`, proyectiles `#ffffff`, partículas blanco fade, power-up triple `#ffffff`, power-up bomba `#ff6666`. Accent: `green`.
  - Neon: fondo `#0a0014`, nave `#00f5ff`, llama `#ff2bd6`, asteroides `#ff2bd6` (cráteres `#b400a0`), proyectiles `#39ff14`, partículas fade cian→magenta, power-up triple `#f5ff00`, power-up bomba `#ff003c`. Accent: `cyan`.
  - Retro: fondo `#001100`, nave `#33ff33`, llama `#7fff7f`, asteroides `#33ff33` (cráteres `#1f9e1f`), proyectiles `#66ff66`, partículas fade verde fósforo, power-up triple `#33ff33`, power-up bomba `#1f9e1f`. Accent: `green`.
- Estado: propuesto

## Frogger (2026-08-12)

- Elementos visuales identificados: fondos por tipo de carril (meta/segura/carretera/río), casillas de meta, vehículos (camión/auto), entidades de río (cocodrilo/tronco + boca), rana (cuerpo/ojos).
- Skins propuestas:
  - Clásico: paleta actual (meta `#0d2b1f`, segura `#123a24`, carretera `#1c1c22`, río `#0a2a4a`, rana `#39ff14`, boca cocodrilo `#ff003c`).
  - Neon: fondos fríos casi negros (`#150a2a`/`#050505`/`#05122a`), meta/rana cian `#00f5ff`, vehículos magenta/naranja neón, cocodrilo verde ácido.
  - Retro: paleta plana NES/8-bit (carretera `#545454`, río `#0058f8`, césped `#00a800`, meta `#f8d800`, rana `#00b800`).
- Estado: propuesto

## Snake — revisión detallada (2026-08-15)

- Nota: reemplaza la entrada provisional de Snake (2026-08-12), hecha antes de que existiera el componente. Ahora `app/games/SnakeGame.tsx` está implementado y registrado en `GAME_COMPONENTS`; se audita contra el código real (función `drawScene`, grilla 40×30 de celdas 20px). Se usó como referencia de forma de objeto el patrón de `app/games/asteroidsSkins.ts` (objeto plano `id/label/<elemento>` en hex), sin implementarlo aquí.
- Elementos visuales identificados: fondo (`fillRect` negro `#000000`), comida (cuadrado `#f5ff00`), cuerpo de la serpiente (todos los segmentos salvo el primero, `#39ff14`), cabeza de la serpiente (primer segmento, distinto del cuerpo, `#7cff5c`). Sin HUD en canvas, sin variación visual por nivel/velocidad.
- Skins propuestas:
  - Clásico: fondo `#000000`, cabeza `#7cff5c`, cuerpo `#39ff14`, comida `#f5ff00`. Accent: `green`. Justificación: es la paleta actual exacta del juego (verde ácido sobre negro con comida amarilla), ya coherente con `color: #39ff14` / `accent: green` de `games.ts`.
  - Neon: fondo `#0a0014`, cabeza `#00f5ff`, cuerpo `#ff2bd6`, comida `#f5ff00` (con glow). Accent: `cyan`. Justificación: fondo casi negro con tinte violeta típico CRT synthwave; cabeza cian de alto contraste para distinguirla del cuerpo magenta saturado, comida amarilla como único acento cálido que "brilla" sobre el resto.
  - Retro: fondo `#0f380f`, cabeza `#9bbc0f`, cuerpo `#8bac0f`, comida `#306230`. Accent: `green`. Justificación: 4 tonos de verde fósforo de Game Boy (DMG), evocando el Snake original en hardware portátil monocromo de los 80s/90s, con la comida en el tono más oscuro para que siga siendo identificable sin romper la monocromía.
- Estado: propuesto

## Space Invaders (2026-08-12)

- Elementos visuales identificados: ninguno — juego `COMING_SOON_GAMES`, sin componente. Paleta provisional basada solo en `color: #ff006e` / `accent: magenta` de `games.ts`.
- Skins propuestas (provisionales):
  - Clásico: fondo `#000`, nave blanca, alienígenas `#ff006e`, disparos `#f5ff00`.
  - Neon: fondo `#0a0014`, nave cian `#00f5ff`, alienígenas magenta con glow, disparos verde ácido `#39ff14`.
  - Retro: monocromo fósforo verde `#33ff33` (homenaje a monitores con overlay de celofán de 1978).
- Estado: propuesto (no accionable hasta tener componente)

## Breakout — revisión detallada (2026-08-14)

- Nota: expande la entrada breve de Breakout ya existente arriba (2026-08-12), con detalle elemento-por-elemento, `accent` sugerido y justificación por skin. Confirmado contra `app/games/BreakoutGame.tsx` vigente: `ROW_COLORS` (5, una por fila), `INDESTRUCTIBLE_COLOR`, borde de bloque `rgba(0,0,0,0.4)`, paddle `#fff`, pelota `#00f5ff`, fondo `#000`. Se usó como referencia de forma de objeto el patrón de `app/games/asteroidsSkins.ts` (objeto plano `id/label/<elemento>` en hex, sin implementarlo aquí).
- Elementos visuales identificados: fondo, 5 colores de fila de bloques, bloque indestructible, borde de bloque, paleta, pelota.
- Skins propuestas:
  - Clásico: fondo `#000000`, filas `#ff2bd6/#00f5ff/#39ff14/#f5ff00/#ff8c1a`, indestructible `#666666`, borde `rgba(0,0,0,0.4)`, paleta `#ffffff`, pelota `#00f5ff`. Accent: `cyan`. Justificación: es la paleta arcoíris actual del juego, ya coherente con `color: #00f5ff` / `accent: cyan` de `games.ts`.
  - Neon: fondo `#05010a`, filas `#ff003c/#00f5ff/#39ff14/#f5ff00/#ff2bd6`, indestructible `#3a2a4a` (con borde con glow), borde `rgba(0,245,255,0.35)`, paleta `#f5ff00` con glow, pelota `#ff2bd6` con estela. Accent: `cyan`. Justificación: mismos 5 tonos llevados a saturación máxima estilo CRT synthwave, fondo casi negro con tinte violeta para resaltar el glow.
  - Retro: fondo `#000000`, filas `#ffb000/#e0d000/#4caf50/#2e7d32/#8d6e00` (bandas planas homenaje Atari/CRT 1976), indestructible `#4a4a4a` (hormigón), borde `rgba(0,0,0,0.6)`, paleta `#cfd8c0` (blanco fósforo), pelota `#ffb000`. Accent: `yellow`. Justificación: tonos ámbar/verde de baja saturación evocando monitores monocromo y las bandas planas del Breakout original de Atari, sin el glow saturado de la skin Neon.
- Estado: propuesto

## Tetris — revisión detallada (2026-08-14)

- Nota: expande la entrada breve de Tetris ya existente arriba (2026-08-12), con detalle elemento-por-elemento, `accent` sugerido y justificación por skin. Confirmado contra `app/games/TetrisGame.tsx` vigente: `COLORS` (7, una por tipo de pieza I/O/T/S/Z/J/L), grid `#22222e`, fondo `#000`, highlight superior de bloque `rgba(255,255,255,0.12)` (fijo, no forma parte de la propuesta de skin), pieza fantasma con alpha 0.2, texto sidebar `#888`.
- Elementos visuales identificados: fondo, líneas de grilla, 7 colores de pieza (I/O/T/S/Z/J/L), texto "SIGUIENTE" del sidebar.
- Skins propuestas:
  - Clásico: fondo `#000000`, grilla `#22222e`, I `#4dd0e1`, O `#ffd54f`, T `#ba68c8`, S `#81c784`, Z `#e57373`, J `#7986cb`, L `#ffb74d`, sidebar `#888888`. Accent: `yellow`. Justificación: paleta pastel actual del juego, coherente con `color: #f5ff00` / `accent: yellow` de `games.ts`.
  - Neon: fondo `#0a0014`, grilla `rgba(0,245,255,0.15)` sobre `#1a0033`, I `#00f5ff`, O `#f5ff00`, T `#ff2bd6`, S `#39ff14`, Z `#ff1744`, J `#7c4dff`, L `#ff8c1a`, sidebar `#00f5ff`. Accent: `cyan`. Justificación: mismas 7 piezas llevadas a saturación/contraste máximos con fondo casi negro y grilla con glow cian, estilo CRT arcade.
  - Retro: fondo `#0f380f`, grilla `#306230`, I `#9bbc0f`, O `#8bac0f`, T `#306230`, S `#9bbc0f`, Z `#8bac0f`, J `#306230`, L `#0f380f`, sidebar `#8bac0f`. Accent: `green`. Justificación: 4 tonos de verde fósforo de Game Boy (DMG), alternados entre piezas para mantener diferenciación sin saturación de color, evocando el hardware portátil de los 80s.
- Estado: propuesto

## Breakout — confirmación (2026-08-15)

- Nota: re-auditoría solicitada para verificar que `app/games/BreakoutGame.tsx` no cambió desde la revisión detallada del 2026-08-14 y que las paletas fijadas en `specs/08-breakout-tetris-skins.md` (tipo `BreakoutSkin`, `BREAKOUT_SKINS`, aún Draft/no implementado) siguen siendo válidas.
- Verificado contra código vigente: `ROW_COLORS = ["#ff2bd6","#00f5ff","#39ff14","#f5ff00","#ff8c1a"]`, `INDESTRUCTIBLE_COLOR = "#666"`, fondo `"#000"`, borde de bloque `rgba(0,0,0,0.4)`, paddle `"#fff"`, pelota `"#00f5ff"` — sin cambios respecto a la auditoría anterior. Sin otros elementos de color en canvas (no hay HUD dibujado en el componente).
- Resultado: las 3 paletas de la entrada "Breakout — revisión detallada (2026-08-14)" siguen vigentes sin ajustes (Clásico/Neon/Retro con los mismos valores hex ya documentados y ya trasladados al spec 08).
- Estado: propuesto (sin implementar; spec 08 en Draft)

## Tetris — confirmación (2026-08-15)

- Nota: releída la entrada "Tetris — revisión detallada (2026-08-14)" y `specs/08-breakout-tetris-skins.md` (tipo `TetrisSkin`, `TETRIS_SKINS`). Recotejado contra `app/games/TetrisGame.tsx` vigente: sin cambios de código desde la última auditoría. `COLORS` (I `#4dd0e1`/O `#ffd54f`/T `#ba68c8`/S `#81c784`/Z `#e57373`/J `#7986cb`/L `#ffb74d`), fondo `#000`, grilla `#22222e`, sidebar `#888` — todos idénticos. Las 3 paletas quedan confirmadas sin ajustes.
- Sobre el punto de la paleta Retro (4 tonos de verde Game Boy repetidos entre las 7 piezas): se revisó y se mantiene sin cambios. El spec 08 ya documenta esta decisión como explícita y aceptada por el usuario; las piezas siguen siendo distinguibles por forma/silueta (no hay ocultamiento parcial en Tetris), por lo que no se propone alternativa.
- Estado: propuesto (fijado en `specs/08-breakout-tetris-skins.md`, aún no implementado en código)

## Pac-Maze (2026-08-12)

- Elementos visuales identificados: ninguno — juego `COMING_SOON_GAMES`, sin componente. Paleta provisional basada solo en `color: #f5ff00` / `accent: yellow` de `games.ts`.
- Skins propuestas (provisionales):
  - Clásico: fondo `#000`, muros `#2121ff`, protagonista `#f5ff00`, fantasmas rojo/rosa/cian/naranja clásicos, puntos blancos.
  - Neon: fondo `#0a0014`, muros cian `#00f5ff`, protagonista amarillo con glow, fantasmas en tonos CRT saturados.
  - Retro: monocromo ámbar `#ffb000` para muros/protagonista, fantasmas en grises/ámbar apagado.
- Estado: propuesto (no accionable hasta tener componente)

## Frogger — revisión detallada (2026-08-15)

- Nota: expande/corrige la entrada breve de Frogger ya existente arriba (2026-08-12, provisional/sin componente todavía). Ahora `app/games/FroggerGame.tsx` existe y está registrado — auditado contra el código real (`drawScene`, `LaneType`, `LaneEntity`, `Frog`). La paleta "Clásico" provisional resultó exacta al código real; se agrega el detalle elemento-por-elemento que faltaba (casas meta activa/inactiva por separado, camión vs auto diferenciados, cocodrilo + boca, tronco, rana + ojos), `accent` sugerido y justificación, siguiendo la forma de objeto de `app/games/asteroidsSkins.ts` (objeto plano `id/label/<elemento>` en hex, sin implementarlo aquí).
- Elementos visuales identificados: fondo de carril por `LaneType` (`goal`/`safe`/`road`/`river`), casa meta activa, casa meta inactiva + borde, auto (`car`), camión (`truck`), tronco (`log`), cocodrilo (`crocodile` cuerpo), boca del cocodrilo (`mouth`, zona letal separada del cuerpo), rana (cuerpo), ojos de la rana. Sin HUD en canvas.
- Skins propuestas:
  - Clásico: carril meta `#0d2b1f`, seguro `#123a24`, carretera `#1c1c22`, río `#0a2a4a`; casa meta activa `#39ff14`, inactiva `#0a1a12` con borde `#39ff14`; auto `#ff3860`, camión `#ff8c00`; tronco `#8a5a2b`; cocodrilo `#2f6b2f`, boca `#ff003c`; rana `#39ff14`, ojos `#0a1a12`. Accent: `green`. Justificación: es la paleta actual del juego tal como está hoy en el código, ya coherente con `color: #00ff41` / `accent: green` de `games.ts`.
  - Neon: carril meta `#0a0018`, seguro `#05020a`, carretera `#0d0014`, río `#030014` (negros con tinte violeta); casa meta activa `#00f5ff` con glow, inactiva `#150a2a` con borde `#00f5ff`; auto `#ff2bd6` (magenta), camión `#ff8c1a` (naranja eléctrico); tronco `#f5ff00` (amarillo ácido); cocodrilo `#39ff14` (verde ácido), boca `#ff003c`; rana `#00f5ff`, ojos `#0a0018`. Accent: `cyan`. Justificación: fondos casi negros con tinte violeta y un acento neón saturado distinto por tipo de peligro (auto/camión/cocodrilo), coherente con el lenguaje CRT/glow ya usado en la plataforma.
  - Retro: carril meta `#f8d800`, seguro `#00a800`, carretera `#545454`, río `#0058f8` (paleta plana estilo NES); casa meta activa `#f8f8f8`, inactiva `#7c7c7c` con borde `#000000`; auto `#f83800`, camión `#a44200`; tronco `#a44200`; cocodrilo `#005800`, boca `#f83800`; rana `#b8f818`, ojos `#000000`. Accent: `yellow`. Justificación: colores planos de 4 bits sin gradientes ni glow, homenaje a la paleta limitada de cartuchos NES/8-bit de los 80s, con saturación y temperatura claramente distintas de la skin Neon.
- Estado: propuesto
