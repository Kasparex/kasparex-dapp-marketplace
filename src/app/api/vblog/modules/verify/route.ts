import { NextRequest, NextResponse } from 'next/server';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { verifyVBlogModulePaymentSplit } from '@/lib/vblog/verifyArticleTx';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      payerAddress?: string;
      articleId?: string;
      moduleId?: 'premium_unlock' | 'tip_to_reveal_unlock' | 'tip_box';
      expectedAuthorAddress?: string;
      expectedAuthorKas?: number;
      expectedPlatformKas?: number;
      authorTxHash?: string;
      platformTxHash?: string;
    };
    const authorTxHash = extractKaspaTransactionId(body.authorTxHash ?? '') ?? '';
    const platformTxHash = extractKaspaTransactionId(body.platformTxHash ?? '') ?? '';
    if (
      !body.payerAddress ||
      !body.articleId ||
      !body.moduleId ||
      !body.expectedAuthorAddress ||
      !Number.isFinite(Number(body.expectedAuthorKas)) ||
      !Number.isFinite(Number(body.expectedPlatformKas)) ||
      !authorTxHash ||
      !platformTxHash
    ) {
      return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 });
    }

    const result = await verifyVBlogModulePaymentSplit({
      payerAddress: body.payerAddress,
      articleId: body.articleId,
      moduleId: body.moduleId,
      expectedAuthorAddress: body.expectedAuthorAddress,
      expectedAuthorKas: Number(body.expectedAuthorKas),
      expectedPlatformKas: Number(body.expectedPlatformKas),
      authorTxHash,
      platformTxHash,
    });
    if (!result.ok) return NextResponse.json(result, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
}
