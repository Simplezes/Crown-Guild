import { NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "@/auth";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { missionId } = await request.json();
    if (!missionId) return NextResponse.json({ error: "Mission ID required" }, { status: 400 });

    const missionRes = await db.execute({
      sql: "SELECT * FROM completed_missions WHERE id = ? AND requester_id = ?",
      args: [missionId, session.user.id]
    });

    if (missionRes.rows.length === 0) {
      return NextResponse.json({ error: "Mission not found or not eligible for commendation" }, { status: 404 });
    }

    const mission = missionRes.rows[0];
    if (mission.commended) {
      return NextResponse.json({ error: "Already commended" }, { status: 400 });
    }

    await db.batch([
      {
        sql: "UPDATE completed_missions SET commended = 1 WHERE id = ?",
        args: [missionId]
      },
      {
        sql: "UPDATE users SET renown = renown + 1 WHERE id = ?",
        args: [mission.host_id]
      }
    ], "write");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Commend error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
