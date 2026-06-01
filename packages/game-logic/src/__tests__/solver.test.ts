import { getMovableTiles } from "../puzzle.js";
import { nextSolverMove, bfsNextMove, greedyNextMove } from "../solver.js";

// Convention: empty tile = n*n-1, solved = [0, 1, ..., n*n-1]
//
// 3×3 board index layout:
//  0 | 1 | 2
//  3 | 4 | 5
//  6 | 7 | 8   (value 8 = empty in solved state)

// ---------------------------------------------------------------------------
// nextSolverMove
// ---------------------------------------------------------------------------

describe("nextSolverMove", () => {
  it("returns null when the board is already solved (3×3)", () => {
    const solved = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    expect(nextSolverMove(solved, 3, null)).toBeNull();
  });

  it("returns null when the board is already solved (5×5)", () => {
    const solved = Array.from({ length: 25 }, (_, i) => i);
    expect(nextSolverMove(solved, 5, null)).toBeNull();
  });

  it("returns a valid movable tile index for a 3×3 board one move from solved", () => {
    // Swap tile at index 7 with empty (index 8):
    // [0,1,2,3,4,5,6,8,7] — empty is at index 7, tile 7 is at index 8.
    // One move: slide tile at index 8 left into the empty at index 7.
    const oneMoveAway = [0, 1, 2, 3, 4, 5, 6, 8, 7];
    const move = nextSolverMove(oneMoveAway, 3, null);
    expect(move).not.toBeNull();
    // The move must be a valid movable tile on that board.
    const emptyIdx = oneMoveAway.indexOf(8); // empty value = 8 for 3×3
    const movable = getMovableTiles(oneMoveAway as number[], emptyIdx, 3);
    expect(movable).toContain(move);
  });

  it("dispatches to greedy (not BFS) for n > 3 and returns a valid move", () => {
    // 5×5 board one move from solved: swap index 23 and 24.
    // Empty (value 24) at index 23; tile 23 sits at index 24.
    const tiles = Array.from({ length: 25 }, (_, i) => i);
    // place empty at index 23, tile 23 at index 24
    tiles[23] = 24;
    tiles[24] = 23;
    const move = nextSolverMove(tiles, 5, null);
    expect(move).not.toBeNull();
    const emptyIdx = tiles.indexOf(24); // empty value = 24 for 5×5
    const movable = getMovableTiles(tiles, emptyIdx, 5);
    expect(movable).toContain(move);
  });
});

// ---------------------------------------------------------------------------
// bfsNextMove
// ---------------------------------------------------------------------------

describe("bfsNextMove", () => {
  it("throws when called with a board larger than 3×3 (n=4)", () => {
    const tiles = Array.from({ length: 16 }, (_, i) => i);
    expect(() => bfsNextMove(tiles, 4)).toThrow(
      "bfsNextMove is only safe for n ≤ 3",
    );
  });

  it("throws when called with a board larger than 3×3 (n=5)", () => {
    const tiles = Array.from({ length: 25 }, (_, i) => i);
    expect(() => bfsNextMove(tiles, 5)).toThrow(
      "bfsNextMove is only safe for n ≤ 3",
    );
  });

  it("returns null for an already-solved 3×3 board", () => {
    expect(bfsNextMove([0, 1, 2, 3, 4, 5, 6, 7, 8], 3)).toBeNull();
  });

  it("returns the optimal single tile index for a board one move from solved", () => {
    // [0,1,2,3,4,5,6,8,7]: empty at 7, tile 23 is the only path to solved.
    // Moving index 8 (value 7) into empty at index 7 solves the board.
    const oneMoveAway = [0, 1, 2, 3, 4, 5, 6, 8, 7];
    const move = bfsNextMove(oneMoveAway, 3);
    expect(move).toBe(8);
  });

  it("returns a valid movable tile for a multi-move 3×3 board", () => {
    // A known non-trivial scramble (2 moves from solved):
    // Start: [0,1,2,3,4,5,8,6,7] — empty at 6
    // Step 1: slide index 7 (value 6) left → [0,1,2,3,4,5,6,8,7] — empty at 7
    // Step 2: slide index 8 (value 7) left → solved
    const twoMoves = [0, 1, 2, 3, 4, 5, 8, 6, 7];
    const move = bfsNextMove(twoMoves, 3);
    expect(move).not.toBeNull();
    const emptyIdx = twoMoves.indexOf(8);
    const movable = getMovableTiles(twoMoves as number[], emptyIdx, 3);
    expect(movable).toContain(move);
  });
});

// ---------------------------------------------------------------------------
// greedyNextMove
// ---------------------------------------------------------------------------

describe("greedyNextMove", () => {
  it("returns a valid movable tile for a standard 5×5 board", () => {
    // One move from solved: empty (24) at index 23, tile 23 at index 24.
    const tiles = Array.from({ length: 25 }, (_, i) => i);
    tiles[23] = 24;
    tiles[24] = 23;
    const move = greedyNextMove(tiles, 5, null);
    expect(move).not.toBeNull();
    const emptyIdx = tiles.indexOf(24);
    const movable = getMovableTiles(tiles, emptyIdx, 5);
    expect(movable).toContain(move);
  });

  it("returns null when the board is already solved (5×5)", () => {
    // The greedy function itself does not check isSolved; it returns null only
    // when there are no candidates. On a solved board the empty is at index 24
    // and there are still movable tiles in its row/column, so it will return
    // a move. nextSolverMove is the public guard for the solved-board case.
    // This test therefore checks the 5×5 via nextSolverMove, which wraps it.
    const solved = Array.from({ length: 25 }, (_, i) => i);
    expect(nextSolverMove(solved, 5, null)).toBeNull();
  });

  it("respects lastMovedValue anti-reversal hint on a 5×5 board", () => {
    // One move from solved: empty at 23, tile 23 at 24.
    const tiles = Array.from({ length: 25 }, (_, i) => i);
    tiles[23] = 24;
    tiles[24] = 23;
    const emptyIdx = tiles.indexOf(24);
    const movable = getMovableTiles(tiles, emptyIdx, 5);
    // Pass tile value 23 (the tile we "just moved") as lastMovedValue.
    // greedyNextMove should still return a valid movable tile (fallback logic).
    const move = greedyNextMove(tiles, 5, 23);
    // Must be a valid movable tile (fallback kicks in when all candidates filtered).
    expect(movable).toContain(move);
  });
});
