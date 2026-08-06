import { NextResponse } from 'next/server';
import { getKrexWrapPublicConfig } from '@/lib/krex/wrap/config';

export const runtime = 'edge';

/** Public wrap bridge config for UI and operators. */
export async function GET() {
  const config = getKrexWrapPublicConfig();
  return NextResponse.json({
    ok: true,
    ...config,
    directions: {
      wrap: config.migrateV2Enabled
        ? 'KRC-20 → keyless sink burn → attestor observe → KCC20 mint (1:1, one-way)'
        : 'KRC-20 → vault deposit → KCC20 mint (1:1)',
      unwrap: config.unwrapEnabled
        ? 'KCC20 burn → KRC-20 release from vault'
        : 'Disabled. v2 migrate is one-way by construction.',
    },
  });
}
