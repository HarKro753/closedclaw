import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import type Database from "better-sqlite3";
import { provisionAgent } from "../agent-provisioner.js";
import { authMiddleware } from "../middleware/auth.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";

const SALT_ROUNDS = 12;
const TOKEN_EXPIRY = "7d";

interface UserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  is_admin: number;
  created_at: string;
}

export function createAuthRouter(db: Database.Database): Router {
  const router = Router();

  router.post("/signup", async (req, res) => {
    try {
      const { email, password, name } = req.body as {
        email?: string;
        password?: string;
        name?: string;
      };

      if (!email || !password || !name) {
        res.status(400).json({ error: "Email, password, and name are required" });
        return;
      }

      if (password.length < 8) {
        res
          .status(400)
          .json({ error: "Password must be at least 8 characters" });
        return;
      }

      const existing = db
        .prepare("SELECT id FROM users WHERE email = ?")
        .get(email) as { id: string } | undefined;

      if (existing) {
        res.status(409).json({ error: "An account with this email already exists" });
        return;
      }

      const userId = uuid();
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      const adminEmails = (process.env["ADMIN_EMAILS"] ?? "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      const isAdmin = adminEmails.includes(email.toLowerCase()) ? 1 : 0;

      db.prepare(
        `INSERT INTO users (id, email, password_hash, name, is_admin) VALUES (?, ?, ?, ?, ?)`
      ).run(userId, email.toLowerCase(), passwordHash, name, isAdmin);

      provisionAgent(db, userId, { userName: name, userEmail: email.toLowerCase() });

      const secret = process.env["JWT_SECRET"];
      if (!secret) {
        res
          .status(500)
          .json({ error: "Server misconfigured: JWT_SECRET not set" });
        return;
      }

      const token = jwt.sign(
        { userId, email: email.toLowerCase() },
        secret,
        { expiresIn: TOKEN_EXPIRY }
      );

      res.status(201).json({
        token,
        user: { id: userId, email: email.toLowerCase(), name, isAdmin: isAdmin === 1 },
      });
    } catch (err) {
      console.error("Signup error:", err);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body as {
        email?: string;
        password?: string;
      };

      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required" });
        return;
      }

      const user = db
        .prepare("SELECT * FROM users WHERE email = ? AND active = 1")
        .get(email.toLowerCase()) as UserRow | undefined;

      if (!user) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      const secret = process.env["JWT_SECRET"];
      if (!secret) {
        res
          .status(500)
          .json({ error: "Server misconfigured: JWT_SECRET not set" });
        return;
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        secret,
        { expiresIn: TOKEN_EXPIRY }
      );

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.is_admin === 1,
        },
      });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Failed to log in" });
    }
  });

  router.get(
    "/me",
    authMiddleware,
    (req: AuthenticatedRequest, res) => {
      if (!req.user) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      const user = db
        .prepare(
          "SELECT id, email, name, is_admin, created_at FROM users WHERE id = ?"
        )
        .get(req.user.userId) as Omit<UserRow, "password_hash"> | undefined;

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.is_admin === 1,
        createdAt: user.created_at,
      });
    }
  );

  return router;
}
