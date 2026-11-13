import type { RegistryMonster } from "@/server/services/registry";

export const FILTERS = ["All", "Tracked", "Complete", "Demand"] as const;
export type BoardFilter = (typeof FILTERS)[number];

export const SORTS = {
  Demand: (a: RegistryMonster, b: RegistryMonster) => b.demand - a.demand,
  Name: (a: RegistryMonster, b: RegistryMonster) => a.name.localeCompare(b.name),
  "S. Hosts": (a: RegistryMonster, b: RegistryMonster) => b.hostCount.small - a.hostCount.small,
  "L. Hosts": (a: RegistryMonster, b: RegistryMonster) => b.hostCount.large - a.hostCount.large,
};
export type BoardSort = keyof typeof SORTS;
export type BoardView = "grid" | "table";

export const CARD_WIDTH = 265;
export const CARD_HEIGHT = 224;
export const GAP = 14;
export const ROW_HEIGHT = 64;
export const HEAD_HEIGHT = 44;
export const BOTTOM_SPACE = 84;
export const MOBILE_BREAKPOINT = 900;

export function matchesFilter(
  monster: RegistryMonster,
  filter: BoardFilter,
  tracked: boolean,
): boolean {
  if (filter === "Tracked") return tracked;
  if (filter === "Complete") return monster.isCompleted;
  if (filter === "Demand") return monster.demand > 0;
  return true;
}

export function matchesSearch(monster: RegistryMonster, query: string): boolean {
  const term = query.trim().toLowerCase();
  return (
    !term || monster.name.toLowerCase().includes(term) || monster.type.toLowerCase().includes(term)
  );
}
