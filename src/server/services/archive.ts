import "server-only";
import {
  computeMasteryPoints,
  getRankProgress,
  type ArchiveRow,
  type Tier,
} from "@/config/mastery";
import { db, ensureArchiveTempered, rowsOf } from "@/server/db";
import { getMonsterTierMap } from "./monsters";

export interface RawArchiveRow {
  monster_id: number;
  type: string;
  tempered: number;
}

export interface RankUp {
  rank: number;
  title: string;
  mp: number;
}

export async function archiveCrown(
  userId: string,
  monsterId: number,
  type: string,
  tempered: boolean,
): Promise<void> {
  await ensureArchiveTempered();
  await db.execute({
    sql: `
      INSERT INTO guild_archive (user_id, monster_id, type, tempered)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, monster_id, type) DO UPDATE SET tempered = MAX(tempered, excluded.tempered)
    `,
    args: [userId, monsterId, type, tempered ? 1 : 0],
  });
}

export async function getArchiveRows(userId: string): Promise<RawArchiveRow[]> {
  await ensureArchiveTempered();
  return rowsOf<RawArchiveRow>(
    await db.execute({
      sql: "SELECT monster_id, type, tempered FROM guild_archive WHERE user_id = ?",
      args: [userId],
    }),
  );
}

export function masteryPointsFromRows(
  rows: RawArchiveRow[],
  tierMap: Record<number, Tier>,
): number {
  const withTiers: ArchiveRow[] = rows.map((row) => ({
    ...row,
    tier: tierMap[row.monster_id] ?? "standard",
  }));
  return computeMasteryPoints(withTiers);
}

export async function getMasteryPoints(userId: string): Promise<number> {
  const [rows, tierMap] = await Promise.all([getArchiveRows(userId), getMonsterTierMap()]);
  return masteryPointsFromRows(rows, tierMap);
}

export function diffRankUp(oldPoints: number, newPoints: number): RankUp | null {
  const before = getRankProgress(oldPoints).currentRank.rank;
  const { currentRank } = getRankProgress(newPoints);
  if (currentRank.rank <= before) return null;
  return { rank: currentRank.rank, title: currentRank.title, mp: newPoints };
}
