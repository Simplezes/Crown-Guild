import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ notifications: [] });
    }

    const res = await db.execute({
      sql: `
        SELECT n.*, u.username as requester_name, u.avatar_url as requester_avatar, 
               u_host.username as host_name, u_host.avatar_url as host_avatar,
               m.name as monster_name, m.image_name as monster_image,
               c.type as crown_type, c.tempered, c.strength_rating
        FROM web_notifications n
        JOIN users u ON n.user_id = u.id
        LEFT JOIN users u_host ON n.host_id = u_host.id
        JOIN monsters m ON n.monster_id = m.id
        JOIN crowns c ON n.crown_id = c.id
        WHERE n.recipient_id = ? AND n.status IN ('sent', 'pending')
        ORDER BY n.created_at DESC
        LIMIT 20
      `,
      args: [session.user.id]
    });

    return NextResponse.json({ notifications: res.rows });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
