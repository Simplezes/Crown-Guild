import "server-only";
import { db, firstRow } from "@/server/db";
import { failure, success, type Result } from "@/server/result";
import { deleteCrown, deleteIfOrphaned } from "../investigations";

export async function removeCrown(
  userId: string,
  crownId: number,
): Promise<Result<Record<string, never>>> {
  const crown = firstRow<{ user_id: string; investigation_id: number | null }>(
    await db.execute({
      sql: "SELECT user_id, investigation_id FROM crowns WHERE id = ?",
      args: [crownId],
    }),
  );
  if (!crown) return failure(404, "Crown not found");
  if (crown.user_id !== userId) return failure(403, "Forbidden");

  await deleteCrown(crownId);
  if (crown.investigation_id) await deleteIfOrphaned(crown.investigation_id);
  return success({});
}
