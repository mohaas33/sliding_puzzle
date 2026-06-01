import { jest } from "@jest/globals";

// AC-7 / AC-8: Acceptance tests for hint counter isolation.
// Uses the same ESM mock pattern as hints.test.ts:
//   jest.unstable_mockModule before any dynamic imports.

jest.unstable_mockModule("../repositories/hintRepository.js", () => ({
  hintRepository: {
    getUsage: jest.fn<() => Promise<number>>(),
    incrementUsage: jest.fn<() => Promise<void>>(),
  },
  HINT_LIMITS: {
    ra_light: 5,
    thoth_hand: 3,
  },
}));

jest.unstable_mockModule("@sliding-puzzle/game-logic", () => ({
  nextSolverMove: jest.fn<() => number | null>(),
  shuffle: jest.fn<() => number[]>(),
  isSolvable: jest.fn<() => boolean>(),
}));

// Dynamic imports AFTER mocks are registered
const { default: request } = await import("supertest");
const { default: express } = await import("express");
const { router } = await import("../routes/index.js");
const { hintRepository } = await import("../repositories/hintRepository.js");
const { nextSolverMove } = await import("@sliding-puzzle/game-logic");

const mockGetUsage = hintRepository.getUsage as jest.MockedFunction<
  typeof hintRepository.getUsage
>;
const mockIncrementUsage = hintRepository.incrementUsage as jest.MockedFunction<
  typeof hintRepository.incrementUsage
>;
const mockNextSolverMove = nextSolverMove as jest.MockedFunction<
  typeof nextSolverMove
>;

function buildApp(): ReturnType<typeof express> {
  const app = express();
  app.use(express.json());
  app.use("/api/v1", router);
  return app;
}

const TILES = [1, 2, 3, 4, 5, 6, 7, 8, 0];
const N = 3;
const USER_ID = "acceptance-user-1";

const RA_BODY = {
  tiles: TILES,
  n: N,
  lastMovedValue: null,
  hintType: "ra_light",
  puzzleId: "puzzle-1",
};

const THOTH_BODY = {
  tiles: TILES,
  n: N,
  lastMovedValue: null,
  hintType: "thoth_hand",
  puzzleId: "puzzle-1",
};

beforeEach(() => {
  jest.clearAllMocks();
  // Default: solver always returns a valid move
  mockNextSolverMove.mockReturnValue(4);
});

// ---------------------------------------------------------------------------
// AC-8: Ra and Thoth counts are independent — Ra uses don't affect Thoth count
// ---------------------------------------------------------------------------

describe("AC-8: Ra's Light and Thoth's Hand use independent counters", () => {
  it(
    "AC-8: ra_light at limit returns 403 but thoth_hand under its own limit " +
      "returns 200",
    async () => {
      const app = buildApp();

      // Mock: ra_light is exhausted (5/5), thoth_hand is at 1/3
      mockGetUsage.mockImplementation(
        (
          _userId: string,
          _puzzleId: string,
          hintType: string,
        ): Promise<number> => {
          if (hintType === "ra_light") return Promise.resolve(5);
          if (hintType === "thoth_hand") return Promise.resolve(1);
          return Promise.resolve(0);
        },
      );

      // Ra's Light should be blocked (limit reached)
      const raRes = await request(app)
        .post("/api/v1/hints")
        .set("x-user-id", USER_ID)
        .send(RA_BODY);

      expect(raRes.status).toBe(403);
      expect(raRes.body).toEqual({ error: "Hint limit reached" });

      // Thoth's Hand should succeed — its counter is independent
      const thothRes = await request(app)
        .post("/api/v1/hints")
        .set("x-user-id", USER_ID)
        .send(THOTH_BODY);

      expect(thothRes.status).toBe(200);
      expect(thothRes.body).toHaveProperty("tile");
    },
  );

  it(
    "AC-8: thoth_hand at limit returns 403 but ra_light under its own limit " +
      "returns 200",
    async () => {
      const app = buildApp();

      // Mock: thoth_hand is exhausted (3/3), ra_light is at 2/5
      mockGetUsage.mockImplementation(
        (
          _userId: string,
          _puzzleId: string,
          hintType: string,
        ): Promise<number> => {
          if (hintType === "thoth_hand") return Promise.resolve(3);
          if (hintType === "ra_light") return Promise.resolve(2);
          return Promise.resolve(0);
        },
      );

      // Thoth's Hand should be blocked (limit reached)
      const thothRes = await request(app)
        .post("/api/v1/hints")
        .set("x-user-id", USER_ID)
        .send(THOTH_BODY);

      expect(thothRes.status).toBe(403);

      // Ra's Light should still succeed — counter is stored separately
      const raRes = await request(app)
        .post("/api/v1/hints")
        .set("x-user-id", USER_ID)
        .send(RA_BODY);

      expect(raRes.status).toBe(200);
      expect(raRes.body).toHaveProperty("tile");
    },
  );

  it(
    "AC-8: incrementUsage is called with the correct hintType key — " +
      "ra_light increments only the ra_light counter",
    async () => {
      const app = buildApp();
      mockGetUsage.mockResolvedValue(0);

      await request(app)
        .post("/api/v1/hints")
        .set("x-user-id", USER_ID)
        .send(RA_BODY);

      expect(mockIncrementUsage).toHaveBeenCalledTimes(1);
      expect(mockIncrementUsage).toHaveBeenCalledWith(
        USER_ID,
        "puzzle-1",
        "ra_light",
      );
      // Should NOT have been called with thoth_hand
      expect(mockIncrementUsage).not.toHaveBeenCalledWith(
        USER_ID,
        "puzzle-1",
        "thoth_hand",
      );
    },
  );

  it(
    "AC-8: incrementUsage is called with the correct hintType key — " +
      "thoth_hand increments only the thoth_hand counter",
    async () => {
      const app = buildApp();
      mockGetUsage.mockResolvedValue(0);

      await request(app)
        .post("/api/v1/hints")
        .set("x-user-id", USER_ID)
        .send(THOTH_BODY);

      expect(mockIncrementUsage).toHaveBeenCalledTimes(1);
      expect(mockIncrementUsage).toHaveBeenCalledWith(
        USER_ID,
        "puzzle-1",
        "thoth_hand",
      );
      expect(mockIncrementUsage).not.toHaveBeenCalledWith(
        USER_ID,
        "puzzle-1",
        "ra_light",
      );
    },
  );
});

// ---------------------------------------------------------------------------
// AC-7: Caps are per-puzzle — repository key is now `${userId}:${puzzleId}:${hintType}`
//
// The repository accepts puzzleId as a first-class parameter, so uses on one
// puzzle do not bleed into another puzzle's quota.  These tests assert the
// correct isolation behaviour: the mock receives different puzzleId values and
// can return independent counts for each.
// ---------------------------------------------------------------------------

describe("AC-7: hint counts are isolated per puzzle", () => {
  it(
    "AC-7: uses from puzzle-1 do not affect the quota for puzzle-2 — " +
      "getUsage is called with the correct puzzleId",
    async () => {
      const app = buildApp();

      // puzzle-1 has 4 uses, puzzle-2 has 0 uses — both under the limit
      mockGetUsage.mockImplementation(
        (
          _userId: string,
          puzzleId: string,
          _hintType: string,
        ): Promise<number> => {
          if (puzzleId === "puzzle-1") return Promise.resolve(4);
          if (puzzleId === "puzzle-2") return Promise.resolve(0);
          return Promise.resolve(0);
        },
      );

      // Request for puzzle-1 (4 uses) — still under the 5-use limit
      const res1 = await request(app)
        .post("/api/v1/hints")
        .set("x-user-id", USER_ID)
        .send({ ...RA_BODY, puzzleId: "puzzle-1" });

      expect(res1.status).toBe(200);

      // Request for puzzle-2 (0 uses) — fresh quota, independent of puzzle-1
      const res2 = await request(app)
        .post("/api/v1/hints")
        .set("x-user-id", USER_ID)
        .send({ ...RA_BODY, puzzleId: "puzzle-2" });

      expect(res2.status).toBe(200);

      // Verify each call was routed with its own puzzleId
      expect(mockGetUsage).toHaveBeenCalledWith(
        USER_ID,
        "puzzle-1",
        "ra_light",
      );
      expect(mockGetUsage).toHaveBeenCalledWith(
        USER_ID,
        "puzzle-2",
        "ra_light",
      );
    },
  );

  it(
    "AC-7: exhausted quota on puzzle-1 does not block puzzle-2 — " +
      "different puzzleIds produce independent 403/200 outcomes",
    async () => {
      const app = buildApp();

      // puzzle-1 has all 5 uses spent; puzzle-2 has only 2
      mockGetUsage.mockImplementation(
        (
          _userId: string,
          puzzleId: string,
          _hintType: string,
        ): Promise<number> => {
          if (puzzleId === "puzzle-1") return Promise.resolve(5);
          if (puzzleId === "puzzle-2") return Promise.resolve(2);
          return Promise.resolve(0);
        },
      );

      // puzzle-1 is exhausted — should get 403
      const res1 = await request(app)
        .post("/api/v1/hints")
        .set("x-user-id", USER_ID)
        .send({ ...RA_BODY, puzzleId: "puzzle-1" });

      expect(res1.status).toBe(403);
      expect(res1.body).toEqual({ error: "Hint limit reached" });

      // puzzle-2 still has quota — should get 200
      const res2 = await request(app)
        .post("/api/v1/hints")
        .set("x-user-id", USER_ID)
        .send({ ...RA_BODY, puzzleId: "puzzle-2" });

      expect(res2.status).toBe(200);
      expect(res2.body).toHaveProperty("tile");
    },
  );
});
