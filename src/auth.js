import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import db from "@/lib/db";

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
        await db.execute({
          sql: `
            INSERT INTO users (id, username, avatar_url)
            VALUES (?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              username = excluded.username,
              avatar_url = excluded.avatar_url
          `,
          args: [
            profile.id,
            profile.username || profile.global_name,
            profile.image_url || `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
          ]
        });
      } catch (e) {
        console.error("Failed to sync user info to DB", e);
      }
      return true;
    },
    async jwt({ token, profile }) {
      if (profile?.id) {
        token.discordId = profile.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.discordId ?? token.sub;
      return session;
    },
  },
});
