import db, { hasCrownSize } from "@/lib/db";
import { fetchDiscordUser } from "@/lib/discord";
import { getMonsterCount, getMonsterTierMap } from "@/lib/monsters";
import { masteryPointsFromRows } from "@/lib/guildArchive";
import { MASTERY_RANKS, getHunterRank, getRankProgress } from "@/lib/mastery";

export async function getProfileData(userId) {
  try {
    const userRes = await db.execute({
      sql: "SELECT id, username, avatar_url, lobby_id, quest_password, status_message, receive_dms FROM users WHERE id = ?",
      args: [userId]
    });

    if (userRes.rows.length === 0) return null;

    let user = userRes.rows[0];

    const monsterCount = getMonsterCount() || 1;
    const sizeCol = (await hasCrownSize()) ? "c.size_cm" : "NULL AS size_cm";

    const [
      crownsRes,
      statsRes,
      archiveRes,
      uniqueRes,
      wishlistRes,
      collectionRes,
    ] = await Promise.all([
      db.execute({
        sql: `SELECT c.id, m.id as monster_id, m.name, m.emoji, m.image_name,
                     c.type, c.tempered, c.strength_rating, c.quest, c.investigation_id, c.pair_id, ${sizeCol},
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
      }),
      db.execute({
        sql: `SELECT
                COUNT(*) as total,
                SUM(CASE WHEN type = 'small' THEN 1 ELSE 0 END) as small,
                SUM(CASE WHEN type = 'large' THEN 1 ELSE 0 END) as large,
                SUM(CASE WHEN tempered = 1 THEN 1 ELSE 0 END) as tempered
              FROM crowns WHERE user_id = ?`,
        args: [userId]
      }),
      db.execute({
        sql: `SELECT monster_id, type, tempered FROM guild_archive WHERE user_id = ?`,
        args: [userId]
      }),
      db.execute({
        sql: `SELECT COUNT(DISTINCT monster_id) as c FROM crowns WHERE user_id = ?`,
        args: [userId]
      }),
      db.execute({
        sql: `SELECT w.*, m.name as monster_name, m.emoji, m.image_name
              FROM wishlist w
              JOIN monsters m ON w.monster_id = m.id
              WHERE w.user_id = ?
              ORDER BY m.name ASC`,
        args: [userId]
      }),
      db.execute({
        sql: `SELECT hc.*, m.name as monster_name, m.emoji, m.image_name
              FROM hunter_collection hc
              JOIN monsters m ON hc.monster_id = m.id
              WHERE hc.user_id = ?
              ORDER BY m.name ASC`,
        args: [userId]
      }),
    ]);

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

    const uniqueMonsters = uniqueRes.rows[0]?.c || 0;
    const completion = ((uniqueMonsters / monsterCount) * 100).toFixed(1);

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

    // Mastery Points come only from crowns actually logged in the app
    // (archived below) - the Collected checklist is a personal tracker,
    // not an MP source, so it can't be used to fake rank.
    const tierMap = await getMonsterTierMap();
    const masteryPoints = masteryPointsFromRows(archiveRes.rows, tierMap);

    return {
      user: { ...user },
      crowns: crownsRes.rows.map(row => ({ ...row })),
      wishlist: Object.values(wishlistMap),
      collection,
      stats: { ...statsRes.rows[0] },
      completion,
      masteryPoints,
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

export async function getCrownsByIds(ids) {
  if (!ids || ids.length === 0) return [];

  try {
    const placeholders = ids.map(() => "?").join(",");
    const res = await db.execute({
      sql: `
        SELECT c.*, m.name, m.image_name,
               inv.remaining_uses AS inv_remaining_uses,
               inv.monster_id     AS inv_monster_id
        FROM crowns c
        JOIN monsters m ON c.monster_id = m.id
        LEFT JOIN investigations inv ON c.investigation_id = inv.id
        WHERE c.id IN (${placeholders})
      `,
      args: ids
    });
    return res.rows.map(row => ({ ...row }));
  } catch (e) {
    console.error("Fetch crowns by ids error", e);
    return [];
  }
}

export { MASTERY_RANKS, getHunterRank, getRankProgress };
