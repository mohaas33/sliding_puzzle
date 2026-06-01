import type { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Locals {
      userId: string;
    }
  }
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const userId = req.headers["x-user-id"];

  if (typeof userId !== "string" || userId.trim() === "") {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  res.locals.userId = userId.trim();
  next();
}
