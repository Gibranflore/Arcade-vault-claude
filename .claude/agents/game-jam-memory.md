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
- Estado: generado

## piratas — Piratas: barcos, tesoros, islas, combate naval, kraken (2026-09-02)

- Carpeta: specs/game-jam-piratas/
- Conceptos:
  - Cannon Storm (`cannon-storm`): combate naval top-down con inercia de barco, disparo exclusivamente broadside (babor/estribor con cooldown propio), oleadas de barcos enemigos con IA de aproximación/costado/retirada y ataques periódicos telegrafiados de un Kraken.
  - Treasure Diver (`treasure-diver`): descenso vertical de un buzo con oxígeno limitado y mecánica de banking push-your-luck (el tesoro recogido solo cuenta al volver a la superficie), criaturas marinas que restan oxígeno y un Kraken de zonas profundas con telegraph.
- Estado: generado
