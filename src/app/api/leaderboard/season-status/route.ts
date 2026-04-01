import { NextRequest, NextResponse } from 'next/server';
import type { SeasonId } from '@/lib/leaderboard/seasons';
import { getSeasonMeta, setSeasonMeta } from '@/lib/leaderboard/snapshotStore';
import type { LeaderboardSeasonMeta, LeaderboardSeasonStatus } from '@/lib/leaderboard/seasonStatus';

function canWrite(req: NextRequest): boolean {
  const token = process.env.CHRONICLES_LEADERBOARD_ADMIN_TOKEN?.trim();
  if (!token) return false;
  return (req.headers.get('x-admin-token') ?? '').trim() === token;
}

export async function GET(req: NextRequest) {
  const season = (req.nextUrl.searchParams.get('season') ?? '').trim() as SeasonId;
  if (!season) return NextResponse.json({ ok: false, error: 'Missing season.' }, { status: 400 });
  const meta = await getSeasonMeta(season);
  return NextResponse.json({ ok: true, seasonMeta: meta ?? null });
}

export async function POST(req: NextRequest) {
  if (!canWrite(req)) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const body = (await req.json()) as {
    seasonId?: string;
    status?: LeaderboardSeasonStatus;
    rewardsTxRef?: string;
    note?: string;
  };
  const seasonId = (body.seasonId ?? '').trim() as SeasonId;
  if (!seasonId) return NextResponse.json({ ok: false, error: 'Missing seasonId.' }, { status: 400 });
  if (!body.status) return NextResponse.json({ ok: false, error: 'Missing status.' }, { status: 400 });

  const now = Date.now();
  const prev = await getSeasonMeta(seasonId);
  const next: LeaderboardSeasonMeta = {
    seasonId,
    status: body.status,
    snapshotPublishedAtMs: prev?.snapshotPublishedAtMs,
    rewardsSentAtMs: prev?.rewardsSentAtMs,
    rewardsConfirmedAtMs: prev?.rewardsConfirmedAtMs,
    rewardsTxRef: body.rewardsTxRef ?? prev?.rewardsTxRef,
    note: body.note ?? prev?.note,
    updatedAtMs: now,
  };
  if (body.status === 'snapshot_published') next.snapshotPublishedAtMs = prev?.snapshotPublishedAtMs ?? now;
  if (body.status === 'rewards_sent') next.rewardsSentAtMs = now;
  if (body.status === 'closed') next.rewardsConfirmedAtMs = now;

  await setSeasonMeta(next);
  return NextResponse.json({ ok: true, seasonMeta: next });
}
