import { auth } from "@/auth";
import db from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  try {
    const res = await db.execute({
      sql: "SELECT lobby_id, quest_password, receive_dms FROM users WHERE id = ?",
      args: [session.user.id]
    });

    if (res.rows.length === 0) {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    }

    return new Response(JSON.stringify(res.rows[0]), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}

export async function PUT(req) {
  const session = await auth();
  if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  try {
    const body = await req.json();
    const { lobby_id, quest_password, receive_dms } = body;

    if (lobby_id && lobby_id.length > 20) {
      return new Response(JSON.stringify({ error: "Lobby ID too long" }), { status: 400 });
    }
    if (quest_password && quest_password.length > 64) {
      return new Response(JSON.stringify({ error: "Quest password too long" }), { status: 400 });
    }

    await db.execute({
      sql: "UPDATE users SET lobby_id = ?, quest_password = ?, receive_dms = ? WHERE id = ?",
      args: [lobby_id || null, quest_password || null, receive_dms ? 1 : 0, session.user.id]
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}
export async function DELETE() {
  const session = await auth();
  if (!session) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const userId = session.user.id;

  try {
    await db.batch([
      { sql: "DELETE FROM web_notifications WHERE user_id = ? OR host_id = ? OR recipient_id = ?", args: [userId, userId, userId] },
      { sql: "DELETE FROM active_missions WHERE host_id = ? OR requester_id = ?", args: [userId, userId] },
      { sql: "DELETE FROM completed_missions WHERE host_id = ? OR requester_id = ?", args: [userId, userId] },
      { sql: "DELETE FROM crowns WHERE user_id = ?", args: [userId] },
      { sql: "DELETE FROM users WHERE id = ?", args: [userId] }
    ], "write");

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    console.error("Account deletion error:", e);
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
}
