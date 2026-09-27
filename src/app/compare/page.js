import CompareView from "@/components/compare/CompareView";
import { getRankProgress } from "@/lib/profile";
import { getCompareData } from "./compareData";
import db from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ searchParams }) {
  const { a, b } = await searchParams;

  if (!a || !b) {
    return {
      title: "Compare Hunters",
      description: "Compare two hunters across crowns, collection progress, and wishlist overlap.",
    };
  }

  const data = await getCompareData(a, b);
  if (!data) {
    return {
      title: "Compare Hunters",
      description: "Compare two hunters across crowns, collection progress, and wishlist overlap.",
    };
  }

  const overlapCount = data.both?.length || 0;
  const totalTracked = overlapCount + (data.onlyA?.length || 0) + (data.onlyB?.length || 0);
  const overlapRate = totalTracked > 0 ? Math.round((overlapCount / totalTracked) * 100) : 0;

  return {
    title: `${data.userA.username} vs ${data.userB.username} | Hunter Compare`,
    description: `${overlapCount} shared targets • ${data.sharedOwnedCount} shared crown species • ${overlapRate}% match`,
  };
}

function side(profile) {
  const u = profile.user;
  const mp = Number(profile.masteryPoints || 0);
  return {
    id: String(u.id),
    name: u.username,
    avatar: u.avatar_url || null,
    rank: getRankProgress(mp).currentRank?.title,
    mp,
    completion: Math.round(Number(profile.completion || 0)),
    stats: { total: Number(profile.stats?.total || 0), small: Number(profile.stats?.small || 0), large: Number(profile.stats?.large || 0), tempered: Number(profile.stats?.tempered || 0) },
  };
}
const item = (w) => ({ id: w.monster_id, name: w.monster_name, image: w.image_name, type: w.type });

export default async function ComparePage({ searchParams }) {
  const { a, b } = await searchParams;
  const data = a && b ? await getCompareData(a, b) : null;
  const plain = async (id) => {
    if (!id) return null;
    const r = await db.execute({ sql: "SELECT id, username, avatar_url FROM users WHERE id = ?", args: [id] });
    const u = r.rows[0];
    return u ? { id: String(u.id), name: u.username || `Hunter ${String(u.id).slice(0, 4)}`, avatar: u.avatar_url || null } : null;
  };

  return (
    <CompareView
      a={data ? side(data.profileA) : await plain(a)}
      b={data ? side(data.profileB) : await plain(b)}
      result={data && {
        shared: data.both.map(item),
        onlyA: data.onlyA.map(item),
        onlyB: data.onlyB.map(item),
        sharedSpecies: data.sharedOwnedCount,
        onlyOwnedA: data.onlyOwnedA,
        onlyOwnedB: data.onlyOwnedB,
      }}
    />
  );
}
