import { NextRequest, NextResponse } from 'next/server';
import { fetchProductRegistry, getRegistryCID } from '@/lib/store/ipfs-registry';

export async function GET(request: NextRequest) {
  try {
    // Return current registry CID or fetch registry
    const cid = getRegistryCID();
    if (!cid) {
      return NextResponse.json(
        { error: 'Registry CID not configured' },
        { status: 404 }
      );
    }

    const registry = await fetchProductRegistry(cid);
    if (!registry) {
      return NextResponse.json(
        { error: 'Registry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ registry, cid });
  } catch (error) {
    console.error('Failed to fetch registry:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registry' },
      { status: 500 }
    );
  }
}

// POST to update registry CID (admin only - would need auth in production)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { registryCid } = body;

    if (!registryCid) {
      return NextResponse.json(
        { error: 'registryCid is required' },
        { status: 400 }
      );
    }

    // In production, this would update an environment variable or database
    // For now, just return success
    // The actual CID should be stored in environment variables
    
    return NextResponse.json({ success: true, registryCid });
  } catch (error) {
    console.error('Failed to update registry:', error);
    return NextResponse.json(
      { error: 'Failed to update registry' },
      { status: 500 }
    );
  }
}
