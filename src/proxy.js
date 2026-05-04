import { withAuth } from "next-auth/middleware";

export const proxy = withAuth(function proxy(req) {
});

export default proxy;

export const config = {
  matcher: ["/registry/:path*"],
};
