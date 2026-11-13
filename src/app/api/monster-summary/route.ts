import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { jsonError } from "@/server/http";
import { logServerError } from "@/server/logger";
import { getMonsterByName } from "@/server/services/monsters";
import { getMonsterSummary } from "@/server/services/monster-summary";

export async function GET(req: Request) {
  const name = new URL(req.url).searchParams.get("name");
  if (!name || name.length > 80) return jsonError("Not found", 404);

  try {
    const monster = await getMonsterByName(name);
    if (!monster) return jsonError("Not found", 404);
    const session = await auth();
    return NextResponse.json(await getMonsterSummary(monster, session?.user?.id ?? null));
  } catch (error) {
    logServerError("monster-summary failed", error);
    return jsonError("Internal Error", 500);
  }
}
