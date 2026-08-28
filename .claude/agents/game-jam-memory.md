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

## piratas — Piratas: barcos, tesoros, mar, combate naval, islas (2026-08-28)

- Carpeta: specs/game-jam-piratas/
- Conceptos:
  - Fuego Cruzado (`fuego-cruzado`): combate naval con inercia (rotación + impulso), disparo de cañones por babor/estribor contra oleadas de barcos enemigos, islas como obstáculos/cobertura, cofres de tesoro flotante al hundir barcos.
  - Cazatesoros: Isla Maldita (`cazatesoros`): excavación en grid con movimiento discreto por celda, cofres enterrados bajo arena, arena movediza, rivales cazatesoros con IA greedy y marea que inunda el mapa en anillos concéntricos.
- Estado: generado
