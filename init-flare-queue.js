import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const client = createClient({
  url: process.env.TURSO_DB_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function migrate() {
  console.log("Running flare migrations on Turso...");
  try {
    await client.execute(`ALTER TABLE active_flares ADD COLUMN discord_message_id TEXT`).catch(() => console.log("discord_message_id already exists"));
    await client.execute(`ALTER TABLE active_flares ADD COLUMN discord_channel_id TEXT`).catch(() => console.log("discord_channel_id already exists"));

    await client.execute(`
      CREATE TABLE IF NOT EXISTS active_flare_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        flare_id INTEGER NOT NULL,
        user_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(flare_id, user_id),
        FOREIGN KEY(flare_id) REFERENCES active_flares(id) ON DELETE CASCADE
      )
    `);

    console.log("✅ Migration complete!");
  } catch (e) {
    console.error("❌ Migration error:", e);
  }
}

migrate();
