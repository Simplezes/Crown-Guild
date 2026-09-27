import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getProfileData, getRankProgress } from "@/lib/profile";
import { rankView } from "@/lib/summary";
import ProfileView from "@/components/profile/ProfileView";
import { getAllMonsters } from "@/lib/monsters";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function buildProfileOgVersion(data) {
  let checksum = 0;

  for (const crown of data.crowns || []) {
    checksum = (checksum * 31 + Number(crown.id || 0)) >>> 0;
    checksum = (checksum * 31 + Number(crown.tempered || 0)) >>> 0;
    checksum = (checksum * 31 + Number(crown.strength_rating || 0)) >>> 0;
    checksum = (checksum * 31 + Number(crown.remaining_uses ?? 0)) >>> 0;
    checksum = (checksum * 31 + Number(crown.investigation_id || 0)) >>> 0;
  }

  for (const w of data.wishlist || []) {
    checksum = (checksum * 31 + Number(w.monster_id || 0)) >>> 0;
    checksum = (checksum * 31 + Number(w.tempered || 0)) >>> 0;
    checksum = (checksum * 31 + String(w.type || "").length) >>> 0;
  }

  checksum = (checksum * 31 + String(data.user?.username || "").length) >>> 0;
  checksum = (checksum * 31 + String(data.user?.status_message || "").length) >>> 0;

  return [
    Number(data.stats?.total || 0),
    Number(data.stats?.small || 0),
    Number(data.stats?.large || 0),
    Number(data.masteryPoints || 0),
    checksum.toString(36),
  ].join("-");
}

export async function generateMetadata({ params, searchParams }) {
  const { id } = await params;
  const search = await searchParams;
  const shareNonce = search?.share || search?.t || null;
  const data = await getProfileData(id);

  if (!data) {
    return { title: "Hunter Not Found" };
  }

  const ogVersion = buildProfileOgVersion(data);
  const nonceParam = shareNonce ? `&share=${encodeURIComponent(String(shareNonce))}` : "";
  const imageUrl = `/profile/${encodeURIComponent(id)}/og?v=${encodeURIComponent(ogVersion)}${nonceParam}`;
  const { currentRank } = getRankProgress(Number(data.masteryPoints || 0));
  const rankTitle = currentRank?.title || "Fledgling";

  return {
    openGraph: {
      title: `${data.user.username}'s Guild Card`,
      description: `${rankTitle} Hunter • ${data.masteryPoints || 0} MP`,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}

export default async function Profile({ params, searchParams }) {
  const { id } = await params;
  const search = await searchParams;
  const [session, data, allMonsters] = await Promise.all([auth(), getProfileData(id), getAllMonsters(true)]);
  if (!data) notFound();

  const isOwner = session?.user?.id === id;
  const mp = Number(data.masteryPoints || 0);
  const user = {
    id: data.user.id,
    username: data.user.username,
    avatar_url: data.user.avatar_url || null,
    status_message: data.user.status_message || "",
    lobby_id: data.user.lobby_id || "",
    quest_password: data.user.quest_password || "",
    receive_dms: data.user.receive_dms ?? 1,
  };

  return (
    <ProfileView
      user={user}
      crowns={data.crowns}
      stats={data.stats}
      mp={mp}
      rank={rankView(mp)}
      collection={data.collection.map((c) => ({ monster_id: c.monster_id, type: c.type }))}
      wishlist={data.wishlist.map((w) => ({ monster_id: w.monster_id, type: w.type }))}
      allMonsters={allMonsters.map((m) => ({ id: m.id, name: m.name, image_name: m.image_name }))}
      isOwner={isOwner}
      viewerId={session?.user?.id || null}
      openSettings={search?.settings === "true"}
    />
  );
}
