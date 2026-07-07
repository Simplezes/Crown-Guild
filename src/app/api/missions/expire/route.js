import db from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { notifyUsers } from "@/lib/pusher";
import { logServerError } from "@/lib/logger";
import { checkRateLimit } from "@/lib/ratelimit";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const userId = session.user.id;

    const rateLimitRes = await checkRateLimit("mission", userId);
    if (rateLimitRes) return rateLimitRes;

    const missionRes = await db.execute({
      sql: "SELECT * FROM active_missions WHERE requester_id = ?",
      args: [userId]
    });

    if (!missionRes.rows[0]) {
      return NextResponse.json({ success: true });
    }

    const mission = missionRes.rows[0];
    await db.execute({ sql: "DELETE FROM active_missions WHERE id = ?", args: [mission.id] });
    await notifyUsers([userId, mission.host_id], "mission_update", { status: 'expired', requesterId: userId });

    return NextResponse.json({ success: true });
  } catch (e) {
    logServerError("Unhandled server error", e);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
