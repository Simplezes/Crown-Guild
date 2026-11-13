import type { Metadata } from "next";
import { MonstersBoard } from "@/features/registry";
import { auth } from "@/server/auth";
import { getRegistryMonsters } from "@/server/services/registry";

export const metadata: Metadata = { title: "Monsters | Crown Guild" };

export default async function FieldGuide() {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const monsters = await getRegistryMonsters(userId);
  return <MonstersBoard monsters={monsters} signedIn={!!userId} />;
}
