// Mastery Points (MP) engine: how ranks are earned.
//
// Every crown you actually log is worth MP based on how threatening the
// monster is, whether it's a small or large crown, and whether the hunt
// was tempered. Getting both crown sizes for a monster adds a completion
// bonus on top. This file has no server-only imports so it can be shared
// between API routes and client components (for live MP previews).

export const TIER_VALUES = {
  standard: { small: 20, large: 35, both: 25 },
  advanced: { small: 35, large: 60, both: 45 },
  apex: { small: 70, large: 120, both: 90 },
};

const TIER_BY_SPECIES = {
  "Fanged Beast": "standard",
  "Bird Wyvern": "standard",
  "Amphibian": "standard",
  "Temnoceran": "standard",
  "Cephalopod": "standard",
  "Construct": "standard",
  "Flying Wyvern": "advanced",
  "Leviathan": "advanced",
  "Brute Wyvern": "advanced",
  "Demi Elder": "apex",
  "Elder Dragon": "apex",
};

const TEMPERED_MULTIPLIER = 1.5;

export function getSpeciesTier(species) {
  return TIER_BY_SPECIES[species] || "standard";
}

// crownMp: MP for a single crown size (small/large) on a monster of a given tier.
export function crownMp(tier, type, tempered) {
  const values = TIER_VALUES[tier] || TIER_VALUES.standard;
  const base = type === "large" ? values.large : values.small;
  return Math.round(base * (tempered ? TEMPERED_MULTIPLIER : 1));
}

export function bothCrownBonus(tier) {
  return (TIER_VALUES[tier] || TIER_VALUES.standard).both;
}

// computeMasteryPoints: rows = [{ monster_id, tier, type, tempered }], one row
// per unique (monster_id, type) a hunter has ever archived. Repeat hunts of
// the same monster/size don't add more MP - breadth and difficulty do.
export function computeMasteryPoints(rows) {
  const byMonster = new Map();
  for (const r of rows) {
    const cur = byMonster.get(r.monster_id) || { tier: r.tier, small: false, large: false, smallTempered: false, largeTempered: false };
    if (r.type === "small") {
      cur.small = true;
      cur.smallTempered = cur.smallTempered || !!r.tempered;
    } else if (r.type === "large") {
      cur.large = true;
      cur.largeTempered = cur.largeTempered || !!r.tempered;
    }
    cur.tier = r.tier;
    byMonster.set(r.monster_id, cur);
  }

  let mp = 0;
  for (const m of byMonster.values()) {
    if (m.small) mp += crownMp(m.tier, "small", m.smallTempered);
    if (m.large) mp += crownMp(m.tier, "large", m.largeTempered);
    if (m.small && m.large) mp += bothCrownBonus(m.tier);
  }
  return mp;
}

export const MASTERY_RANKS = [
  { rank: 1, title: "Fledgling", minPoints: 0 },
  { rank: 2, title: "Scout", minPoints: 150 },
  { rank: 3, title: "Tracker", minPoints: 450 },
  { rank: 4, title: "Hunter", minPoints: 900 },
  { rank: 5, title: "Veteran", minPoints: 1600 },
  { rank: 6, title: "Expert", minPoints: 2400 },
  { rank: 7, title: "Master", minPoints: 3200 },
  { rank: 8, title: "Legend", minPoints: 4000 },
];

export function getHunterRank(points) {
  const rank = [...MASTERY_RANKS].reverse().find(r => points >= r.minPoints);
  return rank ? rank.title : "Fledgling";
}

export function getRankProgress(points) {
  const currentRankIndex = [...MASTERY_RANKS].reverse().findIndex(r => points >= r.minPoints);
  const currentRank = MASTERY_RANKS[MASTERY_RANKS.length - 1 - currentRankIndex];
  const nextRank = MASTERY_RANKS[MASTERY_RANKS.length - currentRankIndex];

  if (!nextRank) return { currentRank, nextRank: null, progress: 100 };

  const range = nextRank.minPoints - currentRank.minPoints;
  const progress = ((points - currentRank.minPoints) / range) * 100;

  return {
    currentRank,
    nextRank,
    progress: Math.min(100, Math.max(0, progress))
  };
}
