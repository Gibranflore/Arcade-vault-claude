# Spec 05 — Juego jugable: Asteroids

- **Estado:** Aprobado
- **Dependencias:** Spec 01 (pantallas visuales del MVP — catálogo, GamePlayer placeholder), Spec 04 (Supabase Auth + Scores — tabla `scores`, `submitScore`, `getLeaderboard`)
- **Fecha:** 2026-07-30

**Objetivo:** Portar `Proyectos/07-AsteroidGame/game.js` a un componente React jugable en la plataforma, conectado al HUD/estados reales de `GamePlayer.tsx` y al guardado real de puntuaciones en Supabase.

## Scope

**Dentro del alcance:**

- Nuevo módulo de tipos compartido `app/games/types.ts` con `GameProps` y `GameHandle` (mismo contrato que la referencia en `app/src/games/types.ts`: `onScore`, `onLives`, `onLevel`, `onGameOver`, `onReady`, `isPaused`).
- Nuevo componente `app/games/AsteroidsGame.tsx`: puerto a React/canvas de `Proyectos/07-AsteroidGame/game.js`, conservando su mecánica (nave con inercia/drag, wrap toroidal, asteroides grandes/medianos/pequeños con split, power-ups de triple disparo y bomba, partículas de explosión, invencibilidad parpadeante al reaparecer), pero:
  - Sin HUD propio dibujado en canvas (sin `drawHUD`, sin `drawOverlay` de game over) — el canvas solo dibuja nave/asteroides/balas/partículas/power-ups.
  - Score/vidas/nivel/game-over se reportan vía `onScore`/`onLives`/`onLevel`/`onGameOver`, no variables internas sueltas.
  - Estructura `start`/`pause`/`resume`/`reset` expuesta vía `onReady` como `GameHandle`, con el loop detenido mientras `isPaused` sea `true`.
  - Controles idénticos al original: `ArrowLeft`/`ArrowRight` rotar, `ArrowUp` propulsar, `Espacio` disparar (sin alias WASD).
  - Resolución interna 800×600 (igual al original), escalado por CSS (`width:100%`, `objectFit:contain`) para caber en el marco CRT existente.
- Reescritura completa de `app/components/GamePlayer.tsx` (hoy solo placeholder) portando la lógica de estados de la referencia (`app/src/pages/GamePlayer.tsx`): `idle`/`playing`/`paused`/`over`, botones INICIAR/PAUSA/CONTINUAR/SALIR, overlay de game over con puntaje final y botones GUARDAR/DE NUEVO/VOLVER AL VAULT.
- Conectar `renderGame()` de `GamePlayer.tsx` para instanciar `AsteroidsGame` cuando `game.id === 'asteroids'`; para cualquier otro `game.id` se mantiene el placeholder "Próximamente" actual (no se tocan Snake/Breakout/Tetris/Invaders/Pac-Man).
- Conectar el guardado real de puntuación: al presionar GUARDAR en game-over, llamar a `submitScore(game.id, user.id, score)` (de `app/lib/scores.ts`, ya existente desde spec 04) solo si hay `user` autenticado.
- Botón GUARDAR oculto/reemplazado para invitados (`guest` sin `user`): en su lugar se muestra el mensaje ya existente "Inicia sesión para guardar tus puntuaciones en el Salón de la Fama".
- Mover la entrada `asteroids` de `COMING_SOON_GAMES` a `GAMES` en `app/lib/games.ts` (queda visible/jugable/filtrable en la Biblioteca `/`, con leaderboard real en `/juegos/asteroids` vía `getLeaderboard`/`getUserBest`, ya funcionales desde spec 04).
- Verificación funcional con Playwright: navegar a `/juegos/asteroids`, iniciar el juego, confirmar renderizado del canvas (nave/asteroides visibles), probar pausa y salir. Verificar guardado real de puntaje y el flujo de game-over queda como paso manual (jugando de verdad), documentado como tal.

**Fuera de alcance (explícitamente NO se hace):**

- Cualquier otro juego real (Snake, Breakout, Tetris, Space Invaders, Pac-Man) — siguen igual que hoy (los 3 primeros con placeholder "Próximamente" si aplica, los últimos 2 en `COMING_SOON_GAMES`).
- Mecanismo de testing/debug para forzar game-over programáticamente vía Playwright (ej. exponer el handle en `window`) — la verificación de guardado de puntaje queda manual.
- Cambios a la tabla `scores`, RLS, o a `app/lib/scores.ts`/`app/lib/supabase/*` — se reutilizan tal cual de spec 04.
- Sonido/efectos de audio (el original `game.js` no tiene, no se agrega).
- Alias de controles WASD o soporte táctil/móvil para Asteroids.
- Borrar `Proyectos/07-AsteroidGame/` — se mantiene intacto como referencia, igual que `app/src/` según decisión de spec 01.

## Modelo de datos

No se introducen estructuras de datos nuevas. Se reutilizan tal cual:

- `GameDef` / `GAMES` / `COMING_SOON_GAMES` (`app/lib/games.ts`, spec 01) — solo cambia la lista a la que pertenece `asteroids`.
- `ScoreRow`, `getLeaderboard`, `getUserBest`, `submitScore` (`app/lib/scores.ts`, spec 04) — sin cambios de firma.
- `GameProps` / `GameHandle` — nuevos, pero como **contrato de tipos** (no persistencia), definidos en `app/games/types.ts` calcando `app/src/games/types.ts`.

## Plan de implementación

1. **Contrato de tipos.** Crear `app/games/types.ts` con `GameProps` y `GameHandle`, idéntico a `app/src/games/types.ts`. El sistema sigue funcional (nadie lo importa aún).

2. **Puerto del juego.** Crear `app/games/AsteroidsGame.tsx`: portar clases `Bullet`/`Asteroid`/`Ship`/`Particle`/`PowerUp` y la lógica de `update`/`draw` de `game.js` dentro de un componente React con canvas + `useRef`/`useEffect` (mismo patrón que `app/src/games/AsteroidsGame.tsx`: `stateRef` para el estado mutable del juego, loop vía `requestAnimationFrame`, `keysRef` para input). Quitar `drawHUD`/`drawOverlay` del `draw()` portado; en su lugar, invocar `onScore`/`onLives`/`onLevel` cuando cambian y `onGameOver()` al entrar en `state === 'gameover'`. Exponer `start`/`pause`/`resume`/`reset` vía `onReady`, congelando el loop de `update` (no `draw`) mientras `isPaused` sea `true`. El sistema sigue funcional (componente aún no usado en ninguna ruta).

3. **GamePlayer con estados reales.** Reescribir `app/components/GamePlayer.tsx` portando de `app/src/pages/GamePlayer.tsx`: estados `idle`/`playing`/`paused`/`over`, HUD de score/vidas/nivel ya presente en el marco, botones PAUSA/CONTINUAR, overlay de pausa, overlay de game over (puntaje final, botones GUARDAR/DE NUEVO/VOLVER AL VAULT), y `renderGame()` que devuelve `<AsteroidsGame {...commonProps} />` si `game.id === 'asteroids'`, o el placeholder "Próximamente" actual (`Clock` + texto) para cualquier otro `game.id`. El sistema sigue funcional (resto de juegos conserva su placeholder).

4. **Guardado real de puntaje.** En el handler de GUARDAR de `GamePlayer.tsx`, llamar a `submitScore(game.id, user.id, score)` (de `app/lib/scores.ts`) solo si `user` existe; mostrar estado `saving`/`saved`/`saveError` igual que la referencia. Si no hay `user` (invitado o sin sesión), no se muestra el botón GUARDAR — se muestra el mensaje existente "Inicia sesión para guardar tus puntuaciones en el Salón de la Fama".

5. **Catálogo.** Mover el objeto `asteroids` de `COMING_SOON_GAMES` a `GAMES` en `app/lib/games.ts`. El sistema queda funcional: `asteroids` aparece en la Biblioteca (`/`), tiene detalle (`/juegos/asteroids`) con leaderboard real, y ahora es jugable de verdad en `/juegos/asteroids/jugar`.

6. **Verificación funcional con Playwright.** Levantar `npm run dev`, navegar a `/juegos/asteroids/jugar`, confirmar overlay idle con botón INICIAR, iniciar el juego y confirmar que el canvas renderiza nave y asteroides, probar PAUSA/CONTINUAR y SALIR. Documentar en el propio spec que el guardado real de puntaje (jugar hasta game over, presionar GUARDAR, ver el score reflejado en `/salon-de-la-fama`) se verifica manualmente por el usuario.

## Criterios de aceptación

- [ ] `npm run dev` levanta la app y `/` muestra la tarjeta de ASTEROIDS en el grid jugable (ya no en "Próximamente").
- [ ] `/juegos/asteroids` muestra info, controles (`Flechas + Espacio`) y leaderboard real (vacío o con datos) vía Supabase.
- [ ] `/juegos/asteroids/jugar` muestra el overlay idle con el botón INICIAR; al presionarlo, el canvas renderiza la nave y los asteroides en movimiento.
- [ ] Durante el juego, el HUD del marco (fuera del canvas) refleja score/vidas/nivel actualizándose en tiempo real; el canvas no dibuja su propio HUD ni su propio "GAME OVER".
- [ ] El botón PAUSA detiene el movimiento del juego y muestra el overlay de pausa; CONTINUAR lo reanuda desde el mismo estado.
- [ ] El botón SALIR regresa a `/juegos/asteroids` en cualquier momento (idle, jugando, pausado).
- [ ] Al perder las 3 vidas, aparece el overlay de "FIN DEL JUEGO" del marco con el puntaje final y los botones GUARDAR/DE NUEVO/VOLVER AL VAULT (verificado manualmente).
- [ ] Con sesión iniciada, presionar GUARDAR llama a `submitScore` y el puntaje aparece luego en `/salon-de-la-fama` para el juego Asteroids (verificado manualmente).
- [ ] En modo invitado o sin sesión, el overlay de game over no muestra el botón GUARDAR, sino el mensaje "Inicia sesión para guardar tus puntuaciones en el Salón de la Fama".
- [ ] Snake, Breakout, Tetris, Space Invaders y Pac-Man no cambian de comportamiento (siguen igual que antes de este spec).
- [ ] `npm run lint` pasa sin errores nuevos.
- [ ] Verificación funcional con Playwright realizada para los pasos automatizables (navegación, inicio, render de canvas, pausa, salir) antes de cerrar el spec.

## Decisiones tomadas y descartadas

- **Portar `Proyectos/07-AsteroidGame/game.js` en vez de usar la referencia simplificada `app/src/games/AsteroidsGame.tsx`.** Justificación: decisión explícita del usuario — es el juego que ya construyó y quiere ver funcionando; incluye mecánicas (power-ups, cráteres, partículas) ausentes en la referencia.
- **Quitar el HUD y el overlay de game-over dibujados dentro del canvas.** Justificación: decisión explícita del usuario — evita duplicar HUD (uno en el canvas, otro en el marco de la plataforma) y mantiene consistencia visual con Snake/Breakout/Tetris.
- **Reescribir `GamePlayer.tsx` completo (estados idle/playing/paused/over) en vez de aislar la lógica dentro de `AsteroidsGame.tsx`.** Justificación: decisión explícita del usuario — esta lógica de HUD/pausa/game-over/guardado es genérica y la necesitará cualquier futuro juego real, no solo Asteroids.
- **Invitados no pueden guardar puntaje (botón oculto, no botón que falla).** Justificación: decisión explícita del usuario — coherente con la RLS de `scores` (spec 04, `INSERT` solo si `auth.uid() = user_id`), evita mostrar una acción que siempre fallaría.
- **Controles fieles al original (solo flechas + Espacio, sin WASD).** Justificación: decisión explícita del usuario — prioriza fidelidad al juego ya construido sobre consistencia de controles con otros juegos.
- **Resolución interna 800×600 escalada por CSS, sin redimensionar el canvas real.** Justificación: igual al patrón ya usado en `app/src/games/AsteroidsGame.tsx` (480×360 con `objectFit: contain`); evita reescribir la geometría del juego portado para otra resolución.
- **Verificación de guardado real y game-over manual, sin mecanismo de debug para forzarlo por Playwright.** Justificación: decisión explícita del usuario — evita agregar código de testing ajeno al juego real; Playwright cubre lo automatizable (render, pausa, salir) y el resto se valida jugando de verdad.
- **Solo Asteroids se mueve a `GAMES`; el resto del catálogo no se toca.** Justificación: es el único juego implementado en este spec; mover otros sin lógica real rompería la promesa de "Jugar ahora".

## Riesgos identificados

| Riesgo                                                                                                                                                                                                                                  | Mitigación                                                                                                                                                                                                                                                                      |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El loop de `game.js` original mezcla estado mutable en variables de módulo (`ship`, `bullets`, `score`, etc.); al portarlo a React hay riesgo de fugas de estado entre re-renders o de que `isPaused` no congele el loop correctamente. | Seguir el patrón ya usado en `app/src/games/AsteroidsGame.tsx`: todo el estado mutable vive en un único `stateRef` (fuera de React state), y el `update` interno respeta `isPaused` explícitamente en cada frame, igual que el checkeo `!isPaused && !s.dead` de la referencia. |
| Al quitar `drawHUD`/`drawOverlay`, es fácil olvidar sincronizar algún cambio de score/vidas/nivel con los callbacks `onScore`/`onLives`/`onLevel`, dejando el HUD del marco desactualizado.                                             | Revisar manualmente cada punto donde `game.js` modificaba `score`/`lives`/`level` (colisión bala-asteroide, power-up bomba, `killShip`, `nextLevel`) y confirmar que cada uno dispara el callback correspondiente antes de cerrar el spec.                                      |
| Los invitados no tienen fila en `profiles`/`scores`; si se llama a `submitScore` sin validar `user` primero, Supabase rechazaría el INSERT por RLS y se mostraría un error confuso.                                                     | El botón GUARDAR ya no se renderiza si no hay `user` (ver Scope), eliminando la posibilidad de intentar el INSERT sin sesión.                                                                                                                                                   |
| Resolución fija 800×600 podría verse pequeña/borrosa en pantallas muy angostas dentro del marco CRT (`aspect-[4/3] sm:aspect-[3/2]`).                                                                                                   | Aceptado como riesgo conocido — mismo tradeoff ya asumido por el resto de juegos portados; no se audita responsive más allá de lo heredado (consistente con spec 01).                                                                                                           |
