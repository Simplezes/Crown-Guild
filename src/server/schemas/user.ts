import { z } from "zod";
import { positiveId } from "./crowns";

const listingType = z.enum(["small", "large", "both"]);

export const listingSchema = z.object({
  monsterId: positiveId,
  type: listingType.nullish(),
});

export const listingRemoveSchema = z.object({ monsterId: positiveId });

const questPassword = z
  .union([z.string(), z.null()])
  .transform((value) => (value ?? "").trim())
  .refine((value) => value === "" || /^\d{4}$/.test(value), {
    message: "Quest password must be exactly 4 digits.",
  });

export const settingsSchema = z.object({
  lobby_id: z.string().max(64, "Lobby ID too long (max 64 characters)").optional(),
  quest_password: questPassword.optional(),
  status_message: z.string().max(200, "Status message too long (max 200 characters)").optional(),
  receive_dms: z
    .union([z.boolean(), z.literal(0), z.literal(1)])
    .transform((value) => value === true || value === 1)
    .optional(),
  share_url: z.boolean().optional(),
});

export const statusSchema = z.object({
  status_message: z.string().max(200, "Status message too long (max 200 characters)"),
});

export const compareQuerySchema = z.object({
  a: z.string().min(1).max(32),
  b: z.string().min(1).max(32),
});

export const userSearchSchema = z.object({
  q: z.string().trim().max(64).default(""),
  exclude: z.string().trim().max(32).default(""),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce
    .number()
    .int()
    .default(12)
    .transform((value) => Math.min(30, Math.max(5, value))),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
