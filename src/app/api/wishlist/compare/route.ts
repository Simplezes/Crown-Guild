import { NextResponse } from "next/server";
import { jsonError, parseQuery } from "@/server/http";
import { logServerError } from "@/server/logger";
import { compareQuerySchema } from "@/server/schemas/user";
import { compareWishlists } from "@/server/services/compare";

export async function GET(req: Request) {
  const parsed = parseQuery(req, compareQuerySchema);
  if ("response" in parsed) return parsed.response;

  try {
    return NextResponse.json(await compareWishlists(parsed.data.a, parsed.data.b));
  } catch (error) {
    logServerError("Wishlist compare failed", error);
    return jsonError("Internal Error", 500);
  }
}
