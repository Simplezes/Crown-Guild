import { ImageResponse } from "next/og";
import { env } from "@/env";
import {
  CrownPostingCard,
  MonsterLedgerCard,
  OG_SIZE,
  loadAvatar,
  urlToDataUrl,
} from "@/features/og/server";
import { getQuestIcon } from "@/config/quests";
import { db, firstRow } from "@/server/db";
import { getMonsterByName, getMonsterStats } from "@/server/services/monsters";
import { getCrownById } from "@/server/services/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

async function seekerCount(monsterId: number): Promise<number> {
  try {
    const row = firstRow<{ count: number }>(
      await db.execute({
        sql: "SELECT COUNT(*) AS count FROM wishlist WHERE monster_id = ?",
        args: [monsterId],
      }),
    );
    return Number(row?.count ?? 0);
  } catch {
    return 0;
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const crownParam = new URL(request.url).searchParams.get("crownId");
  const baseUrl = env.NEXTAUTH_URL;

  const monster = await getMonsterByName(name);
  if (!monster) return new Response("Monster Not Found", { status: 404 });

  const crown =
    crownParam && /^\d+$/.test(crownParam) ? await getCrownById(Number(crownParam)) : null;
  const options = { ...OG_SIZE, headers: NO_STORE };

  const monsterImage = monster.image_name
    ? await urlToDataUrl(`${baseUrl}/monsters/${monster.image_name}`)
    : await urlToDataUrl(`${baseUrl}/icons/MHWilds-Hunt_Icon.png`);

  if (!crown) {
    const [stats, seekers] = await Promise.all([
      getMonsterStats(monster.id),
      seekerCount(monster.id),
    ]);
    return new ImageResponse(
      <MonsterLedgerCard monster={monster} image={monsterImage} stats={stats} seekers={seekers} />,
      options,
    );
  }

  const [avatar, quest, crownIcon] = await Promise.all([
    loadAvatar(crown.avatar_url, baseUrl),
    urlToDataUrl(`${baseUrl}/icons/${getQuestIcon(crown.quest)}`),
    urlToDataUrl(`${baseUrl}/icons/${crown.type}crown.png`),
  ]);
  return new ImageResponse(
    <CrownPostingCard
      monster={monster}
      crown={crown}
      images={{ monster: monsterImage, quest, crown: crownIcon, avatar }}
    />,
    options,
  );
}
