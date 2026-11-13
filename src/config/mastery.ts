export type Tier = "standard" | "advanced" | "apex";

interface TierValues {
  small: number;
  large: number;
  both: number;
}

export interface ArchiveRow {
  monster_id: number;
  type: string;
  tempered: number | boolean;
  tier: Tier;
}

interface MasteryRank {
  rank: number;
  title: string;
  minPoints: number;
}

export interface RankProgress {
  currentRank: MasteryRank;
  nextRank: MasteryRank | null;
  progress: number;
}

const TIER_VALUES: Record<Tier, TierValues> = {
  standard: { small: 20, large: 35, both: 25 },
  advanced: { small: 35, large: 60, both: 45 },
  apex: { small: 70, large: 120, both: 90 },
};

const TIER_BY_SPECIES: Record<string, Tier> = {
  "Fanged Beast": "standard",
  "Bird Wyvern": "standard",
  Amphibian: "standard",
  Temnoceran: "standard",
  Cephalopod: "standard",
  Construct: "standard",
  "Flying Wyvern": "advanced",
  Leviathan: "advanced",
  "Brute Wyvern": "advanced",
  "Demi Elder": "apex",
  "Elder Dragon": "apex",
};

const TEMPERED_MULTIPLIER = 1.5;

const MASTERY_RANKS: MasteryRank[] = [
  { rank: 1, title: "Fledgling", minPoints: 0 },
  { rank: 2, title: "Scout", minPoints: 150 },
  { rank: 3, title: "Tracker", minPoints: 450 },
  { rank: 4, title: "Hunter", minPoints: 900 },
  { rank: 5, title: "Veteran", minPoints: 1600 },
  { rank: 6, title: "Expert", minPoints: 2400 },
  { rank: 7, title: "Master", minPoints: 3200 },
  { rank: 8, title: "Legend", minPoints: 4000 },
];

const FIRST_RANK = MASTERY_RANKS[0] as MasteryRank;

export function getSpeciesTier(species: string | undefined | null): Tier {
  return (species && TIER_BY_SPECIES[species]) || "standard";
}

export function crownMp(tier: Tier, type: string, tempered: boolean): number {
  const values = TIER_VALUES[tier] ?? TIER_VALUES.standard;
  const base = type === "large" ? values.large : values.small;
  return Math.round(base * (tempered ? TEMPERED_MULTIPLIER : 1));
}

function bothCrownBonus(tier: Tier): number {
  return (TIER_VALUES[tier] ?? TIER_VALUES.standard).both;
}

interface MonsterProgress {
  tier: Tier;
  small: boolean;
  large: boolean;
  smallTempered: boolean;
  largeTempered: boolean;
}

export function computeMasteryPoints(rows: ArchiveRow[]): number {
  const byMonster = new Map<number, MonsterProgress>();
  for (const row of rows) {
    const current = byMonster.get(row.monster_id) ?? {
      tier: row.tier,
      small: false,
      large: false,
      smallTempered: false,
      largeTempered: false,
    };
    if (row.type === "small") {
      current.small = true;
      current.smallTempered ||= !!row.tempered;
    } else if (row.type === "large") {
      current.large = true;
      current.largeTempered ||= !!row.tempered;
    }
    current.tier = row.tier;
    byMonster.set(row.monster_id, current);
  }

  let points = 0;
  for (const m of byMonster.values()) {
    if (m.small) points += crownMp(m.tier, "small", m.smallTempered);
    if (m.large) points += crownMp(m.tier, "large", m.largeTempered);
    if (m.small && m.large) points += bothCrownBonus(m.tier);
  }
  return points;
}

function rankFor(points: number): MasteryRank {
  return [...MASTERY_RANKS].reverse().find((r) => points >= r.minPoints) ?? FIRST_RANK;
}

export function getRankProgress(points: number): RankProgress {
  const currentRank = rankFor(points);
  const nextRank = MASTERY_RANKS[MASTERY_RANKS.indexOf(currentRank) + 1] ?? null;
  if (!nextRank) return { currentRank, nextRank: null, progress: 100 };
  const range = nextRank.minPoints - currentRank.minPoints;
  const progress = ((points - currentRank.minPoints) / range) * 100;
  return { currentRank, nextRank, progress: Math.min(100, Math.max(0, progress)) };
}

export interface RankView {
  mp: number;
  rank: number;
  title: string;
  nextTitle: string | null;
  toNext: number;
  progress: number;
}

export function rankView(mp: number): RankView {
  const { currentRank, nextRank, progress } = getRankProgress(mp);
  return {
    mp,
    rank: currentRank.rank,
    title: currentRank.title,
    nextTitle: nextRank?.title ?? null,
    toNext: nextRank ? nextRank.minPoints - mp : 0,
    progress,
  };
}
