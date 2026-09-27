import { NextResponse } from "next/server";
import db from "@/lib/db";
import { auth } from "@/auth";
import { getMonsterByName } from "@/lib/monsters";

export async function GET(req) {
  const name = new URL(req.url).searchParams.get("name");
  const monster = name ? await getMonsterByName(name) : null;
  if (!monster) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const session = await auth();
  const uid = session?.user?.id;
  try {
    const [counts, demand, hosts, mine, wish] = await Promise.all([
      db.execute({ sql: "SELECT type, COUNT(*) AS c FROM crowns WHERE monster_id = ? GROUP BY type", args: [monster.id] }),
      db.execute({ sql: "SELECT COUNT(*) AS c FROM wishlist WHERE monster_id = ?", args: [monster.id] }),
      db.execute({
        sql: `SELECT c.type, c.tempered, c.strength_rating, c.quest, inv.remaining_uses, u.id AS user_id, u.username, u.avatar_url
              FROM crowns c JOIN users u ON u.id = c.user_id
              LEFT JOIN investigations inv ON inv.id = c.investigation_id
              WHERE c.monster_id = ? ORDER BY c.tempered DESC, c.strength_rating DESC LIMIT 3`,
        args: [monster.id],
      }),
      uid ? db.execute({ sql: "SELECT type, COUNT(*) AS c FROM crowns WHERE user_id = ? AND monster_id = ? GROUP BY type", args: [uid, monster.id] }) : null,
      uid ? db.execute({ sql: "SELECT type FROM wishlist WHERE user_id = ? AND monster_id = ? LIMIT 1", args: [uid, monster.id] }) : null,
    ]);
    const by = (rows, t) => Number(rows?.rows.find((r) => r.type === t)?.c || 0);
    return NextResponse.json({
      id: monster.id,
      name: monster.name,
      image_name: monster.image_name,
      type: monster.extraInfo?.type || "Monster",
      elements: monster.extraInfo?.elements || [],
      weakness: monster.extraInfo?.weakness || [],
      demand: Number(demand.rows[0]?.c || 0),
      hostCount: { small: by(counts, "small"), large: by(counts, "large") },
      mine: { s: by(mine, "small"), l: by(mine, "large") },
      wishlistType: wish?.rows[0]?.type || null,
      signedIn: !!uid,
      hosts: hosts.rows.map((r) => ({ ...r })),
    });
  } catch (e) {
    console.error("monster-summary", e);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
