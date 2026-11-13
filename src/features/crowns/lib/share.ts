import { NORMALIZED_EMOJIS } from "./discord-emojis";

export type ShareMode = "emoji" | "emojiSimple" | "plain";

export interface ShareCrown {
  monster_id?: number | null;
  name?: string | null;
  monster_name?: string | null;
  emoji?: string | null;
  type: string;
  tempered: number | boolean | string;
  strength_rating?: number | null;
  pair_id?: string | null;
}

const nameOf = (crown: ShareCrown) => String(crown.name || crown.monster_name || "").trim();
const compact = (value: string) => value.replace(/[^a-z\d]/gi, "").toLowerCase();
const byName = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: "base" });

function monsterEmoji(crown: ShareCrown): string {
  const name = nameOf(crown);
  const guardian = /^(?:Tempered\s+)?Guardian\s+/i.test(name);
  const baseName = name
    .replace(/^Tempered\s+Guardian\s+/i, "")
    .replace(/^Guardian\s+/i, "")
    .replace(/^Tempered\s+/i, "");
  const key = compact(baseName);
  return NORMALIZED_EMOJIS[guardian ? `g${key}` : key] || crown.emoji || baseName || name;
}

function monsterName(crown: ShareCrown): string {
  const name = nameOf(crown);
  return name.replace(/^Tempered\s+/i, "") || name;
}

const isTempered = (crown: ShareCrown) =>
  crown.tempered === true || crown.tempered === 1 || crown.tempered === "1";

function identity(crown: ShareCrown): string {
  if (crown.monster_id != null) return `id:${crown.monster_id}`;
  return `name:${compact(nameOf(crown).replace(/^Tempered\s+/i, ""))}`;
}

function uniqueMonsters(crowns: ShareCrown[]): ShareCrown[] {
  const seen = new Set<string>();
  return crowns.filter((crown) => {
    const key = identity(crown);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function appendMonsterList(lines: string[], label: string, monsters: string[]): void {
  const prefix = `  - ${label}: `;
  const indent = " ".repeat(prefix.length);
  let line = prefix;
  for (const monster of monsters) {
    const next = line === prefix ? monster : `, ${monster}`;
    if (line.length + next.length > 64 && line !== prefix) {
      lines.push(`${line},`);
      line = `${indent}${monster}`;
    } else {
      line += next;
    }
  }
  lines.push(line);
}

interface FormatContext {
  useEmojis: boolean;
  simple: boolean;
  format: (crown: ShareCrown) => string;
}

function temperedGroups(entries: ShareCrown[], format: (crown: ShareCrown) => string) {
  const groups = new Map<string, { seen: Set<string>; values: string[] }>();
  for (const crown of entries.filter(isTempered)) {
    const strength = Number(crown.strength_rating) || 0;
    const rating = strength > 0 ? `${strength}★` : "Tempered";
    const group = groups.get(rating) ?? { seen: new Set<string>(), values: [] };
    groups.set(rating, group);
    const key = identity(crown);
    if (group.seen.has(key)) continue;
    group.seen.add(key);
    group.values.push(format(crown));
  }
  const value = (rating: string) => Number.parseInt(rating, 10) || Number.POSITIVE_INFINITY;
  return [...groups].sort(([a], [b]) => value(a) - value(b));
}

function formatSize(label: "S" | "L", entries: ShareCrown[], ctx: FormatContext): string[] | null {
  if (!entries.length) return null;

  if (ctx.simple) {
    const all = uniqueMonsters(entries).map(ctx.format);
    return all.length ? [`${label}: ${all.join(" ")}`] : [];
  }

  const regular = uniqueMonsters(entries.filter((crown) => !isTempered(crown))).map(ctx.format);
  const tempered = temperedGroups(entries, ctx.format);

  if (!ctx.useEmojis) {
    regular.sort(byName);
    const section = [label === "S" ? "Small" : "Large"];
    if (regular.length) appendMonsterList(section, "Regular", regular);
    for (const [rating, group] of tempered) {
      group.values.sort(byName);
      appendMonsterList(section, rating, group.values);
    }
    return section;
  }

  const parts = [...regular];
  for (const [rating, group] of tempered) parts.push(`(${rating}: ${group.values.join(" ")})`);
  return [`${label}: ${parts.join(" ")}`];
}

function multiQuestLines(crowns: ShareCrown[], ctx: FormatContext): string[] {
  const pairs = new Map<string, ShareCrown[]>();
  for (const crown of crowns) {
    if (!crown.pair_id) continue;
    const id = String(crown.pair_id);
    pairs.set(id, [...(pairs.get(id) ?? []), crown]);
  }
  const quests = [...pairs.values()]
    .filter((pair) => pair.length >= 2)
    .map((pair) =>
      pair
        .slice(0, 2)
        .map(
          (crown) =>
            `${String(crown.type).toLowerCase() === "small" ? "S" : "L"} ${ctx.format(crown)}`,
        )
        .join(" + "),
    );
  if (!quests.length) return [];
  return ctx.useEmojis ? [quests.join(" / ")] : quests.map((quest) => `  - ${quest}`);
}

export function formatCrownShare(
  crowns: ShareCrown[],
  profileUrl: string,
  mode: ShareMode = "emoji",
): string {
  const useEmojis = mode !== "plain";
  const ctx: FormatContext = {
    useEmojis,
    simple: mode === "emojiSimple",
    format: useEmojis ? monsterEmoji : monsterName,
  };

  const small = crowns.filter((crown) => String(crown.type).toLowerCase() === "small");
  const large = crowns.filter((crown) => String(crown.type).toLowerCase() === "large");

  const lines = [useEmojis ? "Available:" : "Available"];
  const smallLines = formatSize("S", small, ctx);
  const largeLines = formatSize("L", large, ctx);
  if (smallLines) lines.push(...smallLines);
  if (largeLines) {
    if (!useEmojis && smallLines) lines.push("");
    lines.push(...largeLines);
  }
  if (!smallLines && !largeLines) lines.push("No crowns recorded yet.");

  const multi = multiQuestLines(crowns, ctx);
  if (multi.length) {
    if (!useEmojis && (smallLines || largeLines)) lines.push("");
    lines.push("Multi-Quest:", ...multi);
  }

  lines.push("", profileUrl);
  return lines.join("\n");
}

export interface WishlistShareEntry {
  name: string;
  emoji?: string | null;
  type: string;
}

export function formatWishlistShare(entries: WishlistShareEntry[]): string {
  const small: string[] = [];
  const large: string[] = [];

  for (const entry of entries) {
    const type = String(entry.type || "").toLowerCase();
    const emoji = monsterEmoji({ ...entry, type, tempered: false });
    if (type === "both" || type === "small") small.push(emoji);
    if (type === "both" || type === "large") large.push(emoji);
  }

  const lines = ["Looking for:"];
  if (large.length) lines.push(`L: ${large.join(" ")}`);
  if (small.length) lines.push(`S: ${small.join(" ")}`);
  if (!large.length && !small.length) lines.push("Nothing on the wishlist yet.");
  return lines.join("\n");
}
