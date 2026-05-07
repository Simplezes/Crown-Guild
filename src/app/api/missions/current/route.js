import { NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "@/auth";
import { logServerError } from "@/lib/logger";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ missions: [] });
    }

    const res = await db.execute({
      sql: `
        SELECT am.*, m.name as monster_name, m.emoji as monster_emoji, m.image_name as monster_image,
               u_host.username as host_name, u_host.avatar_url as host_avatar, u_host.lobby_id, u_host.quest_password,
               u_req.username as requester_name, u_req.avatar_url as requester_avatar
        FROM active_missions am
        JOIN monsters m ON am.monster_id = m.id
        JOIN users u_host ON am.host_id = u_host.id
        JOIN users u_req ON am.requester_id = u_req.id
        WHERE am.host_id = ? OR am.requester_id = ?
        ORDER BY am.created_at ASC
      `,
      args: [session.user.id, session.user.id]
    });

    const missions = [];
    const seenGroupIds = new Set();

    for (const row of res.rows) {
      if (row.group_id) {
        if (seenGroupIds.has(row.group_id)) continue;
        seenGroupIds.add(row.group_id);
        const groupRes = await db.execute({
          sql: `SELECT am.requester_id, am.hunter_confirmed,
                       u.username as requester_name, u.avatar_url as requester_avatar
                FROM active_missions am
                JOIN users u ON am.requester_id = u.id
                WHERE am.group_id = ?
                ORDER BY am.created_at ASC`,
          args: [row.group_id]
        });
        missions.push({ mission: row, group: groupRes.rows.map(r => ({ ...r })) });
      } else {
        missions.push({ mission: row, group: null });
      }
    }

    const seenIds = new Set();
    const dedupedMissions = missions.filter(({ mission }) => {
      const key = String(mission.id);
      if (seenIds.has(key)) return false;
      seenIds.add(key);
      return true;
    });

    return NextResponse.json({ missions: dedupedMissions });
  } catch (error) {
    logServerError("Error fetching current mission:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
