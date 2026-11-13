import { z } from "zod";
import { QUEST_TYPES } from "@/config/quests";
import { SIZE_LABELS } from "@/config/sizes";

export const positiveId = z.coerce.number().int().positive();

const flag = z
  .union([z.boolean(), z.literal(0), z.literal(1)])
  .transform((value) => value === true || value === 1);

const optionalId = z
  .union([positiveId, z.literal(""), z.null()])
  .transform((value) => (value === "" ? null : value))
  .optional();

const sizeInput = z.union([z.number(), z.string(), z.null()]).optional();

const sizeLabel = z
  .union([z.enum(SIZE_LABELS), z.literal(""), z.null()])
  .transform((value) => value || null)
  .optional();

export function normalizeSize(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const size = Number(value);
  if (!Number.isFinite(size) || size <= 0 || size >= 10000) return null;
  return Math.round(size * 100) / 100;
}

const crownFields = {
  monster_id: positiveId,
  type: z.enum(["small", "large"]),
  tempered: flag.optional().default(false),
  strength_rating: z.number().int().min(1).max(10),
  quest: z.enum(QUEST_TYPES),
  pair_id: z.string().max(64).nullable().optional(),
  investigation_id: optionalId,
  investigation_monster_id: optionalId,
  remaining_uses: z.number().int().min(1).max(99).nullable().optional(),
  size_cm: sizeInput,
  size_label: sizeLabel,
};

export const createCrownSchema = z.object(crownFields);

export const updateCrownSchema = z.union([
  z.object({ ...crownFields, mission_host_enabled: z.boolean().optional() }),
  z.object({ pair_id: z.string().max(64).nullable().optional() }),
]);

export const deployCrownSchema = z.object({ crownId: positiveId });

export const crownIdParams = z.object({ id: positiveId });

export type CreateCrownInput = z.infer<typeof createCrownSchema>;
export type UpdateCrownInput = z.infer<typeof updateCrownSchema>;
