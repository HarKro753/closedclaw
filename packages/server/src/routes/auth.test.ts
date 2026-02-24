import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import express from "express";
import { runMigrations } from "../db/migrate.js";
import { createAuthRouter } from "./auth.js";
import { existsSync, rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const TEST_DATA_DIR = "data/test-auth";
const TEST_DB_PATH = join(TEST_DATA_DIR, "test.sqlite");

function createTestApp(db: Database.Database) {
  const app = express();
  app.use(express.json());
  app.use("/auth", createAuthRouter(db));
  return app;
}

async function request(
  app: express.Express,
  method: string,
  path: string,
  body?: Record<string, unknown>,
  token?: string
) {
  const { default: supertest } = await import("supertest") as { default: typeof import("supertest") };
  const req = supertest(app);
  const methodFn = method === "POST" ? req.post(path) : req.get(path);
  methodFn.set("Content-Type", "application/json");
  if (token) {
    methodFn.set("Authorization", `Bearer ${token}`);
  }
  if (body) {
    methodFn.send(body);
  }
  return methodFn;
}

describe("Auth Routes", () => {
  let db: Database.Database;
  let app: express.Express;

  beforeEach(() => {
    if (existsSync(TEST_DATA_DIR)) {
      rmSync(TEST_DATA_DIR, { recursive: true });
    }
    mkdirSync(TEST_DATA_DIR, { recursive: true });

    process.env["JWT_SECRET"] = "test-secret-key-for-testing";
    process.env["ADMIN_EMAILS"] = "admin@test.com";
    process.env["DATA_DIR"] = TEST_DATA_DIR;

    db = new Database(TEST_DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    runMigrations(db);

    app = createTestApp(db);
  });

  afterEach(() => {
    db.close();
    if (existsSync(TEST_DATA_DIR)) {
      rmSync(TEST_DATA_DIR, { recursive: true });
    }
  });

  describe("POST /auth/signup", () => {
    it("creates a user and provisions agent directory", async () => {
      const res = await request(app, "POST", "/auth/signup", {
        email: "user@test.com",
        password: "securepassword123",
        name: "Test User",
      });

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe("user@test.com");
      expect(res.body.user.name).toBe("Test User");
      expect(res.body.user.isAdmin).toBe(false);

      const user = db
        .prepare("SELECT * FROM users WHERE email = ?")
        .get("user@test.com") as { id: string } | undefined;
      expect(user).toBeDefined();

      const agent = db
        .prepare("SELECT * FROM agents WHERE user_id = ?")
        .get(user!.id) as { workspace_dir: string; memory_file: string } | undefined;
      expect(agent).toBeDefined();

      expect(existsSync(agent!.workspace_dir)).toBe(true);
      expect(existsSync(agent!.memory_file)).toBe(true);
    });

    it("assigns admin role for admin emails", async () => {
      const res = await request(app, "POST", "/auth/signup", {
        email: "admin@test.com",
        password: "securepassword123",
        name: "Admin User",
      });

      expect(res.status).toBe(201);
      expect(res.body.user.isAdmin).toBe(true);
    });

    it("rejects duplicate emails", async () => {
      await request(app, "POST", "/auth/signup", {
        email: "dupe@test.com",
        password: "securepassword123",
        name: "First",
      });

      const res = await request(app, "POST", "/auth/signup", {
        email: "dupe@test.com",
        password: "securepassword123",
        name: "Second",
      });

      expect(res.status).toBe(409);
    });

    it("rejects short passwords", async () => {
      const res = await request(app, "POST", "/auth/signup", {
        email: "user@test.com",
        password: "short",
        name: "Test",
      });

      expect(res.status).toBe(400);
    });

    it("rejects missing fields", async () => {
      const res = await request(app, "POST", "/auth/signup", {
        email: "user@test.com",
      });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /auth/login", () => {
    beforeEach(async () => {
      await request(app, "POST", "/auth/signup", {
        email: "login@test.com",
        password: "securepassword123",
        name: "Login Test",
      });
    });

    it("returns token for valid credentials", async () => {
      const res = await request(app, "POST", "/auth/login", {
        email: "login@test.com",
        password: "securepassword123",
      });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe("login@test.com");
    });

    it("rejects invalid password", async () => {
      const res = await request(app, "POST", "/auth/login", {
        email: "login@test.com",
        password: "wrongpassword",
      });

      expect(res.status).toBe(401);
    });

    it("rejects non-existent email", async () => {
      const res = await request(app, "POST", "/auth/login", {
        email: "nobody@test.com",
        password: "securepassword123",
      });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /auth/me", () => {
    it("returns user info with valid token", async () => {
      const signupRes = await request(app, "POST", "/auth/signup", {
        email: "me@test.com",
        password: "securepassword123",
        name: "Me Test",
      });

      const token = signupRes.body.token as string;
      const res = await request(app, "GET", "/auth/me", undefined, token);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe("me@test.com");
      expect(res.body.name).toBe("Me Test");
    });

    it("rejects requests without token", async () => {
      const res = await request(app, "GET", "/auth/me");

      expect(res.status).toBe(401);
    });
  });
});
