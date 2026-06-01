import { getMovableTiles, moveTile, isSolved } from "./puzzle.js";
import type { Tiles } from "./puzzle.js";

/**
 * Computes the total Manhattan distance of all non-empty tiles from their
 * solved positions. Lower values indicate a board closer to solved.
 * Used as the heuristic for the greedy solver.
 */
export function totalManhattanDistance(tiles: Tiles, n: number): number {
  const emptyVal = n * n - 1;
  let total = 0;
  for (let i = 0; i < tiles.length; i++) {
    const v = tiles[i]!;
    if (v === emptyVal) continue;
    total +=
      Math.abs(Math.floor(i / n) - Math.floor(v / n)) +
      Math.abs((i % n) - (v % n));
  }
  return total;
}

/**
 * BFS-based exact solver for boards of size n ≤ 3.
 * Throws if called with n > 3 — the state space is too large for safe BFS.
 * Returns the index of the tile to move next, or null if already solved.
 */
export function bfsNextMove(tiles: Tiles, n: number): number | null {
  if (n > 3) {
    throw new Error("bfsNextMove is only safe for n ≤ 3");
  }
  if (isSolved(tiles)) return null;
  const emptyVal = n * n - 1;
  const startKey = (tiles as number[]).join(",");
  interface Entry {
    state: number[];
    emptyIdx: number;
    firstMove: number;
  }
  const visited = new Set<string>([startKey]);
  const queue: Entry[] = [];

  const startEmpty = (tiles as number[]).indexOf(emptyVal);
  for (const tileIdx of getMovableTiles(tiles as number[], startEmpty, n)) {
    const res = moveTile(tiles as number[], tileIdx, startEmpty);
    if (isSolved(res.tiles)) return tileIdx;
    const key = res.tiles.join(",");
    if (!visited.has(key)) {
      visited.add(key);
      queue.push({
        state: res.tiles,
        emptyIdx: res.emptyIdx,
        firstMove: tileIdx,
      });
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
        queue.push({
          state: res.tiles,
          emptyIdx: res.emptyIdx,
          firstMove: cur.firstMove,
        });
      }
    }
  }
  return null;
}

/**
 * Greedy solver: picks the move that minimises total Manhattan distance of
 * the resulting board. Excludes the tile that was last moved to prevent
 * immediate reversal. Falls back to all candidates if every candidate was
 * the last-moved tile.
 * Returns the index of the tile to move next, or null if no candidates exist.
 */
export function greedyNextMove(
  tiles: Tiles,
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
    if (score < bestScore) {
      bestScore = score;
      bestIdx = tileIdx;
    }
  }

  // Fallback if every candidate was the last-moved tile (shouldn't normally happen)
  if (bestIdx === null) {
    for (const tileIdx of candidates) {
      const res = moveTile(tiles as number[], tileIdx, eIdx);
      const score = totalManhattanDistance(res.tiles, n);
      if (score < bestScore) {
        bestScore = score;
        bestIdx = tileIdx;
      }
    }
  }

  return bestIdx;
}

/**
 * Returns the index of the next tile to move toward the solution, or null
 * if the board is already solved.
 *
 * Dispatches to BFS for n = 3 (exact optimal) and greedy heuristic for n > 3.
 * The `lastMovedValue` hint prevents the greedy path from immediately reversing
 * its own last move — pass the value of the tile that was moved most recently,
 * or null on the first call.
 */
export function nextSolverMove(
  tiles: Tiles,
  n: number,
  lastMovedValue: number | null,
): number | null {
  if (isSolved(tiles)) return null;
  return n === 3
    ? bfsNextMove(tiles, n)
    : greedyNextMove(tiles, n, lastMovedValue);
}
