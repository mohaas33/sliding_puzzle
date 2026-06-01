import type { ChapterProgress } from "../types";

export {
  nextSolverMove,
  bfsNextMove,
  greedyNextMove,
  totalManhattanDistance,
} from "@sliding-puzzle/game-logic";

export function personalize(template: string, name: string): string {
  return template.replace(/\{name\}/g, name);
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export interface PointsResult {
  total: number;
  breakdown: string;
}

export function calculatePoints(
  stars: number,
  moves: number,
  elapsed: number,
  raLightUsed: number,
  thothUsed: number,
): PointsResult {
  // Base: 1000 minus 10 per move, floored at 100
  const moveCost = moves * 10;
  const base = Math.max(100, 1000 - moveCost);

  // Speed bonus (time-based)
  const speedBonus = elapsed < 30 ? 200 : elapsed < 60 ? 100 : 0;

  // No hints bonus (Ra's Light and Thoth's Hand are hints; Vision is free)
  const noHints = raLightUsed === 0 && thothUsed === 0;
  const noHintsBonus = noHints ? 100 : 0;

  // Stars bonus (1/2/3 stars based on which favors were used)
  const starsBonus = stars * 50;

  const total = base + speedBonus + noHintsBonus + starsBonus;

  // Human-readable breakdown
  // e.g. "Base 1000 − 14×10 = 860 + Speed +100 + No hints +100 + Stars +150 = ✦ 1210 pts"
  let bd = `Base 1000`;
  if (moveCost > 0) bd += ` − ${moves}×10 = ${base}`;
  if (speedBonus > 0) bd += ` + Speed +${speedBonus}`;
  if (noHintsBonus > 0) bd += ` + No favors +${noHintsBonus}`;
  if (starsBonus > 0) bd += ` + Stars +${starsBonus}`;
  bd += ` = ✦ ${total} pts`;

  return { total, breakdown: bd };
}

export function getStars(raLightUsed: number, thothUsed: number): number {
  if (thothUsed > 0) return 1;
  if (raLightUsed > 0) return 2;
  return 3;
}

export function getPuzzleState(
  id: number,
  progress: ChapterProgress,
): "completed" | "current" | "locked" {
  if (progress[id]) return "completed";
  if (id === 1 || progress[id - 1]) return "current";
  return "locked";
}
