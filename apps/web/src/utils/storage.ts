import { isSolved } from "@sliding-puzzle/game-logic";
import type { Difficulty, SaveState, ChapterProgress } from "../types";
import { DIFFICULTY_KEY, PROGRESS_KEY, MAX_STEPS } from "../constants";

export function saveKeyFor(n: Difficulty): string {
  return `shards_of_time_${n}x${n}_v1`;
}

export function loadDifficulty(): Difficulty {
  const raw = localStorage.getItem(DIFFICULTY_KEY);
  if (raw === "3" || raw === "4" || raw === "5") return Number(raw) as Difficulty;
  return 5;
}

export function persistDifficulty(n: Difficulty) {
  localStorage.setItem(DIFFICULTY_KEY, String(n));
}

export function loadProgress(): ChapterProgress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? (JSON.parse(raw) as ChapterProgress) : {};
  } catch {
    return {};
  }
}

export function persistProgress(p: ChapterProgress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
}

export function loadSave(n: Difficulty): SaveState | null {
  try {
    const raw = localStorage.getItem(saveKeyFor(n));
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<SaveState>;
    if (!Array.isArray(data.tiles) || data.tiles.length !== n * n) return null;
    if (typeof data.moves !== "number" || typeof data.elapsed !== "number") return null;
    // Discard a solved save — restoring it would trigger the win screen immediately
    if (isSolved(data.tiles)) return null;
    return {
      tiles: data.tiles,
      moves: data.moves,
      elapsed: data.elapsed,
      stepsLeft: typeof data.stepsLeft === "number" ? data.stepsLeft : MAX_STEPS,
    };
  } catch {
    return null;
  }
}

export function writeSave(n: Difficulty, state: SaveState) {
  localStorage.setItem(saveKeyFor(n), JSON.stringify(state));
}

export function clearSave(n: Difficulty) {
  localStorage.removeItem(saveKeyFor(n));
}
