import "server-only";
import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { env } from "@/env";
import { db } from "@/server/db";
import { logServerError } from "@/server/logger";

const SENSITIVE_TOKEN_FIELDS = [
  "discordAccessToken",
  "access_token",
  "refresh_token",
  "id_token",
  "token_type",
  "expires_at",
  "scope",
];

interface DiscordProfile {
  id?: string;
  username?: string;
  global_name?: string;
  avatar?: string;
  image_url?: string;
}

export const { handlers, auth } = NextAuth({
  secret: env.AUTH_SECRET,
  trustHost: true,
  debug: false,
  useSecureCookies: process.env.NODE_ENV === "production",
  session: { strategy: "jwt", maxAge: 60 * 60 * 8, updateAge: 60 * 60 },
  pages: { signIn: "/signin" },
  providers: [
    Discord({
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
      issuer: "https://discord.com",
      authorization: { params: { scope: "identify" } },
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      const discord = profile as DiscordProfile | undefined;
      if (!discord?.id) return false;

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
            discord.id,
            discord.username || discord.global_name || null,
            discord.image_url ||
              `https://cdn.discordapp.com/avatars/${discord.id}/${discord.avatar}.png`,
          ],
        });
      } catch (error) {
        logServerError("Failed to sync user info to DB", error);
      }
      return true;
    },
    async jwt({ token, profile }) {
      const discord = profile as DiscordProfile | undefined;
      if (discord?.id) token.discordId = discord.id;
      for (const field of SENSITIVE_TOKEN_FIELDS) delete token[field];
      return token;
    },
    async session({ session, token }) {
      session.user.id = String(token.discordId ?? token.sub);
      return session;
    },
  },
});
