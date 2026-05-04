import { auth } from "@/auth";

export const proxy = auth;

export default proxy;

export const config = {
  matcher: ["/registry/:path*"],
};
