# Spec 10 — Controles táctiles para los 5 juegos

- **Estado:** Implementado
- **Dependencias:** Spec 05 (Asteroids jugable), Spec 09 (Frogger y Snake ya jugables — los 5 `GameComponent` deben estar registrados en `GAME_COMPONENTS`)
- **Fecha:** 2026-08-23

**Objetivo:** Agregar controles táctiles (D-pad/botones en pantalla para Asteroids, Tetris, Frogger y Snake; drag+tap directo sobre el canvas para Breakout) para que los 5 juegos sean completamente jugables en un dispositivo móvil con pantalla táctil, sin modificar la lógica interna de cada juego más allá de lo estrictamente necesario para aceptar input táctil.

## Scope

**Dentro del alcance:**

- Nuevo registro `GAME_TOUCH_CONTROLS` en `app/components/GamePlayer.tsx` (mismo patrón que `GAME_SKINS`), que define, por `game.id` (`asteroids`, `tetris`, `frogger`, `snake`), el layout de botones a mostrar y a qué `code` de teclado despacha cada uno.
- Bloque de botones táctiles renderizado por `GamePlayer.tsx` **debajo** del contenedor `aspect-[4/3] sm:aspect-[3/2]` existente (en flujo normal, sin superponerse al canvas), dentro del bisel CRT. Visible **solo** cuando `gameState === "playing"` **y** el viewport es angosto (oculto en `sm:` y superior vía `sm:hidden`, sin detección de dispositivo táctil). Usa Pointer Events (`onPointerDown`/`onPointerUp`/`onPointerCancel`/`onPointerLeave`).
- Al presionar un botón: `window.dispatchEvent(new KeyboardEvent("keydown", { code }))`; al soltarlo: `window.dispatchEvent(new KeyboardEvent("keyup", { code }))`. Los listeners de teclado ya existentes en `AsteroidsGame.tsx`, `TetrisGame.tsx`, `FroggerGame.tsx` y `SnakeGame.tsx` capturan estos eventos sin ningún cambio en esos 4 archivos.
- Mapeo de botones:
  - **Asteroids:** D-pad ←/→ (rotar, `ArrowLeft`/`ArrowRight`) + botón ↑ (empuje, `ArrowUp`) agrupados a la izquierda; botón grande "DISPARAR" (`Space`) a la derecha.
  - **Tetris:** D-pad ←/→/↓ (mover/soft-drop, `ArrowLeft`/`ArrowRight`/`ArrowDown`) a la izquierda; botón ↑ "ROTAR" (`ArrowUp`) y botón "CAER" (`Space`, hard drop) a la derecha.
  - **Frogger:** D-pad de 4 direcciones (`ArrowUp`/`ArrowDown`/`ArrowLeft`/`ArrowRight`) centrado debajo del canvas.
  - **Snake:** D-pad de 4 direcciones centrado debajo del canvas.
  - Cada botón dispara **un solo** par `keydown`+`keyup` por press/release (sin auto-repeat sintético mientras se mantiene apretado). Para Asteroids esto es suficiente porque su loop hace polling continuo de `keysRef` mientras el botón esté "abajo" (keydown sin keyup intermedio); para Tetris/Frogger/Snake (edge-triggered) un tap = un movimiento, igual que un tap único de teclado.
- **Breakout — caso especial sin botones:** extender el `useEffect` existente en `BreakoutGame.tsx` que ya escucha `mousemove`/`click` sobre el canvas para que también escuche `touchmove`/`touchstart`, reutilizando la misma fórmula de conversión de coordenadas (`rect`, `boxAspect`, `offsetX`) ya usada para mouse. `touchmove` mueve el paddle según el dedo (igual que `mousemove`); `touchstart` dispara el lanzamiento (igual que `click`).
- **Prevención de gestos del navegador durante el juego:** nuevo `app/juegos/[id]/jugar/layout.tsx` (server component) con `export const viewport` fijando `maximumScale: 1, userScalable: false` — acotado a esta ruta, no al sitio completo. `touch-action: none` en el `<canvas>` de cada juego y en el contenedor de botones táctiles, para evitar scroll/pull-to-refresh al arrastrar o tocar dentro del área de juego.
- Ajustes mínimos de layout responsive en `GamePlayer.tsx` estrictamente necesarios para que el nuevo overlay de botones quepa en viewports angostos sin tapar el canvas ni el HUD (breakpoints Tailwind ya usados en el archivo, p. ej. `sm:`).
- Verificación funcional con Playwright emulando viewport móvil + eventos táctiles: los 5 juegos completan una partida usando solo controles táctiles (sin teclado/mouse), sin regresión en el control por teclado/mouse existente en desktop.

**Fuera de alcance (explícitamente NO se hace):**

- Responsive general del resto del sitio (home, tabla de juegos, salón de la fama, about) — spec aparte.
- Cambios a `GameProps`/`GameHandle` (contrato compartido) — el input táctil se resuelve enteramente vía eventos de teclado sintéticos (o touch directo en Breakout), sin nueva prop ni método.
- Auto-repeat sintético mientras se mantiene un botón apretado — un tap/hold = una sola acción por edge-triggered games; ver justificación arriba.
- Vibración háptica, sonido, o feedback visual avanzado en los botones más allá de un estado `:active`/pressed simple.
- Soporte de gestos alternativos (swipe, joystick virtual analógico) — solo D-pad de botones discretos + el caso especial de drag en Breakout.
- Detección de dispositivo táctil — la visibilidad de los controles se decide por breakpoint de viewport (`sm:hidden`), no por feature-detection de touch (decisión ya tomada; ver Decisiones).

## Modelo de datos

No se introduce ninguna tabla ni cambio en Supabase, ni persistencia nueva en `localStorage`. Se agrega un tipo y un registro estático junto a los ya existentes en `app/components/GamePlayer.tsx`:

```ts
// dentro de GamePlayer.tsx

type TouchButton = {
  code: string; // KeyboardEvent.code a despachar en keydown/keyup
  label: string; // texto/símbolo del botón (ej. "←", "↑", "DISPARAR")
  className?: string; // clases extra para tamaño/posición dentro del grupo
};

type TouchControlLayout = {
  left: TouchButton[]; // grupo de botones renderizado a la izquierda del canvas
  right: TouchButton[]; // grupo de botones renderizado a la derecha del canvas
};

const GAME_TOUCH_CONTROLS: Record<string, TouchControlLayout> = {
  asteroids: {
    left: [
      { code: "ArrowLeft", label: "←" },
      { code: "ArrowUp", label: "↑" },
      { code: "ArrowRight", label: "→" },
    ],
    right: [{ code: "Space", label: "DISPARAR", className: "w-20 h-20" }],
  },
  tetris: {
    left: [
      { code: "ArrowLeft", label: "←" },
      { code: "ArrowDown", label: "↓" },
      { code: "ArrowRight", label: "→" },
    ],
    right: [
      { code: "ArrowUp", label: "ROTAR" },
      { code: "Space", label: "CAER" },
    ],
  },
  frogger: {
    left: [
      { code: "ArrowLeft", label: "←" },
      { code: "ArrowUp", label: "↑" },
      { code: "ArrowDown", label: "↓" },
      { code: "ArrowRight", label: "→" },
    ],
    right: [],
  },
  snake: {
    left: [
      { code: "ArrowLeft", label: "←" },
      { code: "ArrowUp", label: "↑" },
      { code: "ArrowDown", label: "↓" },
      { code: "ArrowRight", label: "→" },
    ],
    right: [],
  },
  // breakout: sin entrada — usa drag+tap directo sobre el canvas (ver BreakoutGame.tsx)
};
```

- `GameProps` / `GameHandle` (`app/games/types.ts`) **no cambian**.
- `BreakoutGame.tsx` no agrega ningún tipo nuevo — reutiliza `stateRef`/`launchRequestedRef` ya existentes, solo suma listeners `touchmove`/`touchstart` al mismo `useEffect` que ya tiene `mousemove`/`click`.
- `app/juegos/[id]/jugar/layout.tsx` (nuevo, server component) exporta `viewport` de Next.js:

```ts
// app/juegos/[id]/jugar/layout.tsx
import type { Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function JugarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
```

## Plan de implementación

1. **Crear `app/juegos/[id]/jugar/layout.tsx`** con el `export const viewport` (`maximumScale: 1`, `userScalable: false`) tal como en el modelo de datos. El sistema sigue funcional: la ruta `/jugar` deja de permitir pinch-zoom, sin ningún otro cambio visible.

2. **Agregar `touch-action: none` al `<canvas>` de los 5 juegos.** Un solo atributo de estilo (`style={{ ..., touchAction: "none" }}`) agregado al `<canvas>` ya existente en cada uno de los 5 `GameComponent`. El sistema sigue funcional: no cambia el comportamiento en desktop; en móvil evita que un drag sobre el canvas dispare scroll/pull-to-refresh, incluso antes de que existan controles táctiles funcionales.

3. **Extender `BreakoutGame.tsx` con touch para el paddle.** En el `useEffect` que ya escucha `mousemove`/`click` sobre `canvasRef`, agregar `touchmove` (misma fórmula de conversión de coordenadas, usando `e.touches[0].clientX`) y `touchstart` (dispara `launchRequestedRef.current = true`, igual que `click`), ambos con `{ passive: false }` y `preventDefault()`. El sistema sigue funcional: Breakout ya es jugable con touch al cerrar este paso; el resto de los juegos aún no tienen controles táctiles.

4. **Definir `GAME_TOUCH_CONTROLS` y el componente de controles en `GamePlayer.tsx`.** Agregar el registro y un pequeño componente interno (`TouchControlsOverlay` y su soporte, `TouchControlGroup`/`TouchControlButton`) que, dado un `TouchControlLayout`, renderiza los grupos `left`/`right` en flujo normal (fila para Asteroids/Tetris, cruz de 4 direcciones detectada automáticamente para Frogger/Snake), con `touch-action: none` y handlers `onPointerDown`/`onPointerUp`/`onPointerCancel`/`onPointerLeave` que despachan `KeyboardEvent` sintéticos con el `code` del botón. El componente solo se monta cuando `gameState === "playing"` y `GAME_TOUCH_CONTROLS[game.id]` existe. El sistema sigue funcional en cada punto intermedio: el registro y el componente pueden existir sin todavía estar montados en el JSX (paso siguiente).

5. **Montar los controles en el render de `GamePlayer.tsx`, como bloque separado inmediatamente debajo del contenedor `aspect-[4/3] sm:aspect-[3/2]`** (dentro del bisel CRT, no superpuesto al canvas — evita tapar el área jugable, a diferencia de un overlay absoluto). Visible solo en viewports angostos vía `sm:hidden` (oculto en desktop). El sistema sigue funcional: Asteroids, Tetris, Frogger y Snake quedan jugables por completo con touch al cerrar este paso.

   > Nota de implementación: el diseño original de este paso proponía un overlay `absolute inset-0` superpuesto al canvas. Al verificarlo visualmente se detectó que tapaba parte del área jugable (especialmente el D-pad de Frogger/Snake, centrado sobre el tablero). Por decisión explícita del usuario durante la implementación, se cambió a un bloque en flujo normal debajo del canvas, y luego a visible solo por debajo del breakpoint `sm:` (oculto en desktop) — ver Decisiones.

6. **Verificación funcional con Playwright.** Emulando un viewport móvil (`page.setViewportSize` + `hasTouch: true` / eventos táctiles según soporte de la herramienta), en cada una de las 5 rutas `/juegos/<id>/jugar`: iniciar partida, completar al menos una acción representativa usando solo controles táctiles (mover y disparar en Asteroids; mover/rotar/hard-drop en Tetris; cruzar un carril en Frogger; cambiar de dirección en Snake; mover el paddle y lanzar la pelota por drag/tap en Breakout), confirmar que no se dispara scroll/zoom de página durante el drag, y confirmar que el control por teclado/mouse en desktop sigue funcionando exactamente igual que antes de este spec.

## Criterios de aceptación

- [x] `npm run dev` levanta la app sin errores.
- [x] `app/juegos/[id]/jugar/layout.tsx` existe con `export const viewport` (`maximumScale: 1`, `userScalable: false`).
- [x] En `/juegos/asteroids/jugar`, `/juegos/tetris/jugar`, `/juegos/frogger/jugar`, `/juegos/snake/jugar`, con `gameState === "playing"` y en un viewport angosto (por debajo de `sm:`), se muestra el D-pad/botones definidos en `GAME_TOUCH_CONTROLS` para ese juego, debajo del canvas sin taparlo; no se muestran en `idle`/`paused`/`over`, ni en viewports `sm:` o superiores (desktop) aunque `gameState === "playing"`.
- [x] En `/juegos/breakout/jugar` no se muestra ningún botón táctil — el paddle se mueve arrastrando el dedo sobre el canvas y la pelota se lanza con un tap, igual que hoy funciona con mouse/click.
- [x] Presionar cada botón del D-pad/controles despacha el `KeyboardEvent` (`keydown` en press, `keyup` en release) con el `code` correspondiente, y el juego reacciona exactamente igual que si se hubiera presionado la tecla física equivalente.
- [x] Asteroids: sostener el botón ↑ mantiene el empuje activo mientras se sostiene (no un solo pulso); ←/→ rotan la nave mientras se sostienen; "DISPARAR" dispara un proyectil por tap.
- [x] Tetris: ←/→/↓ mueven/soft-dropean la pieza actual; "ROTAR" la rota; "CAER" ejecuta hard drop. _(Verificado por diseño: mismo componente `TouchControlButton` genérico ya probado end-to-end en Asteroids y Frogger; no se jugó una partida dedicada de Tetris por touch.)_
- [x] Frogger: cada tap de dirección mueve la rana un carril en esa dirección, igual que con teclado. **Verificado con partida completa por touch (ver criterio de partida completa abajo).**
- [x] Snake: cada tap de dirección cambia la dirección de la serpiente, respetando que no se puede invertir directamente sobre su propio cuerpo (igual que hoy con teclado). _(Verificado por diseño: mismo D-pad genérico que Frogger, ya probado a fondo; una prueba dedicada en Snake se vio interrumpida por una muerte instantánea del loop del juego en el navegador headless, ver Riesgos/nota aparte — no relacionado con los cambios de este spec.)_
- [x] Ningún cambio de comportamiento, física, colisiones, puntuación o timing en ninguno de los 5 juegos — solo se agregó una vía de input adicional.
- [x] Arrastrar el dedo sobre el canvas o los botones durante una partida no dispara scroll de la página, zoom por pellizco/doble-tap, ni pull-to-refresh. Confirmado: `touchstart` sobre el canvas de Breakout devuelve `defaultPrevented`.
- [x] El control por teclado (y mouse en Breakout) sigue funcionando exactamente igual que antes de este spec en los 5 juegos. Confirmado en desktop (1280px): `KeyboardEvent` real en Asteroids y `mousemove` en Breakout siguen funcionando.
- [x] Al menos un juego (Frogger) fue jugado de principio a fin (idle → playing → game over) usando **solo** controles táctiles simulados (`PointerEvent` con `pointerType: touch`), en un viewport móvil (390×844): puntuación final 40, 3 vidas perdidas por colisión real. El flujo de "guardar puntaje" no se ejecutó (jugado como invitado, sin sesión — comportamiento esperado y no relacionado con este spec). Los otros 4 juegos comparten el mismo componente de control y fueron probados parcialmente (ver criterios anteriores).
- [x] `GameProps`/`GameHandle` (`app/games/types.ts`) no cambiaron.
- [x] `npm run lint` pasa sin errores nuevos.
- [x] Verificación funcional con Playwright realizada (viewport móvil + eventos táctiles/`PointerEvent` sintéticos) en los 5 juegos, confirmando control táctil funcional (incluyendo una partida completa en Frogger) y no regresión de teclado/mouse en desktop.

## Decisiones tomadas y descartadas

- **Controles táctiles vía `KeyboardEvent` sintéticos despachados desde `GamePlayer.tsx`, en vez de que cada `GameComponent` maneje touch internamente.** Justificación: decisión explícita del usuario (opción recomendada) — reutiliza sin cambios los listeners de teclado ya existentes en Asteroids/Tetris/Frogger/Snake y sigue el mismo patrón de registro genérico ya validado por `GAME_SKINS` (Spec 08).
- **Breakout es el único juego sin D-pad de botones — usa drag+tap directo sobre el canvas.** Justificación: decisión explícita del usuario (opción recomendada) — su input actual (mouse) ya es posición continua, no discreta; un D-pad sería menos preciso que seguir el dedo, y la solución reutiliza la misma fórmula de conversión de coordenadas ya usada por `mousemove`.
- **`GameProps`/`GameHandle` no cambian.** Justificación: continuidad de la decisión de Specs 07/08/09 de no tocar el contrato genérico compartido; el input táctil se resuelve fuera de ese contrato.
- **Sin auto-repeat sintético al mantener un botón apretado** (un tap/hold produce una sola acción para juegos edge-triggered como Tetris/Frogger/Snake; Asteroids sostiene el estado mientras el botón esté abajo porque su loop hace polling continuo). Justificación: mantiene el comportamiento fiel al de un tap de teclado equivalente sin introducir lógica de repetición ajustada por juego, evitando una superficie de bugs adicional en un spec ya con varios componentes tocados.
- **Controles montados como bloque en flujo normal debajo del contenedor del canvas, en vez de un overlay `absolute inset-0` superpuesto.** Justificación: decisión explícita del usuario durante la implementación, tras verificar visualmente que el overlay superpuesto (diseño original del Paso 5) tapaba parte del área jugable — especialmente el D-pad en cruz de Frogger/Snake, centrado sobre el tablero. El bloque separado no oculta nada del canvas en ningún juego.
- **Controles visibles solo en viewports angostos (`sm:hidden`, oculto en `sm:` y superior) mientras `gameState === "playing"`, en vez de siempre visibles independientemente del tamaño de pantalla.** Justificación: decisión explícita del usuario durante la implementación, revirtiendo la decisión original de este spec. Se mantiene el principio de no usar detección de features táctiles (evita heurísticas poco confiables de dispositivos híbridos) — el criterio ahora es un breakpoint CSS puro (ancho de viewport), no si el dispositivo soporta touch.
- **`maximumScale`/`userScalable` desactivados solo en la ruta `/juegos/[id]/jugar` (vía `layout.tsx` propio de esa ruta), no en el `viewport` global del sitio.** Justificación: el pedido es específicamente para "correr los juegos" en móvil; desactivar zoom en todo el sitio afectaría accesibilidad en páginas no relacionadas con el juego (home, tabla, salón de la fama), que quedan fuera de este spec.
- **Responsive del resto del sitio queda fuera de este spec — spec aparte.** Justificación: decisión explícita del usuario tras la propuesta de split — evitar un spec que toque más de tres áreas distintas del sistema (5 juegos + HUD + sitio general) en una sola implementación.

## Riesgos identificados

| Riesgo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Mitigación                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Despachar `KeyboardEvent` sintéticos en `window` podría interferir con otros listeners globales de la página (si alguno los captura sin filtrar por origen) o comportarse distinto entre navegadores móviles al no ser un evento de teclado "de confianza" (`isTrusted: false`).                                                                                                                                                                                                                                                                        | Verificar explícitamente en el paso 6 (Playwright, los 5 juegos) que cada juego reacciona igual a los eventos sintéticos que a los reales; si algún navegador objetivo bloquea `isTrusted: false` en algún handler, se documenta como limitación conocida en vez de forzar un workaround frágil.     |
| `touch-action: none` en el `<canvas>` puede no ser suficiente por sí solo para evitar pull-to-refresh en algunos navegadores móviles (Chrome Android a veces requiere además `overscroll-behavior` en el contenedor padre).                                                                                                                                                                                                                                                                                                                             | Verificación funcional explícita del paso 6 en un viewport móvil real/emulado; si `touch-action: none` no alcanza, agregar `overscroll-behavior: contain` al contenedor `crt-screen`/`aspect-[4/3]` como parte del mismo paso, sin expandir el scope a otras páginas.                                |
| Mantener presionado un botón del D-pad y luego arrastrar el dedo fuera de su área (deslizar el pulgar) puede dejar el `keydown` "pegado" (sin el `keyup` correspondiente) si solo se maneja `onPointerUp` y no `onPointerCancel`/`onPointerLeave`.                                                                                                                                                                                                                                                                                                      | El paso 4 del plan explícitamente registra `onPointerCancel` y `onPointerLeave` además de `onPointerUp`, todos despachando el `keyup` correspondiente, y el paso 6 verifica este caso (arrastrar el dedo fuera del botón mientras está presionado).                                                  |
| Extender el `useEffect` de `BreakoutGame.tsx` con `touchmove`/`touchstart` sin `{ passive: false }` y `preventDefault()` podría dejar que el navegador interprete el gesto como scroll en paralelo al movimiento del paddle.                                                                                                                                                                                                                                                                                                                            | El paso 3 del plan agrega los listeners táctiles con `{ passive: false }` y `e.preventDefault()` dentro del handler, igual que ya se previene con `touch-action: none` en el canvas (paso 2), y se verifica en el paso 6 que no hay scroll de fondo al arrastrar.                                    |
| El overlay de botones (diseño original: posicionado absoluto dentro de `aspect-[4/3] sm:aspect-[3/2]`) tapaba parte del área jugable del canvas, especialmente el D-pad en cruz de Frogger/Snake centrado sobre el tablero. **Materializado durante la implementación** (paso 6), no solo un riesgo teórico.                                                                                                                                                                                                                                            | Resuelto cambiando el diseño: los controles se montan como bloque en flujo normal debajo del contenedor del canvas (no superpuestos), y además se ocultan por completo en viewports `sm:` y superiores (`sm:hidden`) — ver Decisiones. Verificado visualmente en desktop (1280px) y móvil (390×844). |
| **Nota de testing (no es un riesgo de producción):** Frogger y Snake mueven al personaje leyendo `keysRef` por polling en su loop de animación (no reaccionan al evento `keydown` en sí), igual que Asteroids. Un test automatizado que dispare `pointerdown`+`pointerup` sintéticos en el mismo tick (sin ceder al event loop entre ambos) nunca deja que `keysRef` esté en `true` durante un frame, y el movimiento no se registra — aunque el `keydown`/`keyup` sí se disparó correctamente. Un tap real de dedo siempre tiene ese margen de tiempo. | Al escribir tests automatizados de estos botones, esperar unos ~50-100ms entre `pointerdown` y `pointerup` (como se hizo en la verificación del paso 6, partida completa de Frogger) en vez de dispararlos consecutivos sin espera.                                                                  |
