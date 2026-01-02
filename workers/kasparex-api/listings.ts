/**
 * Listing Management API Handler
 * 
 * Handles listing CRUD operations for Kasparex Index
 */

import type { Env } from '../index';
import { getCorsHeaders } from '../middleware';

export interface ListingRow {
  id: string;
  ipfs_cid: string;
  name: string;
  description: string | null;
  category: string;
  tags: string;
  owner_wallet: string;
  timestamp: number;
  status: string;
  created_at: number;
  updated_at: number;
}

export async function handleListingRequest(
  request: Request,
  env: Env
): Promise<Response> {
  const corsHeaders = getCorsHeaders();
  const url = new URL(request.url);
  const pathname = url.pathname;

  // GET /kasparex/listings - List all listings with filters
  if (pathname === '/kasparex/listings' && request.method === 'GET') {
    return handleGetListings(request, env);
  }

  // POST /kasparex/listings - Create new listing
  if (pathname === '/kasparex/listings' && request.method === 'POST') {
    return handleCreateListing(request, env);
  }

  // GET /kasparex/listings/:id - Get single listing
  const listingIdMatch = pathname.match(/^\/kasparex\/listings\/(.+)$/);
  if (listingIdMatch && request.method === 'GET') {
    return handleGetListing(listingIdMatch[1], env);
  }

  // PUT /kasparex/listings/:id - Update listing
  if (listingIdMatch && request.method === 'PUT') {
    return handleUpdateListing(listingIdMatch[1], request, env);
  }

  return new Response('Not found', {
    status: 404,
    headers: corsHeaders,
  });
}

async function handleGetListings(
  request: Request,
  env: Env
): Promise<Response> {
  const corsHeaders = getCorsHeaders();
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const ownerWallet = url.searchParams.get('ownerWallet');
    const tags = url.searchParams.getAll('tags');

    let query = 'SELECT * FROM listings WHERE 1=1';
    const params: any[] = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (ownerWallet) {
      query += ' AND owner_wallet = ?';
      params.push(ownerWallet);
    }
    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }
    if (tags.length > 0) {
      // Check if tags JSON contains any of the requested tags
      query += ' AND (';
      tags.forEach((tag, index) => {
        if (index > 0) query += ' OR ';
        query += 'tags LIKE ?';
        params.push(`%"${tag}"%`);
      });
      query += ')';
    }

    query += ' ORDER BY timestamp DESC';

    const result = await env.LISTINGS_DB.prepare(query)
      .bind(...params)
      .all<ListingRow>();

    const listings = result.results.map(row => ({
      id: row.id,
      ipfsCid: row.ipfs_cid,
      name: row.name,
      description: row.description || '',
      category: row.category,
      tags: JSON.parse(row.tags || '[]'),
      ownerWallet: row.owner_wallet,
      timestamp: row.timestamp,
      links: {}, // Will be fetched from IPFS metadata
      images: {}, // Will be fetched from IPFS metadata
      status: row.status as 'active' | 'pending' | 'archived',
    }));

    return new Response(
      JSON.stringify(listings),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching listings:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch listings' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

async function handleGetListing(
  id: string,
  env: Env
): Promise<Response> {
  const corsHeaders = getCorsHeaders();
  try {
    const result = await env.LISTINGS_DB.prepare(
      'SELECT * FROM listings WHERE id = ?'
    )
      .bind(id)
      .first<ListingRow>();

    if (!result) {
      return new Response(
        JSON.stringify({ error: 'Listing not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const listing = {
      id: result.id,
      ipfsCid: result.ipfs_cid,
      name: result.name,
      description: result.description || '',
      category: result.category,
      tags: JSON.parse(result.tags || '[]'),
      ownerWallet: result.owner_wallet,
      timestamp: result.timestamp,
      links: {}, // Will be fetched from IPFS metadata
      images: {}, // Will be fetched from IPFS metadata
      status: result.status as 'active' | 'pending' | 'archived',
    };

    return new Response(
      JSON.stringify(listing),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching listing:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch listing' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

async function handleCreateListing(
  request: Request,
  env: Env
): Promise<Response> {
  const corsHeaders = getCorsHeaders();
  try {
    const body = await request.json() as {
      id: string;
      ipfsCid: string;
      name: string;
      category: string;
      tags: string[];
      ownerWallet: string;
      timestamp: number;
      status?: string;
    };

    // Validate required fields
    if (!body.id || !body.ipfsCid || !body.ownerWallet) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Insert into database
    await env.LISTINGS_DB.prepare(
      `INSERT INTO listings (
        id, ipfs_cid, name, description, category, tags, owner_wallet, timestamp, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      body.id,
      body.ipfsCid,
      body.name,
      body.description || null,
      body.category,
      JSON.stringify(body.tags || []),
      body.ownerWallet,
      body.timestamp || Date.now(),
      body.status || 'pending',
      Date.now(),
      Date.now()
    ).run();

    return new Response(
      JSON.stringify({ success: true, id: body.id }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating listing:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create listing' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

async function handleUpdateListing(
  id: string,
  request: Request,
  env: Env
): Promise<Response> {
  const corsHeaders = getCorsHeaders();
  try {
    const body = await request.json() as {
      ipfsCid?: string;
      name?: string;
      category?: string;
      tags?: string[];
      status?: string;
      ownerWallet?: string; // For ownership verification
    };

    // TODO: Phase 3 - Verify ownership before allowing update
    // const listing = await handleGetListing(id, env, corsHeaders);
    // if (listing.ownerWallet !== body.ownerWallet) {
    //   return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403 });
    // }

    const updates: string[] = [];
    const params: any[] = [];

    if (body.ipfsCid) {
      updates.push('ipfs_cid = ?');
      params.push(body.ipfsCid);
    }
    if (body.name) {
      updates.push('name = ?');
      params.push(body.name);
    }
    if (body.category) {
      updates.push('category = ?');
      params.push(body.category);
    }
    if (body.tags) {
      updates.push('tags = ?');
      params.push(JSON.stringify(body.tags));
    }
    if (body.status) {
      updates.push('status = ?');
      params.push(body.status);
    }

    if (updates.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No updates provided' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    updates.push('updated_at = ?');
    params.push(Date.now());
    params.push(id);

    await env.LISTINGS_DB.prepare(
      `UPDATE listings SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...params).run();

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error updating listing:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update listing' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

