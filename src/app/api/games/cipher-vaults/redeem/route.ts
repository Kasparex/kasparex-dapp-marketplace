import { NextRequest, NextResponse } from 'next/server';
import { getPlayerState as getDiamondVeinsPlayerState } from '@/lib/game/diamond-veins-server-store';
import { getCipherPlayerState, replaceCipherPlayerState } from '@/lib/game/cipher-vaults-server-store';
import { CIPHER_TICKET_REDEEM_RATE_POINTS } from '@/lib/game/cipher-vaults-config';

export const runtime = 'nodejs';

function isValidAddress(a: string): boolean {
  return /^kaspa:[a-z0-9]{60,70}$/i.test(a.trim());
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { address?: string; pointsToRedeem?: number };
    const address = body.address?.trim();
    if (!address || !isValidAddress(address)) {
      return NextResponse.json({ error: 'Missing or invalid address' }, { status: 400 });
    }
    const pointsReq = Math.floor(Number(body.pointsToRedeem ?? 0));
    if (!Number.isFinite(pointsReq) || pointsReq <= 0) {
      return NextResponse.json({ error: 'pointsToRedeem must be a positive integer' }, { status: 400 });
    }
    if (pointsReq % CIPHER_TICKET_REDEEM_RATE_POINTS !== 0) {
      return NextResponse.json({ error: `pointsToRedeem must be a multiple of ${CIPHER_TICKET_REDEEM_RATE_POINTS}` }, { status: 400 });
    }

    const dv = getDiamondVeinsPlayerState(address);
    const available = dv?.refinementPointsTotal ?? 0;
    if (available <= 0) {
      return NextResponse.json({ error: 'No Diamond Veins refinement points found for this address yet' }, { status: 404 });
    }

    const cipher = getCipherPlayerState(address);
    const alreadyRedeemed = cipher.redeemedRefinementPointsTotal ?? 0;
    const remaining = Math.max(0, available - alreadyRedeemed);
    if (pointsReq > remaining) {
      return NextResponse.json({ error: 'Not enough unredeemed refinement points' }, { status: 409 });
    }

    const next = {
      ...cipher,
      version: (cipher.version ?? 1) + 1,
      redeemedRefinementPointsTotal: alreadyRedeemed + pointsReq,
    };
    const saved = replaceCipherPlayerState(address, next);
    const ticketsTotal = Math.floor(saved.redeemedRefinementPointsTotal / CIPHER_TICKET_REDEEM_RATE_POINTS);
    const ticketsAvailable = Math.max(0, ticketsTotal - (saved.ticketsSpent ?? 0));
    return NextResponse.json({ ok: true, state: saved, ticketsTotal, ticketsAvailable, redeemedNow: pointsReq });
  } catch (e) {
    console.error('[cipher-vaults/redeem]', e);
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }
}

