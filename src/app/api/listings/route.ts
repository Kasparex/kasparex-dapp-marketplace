import { NextRequest, NextResponse } from 'next/server';
import { Listing, ListingFilters } from '@/lib/listings/types';
import { mockListings } from '@/lib/listings/mockData';

/**
 * GET /api/listings - List all listings with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    const filters: ListingFilters = {};
    if (searchParams.has('category')) {
      filters.category = searchParams.get('category') as any;
    }
    if (searchParams.has('tags')) {
      filters.tags = searchParams.getAll('tags');
    }
    if (searchParams.has('status')) {
      filters.status = searchParams.get('status') as any;
    }
    if (searchParams.has('search')) {
      filters.search = searchParams.get('search') || undefined;
    }
    if (searchParams.has('ownerWallet')) {
      filters.ownerWallet = searchParams.get('ownerWallet') || undefined;
    }

    // Filter listings (in Phase 2, this will query D1 database)
    let filtered = [...mockListings];

    if (filters.category) {
      filtered = filtered.filter(l => l.category === filters.category);
    }
    if (filters.status) {
      filtered = filtered.filter(l => l.status === filters.status);
    }
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(l => 
        filters.tags!.some(tag => l.tags.includes(tag))
      );
    }
    if (filters.search) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter(l =>
        l.name.toLowerCase().includes(query) ||
        l.description.toLowerCase().includes(query) ||
        l.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    if (filters.ownerWallet) {
      filtered = filtered.filter(l => 
        l.ownerWallet.toLowerCase() === filters.ownerWallet!.toLowerCase()
      );
    }

    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/listings - Create a new listing
 * TODO: Phase 2 - Store in D1 database after transaction confirmation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.id || !body.ipfsCid || !body.ownerWallet) {
      return NextResponse.json(
        { error: 'Missing required fields: id, ipfsCid, ownerWallet' },
        { status: 400 }
      );
    }

    // TODO: Phase 2 - Store in D1 database
    // For now, just return success
    const listing: Listing = {
      id: body.id,
      ipfsCid: body.ipfsCid,
      name: body.name || 'Untitled',
      description: body.description || '',
      category: body.category,
      tags: body.tags || [],
      ownerWallet: body.ownerWallet,
      timestamp: body.timestamp || Date.now(),
      links: body.links || {},
      images: body.images || {},
      status: body.status || 'pending',
    };

    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    console.error('Error creating listing:', error);
    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}

