import "server-only";
import { db, firstRow, hasCrownSize, hasCrownSizeLabel } from "@/server/db";
import type { SessionUser } from "@/server/http";
import { failure, success, type Result } from "@/server/result";
import { normalizeSize, type UpdateCrownInput } from "@/server/schemas/crowns";
import { archiveCrown } from "../archive";
import { createInvestigation, deleteIfOrphaned, ownsInvestigation } from "../investigations";

type FullUpdate = Extract<UpdateCrownInput, { monster_id: number }>;

interface ExistingCrown {
  user_id: string;
  old_investigation_id: number | null;
  old_pair_id: string | null;
}

async function resolveInvestigation(
  user: SessionUser,
  input: FullUpdate,
  oldInvestigationId: number | null,
): Promise<Result<number | null>> {
  const requestedHost =
    typeof input.mission_host_enabled === "boolean"
      ? input.mission_host_enabled
      : input.investigation_monster_id !== undefined
        ? input.investigation_monster_id !== null
        : oldInvestigationId !== null;

  const isInvestigation = input.quest === "Investigation Quests";
  if (!isInvestigation && !requestedHost) return success(null);

  const monsterId = input.investigation_monster_id || input.monster_id;
  if (!isInvestigation) return success(await createInvestigation(user.id, monsterId, null));

  if (input.investigation_id) {
    if (!(await ownsInvestigation(input.investigation_id, user.id))) {
      return failure(404, "Investigation not found");
    }
    return success(input.investigation_id);
  }
  return success(await createInvestigation(user.id, monsterId, input.remaining_uses || 3));
}

export async function updateCrown(
  user: SessionUser,
  crownId: number,
  input: UpdateCrownInput,
): Promise<Result<Record<string, never>>> {
  const existing = firstRow<ExistingCrown>(
    await db.execute({
      sql: `SELECT user_id, investigation_id AS old_investigation_id, pair_id AS old_pair_id
            FROM crowns WHERE id = ?`,
      args: [crownId],
    }),
  );
  if (!existing) return failure(404, "Crown not found");
  if (existing.user_id !== user.id) return failure(403, "Forbidden");

  if (!("monster_id" in input)) {
    const pairId = input.pair_id !== undefined ? input.pair_id || null : existing.old_pair_id;
    await db.execute({
      sql: "UPDATE crowns SET pair_id = ? WHERE id = ?",
      args: [pairId, crownId],
    });
    return success({});
  }

  const investigation = await resolveInvestigation(user, input, existing.old_investigation_id);
  if (!investigation.ok) return investigation;

  const pairId = input.pair_id !== undefined ? input.pair_id || null : existing.old_pair_id;
  const assignments = [
    "monster_id = ?",
    "type = ?",
    "tempered = ?",
    "strength_rating = ?",
    "quest = ?",
    "remaining_uses = NULL",
    "investigation_id = ?",
    "pair_id = ?",
  ];
  const args: (string | number | null)[] = [
    input.monster_id,
    input.type,
    input.tempered ? 1 : 0,
    input.strength_rating,
    input.quest,
    investigation.data,
    pairId,
  ];

  if (input.size_cm !== undefined && (await hasCrownSize())) {
    assignments.push("size_cm = ?");
    args.push(normalizeSize(input.size_cm));
  }
  if (input.size_label !== undefined && (await hasCrownSizeLabel())) {
    assignments.push("size_label = ?");
    args.push(input.size_label ?? null);
  }

  await db.execute({
    sql: `UPDATE crowns SET ${assignments.join(", ")} WHERE id = ?`,
    args: [...args, crownId],
  });

  await archiveCrown(user.id, input.monster_id, input.type, input.tempered);

  const old = existing.old_investigation_id;
  if (old && old !== investigation.data) await deleteIfOrphaned(old);

  return success({});
}
