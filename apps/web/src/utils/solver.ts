import { getMovableTiles, moveTile, isSolved } from "@sliding-puzzle/game-logic";
import type { ChapterProgress } from "../types";

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function getStars(moves: number): number {
  if (moves < 30) return 3;
  if (moves < 60) return 2;
  return 1;
}

export function getPuzzleState(
  id: number,
  progress: ChapterProgress,
): "completed" | "current" | "locked" {
  if (progress[id]) return "completed";
  if (id === 1 || progress[id - 1]) return "current";
  return "locked";
}

export function totalManhattanDistance(tiles: readonly number[], n: number): number {
  const emptyVal = n * n - 1;
  let total = 0;
  for (let i = 0; i < tiles.length; i++) {
    const v = tiles[i]!;
    if (v === emptyVal) continue;
    total += Math.abs(Math.floor(i / n) - Math.floor(v / n)) + Math.abs((i % n) - (v % n));
  }
  return total;
}

// BFS: exact optimal next move for 3×3 (state space ≤ 181440).
function bfsNextMove(tiles: readonly number[], n: number): number | null {
  if (isSolved(tiles)) return null;
  const emptyVal = n * n - 1;
  const startKey = tiles.join(",");
  type Entry = { state: number[]; emptyIdx: number; firstMove: number };
  const visited = new Set<string>([startKey]);
  const queue: Entry[] = [];

  const startEmpty = (tiles as number[]).indexOf(emptyVal);
  for (const tileIdx of getMovableTiles(tiles as number[], startEmpty, n)) {
    const res = moveTile(tiles as number[], tileIdx, startEmpty);
    if (isSolved(res.tiles)) return tileIdx;
    const key = res.tiles.join(",");
    if (!visited.has(key)) {
      visited.add(key);
      queue.push({ state: res.tiles, emptyIdx: res.emptyIdx, firstMove: tileIdx });
    }
  }

  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const tileIdx of getMovableTiles(cur.state, cur.emptyIdx, n)) {
      const res = moveTile(cur.state, tileIdx, cur.emptyIdx);
      if (isSolved(res.tiles)) return cur.firstMove;
      const key = res.tiles.join(",");
      if (!visited.has(key)) {
        visited.add(key);
        queue.push({ state: res.tiles, emptyIdx: res.emptyIdx, firstMove: cur.firstMove });
      }
    }
  }
  return null;
}

// Greedy: pick the move that minimises total Manhattan distance of the resulting board.
// Excludes the tile that was last moved to prevent immediate reversal.
function greedyNextMove(
  tiles: readonly number[],
  n: number,
  lastMovedValue: number | null,
): number | null {
  const emptyVal = n * n - 1;
  const eIdx = (tiles as number[]).indexOf(emptyVal);
  const candidates = getMovableTiles(tiles as number[], eIdx, n);
  if (candidates.length === 0) return null;

  let bestIdx: number | null = null;
  let bestScore = Infinity;

  for (const tileIdx of candidates) {
    if (tiles[tileIdx] === lastMovedValue) continue;
    const res = moveTile(tiles as number[], tileIdx, eIdx);
    const score = totalManhattanDistance(res.tiles, n);
    if (score < bestScore) { bestScore = score; bestIdx = tileIdx; }
  }

  // Fallback if every candidate was the last-moved tile (shouldn't normally happen)
  if (bestIdx === null) {
    for (const tileIdx of candidates) {
      const res = moveTile(tiles as number[], tileIdx, eIdx);
      const score = totalManhattanDistance(res.tiles, n);
      if (score < bestScore) { bestScore = score; bestIdx = tileIdx; }
    }
  }

  return bestIdx;
}

export function nextSolverMove(
  tiles: readonly number[],
  n: number,
  lastMovedValue: number | null,
): number | null {
  if (isSolved(tiles)) return null;
  return n === 3
    ? bfsNextMove(tiles, n)
    : greedyNextMove(tiles, n, lastMovedValue);
}
