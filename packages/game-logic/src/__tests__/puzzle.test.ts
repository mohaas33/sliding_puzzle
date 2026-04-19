import { isSolved, isSolvable, getMovableTiles, moveTile, shuffle } from "../puzzle.js";

// Convention: empty tile = n*n-1, solved = [0, 1, ..., n*n-1]

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
    // 8 (empty) is at index 0 instead of 8
    expect(isSolved([8, 1, 2, 3, 4, 5, 6, 7, 0])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isSolvable
// ---------------------------------------------------------------------------

describe("isSolvable", () => {
  // --- odd grid (n=3) ---

  it("recognises solved 3×3 as solvable (0 inversions)", () => {
    expect(isSolvable([0, 1, 2, 3, 4, 5, 6, 7, 8], 3)).toBe(true);
  });

  it("recognises a known-solvable 3×3 (even inversions)", () => {
    // Swap tiles 0 and 1 twice to keep even parity: [1,0,2,3,4,5,6,7,8] → 1 inv,
    // swap again back to get 2 inversions: [1,2,0,3,4,5,6,7,8]
    // 1>0, 2>0 → 2 inversions → even → solvable
    expect(isSolvable([1, 2, 0, 3, 4, 5, 6, 7, 8], 3)).toBe(true);
  });

  it("recognises a known-unsolvable 3×3 (odd inversions)", () => {
    // Swap tiles 6 and 7 in solved board → 1 inversion → odd → not solvable
    expect(isSolvable([0, 1, 2, 3, 4, 5, 7, 6, 8], 3)).toBe(false);
  });

  // --- even grid (n=4) ---

  it("recognises solved 4×4 as solvable", () => {
    // inversions=0 (even), emptyRowFromBottom = 4-floor(15/4) = 4-3 = 1 (odd)
    // (0+1) % 2 = 1 → solvable
    expect(
      isSolvable([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 4)
    ).toBe(true);
  });

  it("recognises a known-unsolvable 4×4", () => {
    // Swap tiles 0 and 1 in solved 4×4 → 1 inversion (odd),
    // emptyRowFromBottom = 1 (odd) → (1+1) % 2 = 0 → not solvable
    expect(
      isSolvable([1, 0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], 4)
    ).toBe(false);
  });

  it("empty tile is excluded from inversion count", () => {
    // Verify the empty (8) does not affect the 3×3 inversion count
    // [0,1,2,3,4,5,6,7,8] and [8,0,1,2,3,4,5,6,7] have different empty positions
    // but the non-empty tile ordering in the latter is [0,1,2,3,4,5,6,7] → 0 inversions
    // However solvability also depends on grid parity for even grids,
    // so just verify it's consistent for odd n=3.
    const tiles = [8, 0, 1, 2, 3, 4, 5, 6, 7]; // empty at top-left, rest in order
    // non-empty values in order: 0,1,2,3,4,5,6,7 → 0 inversions → solvable for n=3
    expect(isSolvable(tiles, 3)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getMovableTiles
// ---------------------------------------------------------------------------

describe("getMovableTiles", () => {
  // 3×3 board layout (indices):
  //  0 | 1 | 2
  //  3 | 4 | 5
  //  6 | 7 | 8  (8 = empty in solved state)

  it("top-left corner (emptyIdx=0): right and down only", () => {
    const tiles = [8, 1, 2, 3, 4, 5, 6, 7, 0];
    expect(getMovableTiles(tiles, 0, 3).sort((a, b) => a - b)).toEqual([1, 3]);
  });

  it("top-right corner (emptyIdx=2): left and down only", () => {
    const tiles = [0, 1, 8, 3, 4, 5, 6, 7, 2];
    expect(getMovableTiles(tiles, 2, 3).sort((a, b) => a - b)).toEqual([1, 5]);
  });

  it("bottom-left corner (emptyIdx=6): right and up only", () => {
    const tiles = [0, 1, 2, 3, 4, 5, 8, 7, 6];
    expect(getMovableTiles(tiles, 6, 3).sort((a, b) => a - b)).toEqual([3, 7]);
  });

  it("bottom-right corner (emptyIdx=8): left and up only", () => {
    const tiles = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    expect(getMovableTiles(tiles, 8, 3).sort((a, b) => a - b)).toEqual([5, 7]);
  });

  it("centre (emptyIdx=4): all four neighbours", () => {
    const tiles = [0, 1, 2, 3, 8, 5, 6, 7, 4];
    expect(getMovableTiles(tiles, 4, 3).sort((a, b) => a - b)).toEqual([1, 3, 5, 7]);
  });

  it("top-centre edge (emptyIdx=1): left, right, down only", () => {
    const tiles = [0, 8, 2, 3, 4, 5, 6, 7, 1];
    expect(getMovableTiles(tiles, 1, 3).sort((a, b) => a - b)).toEqual([0, 2, 4]);
  });
});

// ---------------------------------------------------------------------------
// moveTile
// ---------------------------------------------------------------------------

describe("moveTile", () => {
  it("swaps the tile and empty cell, returns new emptyIdx", () => {
    // 3×3, empty at centre (4), move the tile at index 1 (above empty)
    const tiles = [0, 1, 2, 3, 8, 5, 6, 7, 4];
    const result = moveTile(tiles, 1, 4);
    expect(result.tiles).toEqual([0, 8, 2, 3, 1, 5, 6, 7, 4]);
    expect(result.emptyIdx).toBe(1);
  });

  it("is a pure function — does not mutate input", () => {
    const tiles = [0, 1, 2, 3, 8, 5, 6, 7, 4];
    const original = [...tiles];
    moveTile(tiles, 1, 4);
    expect(tiles).toEqual(original);
  });

  it("move from right neighbour", () => {
    // empty at 4, move tile at index 5
    const tiles = [0, 1, 2, 3, 8, 5, 6, 7, 4];
    const result = moveTile(tiles, 5, 4);
    expect(result.tiles).toEqual([0, 1, 2, 3, 5, 8, 6, 7, 4]);
    expect(result.emptyIdx).toBe(5);
  });

  it("move from below neighbour", () => {
    // empty at 1 (top-centre), move tile at index 4 (below)
    const tiles = [0, 8, 2, 3, 4, 5, 6, 7, 1];
    const result = moveTile(tiles, 4, 1);
    expect(result.tiles).toEqual([0, 4, 2, 3, 8, 5, 6, 7, 1]);
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
    // P(solved) = 1/9! ≈ 2.76e-6; P(any of 1000 solved) ≈ 0.003 %
    for (let i = 0; i < 1000; i++) {
      expect(isSolved(shuffle(3))).toBe(false);
    }
  });
});
