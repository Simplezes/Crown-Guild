import { NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "@/auth";
import { checkRateLimit } from "@/lib/ratelimit";
import { pusherServer } from "@/lib/pusher";
import { logServerError } from "@/lib/logger";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitRes = await checkRateLimit("crown", session.user.id);
    if (rateLimitRes) return rateLimitRes;

    const { crownId } = await request.json();
    const parsedCrownId = Number.parseInt(String(crownId), 10);

    if (!Number.isFinite(parsedCrownId) || parsedCrownId <= 0) {
      return NextResponse.json({ error: "Invalid crown id" }, { status: 400 });
    }

    const sourceRes = await db.execute({
      sql: `
        SELECT
          c.id,
          c.user_id AS host_id,
          c.monster_id,
          c.type,
          c.tempered,
          c.strength_rating,
          c.quest,
          c.remaining_uses,
          c.investigation_id,
          inv.id AS inv_id,
          COALESCE(inv.remaining_uses, c.remaining_uses) AS effective_uses
        FROM crowns c
        LEFT JOIN investigations inv ON c.investigation_id = inv.id
        WHERE c.id = ?
        LIMIT 1
      `,
      args: [parsedCrownId],
    });

    if (sourceRes.rows.length === 0) {
      return NextResponse.json({ error: "Crown not found" }, { status: 404 });
    }

    const source = sourceRes.rows[0];

    const isHostDeploy = String(source.host_id) === String(session.user.id);

    if (source.quest === "Investigation Quests" && source.effective_uses !== null && Number(source.effective_uses) <= 0) {
      return NextResponse.json({ error: "This investigation is out of uses." }, { status: 400 });
    }

    if (isHostDeploy && (source.quest !== "Investigation Quests" || source.effective_uses === null)) {
      return NextResponse.json({ error: "Only investigation crowns can be deployed by the host." }, { status: 400 });
    }

    if (!isHostDeploy) {
      const duplicateRes = await db.execute({
        sql: `
          SELECT id
          FROM crowns
          WHERE user_id = ?
            AND monster_id = ?
            AND type = ?
            AND tempered = ?
            AND strength_rating = ?
          LIMIT 1
        `,
        args: [
          session.user.id,
          source.monster_id,
          source.type,
          source.tempered,
          source.strength_rating,
        ],
      });

      if (duplicateRes.rows.length > 0) {
        return NextResponse.json(
          { error: "You already have this crown in your record." },
          { status: 409 }
        );
      }

      await db.execute({
        sql: "INSERT OR IGNORE INTO users(id, username, avatar_url) VALUES (?, ?, ?)",
        args: [session.user.id, session.user.name, session.user.image],
      });

      await db.execute({
        sql: `
          INSERT INTO crowns(user_id, monster_id, type, tempered, strength_rating, quest, remaining_uses, investigation_id, pair_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        args: [
          session.user.id,
          source.monster_id,
          source.type,
          source.tempered ? 1 : 0,
          source.strength_rating,
          source.quest || "Hunt",
          null,
          null,
          null,
        ],
      });

      await db.execute({
        sql: "INSERT OR IGNORE INTO guild_archive (user_id, monster_id, type) VALUES (?, ?, ?)",
        args: [session.user.id, source.monster_id, source.type],
      });
    }

    if (source.quest === "Investigation Quests" && source.effective_uses !== null) {
      const nextUses = Number(source.effective_uses) - 1;

      if (nextUses <= 0) {
        await db.execute({
          sql: "UPDATE web_notifications SET crown_id = NULL WHERE crown_id = ?",
          args: [source.id],
        });
        await db.execute({ sql: "DELETE FROM crowns WHERE id = ?", args: [source.id] });
        if (source.inv_id) {
          await db.execute({ sql: "DELETE FROM investigations WHERE id = ?", args: [source.inv_id] });
        }
      } else if (source.inv_id) {
        await db.execute({
          sql: "UPDATE investigations SET remaining_uses = ? WHERE id = ?",
          args: [nextUses, source.inv_id],
        });
      } else {
        await db.execute({
          sql: "UPDATE crowns SET remaining_uses = ? WHERE id = ?",
          args: [nextUses, source.id],
        });
      }
    }

    await pusherServer.trigger("public-channel", "crown_update", {});

    return NextResponse.json({ success: true, mode: isHostDeploy ? "host" : "hunter" });
  } catch (error) {
    logServerError("Deploy crown error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
