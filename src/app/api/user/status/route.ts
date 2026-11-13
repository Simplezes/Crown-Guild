import { ok, parseJson, withUser } from "@/server/http";
import { statusSchema } from "@/server/schemas/user";
import { updateStatus } from "@/server/services/settings";

export const POST = withUser("status", async ({ req, user }) => {
  const parsed = await parseJson(req, statusSchema);
  if ("response" in parsed) return parsed.response;
  await updateStatus(user.id, parsed.data.status_message);
  return ok();
});
