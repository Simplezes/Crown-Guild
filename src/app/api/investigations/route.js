import db from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await db.execute({
      sql: `
        SELECT
          inv.id,
          inv.monster_id,
          inv.remaining_uses,
          m.name         AS monster_name,
          m.image_name   AS monster_image,
          m.emoji        AS monster_emoji,
          COUNT(c.id)    AS crown_count
        FROM investigations inv
        JOIN  monsters m ON inv.monster_id = m.id
        LEFT JOIN crowns c ON c.investigation_id = inv.id
        WHERE inv.user_id = ?
        GROUP BY inv.id
        ORDER BY inv.id DESC
      `,
      args: [session.user.id],
    });

    return NextResponse.json(res.rows.map(r => ({ ...r })));
  } catch (error) {
    console.error("Failed to fetch investigations:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
