import "server-only";
import {
  db,
  ensureArchiveTempered,
  firstRow,
  hasCrownSize,
  hasCrownSizeLabel,
  rowsOf,
} from "@/server/db";
import { fetchDiscordUser } from "@/server/discord";
import { logServerError } from "@/server/logger";
import type {
  CrownDetail,
  MonsterListing,
  ProfileCrown,
  ProfileData,
  ProfileUser,
} from "./profile-types";
import { masteryPointsFromRows, type RawArchiveRow } from "./archive";
export type { CrownDetail, MonsterListing, ProfileCrown, ProfileData } from "./profile-types";
import { getMonsterCount, getMonsterTierMap } from "./monsters";

function mergeListings(rows: MonsterListing[]): MonsterListing[] {
  const merged = new Map<number, MonsterListing>();
  for (const row of rows) {
    const existing = merged.get(row.monster_id);
    if (!existing) {
      merged.set(row.monster_id, { ...row });
    } else if (existing.type !== row.type) {
      existing.type = "both";
    }
  }
  return [...merged.values()];
}

const LISTING_SQL = (table: string, alias: string) => `
  SELECT ${alias}.*, m.name AS monster_name, m.emoji, m.image_name
  FROM ${table} ${alias} JOIN monsters m ON ${alias}.monster_id = m.id
  WHERE ${alias}.user_id = ? ORDER BY m.name ASC
`;

export async function getProfileData(userId: string): Promise<ProfileData | null> {
  try {
    const user = firstRow<Omit<ProfileUser, "username"> & { username: string | null }>(
      await db.execute({
        sql: `SELECT id, username, avatar_url, lobby_id, quest_password, status_message, receive_dms
              FROM users WHERE id = ?`,
        args: [userId],
      }),
    );
    if (!user) return null;

    const sizeColumn = (await hasCrownSize()) ? "c.size_cm" : "NULL AS size_cm";
    const labelColumn = (await hasCrownSizeLabel()) ? "c.size_label" : "NULL AS size_label";
    await ensureArchiveTempered();

    const [crowns, stats, archive, unique, wishlist, collection] = await Promise.all([
      db.execute({
        sql: `SELECT c.id, m.id AS monster_id, m.name, m.emoji, m.image_name,
                     c.type, c.tempered, c.strength_rating, c.quest, c.investigation_id, c.pair_id,
                     ${sizeColumn}, ${labelColumn},
                     inv.remaining_uses,
                     inv.monster_id AS inv_monster_id,
                     inv_m.name AS inv_monster_name,
                     inv_m.image_name AS inv_monster_image,
                     inv_m.emoji AS inv_monster_emoji
              FROM crowns c
              JOIN monsters m ON c.monster_id = m.id
              LEFT JOIN investigations inv ON c.investigation_id = inv.id
              LEFT JOIN monsters inv_m ON inv.monster_id = inv_m.id
              WHERE c.user_id = ?
              ORDER BY c.id DESC`,
        args: [userId],
      }),
      db.execute({
        sql: `SELECT COUNT(*) AS total,
                     SUM(CASE WHEN type = 'small' THEN 1 ELSE 0 END) AS small,
                     SUM(CASE WHEN type = 'large' THEN 1 ELSE 0 END) AS large,
                     SUM(CASE WHEN tempered = 1 THEN 1 ELSE 0 END) AS tempered
              FROM crowns WHERE user_id = ?`,
        args: [userId],
      }),
      db.execute({
        sql: "SELECT monster_id, type, tempered FROM guild_archive WHERE user_id = ?",
        args: [userId],
      }),
      db.execute({
        sql: "SELECT COUNT(DISTINCT monster_id) AS c FROM crowns WHERE user_id = ?",
        args: [userId],
      }),
      db.execute({ sql: LISTING_SQL("wishlist", "w"), args: [userId] }),
      db.execute({ sql: LISTING_SQL("hunter_collection", "hc"), args: [userId] }),
    ]);

    let username = user.username;
    let avatar = user.avatar_url;
    if (!username) {
      const discord = await fetchDiscordUser(userId);
      if (discord) {
        username = discord.username;
        avatar = discord.avatar_url;
        db.execute({
          sql: "UPDATE users SET username = ?, avatar_url = ? WHERE id = ?",
          args: [username, avatar, userId],
        }).catch((error: unknown) => logServerError("Failed to cache Discord user", error));
      }
    }

    const monsterCount = getMonsterCount() || 1;
    const uniqueCount = Number(firstRow<{ c: number }>(unique)?.c ?? 0);
    const counts = firstRow<Record<"total" | "small" | "large" | "tempered", number | null>>(stats);

    return {
      user: { ...user, username: username || `Hunter ${user.id.slice(0, 4)}`, avatar_url: avatar },
      crowns: rowsOf<ProfileCrown>(crowns),
      wishlist: mergeListings(rowsOf<MonsterListing>(wishlist)),
      collection: mergeListings(rowsOf<MonsterListing>(collection)),
      stats: {
        total: Number(counts?.total ?? 0),
        small: Number(counts?.small ?? 0),
        large: Number(counts?.large ?? 0),
        tempered: Number(counts?.tempered ?? 0),
      },
      completion: ((uniqueCount / monsterCount) * 100).toFixed(1),
      masteryPoints: masteryPointsFromRows(
        rowsOf<RawArchiveRow>(archive),
        await getMonsterTierMap(),
      ),
    };
  } catch (error) {
    logServerError("Profile fetch failed", error);
    return null;
  }
}

export async function getCrownById(crownId: number): Promise<CrownDetail | null> {
  try {
    return firstRow<CrownDetail>(
      await db.execute({
        sql: `
          SELECT c.*,
                 m.name AS monster_name, m.image_name AS monster_image,
                 u.username, u.avatar_url, u.id AS user_id, u.status_message,
                 inv.remaining_uses,
                 inv_m.name AS inv_monster_name,
                 inv_m.image_name AS inv_monster_image,
                 inv_m.emoji AS inv_monster_emoji
          FROM crowns c
          JOIN monsters m ON c.monster_id = m.id
          JOIN users u ON c.user_id = u.id
          LEFT JOIN investigations inv ON c.investigation_id = inv.id
          LEFT JOIN monsters inv_m ON inv.monster_id = inv_m.id
          WHERE c.id = ?
        `,
        args: [crownId],
      }),
    );
  } catch (error) {
    logServerError("Fetch crown failed", error);
    return null;
  }
}
