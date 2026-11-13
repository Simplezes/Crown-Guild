import type { ProfileCrown } from "@/server/services/profile";

export interface ProfileMonster {
  name: string;
  image_name: string | null;
  small: boolean;
  large: boolean;
  linked: boolean;
}

export interface ProfileMonsterGroups {
  all: ProfileMonster[];
  multi: ProfileMonster[];
  smallOnly: ProfileMonster[];
  largeOnly: ProfileMonster[];
}

function linkedNames(crowns: ProfileCrown[]): Set<string> {
  const pairs = new Map<string, ProfileCrown[]>();
  for (const crown of crowns) {
    if (crown.pair_id) pairs.set(crown.pair_id, [...(pairs.get(crown.pair_id) ?? []), crown]);
  }

  const linked = new Set<string>();
  for (const pair of pairs.values()) {
    const types = new Map<string, { small: boolean; large: boolean }>();
    for (const crown of pair) {
      const entry = types.get(crown.name) ?? { small: false, large: false };
      if (crown.type === "small") entry.small = true;
      if (crown.type === "large") entry.large = true;
      types.set(crown.name, entry);
    }
    for (const [name, entry] of types) {
      if (entry.small && entry.large) linked.add(name);
    }
  }
  return linked;
}

export function groupProfileMonsters(crowns: ProfileCrown[]): ProfileMonsterGroups {
  const linked = linkedNames(crowns);
  const byName = new Map<string, ProfileMonster>();

  for (const crown of crowns) {
    const entry = byName.get(crown.name) ?? {
      name: crown.name,
      image_name: crown.image_name,
      small: false,
      large: false,
      linked: false,
    };
    if (crown.type === "small") entry.small = true;
    if (crown.type === "large") entry.large = true;
    if (linked.has(crown.name)) entry.linked = true;
    byName.set(crown.name, entry);
  }

  const all = [...byName.values()];
  return {
    all,
    multi: all.filter((m) => m.linked),
    smallOnly: all.filter((m) => m.small && !m.linked),
    largeOnly: all.filter((m) => m.large && !m.linked),
  };
}
