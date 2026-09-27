import db, { ensureGuildArchiveTempered } from "@/lib/db";
import { getMonsterTierMap } from "@/lib/monsters";
import { computeMasteryPoints, getRankProgress } from "@/lib/mastery";

// archiveCrown: record that a user has (at least once) logged a crown of
// this size for this monster. Upserts rather than INSERT OR IGNORE so a
// later tempered hunt of the same monster/size upgrades the stored record -
// tempered never gets un-set once earned.
export async function archiveCrown(userId, monsterId, type, tempered) {
  await ensureGuildArchiveTempered();
  await db.execute({
    sql: `
      INSERT INTO guild_archive (user_id, monster_id, type, tempered)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, monster_id, type) DO UPDATE SET tempered = MAX(tempered, excluded.tempered)
    `,
    args: [userId, monsterId, type, tempered ? 1 : 0],
  });
}

export async function getArchiveRows(userId) {
  await ensureGuildArchiveTempered();
  const res = await db.execute({
    sql: "SELECT monster_id, type, tempered FROM guild_archive WHERE user_id = ?",
    args: [userId],
  });
  return res.rows;
}

export async function getMasteryPoints(userId) {
  const [rows, tierMap] = await Promise.all([getArchiveRows(userId), getMonsterTierMap()]);
  return masteryPointsFromRows(rows, tierMap);
}

export function masteryPointsFromRows(rows, tierMap) {
  const withTiers = rows.map((r) => ({ ...r, tier: tierMap[r.monster_id] || "standard" }));
  return computeMasteryPoints(withTiers);
}

export async function getRankForUser(userId) {
  const mp = await getMasteryPoints(userId);
  return { mp, ...getRankProgress(mp) };
}

// diffRankUp: null if no rank was crossed, otherwise the new rank reached.
export function diffRankUp(oldMp, newMp) {
  const before = getRankProgress(oldMp).currentRank.rank;
  const after = getRankProgress(newMp).currentRank.rank;
  if (after <= before) return null;
  const { currentRank } = getRankProgress(newMp);
  return { rank: currentRank.rank, title: currentRank.title, mp: newMp };
}
