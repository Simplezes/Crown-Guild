import type { GroupCrown, LogEntry } from "./types";

export const blankEntry = (monsterId: number | ""): LogEntry => ({
  monster_id: monsterId,
  type: "small",
  tempered: false,
  strength_rating: 1,
  size: "",
  sizeLabel: "",
  sizeMode: "cm",
});

export function cleanSize(value: string): string {
  const text = value.replace(",", ".").replace(/[^\d.]/g, "");
  const [whole = "", ...rest] = text.split(".");
  return rest.length ? `${whole.slice(0, 4)}.${rest.join("").slice(0, 2)}` : whole.slice(0, 4);
}

export function entryFromCrown(crown: GroupCrown): LogEntry {
  return {
    id: crown.id,
    monster_id: crown.monster_id,
    type: crown.type,
    tempered: !!crown.tempered,
    strength_rating: crown.strength_rating || 1,
    size: crown.size_cm ? String(crown.size_cm) : "",
    sizeLabel: crown.size_label || "",
    sizeMode: crown.size_label ? "label" : "cm",
  };
}
