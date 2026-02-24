import express, { type Express } from "express";
import cors from "cors";
import { Database } from "bun:sqlite";
import { mkdirSync, existsSync } from "node:fs";
import { runMigrations } from "./db/migrate.js";
import { createAuthRouter } from "./routes/auth.js";
import { createAgentRouter } from "./routes/agent.js";
import { createAdminRouter } from "./routes/admin.js";
import { createSkillsRouter } from "./routes/skills.js";

const PORT = parseInt(process.env["PORT"] ?? "3900", 10);
const DATA_DIR = process.env["DATA_DIR"] ?? "data";
const DB_PATH = `${DATA_DIR}/db.sqlite`;

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH, { create: true });
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

runMigrations(db);

const app: Express = express();

app.use(cors());
app.use(express.json());

app.use("/auth", createAuthRouter(db));
app.use("/agent", createAgentRouter(db));
app.use("/admin", createAdminRouter(db));
app.use("/skills", createSkillsRouter(db));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`ClosedClaw server running on port ${PORT}`);
  console.log(`OpenClaw Gateway: ${process.env["OPENCLAW_GATEWAY_URL"] ?? "ws://127.0.0.1:18789"}`);
});

export { app };
export type { Database };
