import { Router } from "express";
import { puzzleRouter } from "./puzzle.js";

export const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/puzzles", puzzleRouter);
