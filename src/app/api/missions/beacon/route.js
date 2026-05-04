import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { pusherServer } from "@/lib/pusher";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { host_id, monster_id, crown_id } = await request.json();

    if (!host_id || !monster_id || !crown_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const mId = parseInt(monster_id);
    const cId = parseInt(crown_id);

    if (isNaN(mId) || isNaN(cId)) {
      return NextResponse.json({ error: "Invalid monster or crown ID" }, { status: 400 });
    }

    if (host_id === session.user.id) {
      return NextResponse.json({ error: "You cannot send a beacon to yourself" }, { status: 400 });
    }

    const missionCheck = await db.execute({
      sql: "SELECT id FROM active_missions WHERE requester_id = ?",
      args: [session.user.id]
    });

    if (missionCheck.rows.length > 0) {
      return NextResponse.json({ error: "You already have an active mission. Finish or cancel it first." }, { status: 400 });
    }

    const existing = await db.execute({
      sql: "SELECT id FROM web_notifications WHERE user_id = ? AND host_id = ? AND monster_id = ? AND crown_id = ? AND status = 'pending'",
      args: [session.user.id, host_id, mId, cId]
    });

    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "SOS Beacon already active for this host" }, { status: 400 });
    }

    await db.execute({
      sql: `INSERT INTO web_notifications (user_id, host_id, recipient_id, type, monster_id, crown_id) 
            VALUES (?, ?, ?, 'beacon', ?, ?)`,
      args: [session.user.id, host_id, host_id, mId, cId]
    });

    // In the future, cron jobs will pick this up for discord, but we also want to trigger pusher immediately for the UI
    await pusherServer.trigger("public-channel", "notification_created", {});
    
    // We can also fetch the actual notification data to broadcast it instantly if we wanted, 
    // but the original architecture relied on the bot polling. Let's just trigger notification_created.

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating beacon:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

