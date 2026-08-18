export type FroggerSkin = {
  id: "classic" | "neon" | "retro";
  label: string;
  laneGoal: string;
  laneSafe: string;
  laneRoad: string;
  laneRiver: string;
  goalActive: string;
  goalInactive: string;
  goalBorder: string;
  car: string;
  truck: string;
  log: string;
  crocodile: string;
  crocodileMouth: string;
  frog: string;
  frogEyes: string;
};

export const FROGGER_SKINS: Record<FroggerSkin["id"], FroggerSkin> = {
  classic: {
    id: "classic",
    label: "Clásico",
    laneGoal: "#0d2b1f",
    laneSafe: "#123a24",
    laneRoad: "#1c1c22",
    laneRiver: "#0a2a4a",
    goalActive: "#39ff14",
    goalInactive: "#0a1a12",
    goalBorder: "#39ff14",
    car: "#ff3860",
    truck: "#ff8c00",
    log: "#8a5a2b",
    crocodile: "#2f6b2f",
    crocodileMouth: "#ff003c",
    frog: "#39ff14",
    frogEyes: "#0a1a12",
  },
  neon: {
    id: "neon",
    label: "Neon",
    laneGoal: "#0a0018",
    laneSafe: "#05020a",
    laneRoad: "#0d0014",
    laneRiver: "#030014",
    goalActive: "#00f5ff",
    goalInactive: "#150a2a",
    goalBorder: "#00f5ff",
    car: "#ff2bd6",
    truck: "#ff8c1a",
    log: "#f5ff00",
    crocodile: "#39ff14",
    crocodileMouth: "#ff003c",
    frog: "#00f5ff",
    frogEyes: "#0a0018",
  },
  retro: {
    id: "retro",
    label: "Retro",
    laneGoal: "#f8d800",
    laneSafe: "#00a800",
    laneRoad: "#545454",
    laneRiver: "#0058f8",
    goalActive: "#f8f8f8",
    goalInactive: "#7c7c7c",
    goalBorder: "#000000",
    car: "#f83800",
    truck: "#a44200",
    log: "#a44200",
    crocodile: "#005800",
    crocodileMouth: "#f83800",
    frog: "#b8f818",
    frogEyes: "#000000",
  },
};

export const DEFAULT_FROGGER_SKIN = FROGGER_SKINS.classic;
