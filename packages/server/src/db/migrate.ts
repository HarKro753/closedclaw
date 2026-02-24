import type { Database } from "bun:sqlite";
import {
  CREATE_USERS_TABLE,
  CREATE_AGENTS_TABLE,
  CREATE_MESSAGES_TABLE,
  CREATE_ADMIN_TASKS_TABLE,
} from "./schema.js";

export function runMigrations(db: Database): void {
  db.exec(CREATE_USERS_TABLE);
  db.exec(CREATE_AGENTS_TABLE);
  db.exec(CREATE_MESSAGES_TABLE);
  db.exec(CREATE_ADMIN_TASKS_TABLE);

  try { db.exec("ALTER TABLE agents ADD COLUMN openclaw_agent_id TEXT"); } catch { /* already exists */ }
  try { db.exec("ALTER TABLE agents ADD COLUMN openclaw_session_key TEXT"); } catch { /* already exists */ }
}
