import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  buildAbsoluteSectionUrl,
  hostnameToSectionKey,
  isKasparexSectionHost,
  pathToSectionKey,
  rewriteRootPathForHost,
} from '@/lib/config/sectionHosts';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.split(':')[0]?.toLowerCase();
  if (!host) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;

  if (pathname === '/' || pathname === '') {
    const targetPath = rewriteRootPathForHost(host);
    if (targetPath === null || targetPath === '/') {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = targetPath;
    return NextResponse.rewrite(url);
  }

  if (isKasparexSectionHost(host)) {
    const pathSection = pathToSectionKey(pathname);
    const hostSection = hostnameToSectionKey(host);
    if (pathSection && hostSection && pathSection !== hostSection) {
      // Same-origin fetch/RSC to /api/* must stay on this host; only full document navigations move to api.*.
      if (pathname.startsWith('/api/')) {
        const fetchMode = request.headers.get('sec-fetch-mode');
        const fetchDest = request.headers.get('sec-fetch-dest');
        const isDocumentNavigation =
          fetchMode === 'navigate' || fetchDest === 'document';
        if (!isDocumentNavigation) {
          return NextResponse.next();
        }
      }
      const dest = buildAbsoluteSectionUrl(pathSection, pathname) + search;
      return NextResponse.redirect(dest);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)',
  ],
};
