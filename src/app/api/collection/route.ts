import { ok, parseJson, withUser } from "@/server/http";
import { listingRemoveSchema, listingSchema } from "@/server/schemas/user";
import { removeListing, setListing } from "@/server/services/listings";

export const POST = withUser("collection", async ({ req, user }) => {
  const parsed = await parseJson(req, listingSchema);
  if ("response" in parsed) return parsed.response;
  await setListing("hunter_collection", user.id, parsed.data.monsterId, parsed.data.type);
  return ok();
});

export const DELETE = withUser("collection", async ({ req, user }) => {
  const parsed = await parseJson(req, listingRemoveSchema);
  if ("response" in parsed) return parsed.response;
  await removeListing("hunter_collection", user.id, parsed.data.monsterId);
  return ok();
});
