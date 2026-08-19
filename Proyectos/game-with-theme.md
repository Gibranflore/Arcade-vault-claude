# Arcade Vault — Auditoría de Skins por Juego

Documento generado por el agente `skin-designer`. Propuestas de paleta de color por juego (Clásico / Neon / Retro como mínimo). **No es un cambio de código**: no existe hoy ningún sistema de skins implementado en la plataforma (no hay prop `skin` en `GameProps`, ni selector en `GamePlayer.tsx`, ni registro de skins en `app/lib/`). Este documento es solo la propuesta de diseño visual.

Fuente: `app/lib/games.ts` (catálogo `GAMES` y `COMING_SOON_GAMES`) + componentes reales bajo `app/games/` para los juegos jugables.

---

## Resumen de cobertura

| Juego          | Catálogo                                             | Componente jugable  | Skins hoy | Estado                                                      |
| -------------- | ---------------------------------------------------- | ------------------- | --------- | ----------------------------------------------------------- |
| Breakout       | `GAMES`                                              | `BreakoutGame.tsx`  | 0         | Falta el mínimo de 3                                        |
| Tetris         | `GAMES`                                              | `TetrisGame.tsx`    | 0         | Falta el mínimo de 3                                        |
| Asteroids      | `GAMES`                                              | `AsteroidsGame.tsx` | 0         | Falta el mínimo de 3                                        |
| Frogger        | `GAMES`                                              | `FroggerGame.tsx`   | 0         | Falta el mínimo de 3                                        |
| Snake          | `GAMES` (sin componente, placeholder "PRÓXIMAMENTE") | —                   | 0         | Falta el mínimo de 3 (no accionable hasta tener componente) |
| Space Invaders | `COMING_SOON_GAMES`                                  | —                   | 0         | Falta el mínimo de 3 (no accionable hasta tener componente) |
| Pac-Maze       | `COMING_SOON_GAMES`                                  | —                   | 0         | Falta el mínimo de 3 (no accionable hasta tener componente) |

Prioridad sugerida: **Breakout, Tetris, Asteroids, Frogger** (jugables, con componente real que consumiría las skins). Snake, Space Invaders y Pac-Maze solo tienen metadata de catálogo — sus paletas abajo son provisionales, basadas únicamente en `color`/`accent` de `games.ts`, hasta que exista un componente real que defina sus elementos visuales concretos.

---

## Breakout

**Elementos visuales identificados** (`app/games/BreakoutGame.tsx`):

- Fondo del canvas (`fillRect` negro)
- Bloques por fila, coloreados individualmente (`ROW_COLORS`: `#ff2bd6`, `#00f5ff`, `#39ff14`, `#f5ff00`, `#ff8c1a`)
- Bloques indestructibles (`#666`)
- Borde de bloque (`rgba(0,0,0,0.4)`)
- Paleta del jugador (blanca, `#fff`)
- Pelota (`#00f5ff`)

### Clásico (default)

- Fondo: `#000000`
- Bloques (filas 1-5): `#ff2bd6` (magenta), `#00f5ff` (cian), `#39ff14` (verde), `#f5ff00` (amarillo), `#ff8c1a` (naranja)
- Bloque indestructible: `#666666`
- Paleta: `#ffffff`
- Pelota: `#00f5ff`
- `accent` sugerido: `cyan` (coincide con `games.ts`)
- Justificación: es la paleta arcoíris neón que el juego ya usa hoy — punto de partida sin cambios.

### Neon

- Fondo: `#05010a` (negro casi púrpura, CRT profundo)
- Bloques (filas 1-5): `#ff2bd6` → `#00f5ff` → `#ff2bd6` → `#00f5ff` → `#f5ff00` (duotono cian/magenta con acentos amarillos, en vez de arcoíris completo)
- Bloque indestructible: `#1a1a1a` con borde `#00f5ff` tenue
- Paleta: `#00f5ff` con glow (`shadowColor` sugerido `#00f5ff`)
- Pelota: `#ff2bd6` con glow magenta
- `accent` sugerido: `magenta`
- Justificación: reduce la paleta a un duotono cian/magenta muy saturado sobre negro profundo, con glow en paleta y pelota — el lenguaje CRT/synthwave que ya usa la plataforma (scanlines + glow), en vez de la mezcla arcoíris del clásico.

### Retro

- Fondo: `#000000`
- Bloques por fila (homenaje al Breakout/Atari original de 1976, 4 bandas monocromas): `#ffb000` (ámbar) / `#ffb000` / `#e0d000` (amarillo apagado) / `#4caf50` (verde apagado) — filas agrupadas de 2 en 2 en vez de 5 colores saturados distintos
- Bloque indestructible: `#555555`
- Paleta: `#ffffff`
- Pelota: `#ffffff`
- `accent` sugerido: `green`
- Justificación: recupera las bandas de color planas y de baja saturación del Breakout/Atari original de 1976 (referencia directa del propio `longDescription` del juego), con paleta y pelota blancas como en el hardware de la época.

---

## Tetris

**Elementos visuales identificados** (`app/games/TetrisGame.tsx`):

- Fondo del tablero (negro)
- Líneas de grilla (`#22222e`)
- Colores de las 7 piezas (`COLORS`): I `#4dd0e1`, O `#ffd54f`, T `#ba68c8`, S `#81c784`, Z `#e57373`, J `#7986cb`, L `#ffb74d`
- Overlay de pieza fija/ghost (`rgba(255,255,255,0.12)`)
- Texto de sidebar (`#888`)

### Clásico (default)

- Fondo: `#000000`
- Grilla: `#22222e`
- Piezas: I `#4dd0e1`, O `#ffd54f`, T `#ba68c8`, S `#81c784`, Z `#e57373`, J `#7986cb`, L `#ffb74d`
- Sidebar: `#888888`
- `accent` sugerido: `yellow` (coincide con `games.ts`)
- Justificación: paleta pastel actual del juego, legible y con buen contraste entre piezas.

### Neon

- Fondo: `#000000`
- Grilla: `#0a2a2a` con línea `#00f5ff` muy tenue (glow sutil)
- Piezas saturadas: I `#00f5ff`, O `#f5ff00`, T `#ff2bd6`, S `#39ff14`, Z `#ff1744`, J `#7c4dff`, L `#ff8c1a`
- Sidebar: `#00f5ff`
- `accent` sugerido: `cyan`
- Justificación: mismas 7 identidades de pieza que el clásico pero llevadas a saturación máxima estilo arcade CRT, con grilla que insinúa scanlines cian.

### Retro

- Fondo: `#0f380f` (verde oscuro Game Boy)
- Grilla: `#306230`
- Piezas (4 tonos monocromos de fósforo verde, agrupadas por forma en vez de 7 colores distintos): I/O `#9bbc0f`, T/S `#8bac0f`, Z/J `#306230`, L `#0f380f` con borde `#9bbc0f`
- Sidebar: `#9bbc0f`
- `accent` sugerido: `green`
- Justificación: Tetris es icónico en pantallas monocromas portátiles (Game Boy); esta paleta de 4 tonos de verde fósforo es de baja saturación y distinta temperatura del Neon (que es multicolor saturado), coherente con hardware retro real.

---

## Asteroids

**Elementos visuales identificados** (`app/games/AsteroidsGame.tsx`):

- Fondo del canvas (negro)
- Nave (contorno blanco, `strokeStyle #fff`)
- Llama del propulsor (`rgba(255, 130, 0, 0.85)`)
- Balas (blancas)
- Asteroides (contorno blanco)
- Partículas de explosión (blanco con alpha decreciente)
- Power-up "triple disparo" (contorno blanco, rombo)
- Power-up "bomba" (contorno rojo `#f66`, círculo con cruz)

### Clásico (default)

- Fondo: `#000000`
- Nave / asteroides / balas / partículas: `#ffffff`
- Llama del propulsor: `rgba(255, 130, 0, 0.85)`
- Power-up triple: `#ffffff`
- Power-up bomba: `#ff6666`
- `accent` sugerido: `green` (coincide con `games.ts`, aunque el render actual es monocromo blanco)
- Justificación: es el wireframe blanco-sobre-negro que el juego dibuja hoy — vector arcade simple sin color adicional.

### Neon

- Fondo: `#0a0014` (negro violáceo)
- Nave: `#00f5ff` con glow cian
- Asteroides: `#ff2bd6` (contorno magenta)
- Balas: `#39ff14` (verde ácido)
- Llama del propulsor: `#ff2bd6`
- Partículas: `#00f5ff` con alpha decreciente
- Power-up triple: `#f5ff00`
- Power-up bomba: `#ff003c`
- `accent` sugerido: `cyan`
- Justificación: sustituye el monocromo por un trío saturado cian/magenta/verde ácido sobre negro violáceo profundo, con glow — estética synthwave de alto contraste, claramente distinta del wireframe blanco del clásico.

### Retro

- Fondo: `#000000`
- Nave / asteroides / balas / partículas / power-ups: un único tono fósforo `#33ff33` (verde) — monitor vectorial monocromo
- Llama del propulsor: `#33ff33` (mismo tono, sin color de acento adicional)
- `accent` sugerido: `green`
- Justificación: los arcades vectoriales originales de Asteroids (1979) usaban monitores de fósforo monocromo (verde o ámbar); esta paleta de un solo color, sin acentos naranja/rojo, es de baja saturación y evoca directamente ese hardware — distinta en concepto (mono vs. tricolor) del Neon.

---

## Frogger

**Elementos visuales identificados** (`app/games/FroggerGame.tsx`):

- Fondo por tipo de carril: meta `#0d2b1f`, zona segura `#123a24`, carretera `#1c1c22`, río `#0a2a4a`
- Casillas de meta: ocupada `#39ff14` / vacía `#0a1a12`, borde `#39ff14`
- Vehículos en carretera: camión `#ff8c00`, auto `#ff3860`
- Entidades del río: cocodrilo `#2f6b2f`, tronco `#8a5a2b`, boca del cocodrilo `#ff003c`
- Rana: cuerpo `#39ff14`, ojos `#0a1a12`

### Clásico (default)

- Fondos: meta `#0d2b1f`, segura `#123a24`, carretera `#1c1c22`, río `#0a2a4a`
- Meta ocupada/vacía: `#39ff14` / `#0a1a12`
- Camión: `#ff8c00`, auto: `#ff3860`
- Cocodrilo: `#2f6b2f`, tronco: `#8a5a2b`, boca: `#ff003c`
- Rana: `#39ff14` / ojos `#0a1a12`
- `accent` sugerido: `green` (coincide con `games.ts`)
- Justificación: paleta actual del juego, ya con buen contraste entre carriles y buena legibilidad de peligro (boca roja del cocodrilo).

### Neon

- Fondos: meta `#150a2a`, segura `#0a0a12`, carretera `#050505`, río `#05122a`
- Meta ocupada/vacía: `#00f5ff` / `#0a0a12`, borde `#00f5ff`
- Camión: `#ff8c1a`, auto: `#ff2bd6`
- Cocodrilo: `#39ff14`, tronco: `#8a5a2b` (se mantiene neutro para diferenciarlo del cocodrilo), boca: `#ff003c`
- Rana: `#00f5ff` / ojos `#050505`
- `accent` sugerido: `magenta`
- Justificación: cambia los fondos verdosos/tierra por negros con matices fríos (violeta/azul) y sube saturación en meta/rana/vehículos, reforzando el peligro (boca del cocodrilo se mantiene roja como señal universal) con estética CRT arcade.

### Retro

- Fondos (paleta limitada estilo NES/8-bit): meta `#000000`, segura `#00a800` (verde césped plano), carretera `#545454` (gris asfalto), río `#0058f8` (azul plano)
- Meta ocupada/vacía: `#f8d800` (amarillo NES) / `#141414`
- Camión: `#f8b800`, auto: `#d82800`
- Cocodrilo: `#00a800`, tronco: `#a44200`, boca: `#d82800`
- Rana: `#00b800` / ojos `#141414`
- `accent` sugerido: `yellow`
- Justificación: usa la paleta plana de 8-bit de consolas de los 80 (colores puros sin degradado, tonos tierra/césped/asfalto reales en vez de los tonos oscuros-desaturados del clásico), con menor saturación y temperatura más cálida que el Neon.

---

## Snake

**Elementos visuales identificados**: ninguno — `snake` está registrado en `GAMES` pero no tiene componente en `GAME_COMPONENTS` (`app/components/GamePlayer.tsx`), así que hoy renderiza el placeholder "PRÓXIMAMENTE". Sin componente real, no hay `fillStyle`/`strokeStyle` que auditar; la paleta abajo es provisional, basada solo en `color`/`accent` de `games.ts` y en el lenguaje visual genérico del género. **No accionable hasta que exista un `SnakeGame.tsx` real** (usar `/add-game`).

### Clásico (default, provisional)

- Fondo: `#000000`
- Cuerpo de la serpiente: `#39ff14` (coincide con `color` de `games.ts`)
- Comida/punto: por definir en implementación (sugerido `#f5ff00` de contraste)
- `accent` sugerido: `green` (coincide con `games.ts`)

### Neon (provisional)

- Fondo: `#0a0014`
- Cabeza/cuerpo: cabeza `#ff2bd6`, cuerpo `#00f5ff` (gradiente cian→magenta)
- Comida: `#f5ff00` con glow
- `accent` sugerido: `magenta`
- Justificación: contraste cian/magenta de alta saturación, coherente con el resto del catálogo Neon.

### Retro (provisional)

- Fondo: `#0f380f` (Game Boy)
- Serpiente: `#9bbc0f`
- Comida: `#306230`
- `accent` sugerido: `green`
- Justificación: Snake es sinónimo de las pantallas monocromas de teléfonos/handhelds de los 90 — fósforo verde de 2 tonos evoca directamente ese hardware.

---

## Space Invaders

**Elementos visuales identificados**: ninguno — está en `COMING_SOON_GAMES`, sin componente. Paleta provisional basada solo en `color: #ff006e` / `accent: magenta` de `games.ts`.

### Clásico (default, provisional)

- Fondo: `#000000`
- Nave/cañón del jugador: `#ffffff`
- Alienígenas: `#ff006e` (coincide con `color` de `games.ts`)
- Disparos/láser: `#f5ff00`
- `accent` sugerido: `magenta`

### Neon (provisional)

- Fondo: `#0a0014`
- Cañón: `#00f5ff`
- Alienígenas: `#ff006e` con glow magenta
- Disparos: `#39ff14`
- `accent` sugerido: `magenta`
- Justificación: mantiene el magenta ya asignado en el catálogo como acento principal, subiendo saturación y glow.

### Retro (provisional)

- Fondo: `#000000`
- Cañón: `#33ff33` (fósforo verde)
- Alienígenas: `#33ff33` (mismo tono, monocromo)
- Disparos: `#33ff33`
- `accent` sugerido: `green`
- Justificación: el Space Invaders original (1978) corría en monitores monocromos con overlays de celofán de color; el monocromo verde de un solo tono es la referencia retro directa, opuesta al magenta/cian saturado del Neon.

---

## Pac-Maze

**Elementos visuales identificados**: ninguno — está en `COMING_SOON_GAMES`, sin componente. Paleta provisional basada solo en `color: #f5ff00` / `accent: yellow` de `games.ts`.

### Clásico (default, provisional)

- Fondo (laberinto): `#000000`
- Muros del laberinto: `#2121ff` (azul clásico de Pac-Man)
- Pac-protagonista: `#f5ff00` (coincide con `color` de `games.ts`)
- Fantasmas: rojo `#ff0000`, rosa `#ffb8ff`, cian `#00ffff`, naranja `#ffb852`
- Puntos/monedas: `#ffffff`
- `accent` sugerido: `yellow` (coincide con `games.ts`)

### Neon (provisional)

- Fondo: `#0a0014`
- Muros: `#00f5ff` con glow
- Protagonista: `#f5ff00` con glow
- Fantasmas: `#ff2bd6`, `#ff003c`, `#39ff14`, `#ff8c1a` (paleta saturada uniforme)
- Puntos: `#00f5ff`
- `accent` sugerido: `yellow`
- Justificación: reemplaza el azul clásico de los muros por cian neón con glow y unifica fantasmas en tonos CRT saturados, manteniendo al protagonista amarillo como ancla de identidad de marca del juego.

### Retro (provisional)

- Fondo: `#000000`
- Muros: `#ffb000` (ámbar, homenaje a monitores CRT ámbar)
- Protagonista: `#ffb000`
- Fantasmas: 4 tonos de gris/ámbar apagado (`#888888`, `#aaaaaa`, `#666666`, `#cccccc`) para simular limitación de paleta monocroma
- Puntos: `#ffb000`
- `accent` sugerido: `yellow`
- Justificación: paleta monocroma ámbar de baja saturación, evocando monitores CRT ámbar de oficina de los 80, contrastando con el Neon multicolor saturado.

---

## Notas finales

- Ningún juego del catálogo tiene hoy 3 o más skins diseñadas; los 4 juegos jugables (Breakout, Tetris, Asteroids, Frogger) son la prioridad porque tienen componente real que consumiría estas paletas.
- Snake, Space Invaders y Pac-Maze no tienen componente todavía — sus paletas son provisionales y deberán revisarse contra los elementos reales una vez existan (`/add-game`).
- Este documento es una propuesta de diseño, no una implementación. Para construir el mecanismo técnico de selección de skin (prop `skin` en `GameProps`, selector en `GamePlayer.tsx`, registro de paletas) se debe usar `/spec` primero, ya que afecta el contrato compartido por todos los juegos.
