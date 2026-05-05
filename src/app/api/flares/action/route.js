import db from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { action, flareId } = await req.json();
    const userId = session.user.id;

    if (action === 'join') {
      await db.execute({
        sql: "INSERT OR IGNORE INTO active_flare_queue (flare_id, user_id) VALUES (?, ?)",
        args: [flareId, userId]
      });
      await pusherServer.trigger("public-channel", "flare_updated", { type: 'join' });
      return NextResponse.json({ success: true });
    }

    if (action === 'leave') {
      await db.execute({
        sql: "DELETE FROM active_flare_queue WHERE flare_id = ? AND user_id = ?",
        args: [flareId, userId]
      });
      await pusherServer.trigger("public-channel", "flare_updated", { type: 'leave' });
      return NextResponse.json({ success: true });
    }

    if (action === 'close') {
      const flareRes = await db.execute({
        sql: "SELECT host_id FROM active_flares WHERE id = ?",
        args: [flareId]
      });

      if (flareRes.rows[0]?.host_id !== userId) {
        return new NextResponse("Only the host can close the flare.", { status: 403 });
      }

      await db.execute({
        sql: "DELETE FROM active_flares WHERE id = ?",
        args: [flareId]
      });
      await pusherServer.trigger("public-channel", "flare_updated", { type: 'close' });
      return NextResponse.json({ success: true });
    }

    return new NextResponse("Invalid action", { status: 400 });
  } catch (e) {
    console.error(e);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
