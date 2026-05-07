import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import db from "@/lib/db";
import { emojiservers } from "@/lib/emojiservers";
import { logServerError } from "@/lib/logger";

const SENSITIVE_TOKEN_FIELDS = [
  "discordAccessToken",
  "access_token",
  "refresh_token",
  "id_token",
  "token_type",
  "expires_at",
  "scope",
];

function stripSensitiveTokenFields(token) {
  for (const field of SENSITIVE_TOKEN_FIELDS) {
    delete token[field];
  }
  return token;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  debug: false,
  useSecureCookies: process.env.NODE_ENV === "production",
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
    updateAge: 60 * 60,
  },
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      authorization: { params: { scope: "identify" } },
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      if (!profile?.id) return false;

      try {
        await db.execute({
          sql: `
            INSERT INTO users (id, username, avatar_url, main_crown_server_id)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              username = excluded.username,
              avatar_url = excluded.avatar_url
          `,
          args: [
            profile.id,
            profile.username || profile.global_name,
            profile.image_url || `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`,
            ''
          ]
        });
      } catch (e) {
        logServerError("Failed to sync user info to DB", e);
      }
      return true;
    },
    async jwt({ token, profile }) {
      if (profile?.id) {
        token.discordId = profile.id;
      }

      return stripSensitiveTokenFields(token);
    },
    async session({ session, token }) {
      session.user.id = token.discordId ?? token.sub;
      session.user.guilds = [];

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
