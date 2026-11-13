import "server-only";
import { db, firstRow, rowsOf } from "@/server/db";

export interface GuildCardMonster {
  name: string;
  image_name: string | null;
}

export interface GuildCardData {
  stats: {
    total: number;
    hunters: number;
    species: number;
    small: number;
    large: number;
    tempered: number;
  };
  smallOnly: GuildCardMonster[];
  largeOnly: GuildCardMonster[];
}

interface StatsRow {
  total_crowns: number | null;
  total_hunters: number | null;
  unique_monsters: number | null;
  small: number | null;
  large: number | null;
  tempered: number | null;
}

export async function getGuildCardData(): Promise<GuildCardData> {
  const [crownsRes, statsRes] = await Promise.all([
    db.execute(
      "SELECT c.type, m.name, m.image_name FROM crowns c JOIN monsters m ON c.monster_id = m.id",
    ),
    db.execute(`
      SELECT COUNT(*) AS total_crowns, COUNT(DISTINCT c.user_id) AS total_hunters,
        COUNT(DISTINCT c.monster_id) AS unique_monsters,
        SUM(CASE WHEN c.type = 'small' THEN 1 ELSE 0 END) AS small,
        SUM(CASE WHEN c.type = 'large' THEN 1 ELSE 0 END) AS large,
        SUM(CASE WHEN c.tempered = 1 THEN 1 ELSE 0 END) AS tempered
      FROM crowns c
    `),
  ]);

  const monsters = new Map<string, GuildCardMonster>();
  const small = new Set<string>();
  const large = new Set<string>();
  for (const crown of rowsOf<GuildCardMonster & { type: string }>(crownsRes)) {
    monsters.set(crown.name, { name: crown.name, image_name: crown.image_name });
    if (crown.type === "small") small.add(crown.name);
    if (crown.type === "large") large.add(crown.name);
  }
  const pick = (names: Set<string>) =>
    [...names].map((name) => monsters.get(name)).filter((m): m is GuildCardMonster => !!m);

  const stats = firstRow<StatsRow>(statsRes);
  const n = (value: number | null | undefined) => Number(value || 0);
  return {
    stats: {
      total: n(stats?.total_crowns),
      hunters: n(stats?.total_hunters),
      species: n(stats?.unique_monsters),
      small: n(stats?.small),
      large: n(stats?.large),
      tempered: n(stats?.tempered),
    },
    smallOnly: pick(small),
    largeOnly: pick(large),
  };
}
