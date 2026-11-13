import { fromResult, jsonError, withUser } from "@/server/http";
import { crownIdParams } from "@/server/schemas/crowns";
import { consumeInvestigationUse } from "@/server/services/investigations";

export const PATCH = withUser<{ id: string }>("crown", async ({ user, params }) => {
  const id = crownIdParams.safeParse(params);
  if (!id.success) return jsonError("Invalid investigation id", 400);
  return fromResult(await consumeInvestigationUse(id.data.id, user.id));
});
