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

    const userId = session.user.id;

    await db.execute({
      sql: "DELETE FROM active_missions WHERE created_at < datetime('now', '-50 minutes')"
    });

    const res = await db.execute({
      sql: `
        SELECT a.*, m.name as monster_name
        FROM active_missions a
        JOIN monsters m ON a.monster_id = m.id
        WHERE a.requester_id = ?
      `,
      args: [userId],
    });

    if (res.rows.length === 0) {
      const hostRes = await db.execute({
        sql: "SELECT 1 FROM active_missions WHERE host_id = ?",
        args: [userId]
      });
      if (hostRes.rows.length > 0) {
        return NextResponse.json({ error: "Only the requester can mark a mission as complete." }, { status: 400 });
      }
      return NextResponse.json({ error: "No active mission found." }, { status: 404 });
    }

    const mission = res.rows[0];
    const hostId = mission.host_id;
    const requesterId = mission.requester_id;

    await db.execute({ sql: "INSERT OR IGNORE INTO users(id) VALUES (?)", args: [hostId] });
    await db.execute({ sql: "INSERT OR IGNORE INTO users(id) VALUES (?)", args: [requesterId] });

    await db.execute({
      sql: "UPDATE users SET shared_crowns = shared_crowns + 1 WHERE id = ?",
      args: [hostId],
    });

    await db.execute({
      sql: "UPDATE users SET missions_completed = missions_completed + 1 WHERE id = ?",
      args: [requesterId],
    });

    await db.execute({
      sql: "INSERT INTO completed_missions (host_id, requester_id, monster_id, type, tempered, strength_rating) VALUES (?, ?, ?, ?, ?, ?)",
      args: [hostId, requesterId, mission.monster_id, mission.type, mission.tempered, mission.strength_rating],
    });

    await db.execute({
      sql: "DELETE FROM active_missions WHERE id = ?",
      args: [mission.id],
    });

    const hostCrownRes = await db.execute({
      sql: "SELECT id, quest, remaining_uses FROM crowns WHERE user_id = ? AND monster_id = ? AND type = ? AND tempered = ? AND strength_rating = ? ORDER BY remaining_uses ASC LIMIT 1",
      args: [hostId, mission.monster_id, mission.type, mission.tempered, mission.strength_rating]
    });
    const hostCrown = hostCrownRes.rows[0];

    if (hostCrown && hostCrown.quest === "Investigation Quests" && hostCrown.remaining_uses !== null) {
      const newUses = hostCrown.remaining_uses - 1;
      if (newUses <= 0) {
        await db.execute({
          sql: "UPDATE web_notifications SET crown_id = NULL WHERE crown_id = ?",
          args: [hostCrown.id]
        });
        await db.execute({
          sql: "DELETE FROM crowns WHERE id = ?",
          args: [hostCrown.id]
        });
      } else {
        await db.execute({
          sql: "UPDATE crowns SET remaining_uses = ? WHERE id = ?",
          args: [newUses, hostCrown.id]
        });
      }
    }

    await pusherServer.trigger("public-channel", "mission_update", { status: 'completed' });
    await pusherServer.trigger("public-channel", "crown_update", {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error completing mission:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

