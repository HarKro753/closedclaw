import type { Database } from "bun:sqlite";
import {
  CREATE_USERS_TABLE,
  CREATE_AGENTS_TABLE,
  CREATE_MESSAGES_TABLE,
} from "./schema.js";

export function runMigrations(db: Database): void {
  db.exec(CREATE_USERS_TABLE);
  db.exec(CREATE_AGENTS_TABLE);
  db.exec(CREATE_MESSAGES_TABLE);
}
