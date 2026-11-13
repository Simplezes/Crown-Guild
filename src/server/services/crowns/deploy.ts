import "server-only";
import { db, firstRow } from "@/server/db";
import type { SessionUser } from "@/server/http";
import { failure, success, type Result } from "@/server/result";
import { archiveCrown, diffRankUp, getMasteryPoints, type RankUp } from "../archive";
import { deleteCrown } from "../investigations";

interface SourceCrown {
  id: number;
  host_id: string;
  monster_id: number;
  type: "small" | "large";
  tempered: number;
  strength_rating: number;
  quest: string | null;
  inv_id: number | null;
  effective_uses: number | null;
}

const INVESTIGATION = "Investigation Quests";

async function alreadyOwned(userId: string, source: SourceCrown): Promise<boolean> {
  const result = await db.execute({
    sql: `SELECT id FROM crowns
          WHERE user_id = ? AND monster_id = ? AND type = ? AND tempered = ? AND strength_rating = ?
          LIMIT 1`,
    args: [userId, source.monster_id, source.type, source.tempered, source.strength_rating],
  });
  return result.rows.length > 0;
}

async function copyToHunter(user: SessionUser, source: SourceCrown): Promise<void> {
  await db.execute({
    sql: "INSERT OR IGNORE INTO users(id, username, avatar_url) VALUES (?, ?, ?)",
    args: [user.id, user.name, user.image],
  });
  await db.execute({
    sql: `INSERT INTO crowns(user_id, monster_id, type, tempered, strength_rating, quest, remaining_uses, investigation_id, pair_id)
          VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, NULL)`,
    args: [
      user.id,
      source.monster_id,
      source.type,
      source.tempered ? 1 : 0,
      source.strength_rating,
      source.quest || "Hunt",
    ],
  });
  await archiveCrown(user.id, source.monster_id, source.type, !!source.tempered);
}

async function consumeUse(source: SourceCrown, uses: number): Promise<void> {
  const next = uses - 1;
  if (next <= 0) {
    await deleteCrown(source.id);
    if (source.inv_id) {
      await db.execute({ sql: "DELETE FROM investigations WHERE id = ?", args: [source.inv_id] });
    }
    return;
  }
  if (source.inv_id) {
    await db.execute({
      sql: "UPDATE investigations SET remaining_uses = ? WHERE id = ?",
      args: [next, source.inv_id],
    });
  } else {
    await db.execute({
      sql: "UPDATE crowns SET remaining_uses = ? WHERE id = ?",
      args: [next, source.id],
    });
  }
}

export async function deployCrown(
  user: SessionUser,
  crownId: number,
): Promise<Result<{ mode: "host" | "hunter"; rankUp: RankUp | null }>> {
  const source = firstRow<SourceCrown>(
    await db.execute({
      sql: `
        SELECT c.id, c.user_id AS host_id, c.monster_id, c.type, c.tempered, c.strength_rating,
               c.quest, inv.id AS inv_id,
               COALESCE(inv.remaining_uses, c.remaining_uses) AS effective_uses
        FROM crowns c
        LEFT JOIN investigations inv ON c.investigation_id = inv.id
        WHERE c.id = ?
        LIMIT 1
      `,
      args: [crownId],
    }),
  );
  if (!source) return failure(404, "Crown not found");

  const isInvestigation = source.quest === INVESTIGATION;
  const uses = source.effective_uses === null ? null : Number(source.effective_uses);
  const isHost = String(source.host_id) === user.id;

  if (isInvestigation && uses !== null && uses <= 0) {
    return failure(400, "This investigation is out of uses.");
  }
  if (isHost && (!isInvestigation || uses === null)) {
    return failure(400, "Only investigation crowns can be deployed by the host.");
  }

  let rankUp: RankUp | null = null;
  if (!isHost) {
    if (await alreadyOwned(user.id, source)) {
      return failure(409, "You already have this crown in your record.");
    }
    const before = await getMasteryPoints(user.id);
    await copyToHunter(user, source);
    rankUp = diffRankUp(before, await getMasteryPoints(user.id));
  }

  if (isInvestigation && uses !== null) await consumeUse(source, uses);

  return success({ mode: isHost ? "host" : "hunter", rankUp });
}
