type CrownKind = "small" | "large";
type SizeMode = "cm" | "label";
export type PickTarget = number | "primary" | null;

export interface LogEntry {
  id?: number;
  monster_id: number | "";
  type: CrownKind;
  tempered: boolean;
  strength_rating: number;
  size: string;
  sizeLabel: string;
  sizeMode: SizeMode;
}

export interface GroupCrown {
  id: number;
  monster_id: number;
  type: CrownKind;
  tempered: number | boolean;
  strength_rating: number;
  size_cm: number | null;
  size_label: string | null;
  quest: string;
  remaining_uses: number | null;
  investigation_id: number | null;
  inv_monster_id: number | null;
  pair_id: string | null;
}

export interface LogQuest {
  label: string;
  value: string;
  icon: string;
}

export const QUESTS: LogQuest[] = [
  { label: "Event Quest", value: "Event Quests", icon: "event" },
  { label: "Optional Quest", value: "Optional Quests", icon: "optional" },
  { label: "Field Survey", value: "Field Survey Quests", icon: "survey" },
  { label: "Investigation", value: "Investigation Quests", icon: "investigation" },
];

export const MAX_CROWNS = 4;
export const INVESTIGATION = "Investigation Quests";

export const DEFAULT_QUEST = QUESTS[1] as LogQuest;
