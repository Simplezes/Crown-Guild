import "server-only";
import { db } from "@/server/db";

type ListingTable = "wishlist" | "hunter_collection";

export async function setListing(
  table: ListingTable,
  userId: string,
  monsterId: number,
  type: "small" | "large" | "both" | null | undefined,
): Promise<void> {
  const remove = {
    sql: `DELETE FROM ${table} WHERE user_id = ? AND monster_id = ?`,
    args: [userId, monsterId],
  };
  if (!type) {
    await db.execute(remove);
    return;
  }
  const insert =
    table === "wishlist"
      ? {
          sql: "INSERT INTO wishlist (user_id, monster_id, type, tempered) VALUES (?, ?, ?, 0)",
          args: [userId, monsterId, type],
        }
      : {
          sql: "INSERT INTO hunter_collection (user_id, monster_id, type) VALUES (?, ?, ?)",
          args: [userId, monsterId, type],
        };
  await db.batch([remove, insert], "write");
}

export async function removeListing(
  table: ListingTable,
  userId: string,
  monsterId: number,
): Promise<void> {
  await db.execute({
    sql: `DELETE FROM ${table} WHERE user_id = ? AND monster_id = ?`,
    args: [userId, monsterId],
  });
}
