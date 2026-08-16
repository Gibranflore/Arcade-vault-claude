# Spec 09 — Sistema de skins visuales (Frogger y Snake)

- **Estado:** Aprobado
- **Dependencias:** Spec 05 (Asteroids jugable), Spec 07 (Sistema de skins visuales — Asteroids), Spec 08 (Sistema de skins visuales — Breakout y Tetris; **debe estar implementado**, ya que este spec extiende el registro `GAME_SKINS` que introduce)
- **Fecha:** 2026-08-15

**Objetivo:** Extender el sistema de skins visuales (Spec 07/08) a Frogger y Snake, agregando sus paletas Clásico/Neon/Retro y sumándolos al registro `GAME_SKINS` ya generalizado en `GamePlayer.tsx`, sin volver a tocar el mecanismo del selector/persistencia.

## Scope

**Dentro del alcance:**

- Nuevo tipo `FroggerSkin` y archivo `app/games/froggerSkins.ts` con 3 paletas (Clásico/Neon/Retro), valores hex ya auditados por `skin-designer` contra `FroggerGame.tsx`: colores de carril por tipo (`goal`/`safe`/`road`/`river`), casa meta activa/inactiva + borde, color de auto, color de camión, color de tronco, color de cocodrilo, color de boca de cocodrilo, color de rana, color de ojos de rana (11 campos).
- Nuevo tipo `SnakeSkin` y archivo `app/games/snakeSkins.ts` con 3 paletas (Clásico/Neon/Retro): fondo, color de cabeza, color de cuerpo, color de comida (4 campos).
- `FroggerGame` y `SnakeGame` aceptan cada uno una prop nueva y opcional `skin?: FroggerSkin` / `skin?: SnakeSkin` (default = paleta Clásico si no se pasa), siguiendo el mismo patrón ya usado en Asteroids/Breakout/Tetris (ref actualizado por render, leído dentro del loop `draw`/`drawScene` en cada frame). Todo color literal usado en `drawScene` (Frogger) y en `drawScene` (Snake) pasa a leerse del objeto `skin`. **Ningún cambio de física, colisiones, spawns, puntuación, timing, velocidad de carriles ni lógica de niveles.**
- Se agregan `frogger` y `snake` al registro `GAME_SKINS` de `GamePlayer.tsx` (introducido en el Spec 08), reutilizando la misma lógica de HUD/selector/persistencia ya generalizada — **sin modificar el mecanismo del selector en sí**, solo sumar las dos entradas nuevas y el spread condicional de la prop `skin` para `game.id === "frogger"` / `game.id === "snake"`.
- Persistencia en `localStorage` bajo claves `skin:frogger` y `skin:snake`, mismo patrón (`readSkinId`/`writeSkinId`) ya compartido por los demás juegos.
- Verificación funcional con Playwright: en Frogger y en Snake, cambiar entre las 3 skins con partida en curso y confirmar visualmente el cambio de colores sin romper el juego; confirmar persistencia tras reload; confirmar que Asteroids/Breakout/Tetris siguen funcionando igual.

**Fuera de alcance (explícitamente NO se hace):**

- Cualquier cambio al mecanismo del selector/HUD/`GAME_SKINS` en sí — eso ya se definió y se implementa en el Spec 08. Este spec **no se puede implementar antes que el 08**.
- Cualquier persistencia en Supabase — sigue siendo solo `localStorage`.
- Cambiar `GameProps`/`GameHandle` (contrato compartido) — `skin` sigue siendo una prop propia de cada componente.
- Editor de skins custom (colores libres) — solo las paletas predefinidas ya propuestas.
- Simplificar `FroggerSkin` agrupando auto/camión en un solo color — decisión explícita del usuario de mantener los 11 campos con distinción completa por elemento.
- Skins para Asteroids/Breakout/Tetris — ya cubiertos por specs anteriores, no se tocan acá salvo la adición no disruptiva a `GAME_SKINS`.

## Modelo de datos

No se introduce ninguna tabla ni cambio en Supabase. Se agregan tipos y constantes junto a cada componente (mismo patrón que `asteroidsSkins.ts`/`breakoutSkins.ts`/`tetrisSkins.ts`):

```ts
// app/games/froggerSkins.ts
export type FroggerSkin = {
  id: "classic" | "neon" | "retro";
  label: string;
  laneGoal: string;
  laneSafe: string;
  laneRoad: string;
  laneRiver: string;
  goalActive: string;
  goalInactive: string;
  goalBorder: string;
  car: string;
  truck: string;
  log: string;
  crocodile: string;
  crocodileMouth: string;
  frog: string;
  frogEyes: string;
};

export const FROGGER_SKINS: Record<FroggerSkin["id"], FroggerSkin> = {
  classic: {
    id: "classic",
    label: "Clásico",
    laneGoal: "#0d2b1f",
    laneSafe: "#123a24",
    laneRoad: "#1c1c22",
    laneRiver: "#0a2a4a",
    goalActive: "#39ff14",
    goalInactive: "#0a1a12",
    goalBorder: "#39ff14",
    car: "#ff3860",
    truck: "#ff8c00",
    log: "#8a5a2b",
    crocodile: "#2f6b2f",
    crocodileMouth: "#ff003c",
    frog: "#39ff14",
    frogEyes: "#0a1a12",
  },
  neon: {
    id: "neon",
    label: "Neon",
    laneGoal: "#0a0018",
    laneSafe: "#05020a",
    laneRoad: "#0d0014",
    laneRiver: "#030014",
    goalActive: "#00f5ff",
    goalInactive: "#150a2a",
    goalBorder: "#00f5ff",
    car: "#ff2bd6",
    truck: "#ff8c1a",
    log: "#f5ff00",
    crocodile: "#39ff14",
    crocodileMouth: "#ff003c",
    frog: "#00f5ff",
    frogEyes: "#0a0018",
  },
  retro: {
    id: "retro",
    label: "Retro",
    laneGoal: "#f8d800",
    laneSafe: "#00a800",
    laneRoad: "#545454",
    laneRiver: "#0058f8",
    goalActive: "#f8f8f8",
    goalInactive: "#7c7c7c",
    goalBorder: "#000000",
    car: "#f83800",
    truck: "#a44200",
    log: "#a44200",
    crocodile: "#005800",
    crocodileMouth: "#f83800",
    frog: "#b8f818",
    frogEyes: "#000000",
  },
};

export const DEFAULT_FROGGER_SKIN = FROGGER_SKINS.classic;
```

```ts
// app/games/snakeSkins.ts
export type SnakeSkin = {
  id: "classic" | "neon" | "retro";
  label: string;
  bg: string;
  head: string;
  body: string;
  food: string;
};

export const SNAKE_SKINS: Record<SnakeSkin["id"], SnakeSkin> = {
  classic: {
    id: "classic",
    label: "Clásico",
    bg: "#000000",
    head: "#7cff5c",
    body: "#39ff14",
    food: "#f5ff00",
  },
  neon: {
    id: "neon",
    label: "Neon",
    bg: "#0a0014",
    head: "#00f5ff",
    body: "#ff2bd6",
    food: "#f5ff00",
  },
  retro: {
    id: "retro",
    label: "Retro",
    bg: "#0f380f",
    head: "#9bbc0f",
    body: "#8bac0f",
    food: "#306230",
  },
};

export const DEFAULT_SNAKE_SKIN = SNAKE_SKINS.classic;
```

`GameProps` (`app/games/types.ts`) **no cambia** — cada componente tipa su propia prop adicional (`FroggerGame(props: GameProps & { skin?: FroggerSkin })`, `SnakeGame(props: GameProps & { skin?: SnakeSkin })`).

Extensión de `GAME_SKINS` en `GamePlayer.tsx` (registro ya creado por el Spec 08, aquí solo se agregan entradas):

```ts
const GAME_SKINS: Record<
  string,
  { options: { id: string; label: string }[]; defaultId: string }
> = {
  asteroids: {/* ya existente */},
  breakout: {/* ya existente */},
  tetris: {/* ya existente */},
  frogger: {
    options: [
      { id: "classic", label: "Clásico" },
      { id: "neon", label: "Neon" },
      { id: "retro", label: "Retro" },
    ],
    defaultId: "classic",
  },
  snake: {
    options: [
      { id: "classic", label: "Clásico" },
      { id: "neon", label: "Neon" },
      { id: "retro", label: "Retro" },
    ],
    defaultId: "classic",
  },
};
// localStorage keys: skin:frogger, skin:snake — mismas readSkinId/writeSkinId
// compartidas ya introducidas en el Spec 08. El objeto de paleta concreto
// (FROGGER_SKINS[skinId] / SNAKE_SKINS[skinId]) se pasa en el spread
// condicional al renderizar <GameComponent>, igual que Breakout/Tetris.
```

## Plan de implementación

1. **Definir `FROGGER_SKINS` y `SNAKE_SKINS`.** Crear `app/games/froggerSkins.ts` y `app/games/snakeSkins.ts` con los tipos, las 3 paletas y los `DEFAULT_*_SKIN`, tal como en el modelo de datos. El sistema sigue funcional: archivos nuevos, aún no importados en ningún lado.

2. **Propagar `skin` a `drawScene` de `FroggerGame.tsx`.** Reemplazar los literales de `drawScene` (colores de carril por `lane.type`, casa meta activa/inactiva + borde, `car`/`truck` según `LaneEntity.kind`, `log`/`crocodile` + boca, rana + ojos) por los campos del objeto `skin` recibido como parámetro. Prestar especial atención a la rama `riding.kind === "crocodile"` que calcula `mouthCx` — debe usar `skin.crocodileMouth`. El sistema sigue funcional: sin la prop nueva todavía, usa `DEFAULT_FROGGER_SKIN` fijo internamente — visualmente idéntico a hoy.

3. **Propagar `skin` a `drawScene` de `SnakeGame.tsx`.** Reemplazar `"#000000"` (fondo), `"#f5ff00"` (comida), `"#39ff14"`/`"#7cff5c"` (cuerpo/cabeza) por los campos de `skin`. El sistema sigue funcional: usa `DEFAULT_SNAKE_SKIN` fijo, sin cambios visibles.

4. **Exponer la prop `skin` en ambos componentes.** Agregar el parámetro opcional `skin = DEFAULT_FROGGER_SKIN` / `skin = DEFAULT_SNAKE_SKIN`, guardado en un `ref` actualizado por render (mismo patrón que Asteroids/Breakout/Tetris), leído dentro de `drawScene` en cada frame. El sistema sigue funcional: prop opcional, sin pasarla el comportamiento no cambia.

5. **Sumar `frogger` y `snake` a `GAME_SKINS` en `GamePlayer.tsx`.** Agregar las dos entradas al registro ya generalizado por el Spec 08 (sin tocar la lógica del selector/persistencia en sí) y agregar el spread condicional de la prop `skin` para `game.id === "frogger"` / `game.id === "snake"` al renderizar `<GameComponent>`, pasando `FROGGER_SKINS[skinId]` / `SNAKE_SKINS[skinId]` respectivamente. El sistema sigue funcional en cada punto intermedio: primero se agregan las entradas al registro (HUD ya las muestra), luego se conecta el paso de la prop al componente.

6. **Verificación funcional con Playwright.** Levantar `npm run dev`; en `/juegos/frogger/jugar` y `/juegos/snake/jugar`, iniciar partida, cambiar entre las 3 skins con el juego corriendo y confirmar que los colores cambian sin afectar el gameplay (colisiones de Frogger con carriles/vehículos/río siguen iguales; colisiones de Snake con pared/cuerpo siguen iguales; la boca del cocodrilo cambia de color junto con el resto). Recargar y confirmar persistencia por juego (`skin:frogger`, `skin:snake` no interfieren entre sí ni con las claves de los otros 3 juegos). Confirmar que Asteroids/Breakout/Tetris siguen funcionando igual que antes de este spec.

## Criterios de aceptación

- [ ] `npm run dev` levanta la app sin errores.
- [ ] `app/games/froggerSkins.ts` existe con el tipo `FroggerSkin` y las 3 paletas (`classic`/`neon`/`retro`) con los valores hex definidos en el modelo de datos.
- [ ] `app/games/snakeSkins.ts` existe con el tipo `SnakeSkin` y las 3 paletas (`classic`/`neon`/`retro`) con los valores hex definidos en el modelo de datos.
- [ ] En `/juegos/frogger/jugar`, el HUD superior muestra 3 botones de skin (Clásico/Neon/Retro), con "Clásico" activo por defecto la primera vez (sin `localStorage` previo).
- [ ] En `/juegos/snake/jugar`, el HUD superior muestra 3 botones de skin (Clásico/Neon/Retro), con "Clásico" activo por defecto la primera vez.
- [ ] Cambiar de skin en Frogger actualiza inmediatamente los colores del canvas (carriles, casas meta, vehículos, río/tronco/cocodrilo+boca, rana+ojos) sin reiniciar la partida en curso.
- [ ] Cambiar de skin en Snake actualiza inmediatamente los colores del canvas (fondo, cabeza, cuerpo, comida) sin reiniciar la partida en curso.
- [ ] El comportamiento de cada juego (colisiones de carriles/río en Frogger; colisiones de pared/cuerpo en Snake; puntuación, niveles, game over) es idéntico entre las 3 skins — solo cambian colores.
- [ ] La skin elegida persiste en `localStorage` bajo claves independientes (`skin:frogger`, `skin:snake`) y se recupera correctamente tras recargar la página, sin interferir con las claves de Asteroids/Breakout/Tetris.
- [ ] Los selectores de skin de Asteroids/Breakout/Tetris siguen funcionando exactamente igual que antes de este spec.
- [ ] Un usuario sin sesión iniciada puede cambiar de skin igual que uno con sesión (persistencia en `localStorage` no depende de `useAuth()`).
- [ ] `npm run lint` pasa sin errores nuevos.
- [ ] Verificación funcional con Playwright realizada: cambio de skin en vivo durante partida en Frogger y Snake, persistencia tras reload por juego, y no regresión en los otros 3 juegos, antes de cerrar el spec.

## Decisiones tomadas y descartadas

- **Skin solo cambia colores de render, nunca lógica/física del juego** (en ambos juegos). Justificación: continuidad de la decisión ya tomada en Specs 07/08 — evita que una "skin" afecte balance de dificultad o comportamiento.
- **Persistencia en `localStorage`, no en Supabase**, con claves independientes por juego (`skin:frogger`, `skin:snake`). Justificación: continuidad de Specs 07/08; dato cosmético de cliente que no necesita sincronizarse entre dispositivos.
- **Este spec depende de que el Spec 08 (registro `GAME_SKINS` genérico) ya esté implementado — no generaliza el selector por su cuenta.** Justificación: decisión explícita del usuario (opción recomendada) — evita definir el mecanismo de HUD/persistencia dos veces; el 09 solo agrega entradas al registro ya existente.
- **`FroggerSkin` mantiene 11 campos de color sin agrupar auto/camión en uno solo.** Justificación: decisión explícita del usuario (opción recomendada) — prioriza fidelidad visual completa a los elementos reales de `FroggerGame.tsx` sobre reducir la cantidad de campos del tipo.
- **`AsteroidsSkin`/`BreakoutSkin`/`TetrisSkin`/`FroggerSkin`/`SnakeSkin` NO se unifican en un tipo de color compartido.** Justificación: continuidad de la decisión del Spec 08 — cada juego dibuja elementos distintos; solo se comparte el mecanismo de HUD/selector/persistencia (`GAME_SKINS`, `readSkinId`/`writeSkinId`), no el modelo de color.
- **Paso de la prop `skin` al `GameComponent` sigue siendo condicional por `game.id` (spread manual), no parte de `GameProps`.** Justificación: continuidad de la decisión de Spec 07/08 de no modificar el contrato genérico compartido por todos los juegos.
- **Paletas usadas tal cual las auditó el agente `skin-designer` contra el código real, sin ajustes.** Justificación: decisión explícita del usuario (opción recomendada) — las paletas ya fueron verificadas contra `FroggerGame.tsx`/`SnakeGame.tsx` reales (no las provisionales previas a la implementación de esos juegos).

## Riesgos identificados

| Riesgo                                                                                                                                                                                                                                                                                           | Mitigación                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Este spec depende de que el Spec 08 ya esté implementado (registro `GAME_SKINS`, `readSkinId`/`writeSkinId`); si `/spec-impl` de este spec se ejecuta antes de que el 08 esté mergeado, el paso 5 del plan no tiene dónde engancharse.                                                           | Verificar explícitamente al inicio de la implementación que `GAME_SKINS` y las funciones compartidas ya existen en `GamePlayer.tsx` (código del Spec 08 mergeado) antes de tocar nada; si no existen, detener la implementación de este spec y señalarlo, en vez de improvisar una generalización paralela. |
| `FroggerGame.tsx` dibuja la boca del cocodrilo con una posición calculada a partir de `lane.direction` (`mouthCx`); si el refactor de `drawScene` no pasa `skin` correctamente a esa rama condicional, la boca podría quedar con el color de carril por defecto en vez de `skin.crocodileMouth`. | Revisar explícitamente esa rama (`riding.kind === "crocodile"`) al propagar `skin` en el paso 2 del plan, y verificarla visualmente en el paso 6 (la boca debe cambiar de color junto con el resto al cambiar de skin).                                                                                     |
| El loop de `requestAnimationFrame` en ambos componentes captura `skin` por closure; si se lee desde la prop en el momento de montar el efecto, cambiar de skin en caliente no se reflejaría hasta reiniciar la partida.                                                                          | Guardar `skin` en un `ref` actualizado en cada render (mismo patrón ya usado en Asteroids/Breakout/Tetris) y leer `.current` dentro de `drawScene` en cada frame.                                                                                                                                           |
| Las claves `skin:frogger` / `skin:snake` podrían colisionar o pisar las de otros juegos si `readSkinId`/`writeSkinId` no interpolan correctamente el `gameId`.                                                                                                                                   | Reutilizar tal cual las funciones compartidas ya definidas en el Spec 08 (no reimplementarlas), cubierto por la verificación de persistencia por juego en el plan (paso 6).                                                                                                                                 |
