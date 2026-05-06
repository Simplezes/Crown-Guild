import { NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "@/auth";
import { pusherServer } from "@/lib/pusher";
import { checkRateLimit } from "@/lib/ratelimit";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitRes = await checkRateLimit("mission", session.user.id);
    if (rateLimitRes) return rateLimitRes;

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

    if (mission.group_id) {
      await db.execute({
        sql: "UPDATE active_missions SET hunter_confirmed = 1 WHERE requester_id = ? AND group_id = ?",
        args: [userId, mission.group_id]
      });

      const pendingRes = await db.execute({
        sql: "SELECT COUNT(*) as count FROM active_missions WHERE group_id = ? AND hunter_confirmed = 0",
        args: [mission.group_id]
      });

      if (Number(pendingRes.rows[0].count) > 0) {
        await pusherServer.trigger("public-channel", "mission_update", {
          type: "group_confirmed",
          groupId: mission.group_id,
          confirmedUserId: userId
        });
        return NextResponse.json({ success: true, allDone: false });
      }

      const groupRes = await db.execute({
        sql: "SELECT * FROM active_missions WHERE group_id = ?",
        args: [mission.group_id]
      });
      const groupMissions = groupRes.rows;

      for (const m of groupMissions) {
        await db.execute({ sql: "INSERT OR IGNORE INTO users(id) VALUES (?)", args: [m.requester_id] });
        await db.execute({
          sql: "UPDATE users SET missions_completed = missions_completed + 1, fever_until = datetime('now', '+1 hour') WHERE id = ?",
          args: [m.requester_id]
        });
        await db.execute({
          sql: "UPDATE users SET shared_crowns = shared_crowns + 1, fever_until = datetime('now', '+1 hour') WHERE id = ?",
          args: [m.host_id]
        });
        await db.execute({
          sql: "INSERT INTO completed_missions (host_id, requester_id, monster_id, type, tempered, strength_rating) VALUES (?, ?, ?, ?, ?, ?)",
          args: [m.host_id, m.requester_id, m.monster_id, m.type, m.tempered, m.strength_rating]
        });
      }

      const firstMission = groupMissions[0];
      const hostCrownRes = await db.execute({
        sql: `SELECT c.id, c.quest, c.investigation_id,
                     COALESCE(inv.remaining_uses, c.remaining_uses) as remaining_uses,
                     inv.id as inv_id
              FROM crowns c
              LEFT JOIN investigations inv ON c.investigation_id = inv.id
              WHERE c.user_id = ? AND c.monster_id = ? AND c.type = ? AND c.tempered = ? AND c.strength_rating = ?
              AND c.quest = 'Investigation Quests'
              ORDER BY remaining_uses ASC LIMIT 1`,
        args: [firstMission.host_id, firstMission.monster_id, firstMission.type, firstMission.tempered, firstMission.strength_rating]
      });
      const hostCrown = hostCrownRes.rows[0];
      if (hostCrown && hostCrown.remaining_uses !== null) {
        const newUses = hostCrown.remaining_uses - 1;
        if (newUses <= 0) {
          await db.execute({ sql: "UPDATE web_notifications SET crown_id = NULL WHERE crown_id = ?", args: [hostCrown.id] });
          await db.execute({ sql: "DELETE FROM crowns WHERE id = ?", args: [hostCrown.id] });
          if (hostCrown.inv_id) {
            await db.execute({ sql: "DELETE FROM investigations WHERE id = ?", args: [hostCrown.inv_id] });
          }
        } else if (hostCrown.inv_id) {
          await db.execute({ sql: "UPDATE investigations SET remaining_uses = ? WHERE id = ?", args: [newUses, hostCrown.inv_id] });
        } else {
          await db.execute({ sql: "UPDATE crowns SET remaining_uses = ? WHERE id = ?", args: [newUses, hostCrown.id] });
        }
      }

      await db.execute({ sql: "DELETE FROM active_missions WHERE group_id = ?", args: [mission.group_id] });
      await pusherServer.trigger("public-channel", "mission_update", { status: "completed", groupId: mission.group_id });
      await pusherServer.trigger("public-channel", "crown_update", {});
      return NextResponse.json({ success: true, allDone: true });
    }


    await db.execute({ sql: "INSERT OR IGNORE INTO users(id) VALUES (?)", args: [requesterId] });

    await db.execute({
      sql: "UPDATE users SET missions_completed = missions_completed + 1, fever_until = datetime('now', '+1 hour') WHERE id = ?",
      args: [requesterId],
    });

    await db.execute({
      sql: "UPDATE users SET shared_crowns = shared_crowns + 1, fever_until = datetime('now', '+1 hour') WHERE id = ?",
      args: [hostId],
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
      sql: `SELECT c.id, c.quest, c.investigation_id,
                   COALESCE(inv.remaining_uses, c.remaining_uses) as remaining_uses,
                   inv.id as inv_id
            FROM crowns c
            LEFT JOIN investigations inv ON c.investigation_id = inv.id
            WHERE c.user_id = ? AND c.monster_id = ? AND c.type = ? AND c.tempered = ? AND c.strength_rating = ?
            AND c.quest = 'Investigation Quests'
            ORDER BY remaining_uses ASC LIMIT 1`,
      args: [hostId, mission.monster_id, mission.type, mission.tempered, mission.strength_rating]
    });
    const hostCrown = hostCrownRes.rows[0];

    if (hostCrown && hostCrown.remaining_uses !== null) {
      const newUses = hostCrown.remaining_uses - 1;
      if (newUses <= 0) {
        await db.execute({ sql: "UPDATE web_notifications SET crown_id = NULL WHERE crown_id = ?", args: [hostCrown.id] });
        await db.execute({ sql: "DELETE FROM crowns WHERE id = ?", args: [hostCrown.id] });
        if (hostCrown.inv_id) {
          await db.execute({ sql: "DELETE FROM investigations WHERE id = ?", args: [hostCrown.inv_id] });
        }
      } else if (hostCrown.inv_id) {
        await db.execute({ sql: "UPDATE investigations SET remaining_uses = ? WHERE id = ?", args: [newUses, hostCrown.inv_id] });
      } else {
        await db.execute({ sql: "UPDATE crowns SET remaining_uses = ? WHERE id = ?", args: [newUses, hostCrown.id] });
      }
    }

    await pusherServer.trigger("public-channel", "mission_update", { status: 'completed', hostId, requesterId });
    await pusherServer.trigger("public-channel", "crown_update", {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error completing mission:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

