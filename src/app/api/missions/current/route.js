import { NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "@/auth";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ mission: null });
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
        ORDER BY am.created_at DESC
        LIMIT 1
      `,
      args: [session.user.id, session.user.id]
    });

    return NextResponse.json({ mission: res.rows[0] || null });
  } catch (error) {
    console.error("Error fetching current mission:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
