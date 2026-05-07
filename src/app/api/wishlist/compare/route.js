import db from "@/lib/db";
import { NextResponse } from "next/server";
import { logServerError } from "@/lib/logger";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const a = searchParams.get("a");
  const b = searchParams.get("b");

  if (!a || !b) {
    return new NextResponse("Missing user IDs", { status: 400 });
  }

  try {
    const [usersRes, resA, resB] = await Promise.all([
      db.execute({
        sql: "SELECT id, username, avatar_url FROM users WHERE id IN (?, ?)",
        args: [a, b],
      }),
      db.execute({
        sql: `SELECT w.monster_id, w.type, w.tempered, m.name as monster_name, m.image_name
              FROM wishlist w JOIN monsters m ON w.monster_id = m.id
              WHERE w.user_id = ? ORDER BY m.name ASC`,
        args: [a],
      }),
      db.execute({
        sql: `SELECT w.monster_id, w.type, w.tempered, m.name as monster_name, m.image_name
              FROM wishlist w JOIN monsters m ON w.monster_id = m.id
              WHERE w.user_id = ? ORDER BY m.name ASC`,
        args: [b],
      }),
    ]);

    const userA = usersRes.rows.find((u) => u.id === a) || { id: a, username: "Unknown Hunter" };
    const userB = usersRes.rows.find((u) => u.id === b) || { id: b, username: "Unknown Hunter" };

    const mapA = new Map(resA.rows.map((r) => [r.monster_id, r]));
    const mapB = new Map(resB.rows.map((r) => [r.monster_id, r]));

    const both = resA.rows.filter((r) => mapB.has(r.monster_id));
    const onlyA = resA.rows.filter((r) => !mapB.has(r.monster_id));
    const onlyB = resB.rows.filter((r) => !mapA.has(r.monster_id));

    return NextResponse.json({ userA, userB, both, onlyA, onlyB });
  } catch (e) {
    logServerError("Wishlist compare error", e);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
