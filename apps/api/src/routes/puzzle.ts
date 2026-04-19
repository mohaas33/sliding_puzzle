import { Router } from "express";
import { shuffle, isSolvable } from "@sliding-puzzle/game-logic";

export const puzzleRouter = Router();

// GET /api/v1/puzzles/daily  — returns today's daily puzzle seed
puzzleRouter.get("/daily", (_req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  // TODO: derive deterministic shuffle from date seed + DB puzzle config
  res.json({ date: today, tiles: shuffle(5) });
});

// POST /api/v1/puzzles/validate  — validates a board submitted by the client
puzzleRouter.post("/validate", (req, res) => {
  const { tiles, n } = req.body as { tiles: unknown; n: unknown };

  if (!Array.isArray(tiles) || typeof n !== "number") {
    res.status(400).json({ error: "tiles must be an array and n a number" });
    return;
  }

  res.json({ solvable: isSolvable(tiles as number[], n) });
});
