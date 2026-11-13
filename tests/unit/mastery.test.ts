import { describe, expect, it } from "vitest";
import {
  computeMasteryPoints,
  crownMp,
  getRankProgress,
  rankView,
  type ArchiveRow,
} from "@/config/mastery";

const row = (
  monster_id: number,
  type: string,
  tempered = 0,
  tier: ArchiveRow["tier"] = "standard",
): ArchiveRow => ({ monster_id, type, tempered, tier });

describe("crownMp", () => {
  it("scores by tier and size", () => {
    expect(crownMp("standard", "small", false)).toBe(20);
    expect(crownMp("advanced", "large", false)).toBe(60);
    expect(crownMp("apex", "large", false)).toBe(120);
  });

  it("applies the tempered multiplier with rounding", () => {
    expect(crownMp("standard", "small", true)).toBe(30);
    expect(crownMp("standard", "large", true)).toBe(53);
  });
});

describe("computeMasteryPoints", () => {
  it("adds the both-sizes bonus once per monster", () => {
    expect(computeMasteryPoints([row(1, "small"), row(1, "large")])).toBe(20 + 35 + 25);
  });

  it("counts a single size without a bonus", () => {
    expect(computeMasteryPoints([row(1, "small")])).toBe(20);
  });

  it("treats duplicate rows as one crown and keeps tempered if any is tempered", () => {
    expect(computeMasteryPoints([row(1, "small"), row(1, "small", 1)])).toBe(30);
  });

  it("sums across monsters and tiers", () => {
    expect(computeMasteryPoints([row(1, "small"), row(2, "large", 0, "apex")])).toBe(20 + 120);
  });
});

describe("ranks", () => {
  it("starts at Fledgling", () => {
    expect(getRankProgress(0).currentRank.title).toBe("Fledgling");
  });

  it("promotes exactly at thresholds", () => {
    expect(getRankProgress(149).currentRank.rank).toBe(1);
    expect(getRankProgress(150).currentRank.rank).toBe(2);
    expect(getRankProgress(4000).currentRank.title).toBe("Legend");
  });

  it("reports full progress at the top rank", () => {
    const top = getRankProgress(9999);
    expect(top.nextRank).toBeNull();
    expect(top.progress).toBe(100);
  });

  it("computes points to the next rank", () => {
    expect(rankView(100)).toMatchObject({ rank: 1, nextTitle: "Scout", toNext: 50 });
  });
});
