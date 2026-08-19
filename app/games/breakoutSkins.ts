export type BreakoutSkin = {
  id: "classic" | "neon" | "retro";
  label: string;
  bg: string;
  rowColors: [string, string, string, string, string]; // una por fila de bloques
  indestructible: string;
  blockBorder: string; // admite rgba(...)
  paddle: string;
  ball: string;
};

export const BREAKOUT_SKINS: Record<BreakoutSkin["id"], BreakoutSkin> = {
  classic: {
    id: "classic",
    label: "Clásico",
    bg: "#000000",
    rowColors: ["#ff2bd6", "#00f5ff", "#39ff14", "#f5ff00", "#ff8c1a"],
    indestructible: "#666666",
    blockBorder: "rgba(0,0,0,0.4)",
    paddle: "#ffffff",
    ball: "#00f5ff",
  },
  neon: {
    id: "neon",
    label: "Neon",
    bg: "#05010a",
    rowColors: ["#ff003c", "#00f5ff", "#39ff14", "#f5ff00", "#ff2bd6"],
    indestructible: "#3a2a4a",
    blockBorder: "rgba(0,245,255,0.35)",
    paddle: "#f5ff00",
    ball: "#ff2bd6",
  },
  retro: {
    id: "retro",
    label: "Retro",
    bg: "#000000",
    rowColors: ["#ffb000", "#e0d000", "#4caf50", "#2e7d32", "#8d6e00"],
    indestructible: "#4a4a4a",
    blockBorder: "rgba(0,0,0,0.6)",
    paddle: "#cfd8c0",
    ball: "#ffb000",
  },
};

export const DEFAULT_BREAKOUT_SKIN = BREAKOUT_SKINS.classic;
