import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import db from "@/lib/db";
import { emojiservers } from "@/lib/emojiservers";

async function fetchDiscordGuilds(accessToken) {
  if (!accessToken) return [];

  try {
    const res = await fetch("https://discord.com/api/v10/users/@me/guilds", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!res.ok) return [];

    const guilds = await res.json();
    if (!Array.isArray(guilds)) return [];

    return guilds.map((guild) => ({
      id: String(guild?.id || ""),
      name: String(guild?.name || "Unknown Server"),
      icon: guild?.icon ? String(guild.icon) : null,
    })).filter((guild) => guild.id);
  } catch {
    return [];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      authorization: { params: { scope: "identify guilds" } },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      try {
        const guilds = await fetchDiscordGuilds(account?.access_token);
        const isInMainGuild = guilds.some(g => String(g.id) === '854896452131094559');

        await db.execute({
          sql: `
            INSERT INTO users (id, username, avatar_url, main_crown_server_id)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              username = excluded.username,
              avatar_url = excluded.avatar_url,
              main_crown_server_id = CASE 
                WHEN (users.main_crown_server_id IS NULL OR users.main_crown_server_id = '') AND ? = 1 
                THEN '854896452131094559' 
                ELSE users.main_crown_server_id 
              END
          `,
          args: [
            profile.id,
            profile.username || profile.global_name,
            profile.image_url || `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`,
            isInMainGuild ? '854896452131094559' : '',
            isInMainGuild ? 1 : 0
          ]
        });
      } catch (e) {
        console.error("Failed to sync user info to DB", e);
      }
      return true;
    },
    async jwt({ token, profile, account }) {
      if (profile?.id) {
        token.discordId = profile.id;
      }

      if (account?.provider === "discord" && account?.access_token) {
        token.discordAccessToken = account.access_token;
      }

      if (token.discordAccessToken && (!Array.isArray(token.guilds) || account?.access_token)) {
        token.guilds = await fetchDiscordGuilds(token.discordAccessToken);
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.discordId ?? token.sub;
      session.user.guilds = Array.isArray(token.guilds) ? token.guilds : [];

      try {
        const res = await db.execute({
          sql: "SELECT main_crown_server_id FROM users WHERE id = ?",
          args: [session.user.id],
        });

        const selectedServer = String(res.rows?.[0]?.main_crown_server_id || "");
        session.user.mainCrownServerId = selectedServer || null;
        session.user.canUseEmojiShare = !!selectedServer && !!emojiservers[selectedServer];
      } catch {
        session.user.mainCrownServerId = null;
        session.user.canUseEmojiShare = false;
      }

      return session;
    },
  },
});
