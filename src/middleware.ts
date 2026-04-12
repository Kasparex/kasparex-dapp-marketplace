import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rewriteRootPathForHost } from '@/lib/config/subdomainRootRewrites';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.split(':')[0]?.toLowerCase();
  if (!host) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (pathname !== '/' && pathname !== '') {
    return NextResponse.next();
  }

  const targetPath = rewriteRootPathForHost(host);
  if (targetPath === null || targetPath === '/') {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = targetPath;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)',
  ],
};
