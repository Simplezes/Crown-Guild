import "server-only";
import { rankView } from "@/config/mastery";
import { db, ensureArchiveTempered, firstRow, placeholders, rowsOf } from "@/server/db";
import { logServerError } from "@/server/logger";
import { masteryPointsFromRows, type RawArchiveRow } from "./archive";
import { getMonsterTierMap } from "./monsters";

export interface HomeData {
  unavailable: boolean;
  stats: { hunters: number; crowns: number; temperedRate: number; investigations: number };
  demand: { id: number; name: string; image: string | null; demand: number }[];
  latest: {
    id: number;
    type: "small" | "large";
    tempered: boolean;
    monster: string;
    image: string | null;
    username: string | null;
  }[];
  legends: {
    id: string;
    name: string;
    avatar: string | null;
    crowns: number;
    rank: number;
    rankTitle: string;
  }[];
  rarest: { id: number; name: string; image: string | null; crowns: number }[];
  roster: { name: string; image: string }[];
  spotlightMeta: { small: number; large: number; claimed: number };
  seekers: { name: string; avatar: string | null }[];
}

const EMPTY: HomeData = {
  unavailable: true,
  stats: { hunters: 0, crowns: 0, temperedRate: 0, investigations: 0 },
  demand: [],
  latest: [],
  legends: [],
  rarest: [],
  roster: [],
  spotlightMeta: { small: 0, large: 0, claimed: 0 },
  seekers: [],
};

const count = (result: Awaited<ReturnType<typeof db.execute>>) =>
  Number(firstRow<{ count: number }>(result)?.count ?? 0);

interface DemandRow {
  id: number;
  name: string;
  image_name: string | null;
  demand: number;
}

interface LegendRow {
  id: string;
  username: string | null;
  avatar_url: string | null;
  crown_count: number;
}

async function loadSpotlight(topId: number | undefined, legendIds: string[]) {
  await ensureArchiveTempered();
  const none = { rows: [] } as unknown as Awaited<ReturnType<typeof db.execute>>;
  return Promise.all([
    topId
      ? db.execute({
          sql: `SELECT u.username, u.avatar_url FROM wishlist w JOIN users u ON u.id = w.user_id
                WHERE w.monster_id = ? GROUP BY u.id LIMIT 4`,
          args: [topId],
        })
      : none,
    legendIds.length
      ? db.execute({
          sql: `SELECT user_id, monster_id, type, tempered FROM guild_archive
                WHERE user_id IN (${placeholders(legendIds.length)})`,
          args: legendIds,
        })
      : none,
    topId
      ? db.execute({
          sql: "SELECT type, COUNT(*) AS c FROM wishlist WHERE monster_id = ? GROUP BY type",
          args: [topId],
        })
      : none,
    topId
      ? db.execute({ sql: "SELECT COUNT(*) AS c FROM crowns WHERE monster_id = ?", args: [topId] })
      : none,
  ]);
}

export async function getHomeData(): Promise<HomeData> {
  try {
    const [hunters, crowns, wanted, recent, renown, tempered, investigations, rarest, roster] =
      await Promise.all([
        db.execute("SELECT COUNT(*) AS count FROM users"),
        db.execute("SELECT COUNT(*) AS count FROM crowns"),
        db.execute(`
          SELECT m.id, m.name, m.image_name, COUNT(w.id) AS demand
          FROM monsters m JOIN wishlist w ON m.id = w.monster_id
          GROUP BY m.id ORDER BY demand DESC LIMIT 6
        `),
        db.execute(`
          SELECT c.id, c.type, c.tempered, m.name AS monster_name, m.image_name, u.username
          FROM crowns c JOIN monsters m ON c.monster_id = m.id JOIN users u ON c.user_id = u.id
          ORDER BY c.id DESC LIMIT 5
        `),
        db.execute(`
          SELECT u.id, u.username, u.avatar_url, COUNT(c.id) AS crown_count
          FROM users u JOIN crowns c ON c.user_id = u.id
          GROUP BY u.id ORDER BY crown_count DESC LIMIT 5
        `),
        db.execute("SELECT COUNT(*) AS count FROM crowns WHERE tempered = 1"),
        db.execute("SELECT COUNT(*) AS count FROM investigations"),
        db.execute(`
          SELECT m.id, m.name, m.image_name, COUNT(c.id) AS crown_count
          FROM monsters m JOIN crowns c ON c.monster_id = m.id
          GROUP BY m.id ORDER BY crown_count ASC, m.name ASC LIMIT 3
        `),
        db.execute("SELECT name, image_name FROM monsters ORDER BY name ASC"),
      ]);

    const demand = rowsOf<DemandRow>(wanted);
    const legendRows = rowsOf<LegendRow>(renown);
    const [seekers, archive, wantTypes, claimed] = await loadSpotlight(
      demand[0]?.id,
      legendRows.map((row) => row.id),
    );
    const tierMap = await getMonsterTierMap();
    const archiveRows = rowsOf<RawArchiveRow & { user_id: string }>(archive);

    const want = { small: 0, large: 0 };
    for (const row of rowsOf<{ type: string; c: number }>(wantTypes)) {
      const amount = Number(row.c);
      if (row.type !== "large") want.small += amount;
      if (row.type !== "small") want.large += amount;
    }

    const crownTotal = count(crowns);
    return {
      unavailable: false,
      stats: {
        hunters: count(hunters),
        crowns: crownTotal,
        temperedRate: crownTotal ? Math.round((count(tempered) / crownTotal) * 100) : 0,
        investigations: count(investigations),
      },
      demand: demand.map((row) => ({
        id: row.id,
        name: row.name,
        image: row.image_name,
        demand: Number(row.demand),
      })),
      latest: rowsOf<{
        id: number;
        type: "small" | "large";
        tempered: number;
        monster_name: string;
        image_name: string | null;
        username: string | null;
      }>(recent).map((row) => ({
        id: row.id,
        type: row.type,
        tempered: !!row.tempered,
        monster: row.monster_name,
        image: row.image_name,
        username: row.username,
      })),
      legends: legendRows.map((user) => {
        const view = rankView(
          masteryPointsFromRows(
            archiveRows.filter((row) => row.user_id === user.id),
            tierMap,
          ),
        );
        return {
          id: user.id,
          name: user.username || `Hunter ${String(user.id).slice(0, 4)}`,
          avatar: user.avatar_url || null,
          crowns: Number(user.crown_count),
          rank: view.rank,
          rankTitle: view.title,
        };
      }),
      rarest: rowsOf<{ id: number; name: string; image_name: string | null; crown_count: number }>(
        rarest,
      ).map((row) => ({
        id: row.id,
        name: row.name,
        image: row.image_name,
        crowns: Number(row.crown_count),
      })),
      roster: rowsOf<{ name: string; image_name: string | null }>(roster)
        .filter((row): row is { name: string; image_name: string } => !!row.image_name)
        .map((row) => ({ name: row.name, image: row.image_name })),
      spotlightMeta: { ...want, claimed: Number(firstRow<{ c: number }>(claimed)?.c ?? 0) },
      seekers: rowsOf<{ username: string | null; avatar_url: string | null }>(seekers).map(
        (row) => ({
          name: row.username || "Hunter",
          avatar: row.avatar_url || null,
        }),
      ),
    };
  } catch (error) {
    logServerError("Home data failed", error);
    return EMPTY;
  }
}
