import type { Metadata } from "next";
import { MonsterPage, buildMonsterMetadata, type SearchParams } from "@/features/monster/server";
import { auth } from "@/server/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = Promise<{ name: string }>;
type Search = Promise<SearchParams>;

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}): Promise<Metadata> {
  const [{ name }, search] = await Promise.all([params, searchParams]);
  return buildMonsterMetadata(name, search);
}

export default async function MonsterDetail({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const [{ name }, search, session] = await Promise.all([params, searchParams, auth()]);
  return <MonsterPage name={name} search={search} viewerId={session?.user?.id ?? null} />;
}
