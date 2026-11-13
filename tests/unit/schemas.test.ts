import { describe, expect, it } from "vitest";
import { createCrownSchema, normalizeSize, updateCrownSchema } from "@/server/schemas/crowns";
import { settingsSchema, userSearchSchema } from "@/server/schemas/user";

const valid = { monster_id: 3, type: "large", strength_rating: 4, quest: "Event Quests" };

describe("createCrownSchema", () => {
  it("accepts a minimal valid crown and defaults tempered", () => {
    expect(createCrownSchema.parse(valid).tempered).toBe(false);
  });

  it("coerces numeric strings and 0/1 flags", () => {
    const result = createCrownSchema.parse({ ...valid, monster_id: "3", tempered: 1 });
    expect(result.monster_id).toBe(3);
    expect(result.tempered).toBe(true);
  });

  it.each([
    { type: "medium" },
    { quest: "Made Up Quest" },
    { strength_rating: 0 },
    { strength_rating: 11 },
    { monster_id: -1 },
    { size_label: "XXL" },
  ])("rejects invalid input %o", (patch) => {
    expect(createCrownSchema.safeParse({ ...valid, ...patch }).success).toBe(false);
  });
});

describe("updateCrownSchema", () => {
  it("accepts a pair-only update", () => {
    expect(updateCrownSchema.safeParse({ pair_id: "abc" }).success).toBe(true);
  });

  it("accepts a full update", () => {
    expect(updateCrownSchema.safeParse({ ...valid, mission_host_enabled: true }).success).toBe(
      true,
    );
  });
});

describe("normalizeSize", () => {
  it.each([
    [12.345, 12.35],
    ["8.5", 8.5],
    ["", null],
    [null, null],
    [0, null],
    [10000, null],
    ["abc", null],
  ])("normalizes %o to %o", (input, expected) => {
    expect(normalizeSize(input as number | string | null)).toBe(expected);
  });
});

describe("settingsSchema", () => {
  it("requires a 4 digit quest password or empty", () => {
    expect(settingsSchema.safeParse({ quest_password: "1234" }).success).toBe(true);
    expect(settingsSchema.safeParse({ quest_password: "" }).success).toBe(true);
    expect(settingsSchema.safeParse({ quest_password: "12a4" }).success).toBe(false);
    expect(settingsSchema.safeParse({ quest_password: "12345" }).success).toBe(false);
  });

  it("limits field lengths", () => {
    expect(settingsSchema.safeParse({ status_message: "x".repeat(201) }).success).toBe(false);
    expect(settingsSchema.safeParse({ lobby_id: "x".repeat(65) }).success).toBe(false);
  });
});

describe("userSearchSchema", () => {
  it("clamps the page size", () => {
    expect(userSearchSchema.parse({ limit: "500" }).limit).toBe(30);
    expect(userSearchSchema.parse({ limit: "1" }).limit).toBe(5);
  });

  it("defaults the page and trims the query", () => {
    expect(userSearchSchema.parse({ q: "  hunter " })).toMatchObject({ q: "hunter", page: 1 });
  });
});
