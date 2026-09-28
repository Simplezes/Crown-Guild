import db from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { logServerError } from "@/lib/logger";
import { checkRateLimit } from "@/lib/ratelimit";

export async function PATCH(req, { params }) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimitRes = await checkRateLimit("crown", session.user.id);
  if (rateLimitRes) return rateLimitRes;

  const { id } = await params;

  try {
    const checkRes = await db.execute({
      sql: "SELECT user_id, remaining_uses FROM investigations WHERE id = ?",
      args: [id],
    });

    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: "Investigation not found" }, { status: 404 });
    }
    if (checkRes.rows[0].user_id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (checkRes.rows[0].remaining_uses == null) {
      return NextResponse.json({ error: "This quest doesn't track uses" }, { status: 400 });
    }

    const next = Number(checkRes.rows[0].remaining_uses) - 1;

    if (next <= 0) {
      await db.execute({
        sql: "UPDATE web_notifications SET crown_id = NULL WHERE crown_id IN (SELECT id FROM crowns WHERE investigation_id = ?)",
        args: [id],
      });
      await db.execute({
        sql: "DELETE FROM crowns WHERE investigation_id = ?",
        args: [id],
      });
      await db.execute({
        sql: "DELETE FROM investigations WHERE id = ?",
        args: [id],
      });
      return NextResponse.json({ success: true, removed: true });
    }

    await db.execute({
      sql: "UPDATE investigations SET remaining_uses = ? WHERE id = ?",
      args: [next, id],
    });

    return NextResponse.json({ success: true, removed: false, remaining_uses: next });
  } catch (error) {
    logServerError("Failed to update investigation:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
