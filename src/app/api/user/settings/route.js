import { auth } from "@/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";
import { emojiservers } from "@/lib/emojiservers";

let mainCrownColumnChecked = false;

async function ensureMainCrownServerColumn() {
  if (mainCrownColumnChecked) return;

  try {
    await db.execute("ALTER TABLE users ADD COLUMN main_crown_server_id TEXT");
  } catch {
  }

  mainCrownColumnChecked = true;
}

async function updateSettings(req) {
  const session = await auth();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  try {
    await ensureMainCrownServerColumn();

    const { lobby_id, quest_password, status_message, receive_dms, main_crown_server_id } = await req.json();
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
    if (main_crown_server_id !== undefined) {
      const selected = String(main_crown_server_id || "").trim();

      if (!selected) {
        updates.push("main_crown_server_id = NULL");
      } else {
        const guilds = Array.isArray(session?.user?.guilds) ? session.user.guilds : [];
        const isMember = guilds.some((guild) => String(guild?.id) === selected);
        const isAllowed = !!emojiservers[selected];

        if (!isMember || !isAllowed) {
          return NextResponse.json({ error: "Invalid crown server selection" }, { status: 400 });
        }

        updates.push("main_crown_server_id = ?");
        args.push(selected);
      }
    }

    if (updates.length === 0) return NextResponse.json({ success: true });

    args.push(userId);

    await db.execute({
      sql: `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      args
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
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
    console.error(e);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
