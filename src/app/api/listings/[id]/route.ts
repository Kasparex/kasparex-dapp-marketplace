import { NextRequest, NextResponse } from 'next/server';
import { mockListings } from '@/lib/listings/mockData';

/**
 * GET /api/listings/[id] - Get a single listing
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // TODO: Phase 2 - Query D1 database
    const listing = mockListings.find(l => l.id === id);

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(listing);
  } catch (error) {
    console.error('Error fetching listing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listing' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/listings/[id] - Update a listing
 * TODO: Phase 2 - Verify ownership, update D1 database
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // TODO: Phase 2 - Verify ownership via on-chain check
    // TODO: Phase 2 - Update in D1 database with new transaction hash and IPFS CID

    // For now, just return success
    const listing = mockListings.find(l => l.id === id);
    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...listing,
      ...body,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('Error updating listing:', error);
    return NextResponse.json(
      { error: 'Failed to update listing' },
      { status: 500 }
    );
  }
}

