import { describe, expect, it } from "vitest";
import { groupCrowns, groupKey } from "@/features/profile/lib/crown-groups";
import { DEFAULT_FILTER, matchesCrownFilter } from "@/features/profile/lib/crown-filter";
import { activeFilters, applyFilterValue } from "@/features/profile/lib/filter-options";
import { monsterMatchScore, suggestMonsters } from "@/features/profile/lib/monster-match";
import type { ProfileCrown } from "@/server/services/profile";

const crown = (overrides: Partial<ProfileCrown>): ProfileCrown => ({
  id: 1,
  monster_id: 1,
  name: "Rathalos",
  emoji: null,
  image_name: null,
  type: "small",
  tempered: 0,
  strength_rating: 3,
  quest: "Optional Quests",
  investigation_id: null,
  pair_id: null,
  size_cm: null,
  size_label: null,
  remaining_uses: null,
  inv_monster_id: null,
  inv_monster_name: null,
  inv_monster_image: null,
  inv_monster_emoji: null,
  ...overrides,
});

describe("groupCrowns", () => {
  it("groups paired and investigation crowns and keeps singles separate", () => {
    const crowns = [
      crown({ id: 1, pair_id: "p" }),
      crown({ id: 2, pair_id: "p", type: "large" }),
      crown({ id: 3, investigation_id: 9 }),
      crown({ id: 4, investigation_id: 9 }),
      crown({ id: 5 }),
    ];
    const groups = groupCrowns(crowns);
    expect(groups.map((g) => g.map((c) => c.id))).toEqual([[1, 2], [3, 4], [5]]);
    expect(groups.map(groupKey)).toEqual(["pp", "i9", "s5"]);
  });
});

describe("matchesCrownFilter", () => {
  const group = [crown({ tempered: 1, strength_rating: 6, size_label: "L" })];
  const types = { "1": "Flying Wyvern" };

  it("matches everything by default", () => {
    expect(matchesCrownFilter(group, DEFAULT_FILTER, "", types)).toBe(true);
  });

  it("filters by strength, tempered and monster type", () => {
    expect(matchesCrownFilter(group, { ...DEFAULT_FILTER, strength: "7" }, "", types)).toBe(false);
    expect(
      matchesCrownFilter(group, { ...DEFAULT_FILTER, strength: "6", tempered: true }, "", types),
    ).toBe(true);
    expect(
      matchesCrownFilter(group, { ...DEFAULT_FILTER, monsterType: "Leviathan" }, "", types),
    ).toBe(false);
  });

  it("searches names case-insensitively", () => {
    expect(matchesCrownFilter(group, DEFAULT_FILTER, "RATH", types)).toBe(true);
    expect(matchesCrownFilter(group, DEFAULT_FILTER, "arkveld", types)).toBe(false);
  });
});

describe("filter state helpers", () => {
  it("resets the uses filter when quest type leaves investigations", () => {
    const state = { ...DEFAULT_FILTER, questType: "Investigation Quests", usesLeft: "2" };
    expect(applyFilterValue(state, "questType", "Event Quests").usesLeft).toBe("Any");
  });

  it("describes active filters", () => {
    const chips = activeFilters({ ...DEFAULT_FILTER, tempered: true, strength: "5" }, []);
    expect(chips.map((c) => c.key)).toEqual(["strength", "tempered"]);
  });
});

describe("monster matching", () => {
  it("ranks exact, prefix, substring then fuzzy", () => {
    expect(monsterMatchScore("rathalos", "Rathalos")).toBe(0);
    expect(monsterMatchScore("rath", "Rathalos")).toBe(1);
    expect(monsterMatchScore("alos", "Rathalos")).toBeGreaterThan(2);
    expect(monsterMatchScore("ratalos", "Rathalos")).not.toBeNull();
    expect(monsterMatchScore("zzzz", "Rathalos")).toBeNull();
  });

  it("suggests sorted matches and nothing for an empty query", () => {
    const monsters = ["Rathalos", "Rathian", "Arkveld"].map((name) => ({ name }));
    expect(suggestMonsters(monsters, "rath").map((m) => m.name)).toEqual(["Rathalos", "Rathian"]);
    expect(suggestMonsters(monsters, "")).toEqual([]);
  });
});
