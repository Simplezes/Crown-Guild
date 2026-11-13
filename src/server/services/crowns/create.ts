import "server-only";
import { db, hasCrownSize, hasCrownSizeLabel } from "@/server/db";
import type { SessionUser } from "@/server/http";
import { failure, success, type Result } from "@/server/result";
import { normalizeSize, type CreateCrownInput } from "@/server/schemas/crowns";
import { archiveCrown, diffRankUp, getMasteryPoints, type RankUp } from "../archive";
import { createInvestigation, ownsInvestigation } from "../investigations";

async function resolveInvestigation(
  user: SessionUser,
  input: CreateCrownInput,
): Promise<Result<number | null>> {
  if (input.quest === "Investigation Quests") {
    if (input.investigation_id) {
      if (!(await ownsInvestigation(input.investigation_id, user.id))) {
        return failure(404, "Investigation not found");
      }
      return success(input.investigation_id);
    }
    const monsterId = input.investigation_monster_id || input.monster_id;
    return success(await createInvestigation(user.id, monsterId, input.remaining_uses || 3));
  }
  if (input.investigation_monster_id) {
    return success(await createInvestigation(user.id, input.investigation_monster_id, null));
  }
  return success(null);
}

export async function createCrown(
  user: SessionUser,
  input: CreateCrownInput,
): Promise<Result<{ mp: number; rankUp: RankUp | null }>> {
  await db.execute({
    sql: "INSERT OR IGNORE INTO users(id, username, avatar_url) VALUES (?, ?, ?)",
    args: [user.id, user.name, user.image],
  });

  const investigation = await resolveInvestigation(user, input);
  if (!investigation.ok) return investigation;

  const size = normalizeSize(input.size_cm);
  const withSize = size !== null && (await hasCrownSize());
  const withLabel = !!input.size_label && (await hasCrownSizeLabel());

  const mpBefore = await getMasteryPoints(user.id);

  const columns = [
    "user_id",
    "monster_id",
    "type",
    "tempered",
    "strength_rating",
    "quest",
    "remaining_uses",
    "investigation_id",
    "pair_id",
  ];
  const args: (string | number | null)[] = [
    user.id,
    input.monster_id,
    input.type,
    input.tempered ? 1 : 0,
    input.strength_rating,
    input.quest,
    null,
    investigation.data,
    input.pair_id || null,
  ];
  if (withSize) {
    columns.push("size_cm");
    args.push(size);
  }
  if (withLabel) {
    columns.push("size_label");
    args.push(input.size_label ?? null);
  }

  await db.execute({
    sql: `INSERT INTO crowns(${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`,
    args,
  });

  await archiveCrown(user.id, input.monster_id, input.type, input.tempered);

  const mpAfter = await getMasteryPoints(user.id);
  return success({ mp: mpAfter, rankUp: diffRankUp(mpBefore, mpAfter) });
}
