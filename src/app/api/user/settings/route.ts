import { NextResponse } from "next/server";
import { jsonError, ok, parseJson, withUser } from "@/server/http";
import { settingsSchema } from "@/server/schemas/user";
import { deleteAccount, getSettings, updateSettings } from "@/server/services/settings";

export const GET = withUser(null, async ({ user }) => {
  const settings = await getSettings(user.id, user.name);
  return settings ? NextResponse.json(settings) : jsonError("Not found", 404);
});

const save = withUser("settings", async ({ req, user }) => {
  const parsed = await parseJson(req, settingsSchema);
  if ("response" in parsed) return parsed.response;
  await updateSettings(user.id, parsed.data);
  return ok();
});

export const POST = save;
export const PUT = save;

export const DELETE = withUser("account", async ({ user }) => {
  await deleteAccount(user.id);
  return ok();
});
