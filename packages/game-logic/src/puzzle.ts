/**
 * Tiles are a flat array of length n*n.
 * Values 0 through n*n-2 are the numbered tiles.
 * Value n*n-1 is the empty cell.
 * Solved state: [0, 1, 2, ..., n*n-1]  (empty at last position).
 */

export type Tiles = readonly number[];

export function isSolved(tiles: Tiles): boolean {
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i] !== i) return false;
  }
  return true;
}

export function isSolvable(tiles: number[], n: number): boolean {
  const emptyVal = n * n - 1;
  let inversions = 0;
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i] === emptyVal) continue;
    for (let j = i + 1; j < tiles.length; j++) {
      if (tiles[j] !== emptyVal && (tiles[i] as number) > (tiles[j] as number)) {
        inversions++;
      }
    }
  }

  if (n % 2 === 1) {
    return inversions % 2 === 0;
  } else {
    const emptyIdx = tiles.indexOf(emptyVal);
    const emptyRowFromBottom = n - Math.floor(emptyIdx / n);
    return (inversions + emptyRowFromBottom) % 2 === 1;
  }
}

export function getMovableTiles(tiles: number[], emptyIdx: number, n: number): number[] {
  const movable: number[] = [];
  const row = Math.floor(emptyIdx / n);
  const col = emptyIdx % n;
  if (row > 0) movable.push(emptyIdx - n);
  if (row < n - 1) movable.push(emptyIdx + n);
  if (col > 0) movable.push(emptyIdx - 1);
  if (col < n - 1) movable.push(emptyIdx + 1);
  return movable;
}

export function moveTile(
  tiles: number[],
  tileIdx: number,
  emptyIdx: number,
): { tiles: number[]; emptyIdx: number } {
  const next = [...tiles];
  [next[tileIdx], next[emptyIdx]] = [next[emptyIdx] as number, next[tileIdx] as number];
  return { tiles: next, emptyIdx: tileIdx };
}

export function shuffle(n: number): number[] {
  const size = n * n;
  const emptyVal = size - 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const tiles: number[] = Array.from({ length: size }, (_, i) => i);

    for (let i = size - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j] as number, tiles[i] as number];
    }

    if (!isSolvable(tiles, n)) {
      const first = tiles.findIndex((t) => t !== emptyVal);
      const second = tiles.findIndex((t, i) => t !== emptyVal && i > first);
      [tiles[first], tiles[second]] = [tiles[second] as number, tiles[first] as number];
    }

    if (!isSolved(tiles)) return tiles;
    // Probability of landing on solved is 1/(n*n)! — retry in the
    // astronomically unlikely event it happens.
  }
}
