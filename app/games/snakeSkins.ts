export type SnakeSkin = {
  id: "classic" | "neon" | "retro";
  label: string;
  bg: string;
  head: string;
  body: string;
  food: string;
};

export const SNAKE_SKINS: Record<SnakeSkin["id"], SnakeSkin> = {
  classic: {
    id: "classic",
    label: "Clásico",
    bg: "#000000",
    head: "#7cff5c",
    body: "#39ff14",
    food: "#f5ff00",
  },
  neon: {
    id: "neon",
    label: "Neon",
    bg: "#0a0014",
    head: "#00f5ff",
    body: "#ff2bd6",
    food: "#f5ff00",
  },
  retro: {
    id: "retro",
    label: "Retro",
    bg: "#0f380f",
    head: "#9bbc0f",
    body: "#8bac0f",
    food: "#306230",
  },
};

export const DEFAULT_SNAKE_SKIN = SNAKE_SKINS.classic;
