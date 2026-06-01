import { jest } from "@jest/globals";

// In ESM jest, mock factory functions cannot close over outer-scope variables.
// Use jest.unstable_mockModule before any dynamic imports.

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

// Cast to jest mocks so we can call mockResolvedValue etc.
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

const VALID_BODY = {
  tiles: [1, 2, 3, 4, 5, 6, 7, 8, 0],
  n: 3,
  lastMovedValue: null,
  hintType: "ra_light",
  puzzleId: "puzzle-1",
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/v1/hints", () => {
  describe("authentication", () => {
    it("returns 401 when x-user-id header is missing", async () => {
      const app = buildApp();
      const res = await request(app).post("/api/v1/hints").send(VALID_BODY);

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "Unauthorized" });
      expect(mockGetUsage).not.toHaveBeenCalled();
      expect(mockIncrementUsage).not.toHaveBeenCalled();
    });

    it("returns 401 when x-user-id header is empty string", async () => {
      const app = buildApp();
      const res = await request(app)
        .post("/api/v1/hints")
        .set("x-user-id", "")
        .send(VALID_BODY);

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "Unauthorized" });
    });
  });

  describe("request body validation", () => {
    it("returns 400 when tiles is missing", async () => {
      const app = buildApp();
      const { tiles: _tiles, ...bodyWithoutTiles } = VALID_BODY;
      const res = await request(app)
        .post("/api/v1/hints")
        .set("x-user-id", "user-1")
        .send(bodyWithoutTiles);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(mockIncrementUsage).not.toHaveBeenCalled();
    });

    it("returns 400 when tiles is not an array", async () => {
      const app = buildApp();
      const res = await request(app)
        .post("/api/v1/hints")
        .set("x-user-id", "user-1")
        .send({ ...VALID_BODY, tiles: "not-an-array" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(mockIncrementUsage).not.toHaveBeenCalled();
    });

    it("returns 400 when hintType is invalid", async () => {
      const app = buildApp();
      const res = await request(app)
        .post("/api/v1/hints")
        .set("x-user-id", "user-1")
        .send({ ...VALID_BODY, hintType: "unknown_hint" });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(mockGetUsage).not.toHaveBeenCalled();
      expect(mockIncrementUsage).not.toHaveBeenCalled();
    });

    it("returns 400 when n is not a positive integer", async () => {
      const app = buildApp();
      const res = await request(app)
        .post("/api/v1/hints")
        .set("x-user-id", "user-1")
        .send({ ...VALID_BODY, n: -1 });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(mockIncrementUsage).not.toHaveBeenCalled();
    });

    it("returns 400 with 'Invalid board size' when n === 1", async () => {
      const app = buildApp();
      const res = await request(app)
        .post("/api/v1/hints")
        .set("x-user-id", "user-1")
        .send({ ...VALID_BODY, n: 1 });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "Invalid board size" });
      expect(mockIncrementUsage).not.toHaveBeenCalled();
    });

    it("returns 400 with 'Invalid board size' when n === 6", async () => {
      const app = buildApp();
      const res = await request(app)
        .post("/api/v1/hints")
        .set("x-user-id", "user-1")
        .send({ ...VALID_BODY, n: 6 });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "Invalid board size" });
      expect(mockIncrementUsage).not.toHaveBeenCalled();
    });

    it("returns 400 when puzzleId is missing", async () => {
      const app = buildApp();
      const { puzzleId: _puzzleId, ...bodyWithoutPuzzleId } = VALID_BODY;
      const res = await request(app)
        .post("/api/v1/hints")
        .set("x-user-id", "user-1")
        .send(bodyWithoutPuzzleId);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: "puzzleId must be a non-empty string",
      });
      expect(mockIncrementUsage).not.toHaveBeenCalled();
    });

    it("returns 400 when puzzleId is an empty string", async () => {
      const app = buildApp();
      const res = await request(app)
        .post("/api/v1/hints")
        .set("x-user-id", "user-1")
        .send({ ...VALID_BODY, puzzleId: "" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: "puzzleId must be a non-empty string",
      });
      expect(mockIncrementUsage).not.toHaveBeenCalled();
    });
  });

  describe("hint limit enforcement", () => {
    it("returns 403 when ra_light usage is at the limit (5)", async () => {
      mockGetUsage.mockResolvedValue(5);
      const app = buildApp();
      const res = await request(app)
        .post("/api/v1/hints")
        .set("x-user-id", "user-1")
        .send({ ...VALID_BODY, hintType: "ra_light" });

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Hint limit reached" });
      expect(mockIncrementUsage).not.toHaveBeenCalled();
    });

    it("returns 403 when thoth_hand usage is at the limit (3)", async () => {
      mockGetUsage.mockResolvedValue(3);
      const app = buildApp();
      const res = await request(app)
        .post("/api/v1/hints")
        .set("x-user-id", "user-1")
        .send({ ...VALID_BODY, hintType: "thoth_hand" });

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: "Hint limit reached" });
      expect(mockIncrementUsage).not.toHaveBeenCalled();
    });
  });

  describe("solver interaction", () => {
    it("returns 400 when nextSolverMove returns null (already solved)", async () => {
      mockGetUsage.mockResolvedValue(0);
      mockNextSolverMove.mockReturnValue(null);
      const app = buildApp();
      const res = await request(app)
        .post("/api/v1/hints")
        .set("x-user-id", "user-1")
        .send(VALID_BODY);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "Puzzle already solved" });
      expect(mockIncrementUsage).not.toHaveBeenCalled();
    });
  });

  describe("success path", () => {
    it("returns 200 { tile: N } on a valid request under the limit", async () => {
      mockGetUsage.mockResolvedValue(2);
      mockNextSolverMove.mockReturnValue(7);
      const app = buildApp();
      const res = await request(app)
        .post("/api/v1/hints")
        .set("x-user-id", "user-1")
        .send(VALID_BODY);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ tile: 7 });
    });

    it("calls hintRepository.incrementUsage exactly once on success", async () => {
      mockGetUsage.mockResolvedValue(1);
      mockNextSolverMove.mockReturnValue(3);
      const app = buildApp();
      await request(app)
        .post("/api/v1/hints")
        .set("x-user-id", "user-1")
        .send(VALID_BODY);

      expect(mockIncrementUsage).toHaveBeenCalledTimes(1);
      expect(mockIncrementUsage).toHaveBeenCalledWith(
        "user-1",
        "puzzle-1",
        "ra_light",
      );
    });

    it("does not call incrementUsage when limit is reached", async () => {
      mockGetUsage.mockResolvedValue(5);
      const app = buildApp();
      await request(app)
        .post("/api/v1/hints")
        .set("x-user-id", "user-1")
        .send({ ...VALID_BODY, hintType: "ra_light" });

      expect(mockIncrementUsage).not.toHaveBeenCalled();
    });

    it("does not call incrementUsage when puzzle is already solved", async () => {
      mockGetUsage.mockResolvedValue(0);
      mockNextSolverMove.mockReturnValue(null);
      const app = buildApp();
      await request(app)
        .post("/api/v1/hints")
        .set("x-user-id", "user-1")
        .send(VALID_BODY);

      expect(mockIncrementUsage).not.toHaveBeenCalled();
    });

    it("does not call incrementUsage on invalid body", async () => {
      const app = buildApp();
      await request(app)
        .post("/api/v1/hints")
        .set("x-user-id", "user-1")
        .send({ ...VALID_BODY, hintType: "bad_type" });

      expect(mockIncrementUsage).not.toHaveBeenCalled();
    });
  });
});
