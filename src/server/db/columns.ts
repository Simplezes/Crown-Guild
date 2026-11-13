import "server-only";
import { db } from "./client";

const pending = new Map<string, Promise<void>>();

function ensureColumn(table: string, column: string, definition: string): Promise<void> {
  const key = `${table}.${column}`;
  let promise = pending.get(key);
  if (!promise) {
    promise = (async () => {
      const info = await db.execute(`PRAGMA table_info(${table})`);
      if (!info.rows.some((row) => row.name === column)) {
        await db.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
      }
    })().catch((error: unknown) => {
      pending.delete(key);
      throw error;
    });
    pending.set(key, promise);
  }
  return promise;
}

const available = (ensure: () => Promise<void>) => () =>
  ensure().then(
    () => true,
    () => false,
  );

const ensureCrownSize = () => ensureColumn("crowns", "size_cm", "REAL");
const ensureCrownSizeLabel = () => ensureColumn("crowns", "size_label", "TEXT");
export const ensureArchiveTempered = () =>
  ensureColumn("guild_archive", "tempered", "INTEGER NOT NULL DEFAULT 0");

export const ensureUserShareUrl = () =>
  ensureColumn("users", "share_url", "INTEGER NOT NULL DEFAULT 0");

export const hasCrownSize = available(ensureCrownSize);
export const hasCrownSizeLabel = available(ensureCrownSizeLabel);
