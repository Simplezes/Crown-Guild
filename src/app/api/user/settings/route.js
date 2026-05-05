import { auth } from "@/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req) {
  const session = await auth();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const { lobby_id, quest_password, status_message, receive_dms } = await req.json();
    const userId = session.user.id;

    const updates = [];
    const args = [];

    if (lobby_id !== undefined) { updates.push("lobby_id = ?"); args.push(lobby_id); }
    if (quest_password !== undefined) { updates.push("quest_password = ?"); args.push(quest_password); }
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
    console.error(e);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
