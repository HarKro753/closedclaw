import type { Database } from "bun:sqlite";
import {
  CREATE_USERS_TABLE,
  CREATE_AGENTS_TABLE,
  CREATE_MESSAGES_TABLE,
  CREATE_ADMIN_TASKS_TABLE,
} from "./schema.js";

function safeAlter(db: Database, sql: string): void {
  try { db.exec(sql); } catch { /* column already exists */ }
}

export function runMigrations(db: Database): void {
  db.exec(CREATE_USERS_TABLE);
  db.exec(CREATE_AGENTS_TABLE);
  db.exec(CREATE_MESSAGES_TABLE);
  db.exec(CREATE_ADMIN_TASKS_TABLE);

  safeAlter(db, "ALTER TABLE agents ADD COLUMN openclaw_agent_id TEXT");
  safeAlter(db, "ALTER TABLE agents ADD COLUMN openclaw_session_key TEXT");
  safeAlter(db, "ALTER TABLE agents ADD COLUMN gateway_url TEXT");
  safeAlter(db, "ALTER TABLE agents ADD COLUMN gateway_token TEXT");
  safeAlter(db, "ALTER TABLE agents ADD COLUMN last_connected_at TEXT");
}
