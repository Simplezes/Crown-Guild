import { NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "@/auth";
import { logServerError } from "@/lib/logger";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type } = await request.json();

    let sql = "UPDATE web_notifications SET status = 'read' WHERE recipient_id = ? AND status IN ('sent', 'pending')";
    let args = [session.user.id];

    if (type) {
      sql += " AND type = ?";
      args.push(type);
    }

    await db.execute({ sql, args });

    return NextResponse.json({ success: true });
  } catch (error) {
    logServerError("Error marking all as read:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
