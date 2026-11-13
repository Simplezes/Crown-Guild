import "server-only";
import { db, firstRow, rowsOf } from "@/server/db";
import { failure, success, type Result } from "@/server/result";

export interface InvestigationListing {
  id: number;
  monster_id: number;
  remaining_uses: number | null;
  monster_name: string;
  monster_image: string | null;
  monster_emoji: string | null;
  crown_count: number;
}

export async function createInvestigation(
  userId: string,
  monsterId: number,
  uses: number | null,
): Promise<number> {
  const result = await db.execute({
    sql: "INSERT INTO investigations (user_id, monster_id, remaining_uses) VALUES (?, ?, ?)",
    args: [userId, monsterId, uses],
  });
  return Number(result.lastInsertRowid);
}

export async function ownsInvestigation(id: number, userId: string): Promise<boolean> {
  const result = await db.execute({
    sql: "SELECT id FROM investigations WHERE id = ? AND user_id = ?",
    args: [id, userId],
  });
  return result.rows.length > 0;
}

export async function deleteIfOrphaned(investigationId: number): Promise<void> {
  const row = firstRow<{ c: number }>(
    await db.execute({
      sql: "SELECT COUNT(*) AS c FROM crowns WHERE investigation_id = ?",
      args: [investigationId],
    }),
  );
  if ((row?.c ?? 1) === 0) {
    await db.execute({ sql: "DELETE FROM investigations WHERE id = ?", args: [investigationId] });
  }
}

export async function deleteCrown(crownId: number): Promise<void> {
  await db.execute({
    sql: "UPDATE web_notifications SET crown_id = NULL WHERE crown_id = ?",
    args: [crownId],
  });
  await db.execute({ sql: "DELETE FROM crowns WHERE id = ?", args: [crownId] });
}

export async function listInvestigations(userId: string): Promise<InvestigationListing[]> {
  return rowsOf<InvestigationListing>(
    await db.execute({
      sql: `
        SELECT inv.id, inv.monster_id, inv.remaining_uses,
               m.name AS monster_name, m.image_name AS monster_image, m.emoji AS monster_emoji,
               COUNT(c.id) AS crown_count
        FROM investigations inv
        JOIN monsters m ON inv.monster_id = m.id
        LEFT JOIN crowns c ON c.investigation_id = inv.id
        WHERE inv.user_id = ?
        GROUP BY inv.id
        ORDER BY inv.id DESC
      `,
      args: [userId],
    }),
  );
}

export async function consumeInvestigationUse(
  id: number,
  userId: string,
): Promise<Result<{ removed: boolean; remaining_uses?: number }>> {
  const row = firstRow<{ user_id: string; remaining_uses: number | null }>(
    await db.execute({
      sql: "SELECT user_id, remaining_uses FROM investigations WHERE id = ?",
      args: [id],
    }),
  );
  if (!row) return failure(404, "Investigation not found");
  if (row.user_id !== userId) return failure(403, "Forbidden");
  if (row.remaining_uses == null) return failure(400, "This quest doesn't track uses");

  const next = Number(row.remaining_uses) - 1;
  if (next <= 0) {
    await db.batch([
      {
        sql: "UPDATE web_notifications SET crown_id = NULL WHERE crown_id IN (SELECT id FROM crowns WHERE investigation_id = ?)",
        args: [id],
      },
      { sql: "DELETE FROM crowns WHERE investigation_id = ?", args: [id] },
      { sql: "DELETE FROM investigations WHERE id = ?", args: [id] },
    ]);
    return success({ removed: true });
  }

  await db.execute({
    sql: "UPDATE investigations SET remaining_uses = ? WHERE id = ?",
    args: [next, id],
  });
  return success({ removed: false, remaining_uses: next });
}
