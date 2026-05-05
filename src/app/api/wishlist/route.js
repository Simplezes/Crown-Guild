import { auth } from "@/auth";
import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req) {
  const session = await auth();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const { monsterId, type } = await req.json();
    const userId = session.user.id;

    if (!type) {
      await db.execute({
        sql: "DELETE FROM wishlist WHERE user_id = ? AND monster_id = ?",
        args: [userId, monsterId]
      });
    } else {
      await db.execute({
        sql: "DELETE FROM wishlist WHERE user_id = ? AND monster_id = ?",
        args: [userId, monsterId]
      });

      await db.execute({
        sql: "INSERT INTO wishlist (user_id, monster_id, type, tempered) VALUES (?, ?, ?, 0)",
        args: [userId, monsterId, type]
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req) {
  const session = await auth();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  try {
    const { monsterId } = await req.json();
    const userId = session.user.id;

    await db.execute({
      sql: "DELETE FROM wishlist WHERE user_id = ? AND monster_id = ?",
      args: [userId, monsterId]
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
