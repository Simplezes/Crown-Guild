import { getProfileData } from "@/lib/profile";

export async function getCompareData(a, b) {
  if (!a || !b) return null;

  try {
    const [profileA, profileB] = await Promise.all([getProfileData(a), getProfileData(b)]);
    if (!profileA || !profileB) return null;

    const userA = profileA.user;
    const userB = profileB.user;

    const wishlistA = profileA.wishlist || [];
    const wishlistB = profileB.wishlist || [];
    const mapA = new Map(wishlistA.map((row) => [row.monster_id, row]));
    const mapB = new Map(wishlistB.map((row) => [row.monster_id, row]));

    const both = wishlistA.filter((row) => mapB.has(row.monster_id));
    const onlyA = wishlistA.filter((row) => !mapB.has(row.monster_id));
    const onlyB = wishlistB.filter((row) => !mapA.has(row.monster_id));

    const ownedA = new Set((profileA.crowns || []).map((crown) => crown.monster_id));
    const ownedB = new Set((profileB.crowns || []).map((crown) => crown.monster_id));
    const sharedOwnedCount = [...ownedA].filter((id) => ownedB.has(id)).length;
    const onlyOwnedA = [...ownedA].filter((id) => !ownedB.has(id)).length;
    const onlyOwnedB = [...ownedB].filter((id) => !ownedA.has(id)).length;

    return {
      userA,
      userB,
      profileA,
      profileB,
      both,
      onlyA,
      onlyB,
      sharedOwnedCount,
      onlyOwnedA,
      onlyOwnedB,
    };
  } catch (error) {
    console.error("Compare page error", error);
    return null;
  }
}