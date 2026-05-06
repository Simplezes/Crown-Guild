import db from "@/lib/db";
import { fetchDiscordUser } from "@/lib/discord";
import { getMonsterCount } from "@/lib/monsters";

export async function getProfileData(userId) {
  try {
    const userRes = await db.execute({
      sql: "SELECT id, username, avatar_url, lobby_id, quest_password, status_message, receive_dms, renown, fever_until FROM users WHERE id = ?",
      args: [userId]
    });

    if (userRes.rows.length === 0) return null;

    let user = userRes.rows[0];

    if (!user.username) {
      const discordUser = await fetchDiscordUser(userId);
      if (discordUser) {
        user.username = discordUser.username;
        user.avatar_url = discordUser.avatar_url;
        db.execute({
          sql: "UPDATE users SET username = ?, avatar_url = ? WHERE id = ?",
          args: [user.username, user.avatar_url, userId]
        }).catch(console.error);
      }
    }

    user.username = user.username || `Hunter ${user.id.substring(0, 4)}`;

    const crownsRes = await db.execute({
      sql: `SELECT c.id, m.id as monster_id, m.name, m.emoji, m.image_name,
                   c.type, c.tempered, c.strength_rating, c.quest, c.investigation_id, c.pair_id,
                   inv.remaining_uses,
                   inv.monster_id     AS inv_monster_id,
                   inv_m.name         AS inv_monster_name,
                   inv_m.image_name   AS inv_monster_image,
                   inv_m.emoji        AS inv_monster_emoji
            FROM crowns c
            JOIN  monsters m     ON c.monster_id      = m.id
            LEFT JOIN investigations inv   ON c.investigation_id = inv.id
            LEFT JOIN monsters       inv_m ON inv.monster_id     = inv_m.id
            WHERE c.user_id = ?
            ORDER BY c.id DESC`,
      args: [userId]
    });

    const statsRes = await db.execute({
      sql: `SELECT 
              COUNT(*) as total,
              SUM(CASE WHEN type = 'small' THEN 1 ELSE 0 END) as small,
              SUM(CASE WHEN type = 'large' THEN 1 ELSE 0 END) as large,
              SUM(CASE WHEN tempered = 1 THEN 1 ELSE 0 END) as tempered
            FROM crowns WHERE user_id = ?`,
      args: [userId]
    });

    const activityRes = await db.execute({
      sql: `SELECT 
              (SELECT COUNT(*) FROM completed_missions WHERE host_id = ?) as hosted,
              (SELECT COUNT(*) FROM completed_missions WHERE requester_id = ?) as joined,
              (SELECT COUNT(*) FROM guild_archive WHERE user_id = ?) as archive_count`,
      args: [userId, userId, userId]
    });

    const monsterCount = getMonsterCount() || 1;

    const uniqueRes = await db.execute({
      sql: `SELECT COUNT(DISTINCT monster_id) as c FROM (
              SELECT monster_id FROM crowns WHERE user_id = ?
              UNION
              SELECT monster_id FROM completed_missions WHERE host_id = ?
              UNION
              SELECT monster_id FROM completed_missions WHERE requester_id = ?
            )`,
      args: [userId, userId, userId]
    });

    const uniqueMonsters = uniqueRes.rows[0]?.c || 0;
    const completion = ((uniqueMonsters / monsterCount) * 100).toFixed(1);

    const topAssistRes = await db.execute({
      sql: `SELECT m.name, m.emoji, m.image_name, COUNT(*) as count
            FROM completed_missions cm
            JOIN monsters m ON cm.monster_id = m.id
            WHERE cm.host_id = ?
            GROUP BY cm.monster_id
            ORDER BY count DESC
            LIMIT 1`,
      args: [userId]
    });

    const wishlistRes = await db.execute({
      sql: `SELECT w.*, m.name as monster_name, m.emoji, m.image_name
            FROM wishlist w
            JOIN monsters m ON w.monster_id = m.id
            WHERE w.user_id = ?
            ORDER BY m.name ASC`,
      args: [userId]
    });

    const wishlistMap = {};
    wishlistRes.rows.forEach(row => {
      const mid = row.monster_id;
      if (!wishlistMap[mid]) {
        wishlistMap[mid] = { ...row };
      } else {
        const existing = wishlistMap[mid].type;
        const incoming = row.type;
        if (existing === 'both' || incoming === 'both' || (existing !== incoming)) {
          wishlistMap[mid].type = 'both';
        }
      }
    });

    const collectionRes = await db.execute({
      sql: `SELECT hc.*, m.name as monster_name, m.emoji, m.image_name
            FROM hunter_collection hc
            JOIN monsters m ON hc.monster_id = m.id
            WHERE hc.user_id = ?
            ORDER BY m.name ASC`,
      args: [userId]
    });

    const collectionMap = {};
    collectionRes.rows.forEach(row => {
      const mid = row.monster_id;
      if (!collectionMap[mid]) {
        collectionMap[mid] = { ...row };
      } else {
        const existing = collectionMap[mid].type;
        const incoming = row.type;
        if (existing === 'both' || incoming === 'both' || (existing !== incoming)) {
          collectionMap[mid].type = 'both';
        }
      }
    });

    const collection = Object.values(collectionMap);

    let masteryPoints = 0;
    collection.forEach(item => {
      if (item.type === 'small' || item.type === 'large') masteryPoints += 10;
      else if (item.type === 'both') masteryPoints += 30;
    });
    masteryPoints += (activityRes.rows[0].hosted || 0) * 5;
    masteryPoints += (activityRes.rows[0].joined || 0) * 2;
    masteryPoints += (user.renown || 0) * 15;
    masteryPoints += (activityRes.rows[0].archive_count || 0) * 25;

    const isFever = user.fever_until && new Date(user.fever_until) > new Date();

    return {
      user: { ...user, isFever },
      crowns: crownsRes.rows.map(row => ({ ...row })),
      wishlist: Object.values(wishlistMap),
      collection,
      stats: statsRes.rows[0],
      activity: activityRes.rows[0],
      completion,
      masteryPoints,
      topAssist: topAssistRes.rows[0] ? { ...topAssistRes.rows[0] } : null
    };
  } catch (e) {
    console.error("Profile fetch error", e);
    return null;
  }
}

export async function getCrownById(crownId) {
  try {
    const res = await db.execute({
      sql: `
        SELECT c.*,
               m.name as monster_name, m.image_name as monster_image,
               u.username, u.avatar_url, u.id as user_id, u.status_message,
               inv.remaining_uses,
               inv.monster_id   AS inv_monster_id,
               inv_m.name       AS inv_monster_name,
               inv_m.image_name AS inv_monster_image,
               inv_m.emoji      AS inv_monster_emoji
        FROM crowns c
        JOIN  monsters m     ON c.monster_id      = m.id
        JOIN  users    u     ON c.user_id          = u.id
        LEFT JOIN investigations inv   ON c.investigation_id = inv.id
        LEFT JOIN monsters       inv_m ON inv.monster_id     = inv_m.id
        WHERE c.id = ?
      `,
      args: [crownId]
    });

    if (res.rows.length === 0) return null;
    return res.rows[0];
  } catch (e) {
    console.error("Fetch crown error", e);
    return null;
  }
}

export const MASTERY_RANKS = [
  { rank: 1, title: "Fledgling", minPoints: 0 },
  { rank: 2, title: "Scout", minPoints: 100 },
  { rank: 3, title: "Tracker", minPoints: 300 },
  { rank: 4, title: "Hunter", minPoints: 750 },
  { rank: 5, title: "Veteran", minPoints: 1500 },
  { rank: 6, title: "Expert", minPoints: 3000 },
  { rank: 7, title: "Master", minPoints: 5000 },
  { rank: 8, title: "Legend", minPoints: 8000 },
];

export function getHunterRank(points) {
  const rank = [...MASTERY_RANKS].reverse().find(r => points >= r.minPoints);
  return rank ? rank.title : "Fledgling";
}

export function getRankProgress(points) {
  const currentRankIndex = [...MASTERY_RANKS].reverse().findIndex(r => points >= r.minPoints);
  const currentRank = MASTERY_RANKS[MASTERY_RANKS.length - 1 - currentRankIndex];
  const nextRank = MASTERY_RANKS[MASTERY_RANKS.length - currentRankIndex];

  if (!nextRank) return { currentRank, nextRank: null, progress: 100 };

  const range = nextRank.minPoints - currentRank.minPoints;
  const progress = ((points - currentRank.minPoints) / range) * 100;

  return {
    currentRank,
    nextRank,
    progress: Math.min(100, Math.max(0, progress))
  };
}
