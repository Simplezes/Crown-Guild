import "server-only";
import { env } from "@/env";
import { logServerError } from "./logger";

export interface DiscordUser {
  username: string;
  avatar_url: string | null;
}

interface DiscordApiUser {
  username: string;
  global_name: string | null;
  avatar: string | null;
}

export async function fetchDiscordUser(userId: string): Promise<DiscordUser | null> {
  if (!env.DISCORD_TOKEN || !/^\d{15,25}$/.test(userId)) return null;

  try {
    const res = await fetch(`https://discord.com/api/v10/users/${userId}`, {
      headers: { Authorization: `Bot ${env.DISCORD_TOKEN}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as DiscordApiUser;
    return {
      username: data.global_name || data.username,
      avatar_url: data.avatar
        ? `https://cdn.discordapp.com/avatars/${userId}/${data.avatar}.png`
        : null,
    };
  } catch (error) {
    logServerError("Failed to fetch Discord user", error, { userId });
    return null;
  }
}
