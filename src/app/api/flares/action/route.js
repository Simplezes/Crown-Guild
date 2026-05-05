import db from "@/lib/db";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher";
import { randomUUID } from "crypto";

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { action, flareId } = await req.json();
    const userId = session.user.id;

    if (action === 'join') {
      const countRes = await db.execute({
        sql: "SELECT COUNT(*) as count FROM active_flare_queue WHERE flare_id = ?",
        args: [flareId]
      });
      if (Number(countRes.rows[0].count) >= 4) {
        return new NextResponse("This party is already full (4/4 hunters).", { status: 400 });
      }
      await db.execute({
        sql: "INSERT OR IGNORE INTO active_flare_queue (flare_id, user_id) VALUES (?, ?)",
        args: [flareId, userId]
      });
      await pusherServer.trigger("public-channel", "flare_updated", { type: 'join', flareId });
      return NextResponse.json({ success: true });
    }

    if (action === 'leave') {
      await db.execute({
        sql: "DELETE FROM active_flare_queue WHERE flare_id = ? AND user_id = ?",
        args: [flareId, userId]
      });
      await pusherServer.trigger("public-channel", "flare_updated", { type: 'leave', flareId });
      return NextResponse.json({ success: true });
    }

    if (action === 'close') {
      const flareRes = await db.execute({
        sql: "SELECT host_id, discord_message_id, discord_channel_id FROM active_flares WHERE id = ?",
        args: [flareId]
      });

      if (flareRes.rows[0]?.host_id !== userId) {
        return new NextResponse("Only the host can close the flare.", { status: 403 });
      }

      const { discord_message_id, discord_channel_id } = flareRes.rows[0];

      await db.execute({
        sql: "DELETE FROM active_flares WHERE id = ?",
        args: [flareId]
      });
      await pusherServer.trigger("public-channel", "flare_updated", {
        type: 'close',
        discordMessageId: discord_message_id,
        discordChannelId: discord_channel_id,
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'start') {
      const flareRes = await db.execute({
        sql: `SELECT f.*, u.username as host_name, m.name as monster_name, m.emoji as monster_emoji
              FROM active_flares f
              JOIN users u ON f.host_id = u.id
              JOIN monsters m ON f.monster_id = m.id
              WHERE f.id = ?`,
        args: [flareId]
      });

      if (!flareRes.rows[0]) {
        return new NextResponse("Flare not found.", { status: 404 });
      }
      if (flareRes.rows[0].host_id !== userId) {
        return new NextResponse("Only the host can start the quest.", { status: 403 });
      }

      const flare = flareRes.rows[0];
      const queueRes = await db.execute({
        sql: "SELECT fq.user_id, u.username FROM active_flare_queue fq JOIN users u ON fq.user_id = u.id WHERE fq.flare_id = ? ORDER BY fq.created_at ASC LIMIT 4",
        args: [flareId]
      });

      const groupId = randomUUID();

      for (const { user_id: hunterId } of queueRes.rows) {
        const missionCheck = await db.execute({
          sql: "SELECT 1 FROM active_missions WHERE requester_id = ?",
          args: [hunterId]
        });
        if (missionCheck.rows.length > 0) continue;

        await db.execute({ sql: "INSERT OR IGNORE INTO users(id) VALUES (?)", args: [hunterId] });
        await db.execute({
          sql: "INSERT INTO active_missions (host_id, requester_id, monster_id, type, tempered, strength_rating, group_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
          args: [userId, hunterId, flare.monster_id, flare.type, flare.tempered, flare.strength_rating, groupId]
        });
        await db.execute({
          sql: "UPDATE web_notifications SET status = 'cancelled' WHERE user_id = ? AND status IN ('pending', 'sent') AND type IN ('sos_flare', 'beacon')",
          args: [hunterId]
        });
        await db.execute({
          sql: `INSERT INTO web_notifications (user_id, host_id, recipient_id, type, monster_id, crown_id, status)
                VALUES (?, ?, ?, 'hunt_accepted', ?, (SELECT id FROM crowns WHERE user_id = ? AND monster_id = ? AND type = ? LIMIT 1), 'pending')`,
          args: [hunterId, userId, hunterId, flare.monster_id, userId, flare.monster_id, flare.type]
        });
        await pusherServer.trigger("public-channel", "notification", {
          type: 'hunt_accepted',
          recipient_id: hunterId
        });
      }

      await db.execute({ sql: "DELETE FROM active_flares WHERE id = ?", args: [flareId] });
      await pusherServer.trigger("public-channel", "flare_updated", {
        type: 'started',
        discordMessageId: flare.discord_message_id,
        discordChannelId: flare.discord_channel_id,
        monsterName: flare.monster_name,
        monsterEmoji: flare.monster_emoji,
        tempered: !!flare.tempered,
        crownType: flare.type,
        strengthRating: flare.strength_rating,
        sessionId: flare.session_id,
        hostName: flare.host_name,
        hunters: queueRes.rows.map(r => r.username),
      });
      await pusherServer.trigger("public-channel", "mission_update", {});
      await pusherServer.trigger("public-channel", "notification_updated", {});
      return NextResponse.json({ success: true });
    }

    return new NextResponse("Invalid action", { status: 400 });
  } catch (e) {
    console.error(e);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
