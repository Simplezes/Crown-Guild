const MONSTER_EMOJIS = {
  Ajarakan: "<:Ajarakan:1344853189379362877>",
  Arkveld: "<:Arkveld:1344853190977519707>",
  Balahara: "<:Balahara:1344853192365576213>",
  Blangonga: "<:Blangonga:1344853194274115625>",
  Chatacabra: "<:Chatacabra:1344853659976208444>",
  Congalala: "<:Congalala:1344853197654851707>",
  Doshaguma: "<:Doshaguma:1344853201551233085>",
  GArkveld: "<:GArkveld:1348003732771700767>",
  GDoshaguma: "<:GDoshaguma:1348003735065985157>",
  GEbonyOdogaron: "<:GEbonyOdogaron:1348003736781328625>",
  GFulgurAnjanath: "<:GFulgurAnjanath:1348003738601656380>",
  GRathalos: "<:GRathalos:1344853606796365856>",
  Gogmazios: "<:Gogmazios:1465202204934799558>",
  GoreMagala: "<:GoreMagala:1344853204009222214>",
  Gravios: "<:Gravios:1344853208027365407>",
  Gypceros: "<:Gypceros:1344853211156058243>",
  Hirabami: "<:Hirabami:1344853332254261383>",
  JinDahaad: "<:JinDahaad:1344853215060955277>",
  Lagiacrus: "<:Lagiacrus:1390122035375636520>",
  LalaBarina: "<:LalaBarina:1344853567386685510>",
  Mizutsune: "<:Mizutsune:1358330872331374602>",
  Nerscylla: "<:Nerscylla:1344853219343470632>",
  NuUdra: "<:NuUdra:1344853222400983110>",
  OmegaPlanetes: "<:OmegaPlanetes:1427988281207033966>",
  Rathalos: "<:Rathalos:1344854675371069490>",
  Rathian: "<:Rathian:1344853179535331538>",
  ReyDau: "<:ReyDau:1344853181183692841>",
  Rompopolo: "<:Rompopolo:1344853182425075782>",
  Seregios: "<:Seregios:1390122038320038020>",
  UthDuna: "<:UthDuna:1344853185419804813>",
  XuWu: "<:XuWu:1348003740912975974>",
  YianKutKu: "<:YianKutKu:1344853186812579960>",
  ZohShia: "<:ZohShia:1348003743425106034>",
};

function monsterEmoji(crown) {
  const name = String(crown.name || crown.monster_name || "").trim();
  const guardian = /^(?:Tempered\s+)?Guardian\s+/i.test(name);
  const baseName = name
    .replace(/^Tempered\s+Guardian\s+/i, "")
    .replace(/^Guardian\s+/i, "")
    .replace(/^Tempered\s+/i, "");
  const key = baseName.replace(/[^a-z\d]/gi, "");
  return MONSTER_EMOJIS[guardian ? `G${key}` : key] || crown.emoji || baseName || name;
}

function monsterName(crown) {
  const name = String(crown.name || crown.monster_name || "").trim();
  return name.replace(/^Tempered\s+/i, "") || name;
}

function isTempered(crown) {
  return crown.tempered === true || crown.tempered === 1 || crown.tempered === "1";
}

function monsterIdentity(crown) {
  if (crown.monster_id != null) return `id:${crown.monster_id}`;
  const name = String(crown.name || crown.monster_name || "").replace(/^Tempered\s+/i, "");
  return `name:${name.replace(/[^a-z\d]/gi, "").toLowerCase()}`;
}

function uniqueMonsters(crowns) {
  const seen = new Set();
  return crowns.filter((crown) => {
    const key = monsterIdentity(crown);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function appendMonsterList(lines, label, monsters) {
  const prefix = `  - ${label}: `;
  const continuation = " ".repeat(prefix.length);
  let line = prefix;

  for (const monster of monsters) {
    const next = line === prefix ? monster : `, ${monster}`;
    if (line.length + next.length > 64 && line !== prefix) {
      lines.push(`${line},`);
      line = `${continuation}${monster}`;
    } else {
      line += next;
    }
  }

  lines.push(line);
}

export function formatCrownShare(crowns, profileUrl, mode = "emoji") {
  const useEmojis = mode !== "plain";
  const simple = mode === "emojiSimple";
  const formatMonster = useEmojis ? monsterEmoji : monsterName;
  const small = [];
  const large = [];
  const pairs = new Map();

  for (const crown of crowns) {
    const type = String(crown.type || "").toLowerCase();
    if (type === "small") small.push(crown);
    if (type === "large") large.push(crown);
    if (crown.pair_id) {
      const pairId = String(crown.pair_id);
      if (!pairs.has(pairId)) pairs.set(pairId, []);
      pairs.get(pairId).push(crown);
    }
  }

  const formatSize = (label, entries) => {
    if (!entries.length) return null;

    if (simple) {
      const all = uniqueMonsters(entries).map(formatMonster);
      return all.length ? [`${label}: ${all.join(" ")}`] : [];
    }

    const regular = uniqueMonsters(entries.filter((crown) => !isTempered(crown))).map(formatMonster);
    const tempered = new Map();
    for (const crown of entries.filter(isTempered)) {
      const strength = Number(crown.strength_rating) || 0;
      const rating = strength > 0 ? `${strength}\u2605` : "Tempered";
      if (!tempered.has(rating)) tempered.set(rating, { seen: new Set(), values: [] });
      const group = tempered.get(rating);
      const key = monsterIdentity(crown);
      if (group.seen.has(key)) continue;
      group.seen.add(key);
      group.values.push(formatMonster(crown));
    }

    const ratingValue = (rating) => Number.parseInt(rating, 10) || Number.POSITIVE_INFINITY;
    const orderedTempered = [...tempered].sort(([a], [b]) => ratingValue(a) - ratingValue(b));
    if (!useEmojis) {
      regular.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
      const section = [label === "S" ? "Small" : "Large"];
      if (regular.length) appendMonsterList(section, "Regular", regular);
      for (const [rating, group] of orderedTempered) {
        group.values.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
        appendMonsterList(section, rating, group.values);
      }
      return section;
    }

    const parts = [...regular];
    for (const [rating, group] of orderedTempered) parts.push(`(${rating}: ${group.values.join(" ")})`);
    return [`${label}: ${parts.join(" ")}`];
  };

  const lines = [useEmojis ? "Available:" : "Available"];
  const smallLine = formatSize("S", small);
  const largeLine = formatSize("L", large);
  if (smallLine) lines.push(...smallLine);
  if (largeLine) {
    if (!useEmojis && smallLine) lines.push("");
    lines.push(...largeLine);
  }
  if (!smallLine && !largeLine) lines.push("No crowns recorded yet.");

  const multiQuests = [...pairs.values()]
    .filter((pair) => pair.length >= 2)
    .map((pair) => pair.slice(0, 2).map((crown) => {
      const label = String(crown.type).toLowerCase() === "small" ? "S" : "L";
      return `${label} ${formatMonster(crown)}`;
    }).join(" + "));

  if (multiQuests.length) {
    if (!useEmojis && (smallLine || largeLine)) lines.push("");
    lines.push("Multi-Quest:");
    lines.push(...(useEmojis ? [multiQuests.join(" / ")] : multiQuests.map((quest) => `  - ${quest}`)));
  }
  lines.push("", profileUrl);
  return lines.join("\n");
}

export function formatWishlistShare(entries) {
  const small = [];
  const large = [];

  for (const entry of entries) {
    const type = String(entry.type || "").toLowerCase();
    const emoji = monsterEmoji(entry);
    if (type === "both" || type === "small") small.push(emoji);
    if (type === "both" || type === "large") large.push(emoji);
  }

  const lines = ["Looking for:"];
  if (large.length) lines.push(`L: ${large.join(" ")}`);
  if (small.length) lines.push(`S: ${small.join(" ")}`);
  if (!large.length && !small.length) lines.push("Nothing on the wishlist yet.");
  return lines.join("\n");
}