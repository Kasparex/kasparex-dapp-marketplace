import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Hostname that should show the games section at `/` (must match Vercel custom domain + optional env). */
function gamesHostname(): string {
  return (process.env.NEXT_PUBLIC_GAMES_DOMAIN || 'games.kasparex.com').toLowerCase();
}

export function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.split(':')[0]?.toLowerCase();
  if (!host || host !== gamesHostname()) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (pathname === '/' || pathname === '') {
    const url = request.nextUrl.clone();
    url.pathname = '/games';
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)',
  ],
};
