import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { rankView } from "@/config/mastery";
import { ProfileView } from "@/features/profile";
import { buildProfileMetadata } from "@/features/profile/server";
import { auth } from "@/server/auth";
import { getAllMonstersEnriched } from "@/server/services/monsters";
import { getProfileData } from "@/server/services/profile";
import { getShareUrl } from "@/server/services/settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = Promise<{ id: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}): Promise<Metadata> {
  const [{ id }, search] = await Promise.all([params, searchParams]);
  return buildProfileMetadata(id, first(search.share) || first(search.t));
}

export default async function Profile({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const [{ id }, search] = await Promise.all([params, searchParams]);
  const [session, data, monsters] = await Promise.all([
    auth(),
    getProfileData(id),
    getAllMonstersEnriched(),
  ]);
  if (!data) notFound();

  const mp = Number(data.masteryPoints || 0);
  const viewerId = session?.user?.id ?? null;
  const shareUrl = await getShareUrl(viewerId);

  return (
    <ProfileView
      user={{
        id: data.user.id,
        username: data.user.username,
        avatar_url: data.user.avatar_url || null,
        status_message: data.user.status_message || "",
        lobby_id: data.user.lobby_id || "",
        quest_password: data.user.quest_password || "",
      }}
      crowns={data.crowns}
      stats={data.stats}
      mp={mp}
      rank={rankView(mp)}
      collection={data.collection.map((c) => ({ monster_id: c.monster_id, type: c.type }))}
      wishlist={data.wishlist.map((w) => ({ monster_id: w.monster_id, type: w.type }))}
      allMonsters={monsters.map((m) => ({
        id: m.id,
        name: m.name,
        image_name: m.image_name,
        type: m.type || "Monster",
        emoji: m.emoji,
      }))}
      isOwner={viewerId === id}
      viewerId={viewerId}
      shareUrl={shareUrl}
      openSettings={search.settings === "true"}
    />
  );
}
