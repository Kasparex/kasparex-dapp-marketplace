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
      wrap: 'KRC-20 KREX → vault deposit → KCC20 mint (1:1)',
      unwrap: config.unwrapEnabled
        ? 'KCC20 burn → KRC-20 release from vault'
        : 'Disabled until two-way vault release is production-ready',
    },
  });
}
