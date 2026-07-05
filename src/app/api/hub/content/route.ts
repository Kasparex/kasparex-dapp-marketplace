import { NextRequest, NextResponse } from 'next/server';
import {
  deleteHubContentItem,
  getCachedHubContentRegistry,
  registerHubContentInMemory,
  removeHubContentFromMemory,
  upsertHubContentItem,
} from '@/lib/hub/contentRegistry';
import { HUB_CONTENT_KINDS, type HubContentKind, type HubContentSyncBody } from '@/lib/hub/contentTypes';

export const dynamic = 'force-dynamic';

function isValidKind(value: string): value is HubContentKind {
  return HUB_CONTENT_KINDS.includes(value as HubContentKind);
}

export async function GET(request: NextRequest) {
  if (process.env.CF_PAGES) {
    return NextResponse.json({ ok: false, error: 'Not available in static export' }, { status: 503 });
  }

  try {
    const kind = request.nextUrl.searchParams.get('kind')?.trim();
    const registry = await getCachedHubContentRegistry();

    if (kind && isValidKind(kind)) {
      return NextResponse.json(
        { ok: true, kind, items: registry[kind], updatedAt: registry.updatedAt },
        { headers: { 'Cache-Control': 'private, no-cache, no-store, must-revalidate' } },
      );
    }

    return NextResponse.json(
      { ok: true, registry },
      { headers: { 'Cache-Control': 'private, no-cache, no-store, must-revalidate' } },
    );
  } catch (e) {
    console.error('[hub/content GET]', e);
    return NextResponse.json({ ok: false, error: 'Failed to load hub content' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (process.env.CF_PAGES) {
    return NextResponse.json({ ok: false, error: 'Not available in static export' }, { status: 503 });
  }

  try {
    const body = (await request.json()) as HubContentSyncBody;
    const kind = body.kind;
    const op = body.op;

    if (!kind || !isValidKind(kind)) {
      return NextResponse.json({ ok: false, error: 'Invalid content kind' }, { status: 400 });
    }
    if (op !== 'upsert' && op !== 'delete') {
      return NextResponse.json({ ok: false, error: 'Invalid op' }, { status: 400 });
    }

    if (op === 'delete') {
      const id = (body.id ?? '').trim();
      if (!id) {
        return NextResponse.json({ ok: false, error: 'id is required for delete' }, { status: 400 });
      }
      removeHubContentFromMemory(kind, id);
      const registry = await deleteHubContentItem(kind, id);
      return NextResponse.json({ ok: true, updatedAt: registry.updatedAt });
    }

    const item = body.item as { id?: string } | undefined;
    const id = (item?.id ?? '').trim();
    if (!item || !id) {
      return NextResponse.json({ ok: false, error: 'item with id is required for upsert' }, { status: 400 });
    }

    registerHubContentInMemory(kind, item as { id: string });
    const registry = await upsertHubContentItem(kind, item as { id: string });
    return NextResponse.json({ ok: true, updatedAt: registry.updatedAt });
  } catch (e) {
    console.error('[hub/content POST]', e);
    return NextResponse.json({ ok: false, error: 'Sync failed' }, { status: 500 });
  }
}
