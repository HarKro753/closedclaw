import type { Response, NextFunction } from "express";
import type { Database } from "bun:sqlite";
import type { AuthenticatedRequest } from "./auth.js";

export function adminMiddleware(db: Database) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const user = db
      .prepare("SELECT is_admin FROM users WHERE id = ?")
      .get(req.user.userId) as { is_admin: number } | undefined;

    if (!user || user.is_admin !== 1) {
      res.status(403).json({ error: "Admin access required" });
      return;
    }

    next();
  };
}
