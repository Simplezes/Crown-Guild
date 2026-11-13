import { fromResult, parseJson, withUser } from "@/server/http";
import { createCrownSchema } from "@/server/schemas/crowns";
import { createCrown } from "@/server/services/crowns/create";

export const POST = withUser("crown", async ({ req, user }) => {
  const parsed = await parseJson(req, createCrownSchema);
  if ("response" in parsed) return parsed.response;
  return fromResult(await createCrown(user, parsed.data));
});
