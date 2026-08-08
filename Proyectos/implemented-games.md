# Juegos implementados — Arcade Vault

Juegos jugables en la plataforma (registrados en `app/lib/games.ts` **y** wireados en `GAME_COMPONENTS` dentro de `app/components/GamePlayer.tsx`, con guardado de puntuación en Supabase).

## 1. Asteroids

- **id:** `asteroids`
- **Categoría:** Acción
- **Año:** 1979
- **Controles:** Flechas + Espacio
- **Componente:** `app/games/AsteroidsGame.tsx`
- **Descripción:** Navega por el espacio infinito, dispara a los asteroides y divídelos en pedazos más pequeños. Cuidado con las colisiones. Un clásico de vector y gravedad cero.

## 2. Breakout

- **id:** `breakout`
- **Categoría:** Arcade
- **Año:** 1976
- **Controles:** Flechas o ratón
- **Componente:** `app/games/BreakoutGame.tsx`
- **Descripción:** El legendario juego de ladrillos. Mueve la paleta, rebota la pelota y destruye cada bloque. Cada nivel aumenta la velocidad. Un tributo al arcade original de Atari.

## 3. Tetris

- **id:** `tetris`
- **Categoría:** Puzzle
- **Año:** 1984
- **Controles:** Flechas
- **Componente:** `app/games/TetrisGame.tsx`
- **Descripción:** El puzzle más adictivo de la historia. Las piezas caen, tú decides dónde colocarlas. Completa líneas para eliminarlas y ganar puntos. Si las piezas llegan arriba, se acaba.

---

## Próximamente (registrados pero no jugables)

Estos juegos existen como metadata en `app/lib/games.ts` (`COMING_SOON_GAMES`) pero no tienen componente wireado en `GAME_COMPONENTS`, por lo que muestran la pantalla "PRÓXIMAMENTE" en vez de ser jugables:

- **Snake** (`snake`) — Clásico, 1976, Flechas o WASD
- **Space Invaders** (`invaders`) — Acción, 1978, Flechas + Espacio
- **Pac-Maze** (`pacman`) — Clásico, 1980, Flechas o WASD
