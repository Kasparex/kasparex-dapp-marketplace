import { NextRequest, NextResponse } from 'next/server';
import { hasUserPurchased } from '@/lib/store/purchases';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId');
    const buyerAddress = searchParams.get('buyerAddress');

    if (!productId || !buyerAddress) {
      return NextResponse.json(
        { error: 'productId and buyerAddress are required' },
        { status: 400 }
      );
    }

    const hasAccess = await hasUserPurchased(productId, buyerAddress);

    return NextResponse.json({ hasAccess, verified: true });
  } catch (error) {
    console.error('Failed to verify purchase:', error);
    return NextResponse.json(
      { error: 'Failed to verify purchase', hasAccess: false, verified: false },
      { status: 500 }
    );
  }
}
