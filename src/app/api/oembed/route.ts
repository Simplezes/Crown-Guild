import { NextResponse } from "next/server";
import { env } from "@/env";
import { jsonError } from "@/server/http";

function sameOriginUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.origin === new URL(env.NEXTAUTH_URL).origin ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const url = sameOriginUrl(new URL(req.url).searchParams.get("url"));
  if (!url) return jsonError("Invalid url parameter", 400);

  return NextResponse.json({
    type: "photo",
    version: "1.0",
    provider_name: "Crown Guild",
    provider_url: env.NEXTAUTH_URL,
    url,
    width: 1200,
    height: 630,
  });
}
