import { NextResponse } from "next/server";
import { auth } from "@/server/auth";

export default auth(() => NextResponse.next());

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.png|icons|monsters).*)"],
};
