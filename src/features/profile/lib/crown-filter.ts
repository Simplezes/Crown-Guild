import type { CrownGroup } from "./crown-groups";

export type FilterField =
  "questType" | "usesLeft" | "monsterId" | "monsterType" | "monsterSize" | "strength" | "length";

export interface FilterState {
  questType: string;
  usesLeft: string;
  monsterId: string;
  monsterType: string;
  monsterSize: string;
  strength: string;
  tempered: boolean;
  lengthMode: "cm" | "size";
  lengthCm: string;
  lengthSize: string;
}

export interface FilterOption {
  value: string;
  label: string;
  image_name?: string | null;
}

export const INVESTIGATION = "Investigation Quests";
export const sizeName = (value: string) => (value === "small" ? "Small" : "Large");

export const DEFAULT_FILTER: FilterState = {
  questType: "Any",
  usesLeft: "Any",
  monsterId: "Any",
  monsterType: "Any",
  monsterSize: "Any",
  strength: "Any",
  tempered: false,
  lengthMode: "cm",
  lengthCm: "",
  lengthSize: "Any",
};

export const FILTER_TITLES: Record<FilterField, string> = {
  questType: "Quest type",
  usesLeft: "Uses left",
  monsterId: "Monster",
  monsterType: "Monster type",
  monsterSize: "Monster size",
  strength: "Monster strength",
  length: "Length",
};

export function matchesCrownFilter(
  group: CrownGroup,
  filter: FilterState,
  search: string,
  monsterTypeById: Record<string, string>,
): boolean {
  const first = group[0];
  const term = search.trim().toLowerCase();
  if (term) {
    const haystack = group
      .flatMap((crown) => [
        crown.name,
        crown.inv_monster_name,
        crown.quest,
        crown.type,
        crown.size_label,
        crown.strength_rating,
        crown.remaining_uses,
      ])
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(term)) return false;
  }

  if (filter.questType !== "Any" && (first?.quest || "") !== filter.questType) return false;
  if (filter.questType === INVESTIGATION && filter.usesLeft !== "Any") {
    const uses = Number(first?.remaining_uses ?? Number.NaN);
    if (!Number.isFinite(uses) || uses !== Number(filter.usesLeft)) return false;
  }
  if (filter.monsterId !== "Any" && !group.some((c) => String(c.monster_id) === filter.monsterId))
    return false;
  if (
    filter.monsterType !== "Any" &&
    !group.some((c) => monsterTypeById[String(c.monster_id)] === filter.monsterType)
  ) {
    return false;
  }
  if (filter.monsterSize !== "Any" && !group.some((c) => c.type === filter.monsterSize))
    return false;
  if (
    filter.strength !== "Any" &&
    !group.some((c) => Number(c.strength_rating || 0) >= Number(filter.strength))
  ) {
    return false;
  }
  if (filter.tempered && !group.some((c) => !!c.tempered)) return false;
  if (
    filter.lengthMode === "cm" &&
    filter.lengthCm !== "" &&
    !group.some((c) => Number(c.size_cm) === Number(filter.lengthCm))
  ) {
    return false;
  }
  if (
    filter.lengthMode === "size" &&
    filter.lengthSize !== "Any" &&
    !group.some((c) => String(c.size_label || "").toUpperCase() === filter.lengthSize)
  ) {
    return false;
  }
  return true;
}
