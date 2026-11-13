import { ImageResponse } from "next/og";
import { env } from "@/env";
import {
  OG_COLORS,
  OG_SIZE,
  ProfileFullCard,
  ProfileMonstersCard,
  groupProfileMonsters,
  loadAvatar,
  urlToDataUrl,
  validMonsterImages,
} from "@/features/og/server";
import { getRankProgress } from "@/config/mastery";
import { getProfileData } from "@/server/services/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getProfileData(id);

  if (!data) {
    return new ImageResponse(
      <div
        style={{
          fontSize: 48,
          background: OG_COLORS.void,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: OG_COLORS.mist,
        }}
      >
        Hunter Not Found
      </div>,
      OG_SIZE,
    );
  }

  const baseUrl = env.NEXTAUTH_URL;
  const monstersOnly = new URL(request.url).searchParams.get("card") === "monsters";
  const raw = groupProfileMonsters(data.crowns);

  const names = [
    ...new Set([...raw.all.map((m) => m.image_name), ...data.wishlist.map((w) => w.image_name)]),
  ].filter((name): name is string => !!name);
  const valid = await validMonsterImages(baseUrl, names);
  const keep = <T extends { image_name: string | null }>(list: T[]) =>
    list.filter((item) => !item.image_name || valid.has(item.image_name));

  const groups = {
    all: keep(raw.all),
    multi: keep(raw.multi),
    smallOnly: keep(raw.smallOnly),
    largeOnly: keep(raw.largeOnly),
  };

  const images = new Map<string, string>();
  for (const monster of groups.all) {
    if (monster.image_name && !images.has(monster.name)) {
      images.set(monster.name, await urlToDataUrl(`${baseUrl}/monsters/${monster.image_name}`));
    }
  }
  const avatar = await loadAvatar(data.user.avatar_url, baseUrl);
  const rank = getRankProgress(Number(data.masteryPoints || 0));
  const options = { ...OG_SIZE, headers: NO_STORE };

  if (monstersOnly) {
    return new ImageResponse(
      <ProfileMonstersCard
        data={data}
        rankTitle={rank.currentRank.title}
        groups={groups}
        avatar={avatar}
        images={images}
      />,
      options,
    );
  }
  return new ImageResponse(
    <ProfileFullCard data={data} rank={rank} groups={groups} avatar={avatar} images={images} />,
    options,
  );
}
