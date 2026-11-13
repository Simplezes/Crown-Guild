import { ImageResponse } from "next/og";
import { env } from "@/env";
import { GuildCard, OG_SIZE, urlToDataUrl, validMonsterImages } from "@/features/og/server";
import { getGuildCardData } from "@/server/services/guild-card";

export const runtime = "nodejs";

export async function GET() {
  const baseUrl = env.NEXTAUTH_URL;
  const data = await getGuildCardData();

  const valid = await validMonsterImages(baseUrl, [
    ...new Set(
      [...data.smallOnly, ...data.largeOnly]
        .map((m) => m.image_name)
        .filter((n): n is string => !!n),
    ),
  ]);
  const keep = (list: typeof data.smallOnly) =>
    list.filter((m) => !m.image_name || valid.has(m.image_name));
  const smallOnly = keep(data.smallOnly);
  const largeOnly = keep(data.largeOnly);

  const images = new Map<string, string>();
  for (const monster of [...smallOnly, ...largeOnly]) {
    if (monster.image_name && !images.has(monster.name)) {
      images.set(monster.name, await urlToDataUrl(`${baseUrl}/monsters/${monster.image_name}`));
    }
  }
  const huntIcon = await urlToDataUrl(`${baseUrl}/icons/MHWilds-Hunt_Icon.png`);

  return new ImageResponse(
    <GuildCard data={{ ...data, smallOnly, largeOnly }} huntIcon={huntIcon} images={images} />,
    OG_SIZE,
  );
}
