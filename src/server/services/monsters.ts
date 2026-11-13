import "server-only";
import monstersData from "@/data/monsters.json";
import { getSpeciesTier, type Tier } from "@/config/mastery";
import { db, firstRow, rowsOf } from "@/server/db";
import { logServerError } from "@/server/logger";

interface MonsterEntry {
  _id: { $oid: string };
  name: string;
  type?: string;
  isLarge?: boolean;
  weakness?: string[];
  elements?: string[];
  ailments?: string[];
  games?: { game: string; info?: string; image?: string }[];
}

interface MonsterRow {
  id: number;
  name: string;
  image_name: string | null;
  emoji: string | null;
  is_large?: number | boolean;
}

export interface Monster extends MonsterRow {
  type?: string;
  weaknesses: string[];
  elements: string[];
  ailments: string[];
  info: string | null;
  extraInfo: MonsterEntry | null;
}

const WILDS = "Monster Hunter Wilds";
const catalog = (monstersData as { monsters: MonsterEntry[] }).monsters;
const entryByName = new Map(catalog.map((entry) => [entry.name.toLowerCase(), entry]));

export const getMonsterCount = () => catalog.length;

function enrichMonster(row: MonsterRow): Monster {
  const entry = entryByName.get(row.name.toLowerCase()) ?? null;
  const wilds = entry?.games?.find((game) => game.game === WILDS);
  return {
    ...row,
    type: entry?.type,
    weaknesses: entry?.weakness ?? [],
    elements: entry?.elements ?? [],
    ailments: entry?.ailments ?? [],
    info: wilds?.info ?? null,
    image_name: row.image_name || wilds?.image || null,
    extraInfo: entry,
  };
}

async function getAllMonsters(): Promise<MonsterRow[]> {
  return rowsOf<MonsterRow>(await db.execute("SELECT * FROM monsters ORDER BY name ASC"));
}

export async function getAllMonstersEnriched(): Promise<Monster[]> {
  return (await getAllMonsters()).map(enrichMonster);
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function getMonsterByName(name: string): Promise<Monster | null> {
  const decoded = safeDecode(name);
  const row = firstRow<MonsterRow>(
    await db.execute({ sql: "SELECT * FROM monsters WHERE name = ?", args: [decoded] }),
  );
  if (row) return enrichMonster(row);

  const entry = entryByName.get(decoded.toLowerCase());
  if (!entry) return null;
  return enrichMonster({
    id: -1,
    name: entry.name,
    is_large: entry.isLarge !== false,
    image_name: entry.games?.find((game) => game.game === WILDS)?.image ?? null,
    emoji: "🐉",
  });
}

let tierMapPromise: Promise<Record<number, Tier>> | undefined;

export function getMonsterTierMap(): Promise<Record<number, Tier>> {
  tierMapPromise ??= (async () => {
    const rows = rowsOf<{ id: number; name: string }>(
      await db.execute("SELECT id, name FROM monsters"),
    );
    const map: Record<number, Tier> = {};
    for (const row of rows) {
      map[row.id] = getSpeciesTier(entryByName.get(row.name.toLowerCase())?.type);
    }
    return map;
  })().catch((error: unknown) => {
    tierMapPromise = undefined;
    throw error;
  });
  return tierMapPromise;
}

export async function getMonsterStats(
  monsterId: number,
): Promise<{ small: number; large: number }> {
  try {
    const row = firstRow<{ small: number | null; large: number | null }>(
      await db.execute({
        sql: `SELECT
                SUM(CASE WHEN type = 'small' THEN 1 ELSE 0 END) AS small,
                SUM(CASE WHEN type = 'large' THEN 1 ELSE 0 END) AS large
              FROM crowns WHERE monster_id = ?`,
        args: [monsterId],
      }),
    );
    return { small: Number(row?.small ?? 0), large: Number(row?.large ?? 0) };
  } catch (error) {
    logServerError("Get monster stats failed", error);
    return { small: 0, large: 0 };
  }
}
