import db from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id ?? null;

    await db.execute("DELETE FROM active_flares WHERE created_at < datetime('now', '-10 minutes')");

    const res = await db.execute({
      sql: `
        SELECT f.*, u.username as host_name, u.avatar_url as host_avatar, m.name as monster_name, m.emoji, m.image_name,
               (SELECT COUNT(*) FROM active_flare_queue q WHERE q.flare_id = f.id) as queue_count,
               (SELECT 1 FROM active_flare_queue q2 WHERE q2.flare_id = f.id AND q2.user_id = ?) as is_joined
        FROM active_flares f
        JOIN users u ON f.host_id = u.id
        JOIN monsters m ON f.monster_id = m.id
        ORDER BY f.created_at DESC
      `,
      args: [userId]
    });

    const flares = res.rows.map(r => ({ ...r }));

    for (const flare of flares) {
      const membersRes = await db.execute({
        sql: "SELECT u.id, u.username, u.avatar_url FROM active_flare_queue q JOIN users u ON q.user_id = u.id WHERE q.flare_id = ? ORDER BY q.created_at ASC",
        args: [flare.id]
      });
      flare.members = membersRes.rows.map(r => ({ ...r }));
    }

    return NextResponse.json(flares);
  } catch (e) {
    console.error(e);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
