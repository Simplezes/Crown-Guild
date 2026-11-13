import { describe, expect, it } from "vitest";
import {
  formatCrownShare,
  formatWishlistShare,
  type ShareCrown,
} from "@/features/crowns/lib/share";

const crown = (overrides: Partial<ShareCrown>): ShareCrown => ({
  monster_id: 1,
  name: "Rathalos",
  type: "small",
  tempered: 0,
  strength_rating: 1,
  ...overrides,
});

const LINK = "https://example.test/profile/1";

describe("formatCrownShare", () => {
  it("lists plain text by size with the profile link", () => {
    const text = formatCrownShare(
      [crown({}), crown({ monster_id: 2, name: "Arkveld", type: "large" })],
      LINK,
      "plain",
    );
    expect(text).toBe(
      [
        "Available",
        "Small",
        "  - Regular: Rathalos",
        "",
        "Large",
        "  - Regular: Arkveld",
        "",
        LINK,
      ].join("\n"),
    );
  });

  it("groups tempered crowns by star rating", () => {
    const text = formatCrownShare([crown({ tempered: 1, strength_rating: 5 })], LINK, "plain");
    expect(text).toContain("  - 5★: Rathalos");
  });

  it("deduplicates the same monster", () => {
    const text = formatCrownShare([crown({}), crown({})], LINK, "plain");
    expect(text.match(/Rathalos/g)).toHaveLength(1);
  });

  it("handles an empty list", () => {
    expect(formatCrownShare([], LINK, "plain")).toContain("No crowns recorded yet.");
  });

  it("uses discord emotes in emoji mode", () => {
    expect(formatCrownShare([crown({})], LINK, "emojiSimple")).toContain(
      "<:Rathalos:1344854675371069490>",
    );
  });

  it("lists paired crowns as multi-quest", () => {
    const pair = [
      crown({ pair_id: "p" }),
      crown({ monster_id: 2, name: "Arkveld", type: "large", pair_id: "p" }),
    ];
    expect(formatCrownShare(pair, LINK, "plain")).toContain("Multi-Quest:");
  });
});

describe("formatWishlistShare", () => {
  it("splits sizes and handles both", () => {
    const text = formatWishlistShare([
      { name: "Rathalos", type: "both" },
      { name: "Arkveld", type: "small" },
    ]);
    expect(text).toContain("L: ");
    expect(text).toContain("S: ");
  });

  it("handles an empty wishlist", () => {
    expect(formatWishlistShare([])).toContain("Nothing on the wishlist yet.");
  });
});
