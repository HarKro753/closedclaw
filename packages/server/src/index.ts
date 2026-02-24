import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import { mkdirSync, existsSync } from "node:fs";
import { runMigrations } from "./db/migrate.js";
import { createAuthRouter } from "./routes/auth.js";
import { createAgentRouter } from "./routes/agent.js";
import { createAdminRouter } from "./routes/admin.js";

const PORT = parseInt(process.env["PORT"] ?? "3900", 10);
const DATA_DIR = process.env["DATA_DIR"] ?? "data";
const DB_PATH = `${DATA_DIR}/db.sqlite`;

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

runMigrations(db);

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", createAuthRouter(db));
app.use("/agent", createAgentRouter(db));
app.use("/admin", createAdminRouter(db));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`ClosedClaw server running on port ${PORT}`);
});

export { app };
export type { Database };
