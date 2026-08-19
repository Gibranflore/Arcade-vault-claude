# Spec 08 — Sistema de skins visuales (Breakout y Tetris)

- **Estado:** Implementado
- **Dependencias:** Spec 05 (Asteroids jugable), Spec 07 (Sistema de skins visuales — Asteroids)
- **Fecha:** 2026-08-14

**Objetivo:** Extender el sistema de skins visuales (Spec 07) a Breakout y Tetris, agregando sus paletas Clásico/Neon/Retro y generalizando el selector del HUD y la persistencia en `localStorage` para que sea reutilizable entre los tres juegos en lugar de estar acoplada solo a Asteroids.

## Scope

**Dentro del alcance:**

- Nuevo tipo `BreakoutSkin` y archivo `app/games/breakoutSkins.ts` con 3 paletas (Clásico/Neon/Retro), valores hex ya propuestos por `skin-designer`: fondo, 5 `rowColors`, `indestructible`, `blockBorder`, `paddle`, `ball`.
- Nuevo tipo `TetrisSkin` y archivo `app/games/tetrisSkins.ts` con 3 paletas (Clásico/Neon/Retro): fondo, `gridLine`, 7 colores de pieza (I/O/T/S/Z/J/L), `sidebarText`.
- `BreakoutGame` y `TetrisGame` aceptan cada uno una prop nueva y opcional `skin?: BreakoutSkin` / `skin?: TetrisSkin` (default = paleta Clásico si no se pasa), siguiendo el mismo patrón que `AsteroidsGame` (ref actualizado por render, leído dentro del loop `draw()`). Todo color literal usado en el `draw()` de cada juego pasa a leerse del objeto `skin`. **Ningún cambio de física, colisiones, spawns, puntuación, timing ni piezas/niveles.**
- **Generalización del selector de skin en `GamePlayer.tsx`:** se reemplaza la lógica actual acoplada a `game.id === "asteroids"` por un registro genérico `GAME_SKINS: Record<string, { options: { id: string; label: string }[]; defaultId: string }>` que cubre `"asteroids" | "breakout" | "tetris"`. El HUD renderiza los botones de skin (Clásico/Neon/Retro) para cualquier juego presente en ese registro, y la lectura/escritura de `localStorage` (`skin:<gameId>`) usa la misma función compartida (`readSkinId` / `writeSkinId`) para los tres juegos.
- El paso de la prop `skin` al `GameComponent` concreto sigue siendo por-juego (spread condicional según `game.id`, ya que cada componente tipa su propia prop `skin` con su propio tipo — `AsteroidsSkin`/`BreakoutSkin`/`TetrisSkin` no se unifican en un tipo común), pero ahora los tres casos comparten el mismo bloque de HUD/estado/persistencia en vez de tener uno propio como hoy Asteroids.
- Verificación funcional con Playwright: en Breakout y en Tetris, cambiar entre las 3 skins con partida en curso y confirmar visualmente el cambio de colores sin romper el juego; confirmar persistencia tras reload; confirmar que Asteroids sigue funcionando igual tras el refactor del selector.

**Fuera de alcance (explícitamente NO se hace):**

- Skins para Frogger o Snake — no tienen componente Canvas implementado todavía (ver `app/lib/games.ts`), quedan para cuando exista el juego jugable.
- Cualquier persistencia en Supabase — sigue siendo solo `localStorage`, igual que Spec 07.
- Cambiar `GameProps`/`GameHandle` (contrato compartido) — `skin` sigue siendo una prop propia de cada componente, no del contrato genérico.
- Editor de skins custom (colores libres) — solo las paletas predefinidas ya propuestas.
- Unificar `AsteroidsSkin`/`BreakoutSkin`/`TetrisSkin` en un tipo compartido — cada uno mantiene su propia forma porque cada juego tiene elementos de render distintos; solo se generaliza el HUD/selector/persistencia, no el modelo de color.

## Modelo de datos

No se introduce ninguna tabla ni cambio en Supabase. Se agregan tipos y constantes junto a cada componente (mismo patrón que `app/games/asteroidsSkins.ts`):

```ts
// app/games/breakoutSkins.ts
export type BreakoutSkin = {
  id: "classic" | "neon" | "retro";
  label: string;
  bg: string;
  rowColors: [string, string, string, string, string]; // una por fila de bloques
  indestructible: string;
  blockBorder: string; // admite rgba(...)
  paddle: string;
  ball: string;
};

export const BREAKOUT_SKINS: Record<BreakoutSkin["id"], BreakoutSkin> = {
  classic: {
    id: "classic",
    label: "Clásico",
    bg: "#000000",
    rowColors: ["#ff2bd6", "#00f5ff", "#39ff14", "#f5ff00", "#ff8c1a"],
    indestructible: "#666666",
    blockBorder: "rgba(0,0,0,0.4)",
    paddle: "#ffffff",
    ball: "#00f5ff",
  },
  neon: {
    id: "neon",
    label: "Neon",
    bg: "#05010a",
    rowColors: ["#ff003c", "#00f5ff", "#39ff14", "#f5ff00", "#ff2bd6"],
    indestructible: "#3a2a4a",
    blockBorder: "rgba(0,245,255,0.35)",
    paddle: "#f5ff00",
    ball: "#ff2bd6",
  },
  retro: {
    id: "retro",
    label: "Retro",
    bg: "#000000",
    rowColors: ["#ffb000", "#e0d000", "#4caf50", "#2e7d32", "#8d6e00"],
    indestructible: "#4a4a4a",
    blockBorder: "rgba(0,0,0,0.6)",
    paddle: "#cfd8c0",
    ball: "#ffb000",
  },
};

export const DEFAULT_BREAKOUT_SKIN = BREAKOUT_SKINS.classic;
```

```ts
// app/games/tetrisSkins.ts
export type TetrisSkin = {
  id: "classic" | "neon" | "retro";
  label: string;
  bg: string;
  gridLine: string; // admite rgba(...)
  pieceColors: [string, string, string, string, string, string, string]; // I,O,T,S,Z,J,L (índice 0 = pieza tipo 1)
  sidebarText: string;
};

export const TETRIS_SKINS: Record<TetrisSkin["id"], TetrisSkin> = {
  classic: {
    id: "classic",
    label: "Clásico",
    bg: "#000000",
    gridLine: "#22222e",
    pieceColors: [
      "#4dd0e1",
      "#ffd54f",
      "#ba68c8",
      "#81c784",
      "#e57373",
      "#7986cb",
      "#ffb74d",
    ],
    sidebarText: "#888888",
  },
  neon: {
    id: "neon",
    label: "Neon",
    bg: "#0a0014",
    gridLine: "rgba(0,245,255,0.15)",
    pieceColors: [
      "#00f5ff",
      "#f5ff00",
      "#ff2bd6",
      "#39ff14",
      "#ff1744",
      "#7c4dff",
      "#ff8c1a",
    ],
    sidebarText: "#00f5ff",
  },
  retro: {
    id: "retro",
    label: "Retro",
    bg: "#0f380f",
    gridLine: "#306230",
    pieceColors: [
      "#9bbc0f",
      "#8bac0f",
      "#306230",
      "#9bbc0f",
      "#8bac0f",
      "#306230",
      "#0f380f",
    ],
    sidebarText: "#8bac0f",
  },
};

export const DEFAULT_TETRIS_SKIN = TETRIS_SKINS.classic;
```

`GameProps` (`app/games/types.ts`) **no cambia** — cada componente tipa su propia prop adicional (`BreakoutGame(props: GameProps & { skin?: BreakoutSkin })`, `TetrisGame(props: GameProps & { skin?: TetrisSkin })`), igual que Asteroids.

Generalización del selector en `GamePlayer.tsx` (reemplaza el bloque hoy acoplado a `game.id === "asteroids"`):

```ts
// dentro de GamePlayer.tsx
const GAME_SKINS: Record<
  string,
  { options: { id: string; label: string }[]; defaultId: string }
> = {
  asteroids: {
    options: [
      { id: "classic", label: "Clásico" },
      { id: "neon", label: "Neon" },
      { id: "retro", label: "Retro" },
    ],
    defaultId: "classic",
  },
  breakout: { options: [/* mismos 3 ids/labels */], defaultId: "classic" },
  tetris: { options: [/* mismos 3 ids/labels */], defaultId: "classic" },
};
// localStorage key: `skin:${game.id}`, leída/escrita por una única función
// compartida (readSkinId(gameId) / writeSkinId(gameId, id)) reutilizada
// para los 3 juegos. El objeto de paleta concreto a pasar como prop sigue
// resolviéndose por-juego (ASTEROIDS_SKINS[skinId] / BREAKOUT_SKINS[skinId] /
// TETRIS_SKINS[skinId]) en el spread condicional al renderizar <GameComponent>.
```

## Plan de implementación

1. **Definir `BREAKOUT_SKINS` y `TETRIS_SKINS`.** Crear `app/games/breakoutSkins.ts` y `app/games/tetrisSkins.ts` con los tipos, las 3 paletas y los `DEFAULT_*_SKIN`, tal como en el modelo de datos. El sistema sigue funcional: archivos nuevos, aún no importados en ningún lado.

2. **Propagar `skin` al `draw()` de `BreakoutGame.tsx`.** Reemplazar los literales (`"#000"` fondo, `block.color` ya viene de `ROW_COLORS`/`INDESTRUCTIBLE_COLOR`, `"rgba(0,0,0,0.4)"` borde, `"#fff"` paddle, `"#00f5ff"` pelota) por los campos de `skin`. `buildBlocks()` deja de fijar `color` desde constantes globales y en su lugar el `draw()` resuelve el color de cada bloque a partir de `skin.rowColors[row]` / `skin.indestructible` (se guarda `row`/`type` en el `Block`, no el color final, para poder recolorear sin reconstruir el tablero). El sistema sigue funcional: sin la prop nueva todavía, usa `DEFAULT_BREAKOUT_SKIN` fijo — visualmente idéntico a hoy.

3. **Propagar `skin` al `draw()` de `TetrisGame.tsx`.** `drawBlock()` y el resto de `draw()` dejan de usar la constante `COLORS` y `"#22222e"`/`"#888"`/`"#000"` literales, y reciben `skin` como parámetro para resolver `skin.pieceColors[colorIndex - 1]`, `skin.gridLine`, `skin.sidebarText`, `skin.bg`. El sistema sigue funcional: usa `DEFAULT_TETRIS_SKIN` fijo internamente, sin cambios visibles.

4. **Exponer la prop `skin` en ambos componentes.** Agregar el parámetro opcional `skin = DEFAULT_BREAKOUT_SKIN` / `skin = DEFAULT_TETRIS_SKIN`, guardado en un `ref` actualizado por render (mismo patrón que `AsteroidsGame`), leído dentro de `draw()` en cada frame. El sistema sigue funcional: prop opcional, sin pasarla el comportamiento no cambia.

5. **Generalizar el selector de skin en `GamePlayer.tsx`.** Introducir el registro `GAME_SKINS` (asteroids/breakout/tetris) y las funciones compartidas `readSkinId(gameId)` / `writeSkinId(gameId, id)` sobre `localStorage`, reemplazando la lógica actual acoplada solo a Asteroids. El HUD renderiza los 3 botones para cualquier `game.id` presente en `GAME_SKINS`. Verificar que Asteroids no cambia de comportamiento tras el refactor (mismo resultado visual y de persistencia que hoy). El sistema sigue funcional en cada punto intermedio: primero se generaliza el HUD/persistencia sin agregar Breakout/Tetris al paso de prop, luego se agrega el spread condicional para `game.id === "breakout"` y `"tetris"` pasando `BREAKOUT_SKINS[skinId]` / `TETRIS_SKINS[skinId]` al `GameComponent`.

6. **Verificación funcional con Playwright.** Levantar `npm run dev`; en `/juegos/breakout/jugar` y `/juegos/tetris/jugar`, iniciar partida, cambiar entre las 3 skins con el juego corriendo y confirmar que los colores cambian sin afectar el gameplay (bloques/piezas siguen colisionando igual). Recargar y confirmar persistencia por juego (`skin:breakout`, `skin:tetris` no se pisan entre sí ni con `skin:asteroids`). Confirmar que Asteroids sigue funcionando igual que antes del refactor del selector. Confirmar que Frogger/Snake (sin componente) no rompen nada al no estar en `GAME_SKINS`.

## Criterios de aceptación

- [x] `npm run dev` levanta la app sin errores.
- [x] `app/games/breakoutSkins.ts` existe con el tipo `BreakoutSkin` y las 3 paletas (`classic`/`neon`/`retro`) con los valores hex definidos en el modelo de datos.
- [x] `app/games/tetrisSkins.ts` existe con el tipo `TetrisSkin` y las 3 paletas (`classic`/`neon`/`retro`) con los valores hex definidos en el modelo de datos.
- [x] En `/juegos/breakout/jugar`, el HUD superior muestra 3 botones de skin (Clásico/Neon/Retro), con "Clásico" activo por defecto la primera vez (sin `localStorage` previo).
- [x] En `/juegos/tetris/jugar`, el HUD superior muestra 3 botones de skin (Clásico/Neon/Retro), con "Clásico" activo por defecto la primera vez.
- [x] Cambiar de skin en Breakout actualiza inmediatamente los colores del canvas (fondo, bloques por fila, indestructibles, borde, paddle, pelota) sin reiniciar la partida en curso.
- [x] Cambiar de skin en Tetris actualiza inmediatamente los colores del canvas (fondo, grilla, las 7 piezas, texto sidebar) sin reiniciar la partida en curso.
- [x] El comportamiento de cada juego (física/colisiones en Breakout; rotación/colisión/líneas en Tetris; puntuación, niveles, game over) es idéntico entre las 3 skins — solo cambian colores.
- [x] La skin elegida persiste en `localStorage` bajo claves independientes (`skin:breakout`, `skin:tetris`) y se recupera correctamente tras recargar la página, sin interferir entre sí ni con `skin:asteroids`.
- [x] El selector de skin de Asteroids (`skin:asteroids`) sigue funcionando exactamente igual que antes de este spec tras el refactor del HUD a `GAME_SKINS`.
- [x] El selector de skin solo aparece cuando el juego activo está en `GAME_SKINS` (Asteroids/Breakout/Tetris); en Frogger/Snake (sin componente jugable) el HUD no lo muestra ni rompe el render.
- [x] Un usuario sin sesión iniciada puede cambiar de skin igual que uno con sesión (persistencia en `localStorage` no depende de `useAuth()`).
- [x] `npm run lint` pasa sin errores nuevos.
- [x] Verificación funcional con Playwright realizada: cambio de skin en vivo durante partida en Breakout y Tetris, persistencia tras reload por juego, y no regresión en Asteroids, antes de cerrar el spec.

## Decisiones tomadas y descartadas

- **Skin solo cambia colores de render, nunca lógica/física del juego** (en ambos juegos). Justificación: continuidad de la decisión ya tomada en Spec 07 — evita que una "skin" afecte balance de dificultad o comportamiento.
- **Persistencia en `localStorage`, no en Supabase**, con claves independientes por juego (`skin:breakout`, `skin:tetris`). Justificación: continuidad de Spec 07; dato cosmético de cliente que no necesita sincronizarse entre dispositivos ni tabla/RLS nueva.
- **Selector de skin y persistencia generalizados en `GamePlayer.tsx` vía registro `GAME_SKINS`, reemplazando el bloque acoplado solo a Asteroids.** Justificación: decisión explícita del usuario (recomendación aceptada) — evita triplicar código casi idéntico al agregar Breakout y Tetris; el patrón ya estaba validado en un solo juego (Spec 07), ahora se generaliza.
- **`AsteroidsSkin`/`BreakoutSkin`/`TetrisSkin` NO se unifican en un tipo de color compartido.** Justificación: cada juego dibuja elementos distintos (nave/asteroides vs. bloques por fila vs. piezas tipo Tetromino); forzar un tipo común introduciría campos irrelevantes por juego. Solo se generaliza el HUD/selector/persistencia (ids, labels, `localStorage`), no el modelo de color.
- **Paso de la prop `skin` al `GameComponent` sigue siendo condicional por `game.id` (spread manual), no parte de `GameProps`.** Justificación: continuidad de la decisión de Spec 07 de no modificar el contrato genérico compartido por todos los juegos.
- **Paletas usadas tal cual las propuso el agente `skin-designer`, sin ajustes** (incluyendo Tetris Retro con 4 tonos de verde repetidos entre 7 piezas). Justificación: decisión explícita del usuario (opción recomendada) — se prioriza fidelidad a la paleta Game Boy DMG sobre maximizar distinción de piezas por color; las piezas siguen siendo distinguibles por forma.
- **Frogger y Snake quedan fuera de este spec.** Justificación: no tienen componente Canvas implementado (`app/lib/games.ts` los registra solo como catálogo) — no hay elementos de render que auditar/skinnable todavía.

## Riesgos identificados

| Riesgo                                                                                                                                                                                                                                                                                         | Mitigación                                                                                                                                                                                                                                 |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| El refactor del selector genérico en `GamePlayer.tsx` podría alterar sin querer el comportamiento actual de Asteroids (regresión sobre una feature ya en producción).                                                                                                                          | Migrar la lógica de Asteroids al registro `GAME_SKINS` como primer paso del plan de implementación (paso 5) y verificar explícitamente con Playwright que Asteroids se comporta igual antes de agregar Breakout/Tetris al registro.        |
| En `BreakoutGame.tsx`, `buildBlocks()` hoy fija `color` directamente en cada `Block` a partir de `ROW_COLORS`/`INDESTRUCTIBLE_COLOR`; si el refactor no cambia esto a guardar `row`/`type` y resolver el color en `draw()`, cambiar de skin en caliente no recoloreará bloques ya construidos. | Guardar `row` (índice de fila) y `type` en el `Block` en vez del color final, y resolver `skin.rowColors[row]` / `skin.indestructible` dentro de `draw()` en cada frame (paso 2 del plan).                                                 |
| El loop de `requestAnimationFrame` en ambos componentes captura `skin` por closure; si se lee desde la prop en el momento de montar el efecto, cambiar de skin en caliente no se reflejaría hasta reiniciar la partida.                                                                        | Guardar `skin` en un `ref` actualizado en cada render (mismo patrón que `skinRef` de Asteroids) y leer `.current` dentro de `draw()` en cada frame.                                                                                        |
| `localStorage` no está disponible en SSR y puede lanzar en navegación privada con almacenamiento bloqueado.                                                                                                                                                                                    | Reutilizar el mismo patrón ya usado en Asteroids: leer/escribir solo dentro de `useEffect`, envuelto en `try/catch`, con fallback a `"classic"`.                                                                                           |
| Las claves `skin:breakout` / `skin:tetris` podrían colisionar con `skin:asteroids` si `readSkinId`/`writeSkinId` no interpolan correctamente el `gameId`.                                                                                                                                      | Función compartida con firma `readSkinId(gameId: string)` / `writeSkinId(gameId: string, id: string)` que arma la clave como template string `skin:${gameId}`, cubierto por la verificación de persistencia por juego en el plan (paso 6). |
