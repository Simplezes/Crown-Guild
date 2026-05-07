import { auth } from "@/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { logServerError } from "@/lib/logger";

async function updateSettings(req) {
  const session = await auth();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const { lobby_id, quest_password, status_message, receive_dms } = await req.json();
    const userId = session.user.id;
    let normalizedPassword;

    if (quest_password !== undefined) {
      normalizedPassword = String(quest_password || "").trim();
      if (normalizedPassword !== "" && !/^\d{4}$/.test(normalizedPassword)) {
        return NextResponse.json({ error: "Quest password must be exactly 4 digits." }, { status: 400 });
      }
    }

    const updates = [];
    const args = [];

    if (lobby_id !== undefined) { updates.push("lobby_id = ?"); args.push(lobby_id); }
    if (quest_password !== undefined) { updates.push("quest_password = ?"); args.push(normalizedPassword); }
    if (status_message !== undefined) { updates.push("status_message = ?"); args.push(status_message); }
    if (receive_dms !== undefined) { updates.push("receive_dms = ?"); args.push(receive_dms ? 1 : 0); }

    if (updates.length === 0) return NextResponse.json({ success: true });

    args.push(userId);

    await db.execute({
      sql: `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      args
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    logServerError("Unhandled server error", e);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export const POST = updateSettings;
export const PUT = updateSettings;

export async function DELETE() {
  const session = await auth();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const userId = session.user.id;

  try {
    await db.batch([
      { sql: "DELETE FROM web_notifications WHERE user_id = ? OR host_id = ? OR recipient_id = ?", args: [userId, userId, userId] },
      { sql: "DELETE FROM flare_queue WHERE user_id = ?", args: [userId] },
      { sql: "DELETE FROM active_flares WHERE host_id = ?", args: [userId] },
      { sql: "DELETE FROM crowns WHERE user_id = ?", args: [userId] },
      { sql: "DELETE FROM wishlist WHERE user_id = ?", args: [userId] },
      { sql: "DELETE FROM investigations WHERE user_id = ?", args: [userId] },
      { sql: "DELETE FROM active_missions WHERE host_id = ? OR requester_id = ?", args: [userId, userId] },
      { sql: "DELETE FROM completed_missions WHERE host_id = ? OR requester_id = ?", args: [userId, userId] },
      { sql: "DELETE FROM users WHERE id = ?", args: [userId] },
    ]);

    return NextResponse.json({ success: true });
  } catch (e) {
    logServerError("Unhandled server error", e);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
