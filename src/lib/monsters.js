import db from "./db";
import monstersData from "@/app/database/monsters.json";

export const QUEST_ICONS = {
  "Hunt": "MHWilds-Hunt_Icon.png",
  "Expedition": "MHWilds-Expedition_Record_Board_Icon.png",
  "Field Survey Quests": "MHWilds-Field_Survey_Icon.png",
  "Investigation Quests": "MHWilds-Investigation_Icon.png",
  "Event Quests": "MHWilds-Event_Quest_Icon.png",
  "Optional Quests": "MHWilds-Optional_Quest_Icon.png"
};

export function getQuestIcon(questType) {
  return QUEST_ICONS[questType] || "MHWilds-Hunt_Icon.png";
}

export function enrichMonster(dbMonster, jsonData = null) {
  if (!dbMonster) return null;

  const extra = (jsonData || monstersData.monsters).find(
    m => m.name.toLowerCase() === dbMonster.name.toLowerCase()
  );

  if (!extra) return dbMonster;

  const gameInfo = extra.games?.find(g => g.game === "Monster Hunter Wilds");

  return {
    ...dbMonster,
    type: extra.type,
    weaknesses: extra.weakness || [],
    elements: extra.elements || [],
    ailments: extra.ailments || [],
    info: gameInfo?.info || null,
    image_name: dbMonster.image_name || gameInfo?.image || null,
    extraInfo: extra
  };
}

export async function getAllMonsters(enriched = false) {
  const res = await db.execute("SELECT * FROM monsters ORDER BY name ASC");
  if (enriched) {
    return res.rows.map(m => enrichMonster(m));
  }
  return res.rows;
}

export async function getMonsterByName(name) {
  const decodedName = decodeURIComponent(name);
  const res = await db.execute({
    sql: "SELECT * FROM monsters WHERE name = ?",
    args: [decodedName]
  });

  let monster = res.rows[0];
  const extraInfo = monstersData.monsters.find(m => m.name.toLowerCase() === decodedName.toLowerCase());

  if (!monster) {
    if (!extraInfo) return null;
    monster = {
      id: extraInfo._id.$oid,
      name: extraInfo.name,
      is_large: extraInfo.isLarge !== false,
      image_name: extraInfo.games?.find(g => g.game === "Monster Hunter Wilds")?.image || null,
      emoji: "🐉"
    };
  }

  return enrichMonster(monster, monstersData.monsters);
}

export async function getMonsterById(id) {
  const res = await db.execute({
    sql: "SELECT * FROM monsters WHERE id = ?",
    args: [id]
  });

  if (res.rows.length === 0) return null;
  return enrichMonster(res.rows[0]);
}

export function getMonsterCount() {
  return monstersData.monsters.length;
}

export async function getMonsterStats(monsterId) {
  try {
    const res = await db.execute({
      sql: `
        SELECT 
          SUM(CASE WHEN type = 'small' THEN 1 ELSE 0 END) as small,
          SUM(CASE WHEN type = 'large' THEN 1 ELSE 0 END) as large
        FROM crowns WHERE monster_id = ?
      `,
      args: [monsterId]
    });
    return res.rows[0] || { small: 0, large: 0 };
  } catch (e) {
    console.error("Get monster stats error", e);
    return { small: 0, large: 0 };
  }
}
