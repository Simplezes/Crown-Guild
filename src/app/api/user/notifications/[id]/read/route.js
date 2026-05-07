import { NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "@/auth";
import { logServerError } from "@/lib/logger";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db.execute({
      sql: "UPDATE web_notifications SET status = 'read' WHERE id = ? AND recipient_id = ?",
      args: [id, session.user.id]
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logServerError("Error marking notification as read:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
