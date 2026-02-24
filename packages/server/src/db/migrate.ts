import Database from "better-sqlite3";
import {
  CREATE_USERS_TABLE,
  CREATE_AGENTS_TABLE,
  CREATE_MESSAGES_TABLE,
} from "./schema.js";

export function runMigrations(db: Database.Database): void {
  db.exec(CREATE_USERS_TABLE);
  db.exec(CREATE_AGENTS_TABLE);
  db.exec(CREATE_MESSAGES_TABLE);
}
