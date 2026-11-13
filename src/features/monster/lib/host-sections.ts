import type { HostCrown } from "@/server/services/monster-page";
import { MONSTER_LIST_PAGE_SIZE, paginateItems } from "./pagination";

export type SectionKey = "pairs" | "large" | "small";

export interface HostSection {
  key: SectionKey;
  title: string;
  count: number;
  pageKey: string;
  empty: string;
  icon: string;
  page: number;
  totalPages: number;
  groups: HostCrown[][];
}

interface SectionDefinition {
  key: SectionKey;
  title: string;
  pageKey: string;
  empty: string;
  icon: string;
}

const DEFINITIONS: SectionDefinition[] = [
  {
    key: "pairs",
    title: "Crown Pairs",
    pageKey: "pairsPage",
    empty: "No pair postings logged yet.",
    icon: "/icons/largecrown.png",
  },
  {
    key: "large",
    title: "Large Crowns",
    pageKey: "largePage",
    empty: "No large crowns recorded yet.",
    icon: "/icons/largecrown.png",
  },
  {
    key: "small",
    title: "Small Crowns",
    pageKey: "smallPage",
    empty: "No small crowns recorded yet.",
    icon: "/icons/smallcrown.png",
  },
];

export function pairGroups(crowns: HostCrown[]): HostCrown[][] {
  const byPair = new Map<string, HostCrown[]>();
  for (const crown of crowns) {
    if (!crown.pair_id) continue;
    byPair.set(crown.pair_id, [...(byPair.get(crown.pair_id) ?? []), crown]);
  }
  return [...byPair.values()].filter((group) => group.length >= 2);
}

function pageContaining(
  groups: HostCrown[][],
  highlightId: string | undefined,
  fallback: number,
): number {
  if (!highlightId) return fallback;
  const index = groups.findIndex((group) =>
    group.some((crown) => String(crown.id) === highlightId),
  );
  return index >= 0 ? Math.floor(index / MONSTER_LIST_PAGE_SIZE) + 1 : fallback;
}

export function buildHostSections(
  crowns: HostCrown[],
  pages: Record<SectionKey, number>,
  highlightId: string | undefined,
) {
  const pairs = pairGroups(crowns);
  const paired = new Set(pairs.flatMap((group) => group.map((crown) => crown.id)));
  const solo = (type: "small" | "large") =>
    crowns.filter((crown) => crown.type === type && !paired.has(crown.id)).map((crown) => [crown]);

  const groupsByKey: Record<SectionKey, HostCrown[][]> = {
    pairs,
    large: solo("large"),
    small: solo("small"),
  };

  const sections: HostSection[] = DEFINITIONS.map((definition) => {
    const all = groupsByKey[definition.key];
    const page = pageContaining(all, highlightId, pages[definition.key]);
    const paged = paginateItems(all, page);
    return {
      ...definition,
      count: all.length,
      page: paged.page,
      totalPages: paged.totalPages,
      groups: paged.items,
    };
  });

  return {
    sections,
    pairCount: pairs.length,
    largeCount: groupsByKey.large.length,
    smallCount: groupsByKey.small.length,
  };
}
