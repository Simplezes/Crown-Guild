import { NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "@/auth";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const offset = (page - 1) * limit;

    const countRes = await db.execute({
      sql: "SELECT COUNT(*) as total FROM completed_missions WHERE host_id = ? OR requester_id = ?",
      args: [session.user.id, session.user.id]
    });
    const total = countRes.rows[0].total;

    const res = await db.execute({
      sql: `
        SELECT cm.*, m.name as monster_name, m.emoji as monster_emoji, m.image_name as monster_image,
               u_host.username as host_name, u_host.avatar_url as host_avatar,
               u_req.username as requester_name, u_req.avatar_url as requester_avatar
        FROM completed_missions cm
        JOIN monsters m ON cm.monster_id = m.id
        JOIN users u_host ON cm.host_id = u_host.id
        JOIN users u_req ON cm.requester_id = u_req.id
        WHERE cm.host_id = ? OR cm.requester_id = ?
        ORDER BY cm.completed_at DESC
        LIMIT ? OFFSET ?
      `,
      args: [session.user.id, session.user.id, limit, offset]
    });

    return NextResponse.json({ missions: res.rows, total, page, limit });
  } catch (error) {
    console.error("Error fetching mission history:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
