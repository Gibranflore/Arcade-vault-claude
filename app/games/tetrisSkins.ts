export type TetrisSkin = {
  id: "classic" | "neon" | "retro";
  label: string;
  bg: string;
  gridLine: string; // admite rgba(...)
  pieceColors: [string, string, string, string, string, string, string]; // I,O,T,S,Z,J,L (índice 0 = pieza tipo 1)
  sidebarText: string;
};

export const TETRIS_SKINS: Record<TetrisSkin["id"], TetrisSkin> = {
  classic: {
    id: "classic",
    label: "Clásico",
    bg: "#000000",
    gridLine: "#22222e",
    pieceColors: [
      "#4dd0e1",
      "#ffd54f",
      "#ba68c8",
      "#81c784",
      "#e57373",
      "#7986cb",
      "#ffb74d",
    ],
    sidebarText: "#888888",
  },
  neon: {
    id: "neon",
    label: "Neon",
    bg: "#0a0014",
    gridLine: "rgba(0,245,255,0.15)",
    pieceColors: [
      "#00f5ff",
      "#f5ff00",
      "#ff2bd6",
      "#39ff14",
      "#ff1744",
      "#7c4dff",
      "#ff8c1a",
    ],
    sidebarText: "#00f5ff",
  },
  retro: {
    id: "retro",
    label: "Retro",
    bg: "#0f380f",
    gridLine: "#306230",
    pieceColors: [
      "#9bbc0f",
      "#8bac0f",
      "#306230",
      "#9bbc0f",
      "#8bac0f",
      "#306230",
      "#0f380f",
    ],
    sidebarText: "#8bac0f",
  },
};

export const DEFAULT_TETRIS_SKIN = TETRIS_SKINS.classic;
