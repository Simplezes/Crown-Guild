import db from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";
import { checkRateLimit } from "@/lib/ratelimit";

export async function POST(req) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimitRes = await checkRateLimit("crown", session.user.id);
  if (rateLimitRes) return rateLimitRes;

  try {
    const {
      monster_id,
      type,
      tempered,
      strength_rating,
      quest,
      pair_id,
      investigation_id,
      investigation_monster_id,
      remaining_uses,
    } = await req.json();

    if (!monster_id || !type || !quest || !strength_rating) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await db.execute({
      sql: "INSERT OR IGNORE INTO users(id, username, avatar_url) VALUES (?, ?, ?)",
      args: [session.user.id, session.user.name, session.user.image],
    });

    let resolvedInvestigationId = null;

    if (quest === "Investigation Quests") {
      if (investigation_id) {
        const check = await db.execute({
          sql: "SELECT id FROM investigations WHERE id = ? AND user_id = ?",
          args: [investigation_id, session.user.id],
        });
        if (check.rows.length === 0) {
          return NextResponse.json({ error: "Investigation not found" }, { status: 404 });
        }
        resolvedInvestigationId = investigation_id;
      } else {
        const invMonsterId = investigation_monster_id || monster_id;
        const uses = remaining_uses || 3;

        const invRes = await db.execute({
          sql: "INSERT INTO investigations (user_id, monster_id, remaining_uses) VALUES (?, ?, ?)",
          args: [session.user.id, invMonsterId, uses],
        });
        resolvedInvestigationId = Number(invRes.lastInsertRowid);
      }
    } else if (investigation_monster_id && String(investigation_monster_id) !== String(monster_id)) {
      const invRes = await db.execute({
        sql: "INSERT INTO investigations (user_id, monster_id, remaining_uses) VALUES (?, ?, NULL)",
        args: [session.user.id, investigation_monster_id],
      });
      resolvedInvestigationId = Number(invRes.lastInsertRowid);
    }

    await db.execute({
      sql: `
        INSERT INTO crowns(user_id, monster_id, type, tempered, strength_rating, quest, remaining_uses, investigation_id, pair_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        session.user.id,
        monster_id,
        type,
        tempered ? 1 : 0,
        strength_rating,
        quest,
        null,
        resolvedInvestigationId,
        pair_id || null,
      ],
    });

    await db.execute({
      sql: "INSERT OR IGNORE INTO guild_archive (user_id, monster_id, type) VALUES (?, ?, ?)",
      args: [session.user.id, monster_id, type]
    });

    await pusherServer.trigger("public-channel", "crown_update", {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to add crown:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
