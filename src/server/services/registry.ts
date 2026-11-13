import "server-only";
import { db, rowsOf } from "@/server/db";
import { logServerError } from "@/server/logger";
import { getAllMonstersEnriched } from "./monsters";

export interface RegistryMonster {
  id: number;
  name: string;
  image_name: string | null;
  type: string;
  mine: { s: number; l: number };
  isCompleted: boolean;
  wishlistType: string | null;
  demand: number;
  hostCount: { small: number; large: number };
}

interface UserCrownRow {
  monster_id: number;
  type: string;
}

export async function getRegistryMonsters(userId: string | null): Promise<RegistryMonster[]> {
  const [demandRes, monsters, hostRes, ownRows, wishRows] = await Promise.all([
    db.execute("SELECT monster_id, COUNT(*) AS count FROM wishlist GROUP BY monster_id"),
    getAllMonstersEnriched(),
    db.execute("SELECT monster_id, type, COUNT(*) AS count FROM crowns GROUP BY monster_id, type"),
    userId
      ? db.execute({ sql: "SELECT monster_id, type FROM crowns WHERE user_id = ?", args: [userId] })
      : null,
    userId
      ? db.execute({
          sql: "SELECT monster_id, type FROM wishlist WHERE user_id = ?",
          args: [userId],
        })
      : null,
  ]).catch((error: unknown) => {
    logServerError("Registry data failed", error);
    throw error;
  });

  const demand = new Map(
    rowsOf<{ monster_id: number; count: number }>(demandRes).map((row) => [
      row.monster_id,
      Number(row.count),
    ]),
  );

  const hosts = new Map<number, { small: number; large: number }>();
  for (const row of rowsOf<{ monster_id: number; type: "small" | "large"; count: number }>(
    hostRes,
  )) {
    const entry = hosts.get(row.monster_id) ?? { small: 0, large: 0 };
    entry[row.type] = Number(row.count);
    hosts.set(row.monster_id, entry);
  }

  const owned = ownRows ? rowsOf<UserCrownRow>(ownRows) : [];
  const wished = new Map(
    (wishRows ? rowsOf<UserCrownRow>(wishRows) : []).map((row) => [row.monster_id, row.type]),
  );

  return monsters.map((monster) => {
    const small = owned.filter((c) => c.monster_id === monster.id && c.type === "small").length;
    const large = owned.filter((c) => c.monster_id === monster.id && c.type === "large").length;
    return {
      id: monster.id,
      name: monster.name,
      image_name: monster.image_name,
      type: monster.type || "Monster",
      mine: { s: small, l: large },
      isCompleted: small > 0 && large > 0,
      wishlistType: wished.get(monster.id) ?? null,
      demand: demand.get(monster.id) ?? 0,
      hostCount: hosts.get(monster.id) ?? { small: 0, large: 0 },
    };
  });
}
