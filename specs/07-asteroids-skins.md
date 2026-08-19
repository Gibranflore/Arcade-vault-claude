# Spec 07 — Sistema de skins visuales (Asteroids)

- **Estado:** Implementado
- **Dependencias:** Spec 05 (Asteroids jugable)
- **Fecha:** 2026-08-12

**Objetivo:** Agregar un selector de skin visual (Clásico/Neon/Retro) en el HUD de `GamePlayer.tsx`, que solo cambia los colores de render de `AsteroidsGame.tsx` y persiste la elección en `localStorage`.

## Scope

**Dentro del alcance:**

- Nuevo tipo `AsteroidsSkin` (colores: `bg`, `ship`, `thruster`, `asteroid`, `bullet`, `particle`, `powerupTriple`, `powerupBomb`) definido junto a `AsteroidsGame.tsx`.
- 3 paletas predefinidas — Clásico (default), Neon, Retro — con los valores hex ya propuestos por `skin-designer` en `Proyectos/game-with-theme.md`.
- `AsteroidsGame` acepta una prop nueva y opcional `skin?: AsteroidsSkin` (default = paleta Clásico si no se pasa). Todo el módulo de dibujo (`Bullet.draw`, `Asteroid.draw`, `Ship.draw`, `Particle.draw`, `PowerUp.draw`, y el `ctx.fillStyle = "#000"` del fondo en el loop `draw`) deja de usar colores literales y usa los del objeto `skin` recibido. **Ningún cambio de física, colisiones, spawns, puntuación ni timing.**
- Selector de skin (3 botones: Clásico/Neon/Retro) en el HUD superior de `GamePlayer.tsx`, junto a Puntuación/Vidas/Nivel, visible en todos los estados del juego (idle/playing/paused/over) — pero **solo se renderiza (y aplica la prop `skin`) cuando `game.id === "asteroids"`**, ya que ningún otro `GameComponent` acepta esa prop todavía.
- Persistencia en `localStorage` bajo una clave por juego (p. ej. `skin:asteroids`), leída al montar `GamePlayer` y escrita al cambiar de skin. Aplica igual para usuarios con sesión y sin sesión.
- Verificación funcional con Playwright: cambiar de skin en el HUD y confirmar visualmente que cambian los colores del canvas de Asteroids sin romper el juego, y que la elección persiste tras recargar la página.

**Fuera de alcance (explícitamente NO se hace):**

- Skins para Breakout, Tetris o Frogger — quedan para un spec/iteración futura una vez validado el patrón con Asteroids.
- Cualquier persistencia en Supabase (tabla `user_skins` u otra) — descartado explícitamente por el usuario.
- Cambiar `GameProps`/`GameHandle` (el contrato compartido por todos los juegos) — `skin` es una prop propia de `AsteroidsGame`, no del contrato genérico.
- Editor de skins custom (elegir colores propios) — solo las 3 paletas predefinidas.
- Cambiar el selector de skin visualmente para otros elementos del HUD que no sean juego Asteroids (Snake, Tetris, etc. no muestran selector).

## Modelo de datos

No se introduce ninguna tabla ni cambio en Supabase. Se agregan tipos y constantes nuevas junto a `AsteroidsGame.tsx` (en un archivo hermano `app/games/asteroidsSkins.ts` para no inflar el componente):

```ts
// app/games/asteroidsSkins.ts
export type AsteroidsSkin = {
  id: "classic" | "neon" | "retro";
  label: string;
  bg: string;
  ship: string;
  thruster: string;
  asteroid: string;
  bullet: string;
  particle: string;
  powerupTriple: string;
  powerupBomb: string;
};

export const ASTEROIDS_SKINS: Record<AsteroidsSkin["id"], AsteroidsSkin> = {
  classic: {
    id: "classic",
    label: "Clásico",
    bg: "#000000",
    ship: "#ffffff",
    thruster: "rgba(255, 130, 0, 0.85)",
    asteroid: "#ffffff",
    bullet: "#ffffff",
    particle: "#ffffff", // usado como base del rgba(...) con alpha dinámico
    powerupTriple: "#ffffff",
    powerupBomb: "#ff6666",
  },
  neon: {
    id: "neon",
    label: "Neon",
    bg: "#0a0014",
    ship: "#00f5ff",
    thruster: "#ff2bd6",
    asteroid: "#ff2bd6",
    bullet: "#39ff14",
    particle: "#00f5ff",
    powerupTriple: "#f5ff00",
    powerupBomb: "#ff003c",
  },
  retro: {
    id: "retro",
    label: "Retro",
    bg: "#000000",
    ship: "#33ff33",
    thruster: "#33ff33",
    asteroid: "#33ff33",
    bullet: "#33ff33",
    particle: "#33ff33",
    powerupTriple: "#33ff33",
    powerupBomb: "#33ff33",
  },
};

export const DEFAULT_ASTEROIDS_SKIN = ASTEROIDS_SKINS.classic;
```

Notas de mapeo con clases existentes:

- `Particle.draw` hoy arma `rgba(255,255,255,${alpha})`; con skin se convierte a partir del color `particle` (hex → rgb component) para conservar el fade por alpha en las 3 paletas.
- `Asteroid`/`Bullet`/`Ship`/`PowerUp` reciben el `skin` como parámetro de su método `draw(ctx, skin)` en vez de usar `"#fff"`/`"#f66"` literales.

`GameProps` (`app/games/types.ts`) **no cambia** — `skin` se agrega como prop adicional específica de `AsteroidsGame`, tipada en su propia firma de props (`AsteroidsGame(props: GameProps & { skin?: AsteroidsSkin })`).

`localStorage`: clave `skin:asteroids`, valor = `AsteroidsSkin["id"]` (`"classic" | "neon" | "retro"`), leída/escrita desde `GamePlayer.tsx`.

## Plan de implementación

1. **Definir `ASTEROIDS_SKINS`.** Crear `app/games/asteroidsSkins.ts` con el tipo `AsteroidsSkin`, las 3 paletas (`classic`/`neon`/`retro`) y `DEFAULT_ASTEROIDS_SKIN`, tal como en la sección de datos. El sistema sigue funcional: archivo nuevo, aún no importado en ningún lado.

2. **Propagar `skin` a las clases de dibujo de `AsteroidsGame.tsx`.** Cambiar las firmas `draw(ctx: CanvasRenderingContext2D)` de `Bullet`, `Asteroid`, `Ship`, `Particle`, `PowerUp` a `draw(ctx: CanvasRenderingContext2D, skin: AsteroidsSkin)`, reemplazando cada color literal (`"#fff"`, `"#f66"`, `"rgba(255, 130, 0, 0.85)"`, `"rgba(255,255,255,...)"`) por el campo correspondiente de `skin`. Actualizar las llamadas a `.draw(ctx)` dentro del loop `draw()` del componente para pasar `skin`, y el `ctx.fillStyle = "#000"` del fondo pasa a `skin.bg`. El sistema sigue funcional: sin la prop nueva todavía, `AsteroidsGame` usa `DEFAULT_ASTEROIDS_SKIN` internamente como valor fijo — visualmente idéntico a hoy.

3. **Exponer la prop `skin` en `AsteroidsGame`.** Agregar el parámetro opcional `skin = DEFAULT_ASTEROIDS_SKIN` a la firma del componente (`GameProps & { skin?: AsteroidsSkin }`), guardarlo en un `ref` (para que el loop `requestAnimationFrame` lea el valor actual sin reiniciar el efecto) y usarlo en `draw()`. El sistema sigue funcional: prop opcional, quien no la pase sigue viendo el Clásico.

4. **Selector de skin + persistencia en `GamePlayer.tsx`.** Agregar estado `skinId` inicializado leyendo `localStorage.getItem("skin:asteroids")` (fallback `"classic"` si no existe o el juego no es Asteroids), 3 botones (Clásico/Neon/Retro) en el HUD superior visibles solo cuando `game.id === "asteroids"`, que al hacer click actualizan `skinId` y escriben `localStorage.setItem("skin:asteroids", id)`. Pasar `skin={ASTEROIDS_SKINS[skinId]}` a `<GameComponent>` solo cuando `game.id === "asteroids"` (spread condicional o prop opcional ignorada por los demás componentes). El sistema sigue funcional: HUD con selector nuevo, resto de juegos sin cambios visibles.

5. **Verificación funcional con Playwright.** Levantar `npm run dev`, entrar a `/juegos/asteroids/jugar`, iniciar partida, cambiar entre las 3 skins con el juego corriendo y confirmar que los colores del canvas cambian sin afectar el gameplay (nave sigue respondiendo, colisiones normales). Recargar la página y confirmar que la última skin elegida persiste. Confirmar que en otros juegos (p. ej. Tetris) el HUD no muestra el selector de skin.

## Criterios de aceptación

- [ ] `npm run dev` levanta la app sin errores.
- [ ] `app/games/asteroidsSkins.ts` existe con el tipo `AsteroidsSkin` y las 3 paletas (`classic`/`neon`/`retro`) con los valores hex definidos en la sección de modelo de datos.
- [ ] En `/juegos/asteroids/jugar`, el HUD superior muestra 3 botones de skin (Clásico/Neon/Retro), con "Clásico" activo por defecto la primera vez (sin `localStorage` previo).
- [ ] Cambiar de skin actualiza inmediatamente los colores del canvas (fondo, nave, asteroides, balas, partículas, power-ups) sin reiniciar la partida en curso.
- [ ] El comportamiento del juego (física, colisiones, spawns, puntuación, niveles, game over) es idéntico entre las 3 skins — solo cambian colores.
- [ ] La skin elegida persiste en `localStorage` (`skin:asteroids`) y se recupera correctamente tras recargar la página.
- [ ] El selector de skin solo aparece cuando el juego activo es Asteroids; en Tetris/Breakout/Frogger el HUD no lo muestra.
- [ ] Un usuario sin sesión iniciada puede cambiar de skin igual que uno con sesión (la persistencia en `localStorage` no depende de `useAuth()`).
- [ ] `npm run lint` pasa sin errores nuevos.
- [ ] Verificación funcional con Playwright realizada: cambio de skin en vivo durante partida, persistencia tras reload, y ausencia del selector en otro juego, antes de cerrar el spec.

## Decisiones tomadas y descartadas

- **Skin solo cambia colores de render, nunca lógica/física del juego.** Justificación: decisión explícita del usuario — evita que una "skin" termine afectando balance de dificultad o comportamiento, manteniéndolo puramente cosmético.
- **Persistencia en `localStorage`, no en Supabase.** Justificación: decisión explícita del usuario tras reconsiderar — evita crear una tabla nueva (`user_skins`), RLS y llamadas de red para un dato cosmético de cliente que no necesita sincronizarse entre dispositivos.
- **`localStorage` aplica igual para usuarios con sesión y sin sesión (invitados), sin lógica condicionada a `useAuth()`.** Justificación: decisión del usuario delegada a criterio propio — más simple que bifurcar el comportamiento por estado de autenticación para algo que no requiere distinguir usuarios.
- **El selector de skin vive en el HUD superior de `GamePlayer.tsx`, no en la pantalla idle ni en `/juegos/[id]`.** Justificación: decisión explícita del usuario — permite cambiar de skin incluso con la partida en curso, junto a Puntuación/Vidas/Nivel.
- **`GameProps`/`GameHandle` (contrato compartido por todos los juegos) no se modifica en este spec.** Justificación: decisión explícita del usuario de limitar el alcance a Asteroids primero; `skin` se agrega como prop propia de `AsteroidsGame`, evitando forzar el concepto de skin en juegos que aún no lo soportan (Tetris, Breakout, Frogger).
- **Solo se implementan las 3 paletas ya propuestas por `skin-designer` (Clásico/Neon/Retro), sin editor de colores custom.** Justificación: decisión explícita del usuario — reduce el alcance a lo ya diseñado y evaluado, sin abrir la puerta a UI de selección de color libre.
- **Alcance limitado a Asteroids; Breakout/Tetris/Frogger quedan fuera hasta validar el patrón.** Justificación: decisión explícita del usuario — "si funciona bien implementaremos a los demás", evita comprometerse a un cambio de 4 componentes antes de confirmar que el enfoque (prop opcional + HUD condicional) funciona bien en uno solo.

## Riesgos identificados

| Riesgo                                                                                                                                                                                                                          | Mitigación                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `localStorage` no está disponible en el render de servidor (SSR) de Next.js, y puede lanzar en navegación privada con almacenamiento bloqueado.                                                                                 | Leer `localStorage` solo dentro de un `useEffect` (nunca durante el render inicial/SSR) y envolver el acceso en `try/catch`, cayendo a `"classic"` si falla.                                                                                             |
| El loop de `requestAnimationFrame` en `AsteroidsGame` captura `skin` por closure; si se lee desde el valor de la prop en el momento de montar el efecto, cambiar de skin en caliente no se reflejaría hasta reiniciar el juego. | Guardar `skin` en un `ref` actualizado en cada render (mismo patrón que ya usa `keysRef`/`stateRef`), y leer `skinRef.current` dentro de `draw()` en cada frame.                                                                                         |
| Pasar `skin` condicionalmente solo para Asteroids en `GamePlayer.tsx` (spread condicional) puede volverse frágil si `GAME_COMPONENTS` crece y alguien copia el patrón sin revisar el tipo de prop del componente destino.       | Tipar la prop `skin` como específica de `AsteroidsGame` (no parte de `GameProps`) y aplicar el spread solo bajo `game.id === "asteroids"`, dejando un comentario corto explicando por qué es un caso especial hasta que se generalice en un spec futuro. |
