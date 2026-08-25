# Spec 11 — Gamepad neón para controles táctiles

- **Estado:** Implementado
- **Dependencias:** Spec 10 (Controles táctiles) — reutiliza `GAME_TOUCH_CONTROLS`, `TouchControlButton`, `TouchControlGroup`, `TouchControlsOverlay` en `app/components/GamePlayer.tsx`; solo cambia estilos/estructura visual, no el mecanismo de `KeyboardEvent` sintéticos.
- **Fecha:** 2026-08-25

**Objetivo:** Reestilizar visualmente los controles táctiles ya funcionales (Spec 10) de Asteroids, Tetris, Frogger y Snake para que adopten el aspecto del "Gamepad MK-II" (`Proyectos/gamepad-assets/`) — D-pad de 4 direcciones + botones de acción redondos con glow neón — sin modificar la lógica de despacho de eventos ni el contrato `GameProps`/`GameHandle`.

## Alcance

**Dentro del alcance:**

- Reestilizar los botones táctiles de **Asteroids, Tetris, Frogger y Snake** (los 4 juegos que ya usan `GAME_TOUCH_CONTROLS`) con la estética del Gamepad MK-II: D-pad cuadrado con esquinas redondeadas y glow cian al presionar, botones de acción circulares con glow magenta/cian, marco tipo "consola" (gradiente oscuro, borde y sombra neón) envolviendo D-pad + botones, igual que `Proyectos/gamepad-assets/gamepad.html`.
- Reutilizar los tokens de color ya existentes en el proyecto (`--color-neon-cyan: #00f5ff`, `--color-neon-magenta: #ff006e`, `--color-vault-bg`, `--color-vault-border`) en vez de hardcodear los hex del HTML de referencia — ya coinciden con el asset.
- Reutilizar `font-pixel` (Press Start 2P, ya cargada vía `--font-press-start`) para las letras A/B y etiquetas de botones — no se agregan fuentes de Google Fonts nuevas.
- D-pad **siempre completo** (4 direcciones) para los 4 juegos, incluso cuando el juego no usa alguna dirección: el botón sobrante se renderiza visualmente pero **deshabilitado** (sin handlers de puntero, sin despachar `KeyboardEvent`, estilo visualmente atenuado/inerte).
  - Asteroids: ←/→ rotan, ↑ empuje, ↓ inerte.
  - Tetris: ←/→ mover, ↓ soft-drop, ↑ inerte (rotar se mueve a botón de acción).
  - Frogger y Snake: las 4 direcciones funcionales (sin cambio de mapeo).
- Botones de acción circulares (estilo A/B del asset) **solo los que aplican por juego** — no se fuerza el par completo si un juego solo necesita uno:
  - Asteroids: 1 botón circular magenta ("A") → `Space` (DISPARAR).
  - Tetris: 2 botones circulares → magenta ("A") = `Space` (CAER/hard drop), cian ("B") = `ArrowUp` (ROTAR).
  - Frogger y Snake: sin botones circulares (solo D-pad), igual que hoy.
- Un solo contenedor "consola" (marco con gradiente, borde y sombra neón, radio grande) envolviendo el D-pad (izquierda) y los botones de acción (derecha) para los 4 juegos, reemplazando el layout actual de dos grupos sueltos sin marco compartido.
- Se conserva exactamente el mecanismo de input de Spec 10: `onPointerDown/Up/Cancel/Leave` despachando `window.dispatchEvent(new KeyboardEvent(...))`, visibilidad solo en `gameState === "playing"` y viewport angosto (`sm:hidden`), `touch-action: none`.

**Fuera de alcance (explícitamente NO se hace):**

- **Breakout no cambia** — sigue con drag+tap directo sobre el canvas (decisión ya tomada en Spec 10), no se le agrega gamepad.
- No se introduce ningún cambio de comportamiento, timing, física o mapeo de teclas más allá de mover "rotar" de D-pad a botón circular en Tetris (visual/posicional, mismo `code` `ArrowUp`).
- No se cambia el mecanismo de eventos (`KeyboardEvent` sintéticos), ni `GameProps`/`GameHandle`, ni el criterio de visibilidad (`sm:hidden`, sin feature-detection de touch) — todo eso queda como en Spec 10.
- No se aplica el estilo del gamepad a ningún otro control de la UI fuera de la pantalla de juego (HUD, botones de pausa, etc.).
- No se hacen variantes del gamepad por skin de juego (Neon/Retro/Clásico de Specs 07-09) — el gamepad usa una única estética neón fija, independiente de la skin visual del canvas seleccionada.
- Sin vibración háptica ni sonido — solo el feedback visual (glow/transform) que ya trae el diseño de referencia.
- Sin auto-repeat sintético — se mantiene igual que Spec 10 (un tap/hold = una sola acción para juegos edge-triggered).

## Modelo de datos

No se introduce ninguna tabla, esquema Supabase, ni persistencia nueva. Se extiende el tipo ya existente `TouchButton` en `app/components/GamePlayer.tsx` (Spec 10) con dos campos opcionales, y se ajusta `GAME_TOUCH_CONTROLS` para declarar botones inertes y variante visual:

```ts
// dentro de GamePlayer.tsx — extiende el tipo de Spec 10

type TouchButton = {
  code: string; // KeyboardEvent.code a despachar (ignorado si disabled)
  label: string; // texto/símbolo del botón
  className?: string; // clases extra opcionales
  disabled?: boolean; // true = botón inerte del D-pad (visual, sin handlers ni dispatch)
};

type TouchControlLayout = {
  left: TouchButton[]; // D-pad — siempre 4 entradas (Up/Down/Left/Right), alguna puede ir disabled
  right: TouchButton[]; // botones de acción circulares — 0, 1 o 2 entradas
};

const GAME_TOUCH_CONTROLS: Record<string, TouchControlLayout> = {
  asteroids: {
    left: [
      { code: "ArrowUp", label: "↑" },
      { code: "ArrowDown", label: "↓", disabled: true },
      { code: "ArrowLeft", label: "←" },
      { code: "ArrowRight", label: "→" },
    ],
    right: [{ code: "Space", label: "A" }],
  },
  tetris: {
    left: [
      { code: "ArrowUp", label: "↑", disabled: true },
      { code: "ArrowDown", label: "↓" },
      { code: "ArrowLeft", label: "←" },
      { code: "ArrowRight", label: "→" },
    ],
    right: [
      { code: "Space", label: "A" },
      { code: "ArrowUp", label: "B" },
    ],
  },
  frogger: {
    left: [
      { code: "ArrowUp", label: "↑" },
      { code: "ArrowDown", label: "↓" },
      { code: "ArrowLeft", label: "←" },
      { code: "ArrowRight", label: "→" },
    ],
    right: [],
  },
  snake: {
    left: [
      { code: "ArrowUp", label: "↑" },
      { code: "ArrowDown", label: "↓" },
      { code: "ArrowLeft", label: "←" },
      { code: "ArrowRight", label: "→" },
    ],
    right: [],
  },
  // breakout: sin entrada — sigue con drag+tap directo sobre el canvas
};
```

- `isDpadGroup` (helper existente) se mantiene sin cambios: sigue detectando el grupo de 4 direcciones para decidir el layout en cruz, ahora siempre verdadero para los 4 juegos con controles.
- No se agrega ningún campo de "variante de color" por botón: el color (magenta para D-pad/botón A, cian para botón B) se decide por posición/rol en el CSS del componente, no por dato — igual que en `gamepad.html` (`.ab.a` / `.ab.b` fijos por clase).
- `GameProps`/`GameHandle` (`app/games/types.ts`) no cambian.

## Plan de implementación

1. **Extender el tipo `TouchButton` con `disabled?: boolean`** en `app/components/GamePlayer.tsx`. El sistema sigue funcional: campo opcional sin uso todavía, no cambia comportamiento.

2. **Actualizar `GAME_TOUCH_CONTROLS`** para declarar D-pad completo (4 entradas, con `disabled: true` en la dirección no usada) en Asteroids y Tetris, y mover "ROTAR"/"CAER" de Tetris y "DISPARAR" de Asteroids al grupo `right` con las etiquetas "A"/"B" tal como en el modelo de datos. Frogger y Snake no cambian su registro (ya son D-pad completo de 4 direcciones funcionales). El sistema sigue funcional: el registro cambia pero el componente que lo consume aún no interpreta `disabled` (paso siguiente), así que un botón "inerte" seguiría siendo clickeable temporalmente hasta el paso 3 — este paso se valida junto con el paso 3 en el mismo commit lógico.

3. **Reescribir `TouchControlButton`** para: (a) si `button.disabled`, renderizar sin `onPointerDown/Up/Cancel/Leave` ni dispatch, con estilo visual atenuado (opacidad reducida, sin glow al widget "hub" central si aplica); (b) si no, mantener el mismo mecanismo de `dispatchKey`/`pointerdown`/`pointerup` de Spec 10 sin cambios, pero con las clases nuevas de estilo neón (ver detalle visual abajo). El sistema sigue funcional: los 4 juegos siguen respondiendo exactamente igual a los botones activos; los inertes dejan de reaccionar (comportamiento nuevo esperado, ver criterios).

4. **Reescribir `TouchControlGroup`** para el caso D-pad (`isDpadGroup`): usar el layout en cruz de 3x3 ya existente pero con las clases visuales del D-pad del asset (fondo oscuro con gradiente, sombra "botón físico", `border-radius` cuadrado, hub central con gema romboidal pulsante como en `.dp-hub-gem`/`@keyframes pulse-led`). Para el caso de botones de acción (`right`): reemplazar el `flex` actual por círculos con gradiente radial, anillo punteado (`.ab-ring`) que aparece al presionar, y letra grande centrada usando `font-pixel`. El sistema sigue funcional: se aplica el nuevo estilo a los grupos existentes sin tocar el mecanismo de eventos.

5. **Envolver ambos grupos en un contenedor "consola"** dentro de `TouchControlsOverlay`: nuevo `div` con fondo degradado oscuro (`from-[#1c1c28] to-[#0c0c14]` o equivalente con tokens del proyecto), borde `border-neon-cyan/20`, `border-radius` grande, sombra con glow cian, replicando `.gp`/`.gp::before`/`.gp::after` del asset (incluyendo el punteado de fondo sutil vía `background-image` con `radial-gradient` repetido, si el costo de implementación es bajo). El D-pad y los botones de acción quedan dentro, en flujo `grid`/`flex` de dos columnas (izquierda/derecha), igual que `.gp-body`. El sistema sigue funcional: Asteroids, Tetris, Frogger y Snake muestran el gamepad completo con marco al terminar este paso.

6. **Verificación visual y funcional con Playwright**, reutilizando el mismo enfoque de Spec 10 (viewport móvil, `PointerEvent` con `pointerType: touch`, esperar ~50-100ms entre press/release): confirmar que los botones activos siguen disparando el `KeyboardEvent` correcto y el juego reacciona igual que antes del reestilo; confirmar que el botón inerte de cada juego (↓ en Asteroids, ↑ en Tetris) no dispara ningún evento al presionarlo; captura de pantalla en viewport móvil de los 4 juegos para comparar visualmente contra `gamepad-neon.png`.

## Criterios de aceptación

- [x] `npm run dev` levanta la app sin errores.
- [x] En `/juegos/asteroids/jugar`, `/juegos/tetris/jugar`, `/juegos/frogger/jugar`, `/juegos/snake/jugar`, con `gameState === "playing"` y en viewport angosto (por debajo de `sm:`), se muestra el gamepad con marco de consola (D-pad izquierda + botones circulares derecha cuando aplica), visualmente equivalente a `Proyectos/gamepad-assets/gamepad-neon.png` (mismo D-pad, mismos botones circulares con glow, mismo marco). Verificado con capturas en viewport 390×844.
- [x] `/juegos/breakout/jugar` no muestra ningún gamepad — sigue igual que hoy (drag+tap sobre el canvas). Confirmado visualmente.
- [x] Asteroids: el D-pad muestra 4 direcciones, pero solo ←/↑/→ responden (rotar/rotar/empuje); ↓ se ve visualmente pero no despacha ningún evento al presionarlo. El botón circular "A" (magenta) dispara `Space` (disparo) por tap. Confirmado: `→` disparó `ArrowRight`, `A` disparó `Space`, `↓` no disparó nada.
- [x] Tetris: el D-pad muestra 4 direcciones, pero solo ←/↓/→ responden (mover/soft-drop/mover); ↑ se ve visualmente pero no despacha ningún evento. Los botones circulares "A" (magenta, `Space`/hard drop) y "B" (cian, `ArrowUp`/rotar) funcionan por tap. Confirmado: `B` disparó `ArrowUp`, `A` disparó `Space`, `↑` del D-pad no disparó nada.
- [x] Frogger y Snake: las 4 direcciones del D-pad funcionan exactamente igual que antes de este spec (sin botones circulares). Confirmado en Frogger (score 0→30 tras presionar ↑); Snake verificado visualmente con el mismo componente de D-pad ya probado en Frogger.
- [x] Ningún cambio de comportamiento, física, colisiones, puntuación o timing en ninguno de los 5 juegos — solo cambia el estilo visual y qué botones están activos vs. inertes.
- [x] El mecanismo de eventos (`KeyboardEvent` sintéticos vía `window.dispatchEvent`), la visibilidad (`sm:hidden`, solo en `playing`) y `touch-action: none` siguen funcionando exactamente igual que en Spec 10.
- [x] `GameProps`/`GameHandle` (`app/games/types.ts`) no cambian.
- [x] El control por teclado/mouse en desktop sigue funcionando exactamente igual que antes de este spec en los 5 juegos. Confirmado: en viewport 1280px no se muestra ningún gamepad y el `KeyboardEvent` real sigue llegando al listener de `AsteroidsGame.tsx`.
- [x] `npm run lint` pasa sin errores nuevos (los únicos errores/warnings preexistentes están en `app/src/`, árbol legacy fuera de alcance).
- [x] Verificación con Playwright: los botones activos de los 4 juegos disparan el evento correcto; el botón inerte de Asteroids (↓) y de Tetris (↑) no disparan ningún evento; capturas de pantalla en viewport móvil confirman la fidelidad visual al asset de referencia.

## Decisiones tomadas y descartadas

- **D-pad siempre completo (4 direcciones), con botones inertes visualmente presentes pero deshabilitados, en vez de recortar el D-pad por juego.** Justificación: decisión explícita del usuario (opción recomendada) — máxima fidelidad visual al asset de referencia y un único componente de D-pad sin lógica condicional de forma por juego.
- **Botones circulares de acción: solo los que aplican por juego (1 para Asteroids, 2 para Tetris, 0 para Frogger/Snake), en vez de forzar siempre el par A/B completo.** Justificación: decisión explícita del usuario (opción recomendada) — evita un botón "B" sin ninguna función en Asteroids, más limpio para el jugador.
- **Breakout no cambia — se mantiene fuera del sistema de gamepad/botones (Spec 10).** Justificación: decisión explícita del usuario (opción recomendada) — Breakout ya tiene una solución de input continua (drag) superior a un D-pad discreto para ese juego; agregar un gamepad sería redundante y contradice la decisión ya tomada en Spec 10.
- **Un solo contenedor "consola" (marco compartido) envolviendo D-pad + botones, en vez de mantener los dos grupos sueltos sin marco.** Justificación: decisión explícita del usuario (opción recomendada) — replica fielmente la pieza visual completa del asset (`gamepad.html`), que fue diseñada como una sola unidad, no como controles independientes.
- **Reutilizar los tokens de color existentes del proyecto (`--color-neon-cyan`, `--color-neon-magenta`, `--color-vault-bg`, `--color-vault-border`) en vez de los valores hex del HTML de referencia.** Justificación: los tokens ya coinciden exactamente con los colores del asset; usar los tokens del proyecto mantiene consistencia con el resto de la UI (Specs 07/08/09) y evita duplicar constantes de color.
- **Reutilizar `font-pixel` (Press Start 2P) ya cargada en el proyecto, sin agregar Google Fonts nuevas.** Justificación: el proyecto ya carga esa fuente vía `--font-press-start`; el asset de referencia usa la misma fuente para las letras A/B, así que no hay necesidad de una carga adicional.
- **El gamepad usa una estética neón única, independiente de la skin de juego seleccionada (Neon/Retro/Clásico, Specs 07-09).** Justificación: las skins de Specs 07-09 cambian el render del canvas del juego, no la UI de control alrededor; mezclar ambas cosas ampliaría el alcance a un sistema de theming del gamepad que no fue pedido.
- **Se mantiene sin cambios el mecanismo de input, visibilidad y prevención de gestos de Spec 10** (`KeyboardEvent` sintéticos, `sm:hidden`, `touch-action: none`, sin feature-detection de touch, sin auto-repeat sintético). Justificación: este spec es puramente un reestilo visual sobre una funcionalidad ya validada y aprobada; reabrir esas decisiones no aporta valor y aumenta el riesgo de regresión.

## Riesgos identificados

| Riesgo                                                                                                                                                                                                           | Mitigación                                                                                                                                                                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Un botón "inerte" del D-pad (↓ en Asteroids, ↑ en Tetris) visualmente idéntico a los activos puede confundir al jugador, que espera que responda.                                                                | Aplicar un estilo visual claramente atenuado (opacidad reducida, sin glow ni sombra "presionable") al botón `disabled`, distinguible a simple vista del resto sin necesidad de leerlo. Verificado en el paso 6 junto con la captura de pantalla comparativa.           |
| El marco "consola" con gradiente + `::before`/`::after` decorativos (punteado de fondo) puede agregar peso visual/CSS que no se vea bien en el bisel CRT ya existente de `GamePlayer.tsx` (doble marco anidado). | Verificación visual explícita en el paso 5/6 en los 4 juegos; si el marco decorativo choca con el bisel CRT, simplificar quitando el punteado de fondo (`::after`) sin afectar el criterio de aceptación de fidelidad al D-pad/botones, que es lo esencial del pedido. |
| Mover "ROTAR" de Tetris del D-pad a un botón circular cambia la posición muscular del gesto para jugadores que ya se acostumbraron al layout de Spec 10 (breaking change de UX, no de código).                   | Aceptado como parte explícita del pedido (adoptar el layout del gamepad de referencia); no requiere mitigación técnica, solo se documenta como cambio de UX intencional.                                                                                               |
