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
    particle: "#ffffff",
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
