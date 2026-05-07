import db from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";
import { logServerError } from "@/lib/logger";

export async function PATCH(req, { params }) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

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
      mission_host_enabled,
    } = await req.json();

    const checkRes = await db.execute({
      sql: "SELECT user_id, investigation_id as old_investigation_id, pair_id as old_pair_id FROM crowns WHERE id = ?",
      args: [id],
    });

    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: "Crown not found" }, { status: 404 });
    }
    if (checkRes.rows[0].user_id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const oldInvestigationId = checkRes.rows[0].old_investigation_id ?? null;
    let resolvedInvestigationId = null;

    const hostEnabled =
      typeof mission_host_enabled === "boolean"
        ? mission_host_enabled
        : (investigation_monster_id !== undefined ? investigation_monster_id !== null && investigation_monster_id !== "" : oldInvestigationId !== null);

    if (!hostEnabled) {
      resolvedInvestigationId = null;
    } else if (quest === "Investigation Quests") {
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
    } else {
      const invMonsterId = investigation_monster_id || monster_id;
      const invRes = await db.execute({
        sql: "INSERT INTO investigations (user_id, monster_id, remaining_uses) VALUES (?, ?, NULL)",
        args: [session.user.id, invMonsterId],
      });
      resolvedInvestigationId = Number(invRes.lastInsertRowid);
    }

    const resolvedPairId = pair_id !== undefined ? (pair_id || null) : checkRes.rows[0].old_pair_id ?? null;

    if (monster_id === undefined) {
      await db.execute({
        sql: "UPDATE crowns SET pair_id = ? WHERE id = ?",
        args: [resolvedPairId, id],
      });
      await pusherServer.trigger("public-channel", "crown_update", {});
      return NextResponse.json({ success: true });
    }

    await db.execute({
      sql: `
        UPDATE crowns
        SET monster_id = ?, type = ?, tempered = ?, strength_rating = ?, quest = ?,
            remaining_uses = NULL, investigation_id = ?, pair_id = ?
        WHERE id = ?
      `,
      args: [
        monster_id,
        type,
        tempered ? 1 : 0,
        strength_rating,
        quest,
        resolvedInvestigationId,
        resolvedPairId,
        id,
      ],
    });

    if (oldInvestigationId && oldInvestigationId !== resolvedInvestigationId) {
      const stillLinked = await db.execute({
        sql: "SELECT COUNT(*) as c FROM crowns WHERE investigation_id = ?",
        args: [oldInvestigationId],
      });
      if ((stillLinked.rows[0]?.c ?? 1) === 0) {
        await db.execute({
          sql: "DELETE FROM investigations WHERE id = ?",
          args: [oldInvestigationId],
        });
      }
    }

    await pusherServer.trigger("public-channel", "crown_update", {});

    return NextResponse.json({ success: true });
  } catch (error) {
    logServerError("Failed to update crown:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const checkRes = await db.execute({
      sql: "SELECT user_id, investigation_id FROM crowns WHERE id = ?",
      args: [id],
    });

    if (checkRes.rows.length === 0) {
      return NextResponse.json({ error: "Crown not found" }, { status: 404 });
    }
    if (checkRes.rows[0].user_id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const investigationId = checkRes.rows[0].investigation_id ?? null;

    await db.execute({
      sql: "UPDATE web_notifications SET crown_id = NULL WHERE crown_id = ?",
      args: [id],
    });

    await db.execute({
      sql: "DELETE FROM crowns WHERE id = ?",
      args: [id],
    });

    if (investigationId) {
      const stillLinked = await db.execute({
        sql: "SELECT COUNT(*) as c FROM crowns WHERE investigation_id = ?",
        args: [investigationId],
      });
      if ((stillLinked.rows[0]?.c ?? 1) === 0) {
        await db.execute({
          sql: "DELETE FROM investigations WHERE id = ?",
          args: [investigationId],
        });
      }
    }

    await pusherServer.trigger("public-channel", "crown_update", {});

    return NextResponse.json({ success: true });
  } catch (error) {
    logServerError("Failed to delete crown:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
