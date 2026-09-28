import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DB_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

let sizeColumn;
export function ensureCrownSize() {
  sizeColumn ??= (async () => {
    const info = await client.execute("PRAGMA table_info(crowns)");
    if (!info.rows.some((r) => r.name === "size_cm")) await client.execute("ALTER TABLE crowns ADD COLUMN size_cm REAL");
  })().catch((e) => { sizeColumn = undefined; throw e; });
  return sizeColumn;
}
export const hasCrownSize = () => ensureCrownSize().then(() => true, () => false);

let sizeLabelColumn;
export function ensureCrownSizeLabel() {
  sizeLabelColumn ??= (async () => {
    const info = await client.execute("PRAGMA table_info(crowns)");
    if (!info.rows.some((r) => r.name === "size_label")) await client.execute("ALTER TABLE crowns ADD COLUMN size_label TEXT");
  })().catch((e) => { sizeLabelColumn = undefined; throw e; });
  return sizeLabelColumn;
}
export const hasCrownSizeLabel = () => ensureCrownSizeLabel().then(() => true, () => false);

let archiveTemperedColumn;
export function ensureGuildArchiveTempered() {
  archiveTemperedColumn ??= (async () => {
    const info = await client.execute("PRAGMA table_info(guild_archive)");
    if (!info.rows.some((r) => r.name === "tempered")) {
      await client.execute("ALTER TABLE guild_archive ADD COLUMN tempered INTEGER NOT NULL DEFAULT 0");
    }
  })().catch((e) => { archiveTemperedColumn = undefined; throw e; });
  return archiveTemperedColumn;
}
export const hasGuildArchiveTempered = () => ensureGuildArchiveTempered().then(() => true, () => false);

export default client;
