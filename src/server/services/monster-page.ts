import "server-only";
import { db, firstRow, rowsOf } from "@/server/db";
import { logServerError } from "@/server/logger";
import { getCrownById, type CrownDetail } from "./profile";
import { getMonsterByName, type Monster } from "./monsters";

export interface HostCrown {
  id: number;
  user_id: string;
  monster_id: number;
  type: "small" | "large";
  tempered: number;
  strength_rating: number;
  quest: string;
  pair_id: string | null;
  investigation_id: number | null;
  size_cm: number | null;
  size_label: string | null;
  username: string | null;
  avatar_url: string | null;
  status_message: string | null;
  receive_dms: number | null;
  inv_remaining_uses: number | null;
  inv_monster_id: number | null;
  inv_monster_name: string | null;
}

export interface SeekingEntry {
  id: number;
  user_id: string;
  type: string;
  username: string | null;
  avatar_url: string | null;
  status_message: string | null;
}

export type MonsterPageResult =
  | {
      status: "ok";
      monster: Monster;
      crowns: HostCrown[];
      wishlist: SeekingEntry[];
      userWishlistType: string | null;
    }
  | { status: "missing" }
  | { status: "error" };

export async function getMonsterPageData(
  name: string,
  userId: string | null,
): Promise<MonsterPageResult> {
  try {
    const monster = await getMonsterByName(name);
    if (!monster) return { status: "missing" };

    const [crowns, wishlist, own] = await Promise.all([
      db.execute({
        sql: `
          SELECT c.*, u.username, u.avatar_url, u.id AS user_id, u.status_message, u.receive_dms,
                 inv.remaining_uses AS inv_remaining_uses,
                 inv.monster_id AS inv_monster_id,
                 inv_m.name AS inv_monster_name
          FROM crowns c
          JOIN users u ON c.user_id = u.id
          LEFT JOIN investigations inv ON c.investigation_id = inv.id
          LEFT JOIN monsters inv_m ON inv.monster_id = inv_m.id
          WHERE c.monster_id = ?
          ORDER BY c.type DESC, c.tempered DESC
        `,
        args: [monster.id],
      }),
      db.execute({
        sql: `
          SELECT w.*, u.username, u.avatar_url, u.id AS user_id, u.status_message
          FROM wishlist w JOIN users u ON w.user_id = u.id
          WHERE w.monster_id = ?
          ORDER BY u.username ASC
        `,
        args: [monster.id],
      }),
      userId
        ? db.execute({
            sql: "SELECT type FROM wishlist WHERE user_id = ? AND monster_id = ? LIMIT 1",
            args: [userId, monster.id],
          })
        : null,
    ]);

    return {
      status: "ok",
      monster,
      crowns: rowsOf<HostCrown>(crowns),
      wishlist: rowsOf<SeekingEntry>(wishlist),
      userWishlistType: own ? (firstRow<{ type: string }>(own)?.type ?? null) : null,
    };
  } catch (error) {
    logServerError("Monster fetch failed", error);
    return { status: "error" };
  }
}

export async function findFeaturedCrown(
  monster: Monster,
  crownId: string | undefined,
  userId: string | undefined,
): Promise<CrownDetail | null> {
  if (crownId && /^\d+$/.test(crownId)) return getCrownById(Number(crownId));
  if (!userId) return null;
  const latest = firstRow<{ id: number }>(
    await db.execute({
      sql: "SELECT id FROM crowns WHERE user_id = ? AND monster_id = ? ORDER BY id DESC LIMIT 1",
      args: [userId, monster.id],
    }),
  );
  return latest ? getCrownById(latest.id) : null;
}

interface MonsterSummaryVersionRow {
  total: number | null;
  small: number | null;
  large: number | null;
  tempered: number | null;
  latest_id: number | null;
  wishlist_total: number | null;
}

export async function getMonsterSummaryVersion(monsterId: number): Promise<string> {
  const row = firstRow<MonsterSummaryVersionRow>(
    await db.execute({
      sql: `
        SELECT COUNT(*) AS total,
               SUM(CASE WHEN type = 'small' THEN 1 ELSE 0 END) AS small,
               SUM(CASE WHEN type = 'large' THEN 1 ELSE 0 END) AS large,
               SUM(CASE WHEN tempered = 1 THEN 1 ELSE 0 END) AS tempered,
               MAX(id) AS latest_id,
               (SELECT COUNT(*) FROM wishlist w WHERE w.monster_id = ?) AS wishlist_total
        FROM crowns WHERE monster_id = ?
      `,
      args: [monsterId, monsterId],
    }),
  );
  const n = (value: number | null | undefined) => Number(value || 0);
  return [
    n(row?.latest_id),
    n(row?.total),
    n(row?.small),
    n(row?.large),
    n(row?.tempered),
    n(row?.wishlist_total),
  ].join("-");
}
