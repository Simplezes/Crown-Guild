const QUEST_ICONS: Record<string, string> = {
  Hunt: "MHWilds-Hunt_Icon.png",
  Expedition: "MHWilds-Expedition_Record_Board_Icon.png",
  "Field Survey Quests": "MHWilds-Field_Survey_Icon.png",
  "Investigation Quests": "MHWilds-Investigation_Icon.png",
  "Event Quests": "MHWilds-Event_Quest_Icon.png",
  "Optional Quests": "MHWilds-Optional_Quest_Icon.png",
};

export const QUEST_TYPES = Object.keys(QUEST_ICONS) as [string, ...string[]];

export function getQuestIcon(questType: string): string {
  return QUEST_ICONS[questType] ?? "MHWilds-Hunt_Icon.png";
}
