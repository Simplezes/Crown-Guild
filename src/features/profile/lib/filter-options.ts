import type { FilterField, FilterOption, FilterState } from "./crown-filter";
import { INVESTIGATION, sizeName } from "./crown-filter";

const QUEST_TYPES = [
  "Any",
  "Optional Quests",
  "Field Survey Quests",
  "Investigation Quests",
  "Event Quests",
];
const STRENGTHS = ["Any", ...Array.from({ length: 10 }, (_, index) => String(index + 1))];

export function activeFilters(filter: FilterState, monsters: FilterOption[]) {
  const chips: { key: string; label: string }[] = [];
  if (filter.questType !== "Any")
    chips.push({ key: "questType", label: `Quest: ${filter.questType}` });
  if (filter.questType === INVESTIGATION && filter.usesLeft !== "Any") {
    chips.push({ key: "usesLeft", label: `Uses left: ${filter.usesLeft}` });
  }
  if (filter.monsterId !== "Any") {
    const label = monsters.find((option) => option.value === filter.monsterId)?.label || "Selected";
    chips.push({ key: "monsterId", label: `Monster: ${label}` });
  }
  if (filter.monsterType !== "Any")
    chips.push({ key: "monsterType", label: `Type: ${filter.monsterType}` });
  if (filter.monsterSize !== "Any") {
    chips.push({ key: "monsterSize", label: `Size: ${sizeName(filter.monsterSize)}` });
  }
  if (filter.strength !== "Any")
    chips.push({ key: "strength", label: `Strength: ${filter.strength}+` });
  if (filter.tempered) chips.push({ key: "tempered", label: "Tempered" });
  if (filter.lengthMode === "cm" && filter.lengthCm !== "") {
    chips.push({ key: "length", label: `Length: ${filter.lengthCm} cm` });
  }
  if (filter.lengthMode === "size" && filter.lengthSize !== "Any") {
    chips.push({ key: "length", label: `Length: ${filter.lengthSize}` });
  }
  return chips;
}

export function filterCategories(filter: FilterState, monsters: FilterOption[]) {
  const monsterLabel =
    filter.monsterId === "Any"
      ? "Any"
      : monsters.find((option) => option.value === filter.monsterId)?.label || "Any";
  const length =
    filter.lengthMode === "cm"
      ? filter.lengthCm
        ? `${filter.lengthCm} cm`
        : "Any"
      : filter.lengthSize;

  const rows: { key: FilterField; value: string }[] = [
    { key: "questType", value: filter.questType },
  ];
  if (filter.questType === INVESTIGATION) {
    rows.push({
      key: "usesLeft",
      value: filter.usesLeft === "Any" ? "Any" : `${filter.usesLeft} left`,
    });
  }
  rows.push(
    { key: "monsterId", value: monsterLabel },
    { key: "monsterType", value: filter.monsterType },
    {
      key: "monsterSize",
      value: filter.monsterSize === "Any" ? "Any" : sizeName(filter.monsterSize),
    },
    { key: "strength", value: filter.strength === "Any" ? "Any" : `${filter.strength}+` },
    { key: "length", value: length },
  );
  return rows;
}

export function filterMenuOptions(
  field: FilterField,
  monsters: FilterOption[],
  monsterTypes: string[],
): FilterOption[] {
  switch (field) {
    case "questType":
      return QUEST_TYPES.map((value) => ({
        value,
        label: value === "Any" ? "Any quest type" : value,
      }));
    case "usesLeft":
      return ["Any", "1", "2", "3"].map((value) => ({
        value,
        label: value === "Any" ? "Any" : `${value} left`,
      }));
    case "monsterId":
      return monsters;
    case "monsterType":
      return monsterTypes.map((value) => ({
        value,
        label: value === "Any" ? "Any monster type" : value,
      }));
    case "monsterSize":
      return ["Any", "small", "large"].map((value) => ({
        value,
        label: value === "Any" ? "Any size" : sizeName(value),
      }));
    case "strength":
      return STRENGTHS.map((value) => ({
        value,
        label: value === "Any" ? "Any strength" : `${value}★+`,
      }));
    default:
      return [];
  }
}

export function resetFilter(key: string): Partial<FilterState> {
  const resets: Record<string, Partial<FilterState>> = {
    questType: { questType: "Any", usesLeft: "Any" },
    usesLeft: { usesLeft: "Any" },
    monsterId: { monsterId: "Any" },
    monsterType: { monsterType: "Any" },
    monsterSize: { monsterSize: "Any" },
    strength: { strength: "Any" },
    tempered: { tempered: false },
    length: { lengthMode: "cm", lengthCm: "", lengthSize: "Any" },
  };
  return resets[key] ?? {};
}

export function applyFilterValue(
  current: FilterState,
  field: FilterField,
  value: string,
): FilterState {
  if (field === "length") return current;
  if (field === "questType") {
    return {
      ...current,
      questType: value,
      usesLeft: value === INVESTIGATION ? current.usesLeft : "Any",
    };
  }
  return { ...current, [field]: value };
}
