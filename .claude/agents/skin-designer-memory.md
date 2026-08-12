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

## Snake (2026-08-12)

- Elementos visuales identificados: ninguno — sin componente implementado (`GAMES` lo referencia pero no está en `GAME_COMPONENTS`; renderiza placeholder). Paleta provisional basada solo en `color`/`accent` de `games.ts`.
- Skins propuestas (provisionales, pendientes de componente real):
  - Clásico: fondo `#000`, cuerpo `#39ff14` (de `games.ts`), comida sugerida `#f5ff00`.
  - Neon: fondo `#0a0014`, cabeza `#ff2bd6`, cuerpo `#00f5ff`, comida `#f5ff00`.
  - Retro: paleta Game Boy (`#0f380f`/`#9bbc0f`/`#306230`).
- Estado: propuesto (no accionable hasta implementar `SnakeGame.tsx`)

## Space Invaders (2026-08-12)

- Elementos visuales identificados: ninguno — juego `COMING_SOON_GAMES`, sin componente. Paleta provisional basada solo en `color: #ff006e` / `accent: magenta` de `games.ts`.
- Skins propuestas (provisionales):
  - Clásico: fondo `#000`, nave blanca, alienígenas `#ff006e`, disparos `#f5ff00`.
  - Neon: fondo `#0a0014`, nave cian `#00f5ff`, alienígenas magenta con glow, disparos verde ácido `#39ff14`.
  - Retro: monocromo fósforo verde `#33ff33` (homenaje a monitores con overlay de celofán de 1978).
- Estado: propuesto (no accionable hasta tener componente)

## Pac-Maze (2026-08-12)

- Elementos visuales identificados: ninguno — juego `COMING_SOON_GAMES`, sin componente. Paleta provisional basada solo en `color: #f5ff00` / `accent: yellow` de `games.ts`.
- Skins propuestas (provisionales):
  - Clásico: fondo `#000`, muros `#2121ff`, protagonista `#f5ff00`, fantasmas rojo/rosa/cian/naranja clásicos, puntos blancos.
  - Neon: fondo `#0a0014`, muros cian `#00f5ff`, protagonista amarillo con glow, fantasmas en tonos CRT saturados.
  - Retro: monocromo ámbar `#ffb000` para muros/protagonista, fantasmas en grises/ámbar apagado.
- Estado: propuesto (no accionable hasta tener componente)
