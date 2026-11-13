import "server-only";
import { db, ensureUserShareUrl, firstRow } from "@/server/db";
import type { SettingsInput } from "@/server/schemas/user";
import { getUserSummary } from "./summary";

export interface UserSettings {
  id: string;
  username: string;
  lobby_id: string;
  quest_password: string;
  status_message: string;
  receive_dms: number;
  share_url: number;
}

interface SettingsRow {
  id: string;
  username: string | null;
  lobby_id: string | null;
  quest_password: string | null;
  status_message: string | null;
  receive_dms: number | null;
  share_url: number | null;
}

export async function getSettings(
  userId: string,
  fallbackName: string | null,
): Promise<{ user: UserSettings; rank: { title: string } } | null> {
  await ensureUserShareUrl();
  const [result, summary] = await Promise.all([
    db.execute({
      sql: `SELECT id, username, lobby_id, quest_password, status_message, receive_dms, share_url
            FROM users WHERE id = ?`,
      args: [userId],
    }),
    getUserSummary(userId),
  ]);
  const row = firstRow<SettingsRow>(result);
  if (!row) return null;
  return {
    user: {
      id: row.id,
      username: row.username || fallbackName || "Hunter",
      lobby_id: row.lobby_id || "",
      quest_password: row.quest_password || "",
      status_message: row.status_message || "",
      receive_dms: row.receive_dms ?? 1,
      share_url: row.share_url ?? 0,
    },
    rank: { title: summary?.title || "Fledgling" },
  };
}

export async function getShareUrl(userId: string | null): Promise<boolean> {
  if (!userId) return false;
  try {
    await ensureUserShareUrl();
    const result = await db.execute({
      sql: "SELECT share_url FROM users WHERE id = ?",
      args: [userId],
    });
    return Number(firstRow<{ share_url: number | null }>(result)?.share_url ?? 0) === 1;
  } catch {
    return false;
  }
}

export async function updateSettings(userId: string, input: SettingsInput): Promise<void> {
  const assignments: string[] = [];
  const args: (string | number)[] = [];

  if (input.lobby_id !== undefined) {
    assignments.push("lobby_id = ?");
    args.push(input.lobby_id);
  }
  if (input.quest_password !== undefined) {
    assignments.push("quest_password = ?");
    args.push(input.quest_password);
  }
  if (input.status_message !== undefined) {
    assignments.push("status_message = ?");
    args.push(input.status_message);
  }
  if (input.receive_dms !== undefined) {
    assignments.push("receive_dms = ?");
    args.push(input.receive_dms ? 1 : 0);
  }
  if (input.share_url !== undefined) {
    await ensureUserShareUrl();
    assignments.push("share_url = ?");
    args.push(input.share_url ? 1 : 0);
  }
  if (assignments.length === 0) return;

  await db.execute({
    sql: `UPDATE users SET ${assignments.join(", ")} WHERE id = ?`,
    args: [...args, userId],
  });
}

export async function updateStatus(userId: string, message: string): Promise<void> {
  await db.execute({
    sql: "UPDATE users SET status_message = ? WHERE id = ?",
    args: [message, userId],
  });
}

export async function deleteAccount(userId: string): Promise<void> {
  await db.batch(
    [
      {
        sql: "DELETE FROM web_notifications WHERE user_id = ? OR host_id = ? OR recipient_id = ?",
        args: [userId, userId, userId],
      },
      { sql: "DELETE FROM flare_queue WHERE user_id = ?", args: [userId] },
      { sql: "DELETE FROM active_flares WHERE host_id = ?", args: [userId] },
      { sql: "DELETE FROM crowns WHERE user_id = ?", args: [userId] },
      { sql: "DELETE FROM wishlist WHERE user_id = ?", args: [userId] },
      { sql: "DELETE FROM investigations WHERE user_id = ?", args: [userId] },
      {
        sql: "DELETE FROM active_missions WHERE host_id = ? OR requester_id = ?",
        args: [userId, userId],
      },
      {
        sql: "DELETE FROM completed_missions WHERE host_id = ? OR requester_id = ?",
        args: [userId, userId],
      },
      { sql: "DELETE FROM guild_archive WHERE user_id = ?", args: [userId] },
      { sql: "DELETE FROM hunter_collection WHERE user_id = ?", args: [userId] },
      { sql: "DELETE FROM users WHERE id = ?", args: [userId] },
    ],
    "write",
  );
}
