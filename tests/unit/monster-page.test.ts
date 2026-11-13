import { describe, expect, it } from "vitest";
import { buildHostSections } from "@/features/monster/lib/host-sections";
import { buildPageHref, paginateItems, parsePageParam } from "@/features/monster/lib/pagination";
import type { HostCrown } from "@/server/services/monster-page";

const host = (id: number, overrides: Partial<HostCrown> = {}): HostCrown => ({
  id,
  user_id: String(id),
  monster_id: 1,
  type: "small",
  tempered: 0,
  strength_rating: 1,
  quest: "Hunt",
  pair_id: null,
  investigation_id: null,
  size_cm: null,
  size_label: null,
  username: null,
  avatar_url: null,
  status_message: null,
  receive_dms: 1,
  inv_remaining_uses: null,
  inv_monster_id: null,
  inv_monster_name: null,
  ...overrides,
});

describe("pagination", () => {
  it("clamps pages and slices", () => {
    expect(paginateItems([1, 2, 3, 4, 5, 6, 7], 99, 3)).toEqual({
      items: [7],
      page: 3,
      totalPages: 3,
    });
  });

  it("parses page params defensively", () => {
    expect(parsePageParam("2")).toBe(2);
    expect(parsePageParam("-4")).toBe(1);
    expect(parsePageParam("abc")).toBe(1);
    expect(parsePageParam(undefined)).toBe(1);
  });

  it("builds hrefs, overriding and removing params", () => {
    expect(buildPageHref({ tab: "hosts", x: "1" }, { tab: "seeking", x: null, y: 2 })).toBe(
      "?tab=seeking&y=2",
    );
    expect(buildPageHref({}, {})).toBe("?");
  });
});

describe("buildHostSections", () => {
  it("separates pairs from solo crowns", () => {
    const crowns = [
      host(1, { pair_id: "p" }),
      host(2, { pair_id: "p", type: "large" }),
      host(3),
      host(4, { type: "large" }),
    ];
    const result = buildHostSections(crowns, { pairs: 1, large: 1, small: 1 }, undefined);
    expect(result.pairCount).toBe(1);
    expect(result.largeCount).toBe(1);
    expect(result.smallCount).toBe(1);
  });

  it("jumps to the page containing the highlighted crown", () => {
    const crowns = Array.from({ length: 12 }, (_, index) => host(index + 1));
    const { sections } = buildHostSections(crowns, { pairs: 1, large: 1, small: 1 }, "11");
    expect(sections.find((s) => s.key === "small")?.page).toBe(3);
  });
});
