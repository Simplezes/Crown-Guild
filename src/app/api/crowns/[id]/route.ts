import { fromResult, jsonError, parseJson, withUser } from "@/server/http";
import { crownIdParams, updateCrownSchema } from "@/server/schemas/crowns";
import { removeCrown } from "@/server/services/crowns/remove";
import { updateCrown } from "@/server/services/crowns/update";

export const PATCH = withUser<{ id: string }>("crown", async ({ req, user, params }) => {
  const id = crownIdParams.safeParse(params);
  if (!id.success) return jsonError("Invalid crown id", 400);
  const parsed = await parseJson(req, updateCrownSchema);
  if ("response" in parsed) return parsed.response;
  return fromResult(await updateCrown(user, id.data.id, parsed.data));
});

export const DELETE = withUser<{ id: string }>("crown", async ({ user, params }) => {
  const id = crownIdParams.safeParse(params);
  if (!id.success) return jsonError("Invalid crown id", 400);
  return fromResult(await removeCrown(user.id, id.data.id));
});
