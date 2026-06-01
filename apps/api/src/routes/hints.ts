import { Router } from "express";
import { nextSolverMove } from "@sliding-puzzle/game-logic";
import {
  hintRepository,
  HINT_LIMITS,
  type HintType,
} from "../repositories/hintRepository.js";

export const hintsRouter = Router();

interface HintRequestBody {
  tiles: unknown;
  n: unknown;
  lastMovedValue: unknown;
  hintType: unknown;
  puzzleId: unknown;
}

function isHintType(value: unknown): value is HintType {
  return value === "ra_light" || value === "thoth_hand";
}

hintsRouter.post("/", async (req, res) => {
  const { tiles, n, lastMovedValue, hintType, puzzleId } =
    req.body as HintRequestBody;

  // Validate tiles
  if (!Array.isArray(tiles) || !tiles.every((t) => typeof t === "number")) {
    res.status(400).json({ error: "tiles must be an array of numbers" });
    return;
  }

  // Validate n
  if (typeof n !== "number" || !Number.isInteger(n) || n < 2 || n > 5) {
    res.status(400).json({ error: "Invalid board size" });
    return;
  }

  // Validate lastMovedValue
  if (lastMovedValue !== null && typeof lastMovedValue !== "number") {
    res.status(400).json({ error: "lastMovedValue must be a number or null" });
    return;
  }

  // Validate hintType
  if (!isHintType(hintType)) {
    res.status(400).json({ error: "hintType must be ra_light or thoth_hand" });
    return;
  }

  // Validate puzzleId
  if (typeof puzzleId !== "string" || puzzleId.trim() === "") {
    res.status(400).json({ error: "puzzleId must be a non-empty string" });
    return;
  }

  const userId: string = res.locals.userId;

  // Check hint usage limit
  const usage = await hintRepository.getUsage(userId, puzzleId, hintType);
  if (usage >= HINT_LIMITS[hintType]) {
    res.status(403).json({ error: "Hint limit reached" });
    return;
  }

  // Compute next move
  const tile = nextSolverMove(
    tiles as number[],
    n,
    lastMovedValue as number | null,
  );

  if (tile === null) {
    res.status(400).json({ error: "Puzzle already solved" });
    return;
  }

  await hintRepository.incrementUsage(userId, puzzleId, hintType);

  res.status(200).json({ tile });
});
