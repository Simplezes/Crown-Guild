import db from "@/lib/db";
import { fetchDiscordUser } from "@/lib/discord";
import { getMonsterCount } from "@/lib/monsters";

export async function getProfileData(userId) {
  try {
    const userRes = await db.execute({
      sql: "SELECT id, username, avatar_url, lobby_id, status_message FROM users WHERE id = ?",
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
              (SELECT COUNT(*) FROM completed_missions WHERE requester_id = ?) as joined`,
      args: [userId, userId]
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

    return {
      user: { ...user },
      crowns: crownsRes.rows.map(row => ({ ...row })),
      wishlist: Object.values(wishlistMap),
      stats: statsRes.rows[0],
      activity: activityRes.rows[0],
      completion,
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

export function getHunterRank(hosted, joined) {
  const total = (hosted || 0) + (joined || 0);
  if (total === 0) return "Fledgling";

  if (hosted >= joined * 2) {
    if (hosted >= 50) return "Guild Patron";
    if (hosted >= 20) return "Crown Broker";
    if (hosted >= 5) return "Expedition Leader";
    return "Host";
  } else if (joined >= hosted * 2) {
    if (joined >= 50) return "Crown Assassin";
    if (joined >= 20) return "Elite Mercenary";
    if (joined >= 5) return "Crown Seeker";
    return "Hunter";
  } else {
    if (total >= 100) return "Guild Legend";
    if (total >= 40) return "Veteran Hunter";
    if (total >= 10) return "Seasoned Hunter";
    return "Hunter";
  }
}
