import { NextRequest, NextResponse } from 'next/server';
import { workerUpstreamBase } from '@/lib/api/workerBaseUrl';

type RouteContext = { params: Promise<{ path?: string[] }> };

async function proxyToWorker(request: NextRequest, pathSegments: string[] | undefined): Promise<NextResponse> {
  if (process.env.CF_PAGES) {
    return NextResponse.json({ error: 'Worker proxy not available in static export' }, { status: 503 });
  }

  const upstreamBase = workerUpstreamBase();
  const suffix = pathSegments?.length ? `/${pathSegments.join('/')}` : '';
  const url = new URL(request.url);
  const target = `${upstreamBase}${suffix}${url.search}`;

  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);
  const accept = request.headers.get('accept');
  if (accept) headers.set('Accept', accept);

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: 'no-store',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.text();
  }

  try {
    const upstream = await fetch(target, init);
    const body = await upstream.text();
    const responseHeaders = new Headers();
    const upstreamType = upstream.headers.get('content-type');
    if (upstreamType) responseHeaders.set('Content-Type', upstreamType);
    responseHeaders.set('Cache-Control', 'no-store');

    return new NextResponse(body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Worker proxy fetch failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        target,
      },
      { status: 502 },
    );
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyToWorker(request, path);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyToWorker(request, path);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyToWorker(request, path);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyToWorker(request, path);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: 'GET, POST, PUT, DELETE, OPTIONS',
    },
  });
}
