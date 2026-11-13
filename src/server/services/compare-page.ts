import "server-only";
import { getRankProgress } from "@/config/mastery";
import { db, firstRow } from "@/server/db";
import { logServerError } from "@/server/logger";
import { getProfileData, type MonsterListing, type ProfileData } from "./profile";

export interface CompareData {
  profileA: ProfileData;
  profileB: ProfileData;
  both: MonsterListing[];
  onlyA: MonsterListing[];
  onlyB: MonsterListing[];
  sharedOwnedCount: number;
  onlyOwnedA: number;
  onlyOwnedB: number;
}

export interface CompareSide {
  id: string;
  name: string;
  avatar: string | null;
  rank?: string;
  mp?: number;
  completion?: number;
  stats?: { total: number; small: number; large: number; tempered: number };
}

const validId = (value: string | undefined): value is string => !!value && value.length <= 32;

export async function getCompareData(
  a: string | undefined,
  b: string | undefined,
): Promise<CompareData | null> {
  if (!validId(a) || !validId(b)) return null;
  try {
    const [profileA, profileB] = await Promise.all([getProfileData(a), getProfileData(b)]);
    if (!profileA || !profileB) return null;

    const idsB = new Set(profileB.wishlist.map((row) => row.monster_id));
    const idsA = new Set(profileA.wishlist.map((row) => row.monster_id));
    const ownedA = new Set(profileA.crowns.map((crown) => crown.monster_id));
    const ownedB = new Set(profileB.crowns.map((crown) => crown.monster_id));

    return {
      profileA,
      profileB,
      both: profileA.wishlist.filter((row) => idsB.has(row.monster_id)),
      onlyA: profileA.wishlist.filter((row) => !idsB.has(row.monster_id)),
      onlyB: profileB.wishlist.filter((row) => !idsA.has(row.monster_id)),
      sharedOwnedCount: [...ownedA].filter((id) => ownedB.has(id)).length,
      onlyOwnedA: [...ownedA].filter((id) => !ownedB.has(id)).length,
      onlyOwnedB: [...ownedB].filter((id) => !ownedA.has(id)).length,
    };
  } catch (error) {
    logServerError("Compare data failed", error);
    return null;
  }
}

export function sideOf(profile: ProfileData): CompareSide {
  const mp = Number(profile.masteryPoints || 0);
  return {
    id: String(profile.user.id),
    name: profile.user.username,
    avatar: profile.user.avatar_url || null,
    rank: getRankProgress(mp).currentRank.title,
    mp,
    completion: Math.round(Number(profile.completion || 0)),
    stats: profile.stats,
  };
}

export async function getUserBrief(id: string | undefined): Promise<CompareSide | null> {
  if (!validId(id)) return null;
  const row = firstRow<{ id: string; username: string | null; avatar_url: string | null }>(
    await db.execute({
      sql: "SELECT id, username, avatar_url FROM users WHERE id = ?",
      args: [id],
    }),
  );
  if (!row) return null;
  return {
    id: String(row.id),
    name: row.username || `Hunter ${String(row.id).slice(0, 4)}`,
    avatar: row.avatar_url || null,
  };
}
