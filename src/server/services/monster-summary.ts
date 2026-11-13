import "server-only";
import { db, firstRow, rowsOf } from "@/server/db";
import type { Monster } from "./monsters";

interface CountRow {
  type: string;
  c: number;
}

interface HostRow {
  type: string;
  tempered: number;
  strength_rating: number;
  quest: string;
  remaining_uses: number | null;
  user_id: string;
  username: string | null;
  avatar_url: string | null;
}

export interface MonsterSummary {
  id: number;
  name: string;
  image_name: string | null;
  type: string;
  elements: string[];
  weakness: string[];
  demand: number;
  hostCount: { small: number; large: number };
  mine: { s: number; l: number };
  wishlistType: string | null;
  signedIn: boolean;
  hosts: HostRow[];
}

const countOf = (rows: CountRow[], type: string) =>
  Number(rows.find((row) => row.type === type)?.c ?? 0);

export async function getMonsterSummary(
  monster: Monster,
  userId: string | null,
): Promise<MonsterSummary> {
  const [counts, demand, hosts, mine, wish] = await Promise.all([
    db.execute({
      sql: "SELECT type, COUNT(*) AS c FROM crowns WHERE monster_id = ? GROUP BY type",
      args: [monster.id],
    }),
    db.execute({
      sql: "SELECT COUNT(*) AS c FROM wishlist WHERE monster_id = ?",
      args: [monster.id],
    }),
    db.execute({
      sql: `SELECT c.type, c.tempered, c.strength_rating, c.quest, inv.remaining_uses,
                   u.id AS user_id, u.username, u.avatar_url
            FROM crowns c JOIN users u ON u.id = c.user_id
            LEFT JOIN investigations inv ON inv.id = c.investigation_id
            WHERE c.monster_id = ?
            ORDER BY c.tempered DESC, c.strength_rating DESC LIMIT 3`,
      args: [monster.id],
    }),
    userId
      ? db.execute({
          sql: "SELECT type, COUNT(*) AS c FROM crowns WHERE user_id = ? AND monster_id = ? GROUP BY type",
          args: [userId, monster.id],
        })
      : null,
    userId
      ? db.execute({
          sql: "SELECT type FROM wishlist WHERE user_id = ? AND monster_id = ? LIMIT 1",
          args: [userId, monster.id],
        })
      : null,
  ]);

  const hostCounts = rowsOf<CountRow>(counts);
  const mineCounts = mine ? rowsOf<CountRow>(mine) : [];

  return {
    id: monster.id,
    name: monster.name,
    image_name: monster.image_name,
    type: monster.extraInfo?.type || "Monster",
    elements: monster.elements,
    weakness: monster.weaknesses,
    demand: Number(firstRow<{ c: number }>(demand)?.c ?? 0),
    hostCount: { small: countOf(hostCounts, "small"), large: countOf(hostCounts, "large") },
    mine: { s: countOf(mineCounts, "small"), l: countOf(mineCounts, "large") },
    wishlistType: wish ? (firstRow<{ type: string }>(wish)?.type ?? null) : null,
    signedIn: !!userId,
    hosts: rowsOf<HostRow>(hosts),
  };
}
