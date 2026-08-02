import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/** Legacy Diamond Veins → ticket redeem. Cipher Vaults v3 refines Cipher Fragments from the Game Deck. */
export async function POST(_request: NextRequest) {
  return NextResponse.json(
    {
      error:
        'Cipher Vaults v3 no longer redeems Diamond Veins points into tickets. Clear levels for Cipher Fragments, then refine from the Game Deck.',
    },
    { status: 410 },
  );
}
