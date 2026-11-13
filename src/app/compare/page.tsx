import type { Metadata } from "next";
import { CompareView, type CompareItem } from "@/features/compare";
import type { MonsterListing } from "@/server/services/profile";
import { getCompareData, getUserBrief, sideOf } from "@/server/services/compare-page";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Search = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

const DEFAULT_META: Metadata = {
  title: "Compare Hunters",
  description: "Compare two hunters across crowns, collection progress, and wishlist overlap.",
};

const toItem = (entry: MonsterListing): CompareItem => ({
  id: entry.monster_id,
  name: entry.monster_name,
  image: entry.image_name,
  type: entry.type,
});

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Search;
}): Promise<Metadata> {
  const search = await searchParams;
  const data = await getCompareData(first(search.a), first(search.b));
  if (!data) return DEFAULT_META;

  const overlap = data.both.length;
  const tracked = overlap + data.onlyA.length + data.onlyB.length;
  const rate = tracked > 0 ? Math.round((overlap / tracked) * 100) : 0;
  return {
    title: `${data.profileA.user.username} vs ${data.profileB.user.username} | Hunter Compare`,
    description: `${overlap} shared targets • ${data.sharedOwnedCount} shared crown species • ${rate}% match`,
  };
}

export default async function ComparePage({ searchParams }: { searchParams: Search }) {
  const search = await searchParams;
  const a = first(search.a);
  const b = first(search.b);
  const data = await getCompareData(a, b);

  return (
    <CompareView
      a={data ? sideOf(data.profileA) : await getUserBrief(a)}
      b={data ? sideOf(data.profileB) : await getUserBrief(b)}
      result={
        data && {
          shared: data.both.map(toItem),
          onlyA: data.onlyA.map(toItem),
          onlyB: data.onlyB.map(toItem),
          sharedSpecies: data.sharedOwnedCount,
          onlyOwnedA: data.onlyOwnedA,
          onlyOwnedB: data.onlyOwnedB,
        }
      }
    />
  );
}
