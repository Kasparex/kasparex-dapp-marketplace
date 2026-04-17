import { NextResponse } from 'next/server';
import { KPX_CM_RT_CODES_V1, KPX_MAX_BYTES, KPX_PROTOCOL, KPX_SEQ_MAX, KPX_SEQ_MIN, KPX_VERSION } from '@/lib/kpx/constants';

export async function GET() {
  return NextResponse.json({
    p: KPX_PROTOCOL,
    v: KPX_VERSION,
    seq: { min: KPX_SEQ_MIN, max: KPX_SEQ_MAX },
    maxBytes: KPX_MAX_BYTES,
    cm: { rtCodesV1: KPX_CM_RT_CODES_V1 },
    note: 'This endpoint describes the Kasparex reference implementation for kpx v1 parsing/limits.',
  });
}

