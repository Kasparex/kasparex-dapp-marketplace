import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rewriteRootPathForHost } from '@/lib/config/subdomainRootRewrites';
import { recordEdgeHit } from '@/lib/usage/recordEdgeHit';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.split(':')[0]?.toLowerCase();
  if (!host) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/api/')) {
    // Best-effort: small sampled telemetry for detecting spikes.
    // Must never block requests.
    recordEdgeHit(request).catch(() => {});
    return NextResponse.next();
  }

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
    '/',
    '/api/:path*',
  ],
};
