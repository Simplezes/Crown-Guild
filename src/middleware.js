import { NextResponse } from 'next/server';

export function middleware(request) {
  const url = request.nextUrl;
  const userAgent = request.headers.get('user-agent') || '';
  const isDiscordBot = userAgent.toLowerCase().includes('discordbot');

  if (isDiscordBot) {
    if (
      url.pathname.startsWith('/profile/') ||
      url.pathname.startsWith('/monster/') ||
      url.pathname.startsWith('/quest/')
    ) {
      if (!url.pathname.endsWith('/og')) {
        const newUrl = new URL(`${url.pathname}/og`, url.origin);
        for (const [key, value] of url.searchParams) {
          newUrl.searchParams.append(key, value);
        }
        return NextResponse.rewrite(newUrl);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/profile/:path*', '/monster/:path*', '/quest/:path*'],
};
