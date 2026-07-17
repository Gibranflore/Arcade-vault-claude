import type { LucideIcon } from 'lucide-react';
import { Gamepad2, Grid3x3, Ghost, Rocket, Blocks, Bug } from 'lucide-react';

export type GameCategory = 'Clásico' | 'Acción' | 'Puzzle' | 'Arcade';

export type GameDef = {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  category: GameCategory;
  color: string;
  accent: 'cyan' | 'magenta' | 'yellow' | 'green';
  icon: LucideIcon;
  controls: string;
  year: string;
};

export const GAMES: GameDef[] = [
  {
    id: 'snake',
    title: 'SNAKE',
    description: 'Devora puntos y crece sin chocar contigo mismo.',
    longDescription: 'El clásico Snake de los teléfonos antiguos. Controla la serpiente, come los puntos y crece cada vez más. Evita chocar contra las paredes o contra tu propio cuerpo. ¿Hasta dónde podrás llegar?',
    category: 'Clásico',
    color: '#39ff14',
    accent: 'green',
    icon: Grid3x3,
    controls: 'Flechas o WASD',
    year: '1976',
  },
  {
    id: 'breakout',
    title: 'BREAKOUT',
    description: 'Rebota la pelota y destruye todos los ladrillos.',
    longDescription: 'El legendario juego de ladrillos. Mueve la paleta, rebota la pelota y destruye cada bloque. Cada nivel aumenta la velocidad. Un tributo al arcade original de Atari.',
    category: 'Arcade',
    color: '#00f5ff',
    accent: 'cyan',
    icon: Gamepad2,
    controls: 'Flechas o ratón',
    year: '1976',
  },
  {
    id: 'tetris',
    title: 'TETRIS',
    description: 'Encaja las piezas y completa líneas sin parar.',
    longDescription: 'El puzzle más adictivo de la historia. Las piezas caen, tú decides dónde colocarlas. Completa líneas para eliminarlas y ganar puntos. Si las piezas llegan arriba, se acaba.',
    category: 'Puzzle',
    color: '#f5ff00',
    accent: 'yellow',
    icon: Blocks,
    controls: 'Flechas',
    year: '1984',
  },
];

export const COMING_SOON_GAMES: GameDef[] = [
  {
    id: 'invaders',
    title: 'SPACE INVADERS',
    description: 'Defiende la galaxia de la invasión alienígena.',
    longDescription: 'Oleadas de alienígenas descienden hacia tu nave. Dispara, esquiva y sobrevive. Cada nivel trae enemigos más rápidos y agresivos. El shoot-em-up que lo empezó todo.',
    category: 'Acción',
    color: '#ff006e',
    accent: 'magenta',
    icon: Rocket,
    controls: 'Flechas + Espacio',
    year: '1978',
  },
  {
    id: 'pacman',
    title: 'PAC-MAZE',
    description: 'Recorre el laberinto y devora todas las monedas.',
    longDescription: 'Un tributo a Pac-Man. Recorre el laberinto, come todos los puntos y evita a los fantasmas. Las monedas grandes te dan poder temporal para devorarlos. ¿Podrás limpiar el tablero?',
    category: 'Clásico',
    color: '#f5ff00',
    accent: 'yellow',
    icon: Bug,
    controls: 'Flechas o WASD',
    year: '1980',
  },
  {
    id: 'asteroids',
    title: 'ASTEROIDS',
    description: 'Vuela por el espacio y destruye asteroides a la deriva.',
    longDescription: 'Navega por el espacio infinito, dispara a los asteroides y divídelos en pedazos más pequeños. Cuidado con las colisiones. Un clásico de vector y gravedad cero.',
    category: 'Acción',
    color: '#39ff14',
    accent: 'green',
    icon: Ghost,
    controls: 'Flechas + Espacio',
    year: '1979',
  },
];

export function getGame(id: string): GameDef | undefined {
  return GAMES.find((g) => g.id === id);
}
