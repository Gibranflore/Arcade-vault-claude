# Historial de game jams — game-jam

Registro de temas procesados y conceptos de juego generados por el agente `@game-jam`, para evitar repetir ideas entre sesiones.

<!-- Formato por entrada:
## <game-id> — <tema> (<fecha YYYY-MM-DD>)
- Carpeta: specs/game-jam-<game-id>/
- Conceptos:
  - <Nombre concepto 1>: <mecánica core en una línea>
  - <Nombre concepto 2>: <mecánica core en una línea>
- Estado: generado | implementado
-->

## frogger — Frogger: cruza la carretera y el río sin que te aplasten o te coman los cocodrilos (2026-08-12)

- Carpeta: specs/game-jam-frogger/
- Conceptos:
  - Frogger Clásico (`frogger`): tablero fijo de carriles horizontales (carretera + río), salto discreto por celda, arrastre solidario sobre troncos/cocodrilos, meta de 5 casas.
  - Hoppy Hazard (`hoppy-hazard`): scroll vertical infinito con salto automático (estilo Doodle Jump), control horizontal en el aire, agua ascendente y plataformas que se hunden (cocodrilos) o rebotan (troncos).
- Estado: generado (Frogger Clásico implementado en `app/games/FroggerGame.tsx` y catálogo; Hoppy Hazard sigue en Draft)

## piratas — Piratas (2026-09-01)

- Carpeta: specs/game-jam-piratas/
- Conceptos:
  - Cañones a Babor (`canones-a-babor`): combate naval top-down en mar acotado, movimiento inercial del barco, disparo de cañones por costado (babor/estribor, perpendicular a la proa) contra oleadas de barcos enemigos, botín flotante.
  - Duelo de Espadas al Atardecer (`duelo-de-espadas`): duelo de esgrima de reacción por patrones, bloqueo de ataques telegrafiados por zona (alto/medio/bajo) con fintas, ventanas de contraataque, sucesión de capitanes enemigos.
- Estado: generado
