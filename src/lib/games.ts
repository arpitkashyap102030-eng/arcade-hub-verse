import aviator from "@/assets/game-aviator.jpg";
import chickenRoad from "@/assets/game-chicken-road.jpg";
import towerRush from "@/assets/game-tower-rush.jpg";
import mines from "@/assets/game-mines.jpg";
import vortex from "@/assets/game-vortex.jpg";
import jetx from "@/assets/game-jetx.jpg";
import cricketx from "@/assets/game-cricketx.jpg";
import goRush from "@/assets/game-go-rush.jpg";
import chickenDash from "@/assets/game-chicken-dash.jpg";
import dice from "@/assets/game-dice.jpg";

export type Engine = "crash" | "road" | "tower" | "mines" | "dice";
export type Category = "crash" | "table" | "hot" | "slot" | "live" | "fishing";

export type GameDef = {
  slug: string;
  name: string;
  studio: string;
  image: string;
  engine: Engine;
  categories: Category[];
  tagline: string;
  /** Engine tuning knobs so each title plays differently. */
  config: Record<string, number | string>;
};

export const GAMES: GameDef[] = [
  {
    slug: "aviator",
    name: "Aviator",
    studio: "Scribe",
    image: aviator,
    engine: "crash",
    categories: ["crash", "hot"],
    tagline: "Cash out before the plane flies away.",
    config: { speed: 0.055, theme: "plane", icon: "✈️" },
  },
  {
    slug: "go-rush",
    name: "Go Rush",
    studio: "JILI",
    image: goRush,
    engine: "crash",
    categories: ["crash"],
    tagline: "Ride the rocket as far as you dare.",
    config: { speed: 0.075, theme: "rocket", icon: "🚀" },
  },
  {
    slug: "chicken-road-2",
    name: "Chicken Road 2",
    studio: "Inout",
    image: chickenRoad,
    engine: "road",
    categories: ["crash", "hot"],
    tagline: "Cross lane by lane. Don't get flattened.",
    config: { lanes: 12, risk: 0.14, icon: "🐔" },
  },
  {
    slug: "vortex",
    name: "Vortex",
    studio: "Turbo",
    image: vortex,
    engine: "crash",
    categories: ["crash"],
    tagline: "The portal pulls harder every second.",
    config: { speed: 0.1, theme: "vortex", icon: "🌀" },
  },
  {
    slug: "tower-rush",
    name: "Tower Rush",
    studio: "GS",
    image: towerRush,
    engine: "tower",
    categories: ["crash", "table"],
    tagline: "Pick the safe crate on every floor.",
    config: { floors: 8, choices: 3, traps: 1, icon: "📦" },
  },
  {
    slug: "jetx",
    name: "JetX",
    studio: "Smartsoft",
    image: jetx,
    engine: "crash",
    categories: ["crash"],
    tagline: "Neon jet, rising stakes.",
    config: { speed: 0.09, theme: "jet", icon: "🛩️" },
  },
  {
    slug: "cricketx",
    name: "CricketX",
    studio: "Smartsoft",
    image: cricketx,
    engine: "crash",
    categories: ["crash"],
    tagline: "Every ball lifts the multiplier.",
    config: { speed: 0.065, theme: "cricket", icon: "🏏" },
  },
  {
    slug: "mines",
    name: "Mines",
    studio: "Stake",
    image: mines,
    engine: "mines",
    categories: ["crash", "table", "hot"],
    tagline: "Dig for gems, dodge the bombs.",
    config: { grid: 25, icon: "💎" },
  },
  {
    slug: "chicken-dash",
    name: "Chicken Dash",
    studio: "JILI",
    image: chickenDash,
    engine: "road",
    categories: ["crash"],
    tagline: "Sprint the field, grab the coins.",
    config: { lanes: 9, risk: 0.2, icon: "🐤" },
  },
  {
    slug: "lucky-dice",
    name: "Lucky Dice",
    studio: "3CR",
    image: dice,
    engine: "dice",
    categories: ["table", "hot"],
    tagline: "Set your odds, roll under the line.",
    config: { icon: "🎲" },
  },
];

export const HOUSE_EDGE = 0.99;

export function getGame(slug: string): GameDef | undefined {
  return GAMES.find((g) => g.slug === slug);
}

export const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: "hot", label: "Hot", icon: "🔥" },
  { id: "table", label: "Table", icon: "🎰" },
  { id: "live", label: "Live", icon: "📹" },
  { id: "slot", label: "Slot", icon: "🍒" },
  { id: "crash", label: "Crash", icon: "📈" },
  { id: "fishing", label: "Fishing", icon: "🎣" },
];

/** Provably-style crash point with a 1% house edge. Capped at 1000x. */
export function rollCrashPoint(): number {
  const u = Math.random();
  if (u < 0.01) return 1;
  return Math.min(1000, Math.max(1, Math.floor((HOUSE_EDGE / (1 - u)) * 100) / 100));
}

/** Fair multiplier for surviving `steps` independent hazards of probability `risk`. */
export function stepMultiplier(steps: number, risk: number): number {
  return Math.round((HOUSE_EDGE / Math.pow(1 - risk, steps)) * 100) / 100;
}

/** Mines payout after revealing `picks` safe tiles from `total` with `bombs` bombs. */
export function minesMultiplier(total: number, bombs: number, picks: number): number {
  let m = 1;
  for (let i = 0; i < picks; i++) {
    m *= (total - i) / (total - bombs - i);
  }
  return Math.round(m * HOUSE_EDGE * 100) / 100;
}

export function formatCoins(n: number): string {
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
