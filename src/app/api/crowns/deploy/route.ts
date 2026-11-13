import { fromResult, parseJson, withUser } from "@/server/http";
import { deployCrownSchema } from "@/server/schemas/crowns";
import { deployCrown } from "@/server/services/crowns/deploy";

export const POST = withUser("crown", async ({ req, user }) => {
  const parsed = await parseJson(req, deployCrownSchema);
  if ("response" in parsed) return parsed.response;
  return fromResult(await deployCrown(user, parsed.data.crownId));
});
