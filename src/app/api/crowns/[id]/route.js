import db from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { monster_id, type, tempered, strength_rating, quest, remaining_uses } = await req.json();
    const checkRes = await db.execute({
      sql: "SELECT user_id FROM crowns WHERE id = ?",
      args: [id]
    });

    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: "Crown not found" }, { status: 404 });
    }

    if (checkRes.rows[0].user_id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.execute({
      sql: `
        UPDATE crowns 
        SET monster_id = ?, type = ?, tempered = ?, strength_rating = ?, quest = ?, remaining_uses = ?
        WHERE id = ?
      `,
      args: [
        monster_id,
        type,
        tempered ? 1 : 0,
        strength_rating,
        quest,
        quest === "Investigation Quests" ? remaining_uses : null,
        id
      ],
    });

    await pusherServer.trigger("public-channel", "crown_update", {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to update crown:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const checkRes = await db.execute({
      sql: "SELECT user_id FROM crowns WHERE id = ?",
      args: [id]
    });

    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: "Crown not found" }, { status: 404 });
    }

    if (checkRes.rows[0].user_id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.execute({
      sql: "UPDATE web_notifications SET crown_id = NULL WHERE crown_id = ?",
      args: [id]
    });

    await db.execute({
      sql: "DELETE FROM crowns WHERE id = ?",
      args: [id]
    });

    await pusherServer.trigger("public-channel", "crown_update", {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete crown:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

