import db from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";

export async function POST(req) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { monster_id, type, tempered, strength_rating, quest, remaining_uses } = await req.json();

    if (!monster_id || !type || !quest || !strength_rating) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await db.execute({
      sql: "INSERT OR IGNORE INTO users(id, username, avatar_url) VALUES (?, ?, ?)",
      args: [session.user.id, session.user.name, session.user.image],
    });

    await db.execute({
      sql: `
        INSERT INTO crowns(user_id, monster_id, type, tempered, strength_rating, quest, remaining_uses) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        session.user.id,
        monster_id,
        type,
        tempered ? 1 : 0,
        strength_rating,
        quest,
        quest === "Investigation Quests" ? (remaining_uses || 3) : null
      ],
    });

    // Broadcast the update to all clients
    await pusherServer.trigger("public-channel", "crown_update", {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to add crown:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
