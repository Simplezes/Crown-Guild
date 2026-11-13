import { NextResponse } from "next/server";
import { jsonError, parseQuery } from "@/server/http";
import { logServerError } from "@/server/logger";
import { userSearchSchema } from "@/server/schemas/user";
import { searchUsers } from "@/server/services/compare";

export async function GET(req: Request) {
  const parsed = parseQuery(req, userSearchSchema);
  if ("response" in parsed) return parsed.response;

  const { q, exclude, page, limit } = parsed.data;
  try {
    return NextResponse.json(await searchUsers(q, exclude, page, limit));
  } catch (error) {
    logServerError("Failed to fetch users for compare picker", error);
    return jsonError("Internal Server Error", 500);
  }
}
