import { NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "@/auth";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ isHosting: false });
    }

    const { searchParams } = new URL(request.url);
    const monsterId = searchParams.get("monster_id");

    if (!monsterId) {
      return NextResponse.json({ error: "Missing monster_id" }, { status: 400 });
    }

    const activeMissionsRes = await db.execute({
      sql: `SELECT * FROM active_missions WHERE host_id = ? AND monster_id = ?`,
      args: [session.user.id, parseInt(monsterId)]
    });

    const isHosting = activeMissionsRes.rows.length > 0;

    return NextResponse.json({ isHosting });
  } catch (error) {
    console.error("Error checking active missions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
