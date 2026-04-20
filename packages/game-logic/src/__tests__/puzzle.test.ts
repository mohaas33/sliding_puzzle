import { isSolved, isSolvable, getMovableTiles, moveTile, shuffle } from "../puzzle.js";

// Convention: empty tile = n*n-1, solved = [0, 1, ..., n*n-1]
//
// 3×3 board index layout:
//  0 | 1 | 2
//  3 | 4 | 5
//  6 | 7 | 8   (value 8 = empty in solved state)

// ---------------------------------------------------------------------------
// isSolved
// ---------------------------------------------------------------------------

describe("isSolved", () => {
  it("returns true for solved 3×3", () => {
    expect(isSolved([0, 1, 2, 3, 4, 5, 6, 7, 8])).toBe(true);
  });

  it("returns true for solved 2×2", () => {
    expect(isSolved([0, 1, 2, 3])).toBe(true);
  });

  it("returns false when one tile is out of place", () => {
    expect(isSolved([0, 1, 2, 3, 4, 5, 7, 6, 8])).toBe(false);
  });

  it("returns false when empty tile is not at last position", () => {
    expect(isSolved([8, 1, 2, 3, 4, 5, 6, 7, 0])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isSolvable
// ---------------------------------------------------------------------------

describe("isSolvable", () => {
  it("recognises solved 3×3 as solvable (0 inversions)", () => {
    expect(isSolvable([0, 1, 2, 3, 4, 5, 6, 7, 8], 3)).toBe(true);
  });

  it("recognises a known-solvable 3×3 (even inversions)", () => {
    // 1>0, 2>0 → 2 inversions → even → solvable
    expect(isSolvable([1, 2, 0, 3, 4, 5, 6, 7, 8], 3)).toBe(true);
  });

  it("recognises a known-unsolvable 3×3 (odd inversions)", () => {
    // Swap tiles 6 and 7 → 1 inversion → odd → not solvable
    expect(isSolvable([0, 1, 2, 3, 4, 5, 7, 6, 8], 3)).toBe(false);
  });

  it("recognises solved 4×4 as solvable", () => {
    expect(
      isSolvable([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 4)
    ).toBe(true);
  });

  it("recognises a known-unsolvable 4×4", () => {
    expect(
      isSolvable([1, 0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 4)
    ).toBe(false);
  });

  it("empty tile is excluded from inversion count", () => {
    const tiles = [8, 0, 1, 2, 3, 4, 5, 6, 7];
    expect(isSolvable(tiles, 3)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getMovableTiles — now returns all tiles in same row AND column as empty
// ---------------------------------------------------------------------------

describe("getMovableTiles", () => {
  // Helper: returns sorted movable indices for easy comparison.
  function movable(tiles: number[], emptyIdx: number, n: number) {
    return getMovableTiles(tiles, emptyIdx, n).sort((a, b) => a - b);
  }

  it("empty at top-left (0): rest of row 0 + rest of col 0", () => {
    // row 0: [1, 2]  col 0: [3, 6]
    const tiles = [8, 1, 2, 3, 4, 5, 6, 7, 0];
    expect(movable(tiles, 0, 3)).toEqual([1, 2, 3, 6]);
  });

  it("empty at top-right (2): rest of row 0 + rest of col 2", () => {
    // row 0: [0, 1]  col 2: [5, 8]
    const tiles = [0, 1, 8, 3, 4, 5, 6, 7, 2];
    expect(movable(tiles, 2, 3)).toEqual([0, 1, 5, 8]);
  });

  it("empty at bottom-left (6): rest of row 2 + rest of col 0", () => {
    // row 2: [7, 8]  col 0: [0, 3]
    const tiles = [0, 1, 2, 3, 4, 5, 8, 7, 6];
    expect(movable(tiles, 6, 3)).toEqual([0, 3, 7, 8]);
  });

  it("empty at bottom-right (8): rest of row 2 + rest of col 2", () => {
    // row 2: [6, 7]  col 2: [2, 5]
    const tiles = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    expect(movable(tiles, 8, 3)).toEqual([2, 5, 6, 7]);
  });

  it("empty at centre (4): rest of row 1 + rest of col 1", () => {
    // row 1: [3, 5]  col 1: [1, 7]  → same result as the old adjacent-only test
    const tiles = [0, 1, 2, 3, 8, 5, 6, 7, 4];
    expect(movable(tiles, 4, 3)).toEqual([1, 3, 5, 7]);
  });

  it("empty at top-centre (1): rest of row 0 + rest of col 1", () => {
    // row 0: [0, 2]  col 1: [4, 7]
    const tiles = [0, 8, 2, 3, 4, 5, 6, 7, 1];
    expect(movable(tiles, 1, 3)).toEqual([0, 2, 4, 7]);
  });
});

// ---------------------------------------------------------------------------
// moveTile — shifts the entire chain between tileIdx and emptyIdx
// ---------------------------------------------------------------------------

describe("moveTile", () => {
  // ── single-step moves (adjacent tile, behaviour unchanged) ──────────────

  it("adjacent tile above empty slides down one step", () => {
    // empty at centre (4), click index 1 (above)
    const tiles = [0, 1, 2, 3, 8, 5, 6, 7, 4];
    const result = moveTile(tiles, 1, 4);
    expect(result.tiles).toEqual([0, 8, 2, 3, 1, 5, 6, 7, 4]);
    expect(result.emptyIdx).toBe(1);
  });

  it("adjacent tile to the right of empty slides left one step", () => {
    // empty at 4, click index 5 (right)
    const tiles = [0, 1, 2, 3, 8, 5, 6, 7, 4];
    const result = moveTile(tiles, 5, 4);
    expect(result.tiles).toEqual([0, 1, 2, 3, 5, 8, 6, 7, 4]);
    expect(result.emptyIdx).toBe(5);
  });

  it("adjacent tile below empty slides up one step", () => {
    // empty at 1 (top-centre), click index 4 (below)
    const tiles = [0, 8, 2, 3, 4, 5, 6, 7, 1];
    const result = moveTile(tiles, 4, 1);
    expect(result.tiles).toEqual([0, 4, 2, 3, 8, 5, 6, 7, 1]);
    expect(result.emptyIdx).toBe(4);
  });

  // ── multi-step row slides ────────────────────────────────────────────────

  it("clicking two steps right in same row slides two tiles left", () => {
    // 3×3, row 0: [8(E), 1, 2] → click index 2
    // expected: [1, 2, E, ...]
    const tiles = [8, 1, 2, 3, 4, 5, 6, 7, 0];
    const result = moveTile(tiles, 2, 0);
    expect(result.tiles).toEqual([1, 2, 8, 3, 4, 5, 6, 7, 0]);
    expect(result.emptyIdx).toBe(2);
  });

  it("clicking two steps left in same row slides two tiles right", () => {
    // 3×3, row 0: [0, 1, 8(E)] → click index 0
    // expected: [E, 0, 1, ...]
    const tiles = [0, 1, 8, 3, 4, 5, 6, 7, 2];
    const result = moveTile(tiles, 0, 2);
    expect(result.tiles).toEqual([8, 0, 1, 3, 4, 5, 6, 7, 2]);
    expect(result.emptyIdx).toBe(0);
  });

  // ── multi-step column slides ─────────────────────────────────────────────

  it("clicking two steps down in same column slides two tiles up", () => {
    // 3×3, col 0: row0=8(E), row1=3, row2=6 → click index 6
    // expected col 0: row0=3, row1=6, row2=E
    const tiles = [8, 1, 2, 3, 4, 5, 6, 7, 0];
    const result = moveTile(tiles, 6, 0);
    expect(result.tiles).toEqual([3, 1, 2, 6, 4, 5, 8, 7, 0]);
    expect(result.emptyIdx).toBe(6);
  });

  it("clicking two steps up in same column slides two tiles down", () => {
    // 3×3, col 0: row0=0, row1=3, row2=8(E) → click index 0
    // expected col 0: row0=E, row1=0, row2=3
    const tiles = [0, 1, 2, 3, 4, 5, 8, 7, 6];
    const result = moveTile(tiles, 0, 6);
    expect(result.tiles).toEqual([8, 1, 2, 0, 4, 5, 3, 7, 6]);
    expect(result.emptyIdx).toBe(0);
  });

  // ── invariants ────────────────────────────────────────────────────────────

  it("is a pure function — does not mutate input", () => {
    const tiles = [0, 1, 2, 3, 8, 5, 6, 7, 4];
    const original = [...tiles];
    moveTile(tiles, 1, 4);
    expect(tiles).toEqual(original);
  });

  it("invalid move (not same row or column) returns tiles unchanged", () => {
    // 3×3, empty at 4 (centre), click 0 (diagonal) — invalid
    const tiles = [0, 1, 2, 3, 8, 5, 6, 7, 4];
    const result = moveTile(tiles, 0, 4);
    expect(result.tiles).toEqual(tiles);
    expect(result.emptyIdx).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// shuffle
// ---------------------------------------------------------------------------

describe("shuffle", () => {
  it("returns array of correct length for 5×5", () => {
    expect(shuffle(5)).toHaveLength(25);
  });

  it("returns array of correct length for 3×3", () => {
    expect(shuffle(3)).toHaveLength(9);
  });

  it("contains exactly the right set of values for 3×3", () => {
    const tiles = shuffle(3);
    expect([...tiles].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("contains exactly the right set of values for 5×5", () => {
    const tiles = shuffle(5);
    const expected = Array.from({ length: 25 }, (_, i) => i);
    expect([...tiles].sort((a, b) => a - b)).toEqual(expected);
  });

  it("always returns a solvable board (100 samples, 5×5)", () => {
    for (let i = 0; i < 100; i++) {
      expect(isSolvable(shuffle(5), 5)).toBe(true);
    }
  });

  it("always returns a solvable board (100 samples, 4×4)", () => {
    for (let i = 0; i < 100; i++) {
      expect(isSolvable(shuffle(4), 4)).toBe(true);
    }
  });

  it("never returns the solved state (1000 samples, 3×3)", () => {
    for (let i = 0; i < 1000; i++) {
      expect(isSolved(shuffle(3))).toBe(false);
    }
  });
});
