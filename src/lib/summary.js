import { cache } from "react";
import db from "@/lib/db";
import { MASTERY_RANKS, getRankProgress } from "@/lib/profile";

export function masteryFromCollection(rows, archiveCount = 0) {
  const byMonster = {};
  for (const r of rows) {
    const cur = byMonster[r.monster_id];
    byMonster[r.monster_id] = !cur ? r.type : cur === r.type ? cur : "both";
  }
  let mp = archiveCount * 25;
  for (const t of Object.values(byMonster)) mp += t === "both" ? 30 : 10;
  return mp;
}

export function rankView(mp) {
  const { currentRank, nextRank, progress } = getRankProgress(mp);
  return {
    mp,
    rank: currentRank.rank,
    title: currentRank.title,
    nextTitle: nextRank?.title ?? null,
    toNext: nextRank ? nextRank.minPoints - mp : 0,
    progress,
  };
}

export const getUserSummary = cache(async (userId) => {
  if (!userId) return null;
  try {
    const [col, arch, st, tg] = await Promise.all([
      db.execute({ sql: "SELECT monster_id, type FROM hunter_collection WHERE user_id = ?", args: [userId] }),
      db.execute({ sql: "SELECT COUNT(*) as c FROM guild_archive WHERE user_id = ?", args: [userId] }),
      db.execute({
        sql: `SELECT SUM(CASE WHEN type = 'small' THEN 1 ELSE 0 END) AS s, SUM(CASE WHEN type = 'large' THEN 1 ELSE 0 END) AS l,
                     SUM(CASE WHEN tempered = 1 THEN 1 ELSE 0 END) AS t FROM crowns WHERE user_id = ?`,
        args: [userId],
      }),
      db.execute({
        sql: `SELECT DISTINCT m.name, m.image_name FROM wishlist w JOIN monsters m ON m.id = w.monster_id WHERE w.user_id = ? ORDER BY m.name`,
        args: [userId],
      }),
    ]);
    return {
      ...rankView(masteryFromCollection(col.rows, arch.rows[0]?.c || 0)),
      stats: { s: Number(st.rows[0]?.s || 0), l: Number(st.rows[0]?.l || 0), t: Number(st.rows[0]?.t || 0) },
      targets: tg.rows.map((r) => ({ name: r.name, image: r.image_name })),
    };
  } catch (e) {
    console.error("User summary error", e);
    return { ...rankView(0), stats: { s: 0, l: 0, t: 0 }, targets: [] };
  }
});

export { MASTERY_RANKS };
