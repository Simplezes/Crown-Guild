import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { QUEST_SYSTEM_ENABLED } from "@/lib/sos";

const SITE_VISIBLE = process.env.NODE_ENV !== "production" || QUEST_SYSTEM_ENABLED;

export default auth((req) => {
  if (!SITE_VISIBLE) {
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.png|icons|monsters).*)"],
};
