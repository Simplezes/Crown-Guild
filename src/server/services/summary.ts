import "server-only";
import { cache } from "react";
import { rankView, type RankView } from "@/config/mastery";
import { db, firstRow, rowsOf } from "@/server/db";
import { logServerError } from "@/server/logger";
import { getArchiveRows, masteryPointsFromRows } from "./archive";
import { getMonsterTierMap } from "./monsters";

export interface UserSummary extends RankView {
  stats: { s: number; l: number; t: number };
  targets: { name: string; image: string | null }[];
}

const EMPTY_SUMMARY: UserSummary = {
  ...rankView(0),
  stats: { s: 0, l: 0, t: 0 },
  targets: [],
};

export const getUserSummary = cache(async (userId: string): Promise<UserSummary | null> => {
  if (!userId) return null;
  try {
    const [archiveRows, tierMap, stats, targets] = await Promise.all([
      getArchiveRows(userId),
      getMonsterTierMap(),
      db.execute({
        sql: `SELECT SUM(CASE WHEN type = 'small' THEN 1 ELSE 0 END) AS s,
                     SUM(CASE WHEN type = 'large' THEN 1 ELSE 0 END) AS l,
                     SUM(CASE WHEN tempered = 1 THEN 1 ELSE 0 END) AS t
              FROM crowns WHERE user_id = ?`,
        args: [userId],
      }),
      db.execute({
        sql: `SELECT DISTINCT m.name, m.image_name
              FROM wishlist w JOIN monsters m ON m.id = w.monster_id
              WHERE w.user_id = ? ORDER BY m.name`,
        args: [userId],
      }),
    ]);
    const counts = firstRow<{ s: number | null; l: number | null; t: number | null }>(stats);
    return {
      ...rankView(masteryPointsFromRows(archiveRows, tierMap)),
      stats: { s: Number(counts?.s ?? 0), l: Number(counts?.l ?? 0), t: Number(counts?.t ?? 0) },
      targets: rowsOf<{ name: string; image_name: string | null }>(targets).map((row) => ({
        name: row.name,
        image: row.image_name,
      })),
    };
  } catch (error) {
    logServerError("User summary failed", error);
    return EMPTY_SUMMARY;
  }
});
