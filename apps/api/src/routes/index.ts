import { Router } from "express";
import { puzzleRouter } from "./puzzle.js";
import { hintsRouter } from "./hints.js";
import { requireAuth } from "../middleware/auth.js";

export const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/puzzles", puzzleRouter);
router.use("/hints", requireAuth, hintsRouter);
