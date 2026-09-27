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

export default client;
