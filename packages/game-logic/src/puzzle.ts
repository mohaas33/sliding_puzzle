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

/**
 * Returns all grid positions in the same row or column as the empty cell,
 * excluding the empty cell itself. Any of these can be clicked to trigger
 * a group slide.
 */
export function getMovableTiles(tiles: number[], emptyIdx: number, n: number): number[] {
  const movable: number[] = [];
  const emptyRow = Math.floor(emptyIdx / n);
  const emptyCol = emptyIdx % n;

  for (let c = 0; c < n; c++) {
    const i = emptyRow * n + c;
    if (i !== emptyIdx) movable.push(i);
  }

  for (let r = 0; r < n; r++) {
    const i = r * n + emptyCol;
    if (i !== emptyIdx) movable.push(i);
  }

  return movable;
}

/**
 * Slides all tiles between tileIdx and emptyIdx (inclusive of tileIdx,
 * exclusive of emptyIdx) one step toward the empty cell.
 * Pure function — does not mutate the input array.
 */
export function moveTile(
  tiles: number[],
  tileIdx: number,
  emptyIdx: number,
): { tiles: number[]; emptyIdx: number } {
  const n = Math.round(Math.sqrt(tiles.length));
  const tileRow = Math.floor(tileIdx / n);
  const emptyRow = Math.floor(emptyIdx / n);
  const tileCol = tileIdx % n;
  const emptyCol = emptyIdx % n;

  let step: number;
  if (tileRow === emptyRow) {
    step = tileIdx < emptyIdx ? 1 : -1;
  } else if (tileCol === emptyCol) {
    step = tileIdx < emptyIdx ? n : -n;
  } else {
    // Not in the same row or column — invalid, return unchanged.
    return { tiles: [...tiles], emptyIdx };
  }

  // Fill the empty gap by copying tiles one step at a time from tileIdx toward emptyIdx.
  const next = [...tiles];
  let cur = emptyIdx;
  while (cur !== tileIdx) {
    const src = cur - step;
    next[cur] = next[src] as number;
    cur = src;
  }
  next[tileIdx] = tiles[emptyIdx] as number;

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

    // Reject solved state and empty-in-top-left (looks unshuffled to players)
    if (!isSolved(tiles) && tiles.indexOf(emptyVal) !== 0) return tiles;
  }
}
