import db from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";
import { SOS_DISABLED_MESSAGE, SOS_FEATURE_ENABLED } from '@/lib/sos';

export async function POST(req) {
  if (!SOS_FEATURE_ENABLED) {
    return new NextResponse(SOS_DISABLED_MESSAGE, { status: 503 });
  }

  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { monsterId, crownId } = await req.json();
    const userId = session.user.id;

    const crownRes = await db.execute({
      sql: "SELECT * FROM crowns WHERE id = ? AND user_id = ?",
      args: [crownId, userId]
    });

    if (crownRes.rows.length === 0) {
      return new NextResponse("You don't own this crown record.", { status: 403 });
    }

    const crown = crownRes.rows[0];

    const userRes = await db.execute({
      sql: "SELECT lobby_id FROM users WHERE id = ?",
      args: [userId]
    });
    const lobbyId = userRes.rows[0]?.lobby_id;

    if (!lobbyId) {
      return new NextResponse("Lobby ID not set in profile.", { status: 400 });
    }

    await db.execute({
      sql: "DELETE FROM active_flares WHERE host_id = ?",
      args: [userId]
    });

    await db.execute({
      sql: "INSERT INTO active_flares (host_id, monster_id, type, tempered, strength_rating, session_id) VALUES (?, ?, ?, ?, ?, ?)",
      args: [userId, monsterId, crown.type, crown.tempered, crown.strength_rating, lobbyId]
    });

    await pusherServer.trigger("public-channel", "flare_updated", { type: 'fired' });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
