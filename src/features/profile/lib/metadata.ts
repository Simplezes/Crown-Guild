import type { Metadata } from "next";
import { getRankProgress } from "@/config/mastery";
import { getProfileData, type ProfileData } from "@/server/services/profile";

function ogVersion(data: ProfileData): string {
  let checksum = 0;
  const mix = (value: number) => {
    checksum = (checksum * 31 + value) >>> 0;
  };

  for (const crown of data.crowns) {
    mix(Number(crown.id || 0));
    mix(Number(crown.tempered || 0));
    mix(Number(crown.strength_rating || 0));
    mix(Number(crown.remaining_uses ?? 0));
    mix(Number(crown.investigation_id || 0));
  }
  for (const entry of data.wishlist) {
    mix(Number(entry.monster_id || 0));
    mix(Number(entry.tempered || 0));
    mix(String(entry.type || "").length);
  }
  mix(String(data.user.username || "").length);
  mix(String(data.user.status_message || "").length);

  return [
    Number(data.stats.total || 0),
    Number(data.stats.small || 0),
    Number(data.stats.large || 0),
    Number(data.masteryPoints || 0),
    checksum.toString(36),
  ].join("-");
}

export async function buildProfileMetadata(
  id: string,
  shareNonce: string | undefined,
): Promise<Metadata> {
  const data = await getProfileData(id);
  if (!data) return { title: "Hunter Not Found" };

  const nonce = shareNonce ? `&share=${encodeURIComponent(shareNonce)}` : "";
  const imageUrl = `/profile/${encodeURIComponent(id)}/og?v=${encodeURIComponent(ogVersion(data))}${nonce}`;
  const rankTitle = getRankProgress(Number(data.masteryPoints || 0)).currentRank.title;

  return {
    title: `${data.user.username} | Crown Guild`,
    openGraph: {
      title: `${data.user.username}'s Guild Card`,
      description: `${rankTitle} Hunter • ${data.masteryPoints || 0} MP`,
      images: [{ url: imageUrl, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
  };
}
