import type { Metadata } from "next";
import type { CrownDetail } from "@/server/services/profile";
import { findFeaturedCrown, getMonsterSummaryVersion } from "@/server/services/monster-page";
import { getMonsterByName } from "@/server/services/monsters";
import { firstParam, type SearchParams } from "./pagination";

function featuredCrownVersion(crown: CrownDetail): string {
  const parts = [
    Number(crown.id || 0),
    Number(crown.tempered || 0),
    Number(crown.strength_rating || 0),
    Number(crown.remaining_uses ?? 0),
    String(crown.type || ""),
    String(crown.quest || ""),
    String(crown.username || ""),
    String(crown.status_message || ""),
  ].join("|");

  let checksum = 0;
  for (const char of parts) checksum = (checksum * 31 + char.charCodeAt(0)) >>> 0;
  return `${Number(crown.id || 0)}-${checksum.toString(36)}`;
}

export async function buildMonsterMetadata(name: string, search: SearchParams): Promise<Metadata> {
  const monster = await getMonsterByName(name);
  if (!monster) return { title: "Monster Not Found | Crown Guild" };

  const shareNonce = firstParam(search.share) || firstParam(search.t);
  const featured = await findFeaturedCrown(
    monster,
    firstParam(search.crownId),
    firstParam(search.user),
  );

  let title = `${monster.name} | Crown Registry`;
  let description = `${monster.is_large ? "Large Monster" : "Small Monster"} • View S&L crown records and tactical field intelligence.`;
  const query = new URLSearchParams();

  if (featured) {
    query.set("crownId", String(featured.id));
    query.set("v", featuredCrownVersion(featured));
    const size = featured.type === "small" ? "Small" : "Large";
    title = `${featured.tempered ? "Tempered " : ""}${size} Crown ${monster.name}`;
    description = `Secured by ${featured.username} • View the full S&L ledger on Crown Guild.`;
  } else {
    query.set("v", await getMonsterSummaryVersion(monster.id));
  }
  if (shareNonce) query.set("share", shareNonce);

  return {
    title,
    openGraph: {
      title,
      description,
      images: [
        { url: `/monster/${encodeURIComponent(name)}/og?${query}`, width: 1200, height: 630 },
      ],
    },
    twitter: { card: "summary_large_image" },
  };
}
