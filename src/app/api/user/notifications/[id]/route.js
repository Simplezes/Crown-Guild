import { NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "@/auth";
import { pusherServer } from "@/lib/pusher";
import { logServerError } from "@/lib/logger";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const beaconRes = await db.execute({
      sql: "SELECT * FROM web_notifications WHERE id = ? AND host_id = ?",
      args: [id, session.user.id]
    });

    if (beaconRes.rows.length === 0) {
      return NextResponse.json({ error: "Beacon not found" }, { status: 404 });
    }

    const beacon = beaconRes.rows[0];
    const activeCheck = await db.execute({
      sql: "SELECT id FROM active_missions WHERE requester_id = ?",
      args: [beacon.user_id]
    });

    if (activeCheck.rows.length > 0) {
      return NextResponse.json({ error: "Hunter already has an active mission" }, { status: 400 });
    }

    const crownRes = await db.execute({
      sql: `SELECT c.type, c.strength_rating, c.tempered, c.quest,
                   COALESCE(inv.remaining_uses, c.remaining_uses) as remaining_uses
            FROM crowns c
            LEFT JOIN investigations inv ON c.investigation_id = inv.id
            WHERE c.id = ?`,
      args: [beacon.crown_id]
    });
    const crown = crownRes.rows[0];

    if (!crown) {
      return NextResponse.json({ error: "Crown not found" }, { status: 400 });
    }

    if (crown.quest === 'Investigation Quests' && crown.remaining_uses !== null) {
      const activeCountRes = await db.execute({
        sql: `SELECT COUNT(*) as count FROM active_missions
              WHERE host_id = ? AND monster_id = ? AND type = ? AND tempered = ?`,
        args: [session.user.id, beacon.monster_id, crown.type, crown.tempered]
      });
      const activeCount = Number(activeCountRes.rows[0].count);
      if (activeCount >= crown.remaining_uses) {
        return NextResponse.json({
          error: `No investigation uses remaining. You already have ${activeCount} active mission(s) using this investigation.`
        }, { status: 400 });
      }
    }

    await db.execute({
      sql: `INSERT INTO active_missions (host_id, requester_id, monster_id, type, tempered, strength_rating) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        session.user.id,
        beacon.user_id,
        beacon.monster_id,
        crown.type,
        crown.tempered,
        crown.strength_rating
      ]
    });

    await db.execute({
      sql: "UPDATE web_notifications SET status = 'accepted' WHERE id = ?",
      args: [id]
    });

    await db.execute({
      sql: "UPDATE web_notifications SET status = 'cancelled' WHERE user_id = ? AND status = 'pending' AND type IN ('beacon', 'sos_flare')",
      args: [beacon.user_id]
    });

    await db.execute({
      sql: `INSERT INTO web_notifications (user_id, host_id, recipient_id, type, monster_id, crown_id, status) 
            VALUES (?, ?, ?, 'hunt_accepted', ?, ?, 'pending')`,
      args: [
        beacon.user_id,
        session.user.id,
        beacon.user_id,
        beacon.monster_id,
        beacon.crown_id
      ]
    });

    await pusherServer.trigger("public-channel", "mission_update", {});
    await pusherServer.trigger("public-channel", "crown_update", {});
    await pusherServer.trigger("public-channel", "notification_updated", {});
    await pusherServer.trigger("public-channel", "notification_created", {});

    return NextResponse.json({ success: true });
  } catch (error) {
    logServerError("Error accepting beacon:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.execute({
      sql: "UPDATE web_notifications SET status = 'declined' WHERE id = ? AND host_id = ?",
      args: [id, session.user.id]
    });

    await pusherServer.trigger("public-channel", "notification_updated", {});

    return NextResponse.json({ success: true });
  } catch (error) {
    logServerError("Error declining beacon:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

