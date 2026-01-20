/**
 * Promo Engine API
 * 
 * Handles promo token, page, and mint event endpoints
 */

import type { Env } from '../index';
import { getCorsHeaders } from '../middleware';
import {
  verifyRecaptcha,
  storeRecaptchaVerification,
  validateSessionToken,
  checkRateLimit,
  updateRateLimit,
  analyzeMintPattern,
  updateSuspiciousScore,
  getIpAddress,
} from './promo-security';

/**
 * Main handler for promo API requests
 */
export async function handlePromoRequest(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  try {
    // GET /kasparex/promo/tokens - List all promo tokens
    if (pathname === '/kasparex/promo/tokens' && request.method === 'GET') {
      return handleListTokens(env);
    }

    // GET /kasparex/promo/token/:tokenId - Get token details
    const tokenMatch = pathname.match(/^\/kasparex\/promo\/token\/([^/]+)$/);
    if (tokenMatch && request.method === 'GET') {
      return handleGetToken(env, tokenMatch[1]);
    }

    // GET /kasparex/promo/pages/:tokenId - List pages for a token
    const pagesMatch = pathname.match(/^\/kasparex\/promo\/pages\/([^/]+)$/);
    if (pagesMatch && request.method === 'GET') {
      const page = url.searchParams.get('page') || '1';
      const limit = url.searchParams.get('limit') || '20';
      return handleListPages(env, pagesMatch[1], parseInt(page), parseInt(limit));
    }

    // GET /kasparex/promo/page/:pageId - Get page details
    const pageMatch = pathname.match(/^\/kasparex\/promo\/page\/([^/]+)$/);
    if (pageMatch && request.method === 'GET') {
      return handleGetPage(env, pageMatch[1]);
    }

    // GET /kasparex/promo/page-by-owner/:tokenId/:wallet - Get page by owner
    const ownerMatch = pathname.match(/^\/kasparex\/promo\/page-by-owner\/([^/]+)\/([^/]+)$/);
    if (ownerMatch && request.method === 'GET') {
      return handleGetPageByOwner(env, ownerMatch[1], ownerMatch[2]);
    }

    // POST /kasparex/promo/verify-recaptcha - Verify reCAPTCHA
    if (pathname === '/kasparex/promo/verify-recaptcha' && request.method === 'POST') {
      return handleVerifyRecaptcha(request, env);
    }

    // GET /kasparex/promo/cooldown-status/:wallet - Get cooldown status
    const cooldownMatch = pathname.match(/^\/kasparex\/promo\/cooldown-status\/([^/]+)$/);
    if (cooldownMatch && request.method === 'GET') {
      return handleCooldownStatus(env, cooldownMatch[1]);
    }

    // GET /kasparex/promo/rate-limit-status/:wallet - Get rate limit status
    const rateLimitMatch = pathname.match(/^\/kasparex\/promo\/rate-limit-status\/([^/]+)$/);
    if (rateLimitMatch && request.method === 'GET') {
      return handleRateLimitStatus(env, rateLimitMatch[1]);
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      {
        status: 404,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Promo API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * List all promo tokens
 */
async function handleListTokens(env: Env): Promise<Response> {
  try {
    const tokens = await env.NODES_DB
      .prepare('SELECT * FROM promo_tokens WHERE status = ? ORDER BY created_at DESC')
      .bind('ACTIVE')
      .all<{
        id: string;
        ticker: string;
        name: string;
        contract_address: string;
        network: string;
        mint_price: number;
        tokens_per_mint: number;
        mintable_supply: number;
        minted_so_far: number;
        status: string;
        creator_wallet: string;
        platform_wallet: string;
        genesis_page_id: string | null;
        created_at: number | null;
        updated_at: number | null;
      }>();

    return new Response(
      JSON.stringify({ tokens: tokens.results || [] }),
      {
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error listing tokens:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to list tokens' }),
      { status: 500, headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Get token details
 */
async function handleGetToken(env: Env, tokenId: string): Promise<Response> {
  try {
    const token = await env.NODES_DB
      .prepare('SELECT * FROM promo_tokens WHERE id = ?')
      .bind(tokenId)
      .first<{
        id: string;
        ticker: string;
        name: string;
        contract_address: string;
        network: string;
        mint_price: number;
        tokens_per_mint: number;
        mintable_supply: number;
        minted_so_far: number;
        status: string;
        creator_wallet: string;
        platform_wallet: string;
        genesis_page_id: string | null;
        created_at: number | null;
        updated_at: number | null;
      }>();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token not found' }),
        { status: 404, headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } }
      );
    }

    // Get aggregated stats
    const stats = await env.NODES_DB
      .prepare(
        `SELECT 
          COUNT(DISTINCT page_id) as total_pages,
          COUNT(*) as total_mints,
          SUM(total_paid) as total_volume
         FROM promo_mint_events
         WHERE token_id = ?`
      )
      .bind(tokenId)
      .first<{
        total_pages: number;
        total_mints: number;
        total_volume: number;
      }>();

    return new Response(
      JSON.stringify({
        token,
        stats: {
          totalPages: stats?.total_pages || 0,
          totalMints: stats?.total_mints || 0,
          totalVolume: stats?.total_volume || 0,
        },
      }),
      {
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error getting token:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get token' }),
      { status: 500, headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * List pages for a token
 */
async function handleListPages(
  env: Env,
  tokenId: string,
  page: number,
  limit: number
): Promise<Response> {
  try {
    const offset = (page - 1) * limit;
    const pages = await env.NODES_DB
      .prepare(
        `SELECT * FROM promo_pages 
         WHERE token_id = ? AND status = ?
         ORDER BY total_mints DESC, created_at DESC
         LIMIT ? OFFSET ?`
      )
      .bind(tokenId, 'ACTIVE', limit, offset)
      .all();

    const total = await env.NODES_DB
      .prepare('SELECT COUNT(*) as count FROM promo_pages WHERE token_id = ? AND status = ?')
      .bind(tokenId, 'ACTIVE')
      .first<{ count: number }>();

    return new Response(
      JSON.stringify({
        pages: pages.results || [],
        pagination: {
          page,
          limit,
          total: total?.count || 0,
          totalPages: Math.ceil((total?.count || 0) / limit),
        },
      }),
      {
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error listing pages:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to list pages' }),
      { status: 500, headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Get page details
 */
async function handleGetPage(env: Env, pageId: string): Promise<Response> {
  try {
    const page = await env.NODES_DB
      .prepare('SELECT * FROM promo_pages WHERE id = ?')
      .bind(pageId)
      .first();

    if (!page) {
      return new Response(
        JSON.stringify({ error: 'Page not found' }),
        { status: 404, headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ page }),
      {
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error getting page:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get page' }),
      { status: 500, headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Get page by owner wallet
 */
async function handleGetPageByOwner(
  env: Env,
  tokenId: string,
  wallet: string
): Promise<Response> {
  try {
    const page = await env.NODES_DB
      .prepare(
        'SELECT * FROM promo_pages WHERE token_id = ? AND owner_wallet = ? AND status = ?'
      )
      .bind(tokenId, wallet.toLowerCase(), 'ACTIVE')
      .first();

    if (!page) {
      return new Response(
        JSON.stringify({ page: null }),
        {
          headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ page }),
      {
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error getting page by owner:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get page' }),
      { status: 500, headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Verify reCAPTCHA and return session token
 */
async function handleVerifyRecaptcha(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    const body = await request.json() as {
      recaptchaToken: string;
      walletAddress: string;
      tokenId: string;
    };

    if (!body.recaptchaToken || !body.walletAddress || !body.tokenId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } }
      );
    }

    // Get reCAPTCHA secret from env
    const recaptchaSecret = env.RECAPTCHA_SECRET_KEY;
    if (!recaptchaSecret) {
      return new Response(
        JSON.stringify({ error: 'reCAPTCHA not configured' }),
        { status: 500, headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } }
      );
    }

    // Verify with Google
    const verification = await verifyRecaptcha(body.recaptchaToken, recaptchaSecret);
    if (!verification.success) {
      return new Response(
        JSON.stringify({ error: verification.error || 'reCAPTCHA verification failed' }),
        { status: 400, headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } }
      );
    }

    // Store verification
    const stored = await storeRecaptchaVerification(
      env.NODES_DB,
      body.recaptchaToken,
      body.walletAddress,
      body.tokenId
    );

    if (!stored) {
      return new Response(
        JSON.stringify({ error: 'Failed to store verification' }),
        { status: 500, headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } }
      );
    }

    // Generate session token (use the stored ID)
    const now = Math.floor(Date.now() / 1000);
    const sessionToken = `recaptcha_${body.recaptchaToken.slice(0, 16)}_${body.walletAddress.slice(0, 10)}_${now}`;

    return new Response(
      JSON.stringify({
        verified: true,
        sessionToken,
        expiresAt: now + 300, // 5 minutes
      }),
      {
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to verify reCAPTCHA' }),
      { status: 500, headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Get cooldown status for wallet
 */
async function handleCooldownStatus(env: Env, wallet: string): Promise<Response> {
  try {
    // This would ideally read from the contract, but for now return basic info
    // In production, you'd query the contract's lastMintTime and cooldownSeconds
    const rateLimit = await checkRateLimit(env.NODES_DB, wallet, null, new Request('http://localhost'));
    
    return new Response(
      JSON.stringify({
        cooldownActive: !rateLimit.allowed,
        reason: rateLimit.reason,
        retryAfter: rateLimit.retryAfter,
      }),
      {
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error getting cooldown status:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get cooldown status' }),
      { status: 500, headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Get rate limit status for wallet
 */
async function handleRateLimitStatus(env: Env, wallet: string): Promise<Response> {
  try {
    const walletKey = `wallet_${wallet.toLowerCase()}`;
    const limit = await env.NODES_DB
      .prepare('SELECT * FROM promo_rate_limiting WHERE key = ?')
      .bind(walletKey)
      .first<{
        mint_count: number;
        last_mint_at: number | null;
        daily_reset_at: number | null;
        suspicious_score: number;
      }>();

    const now = Math.floor(Date.now() / 1000);
    const today = Math.floor(now / 86400);

    // Check if daily reset needed
    const dailyMints = limit && limit.daily_reset_at === today ? limit.mint_count : 0;

    return new Response(
      JSON.stringify({
        dailyMints,
        maxMintsPerDay: 10, // Should match contract or config
        remainingMints: Math.max(0, 10 - dailyMints),
        suspiciousScore: limit?.suspicious_score || 0,
        lastMintAt: limit?.last_mint_at || null,
      }),
      {
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error getting rate limit status:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get rate limit status' }),
      { status: 500, headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Admin: Register new token in database
 */
async function handleAdminRegisterToken(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    // Check admin auth (simple token check)
    const authHeader = request.headers.get('Authorization');
    const adminToken = env.ADMIN_AUTH_TOKEN;
    if (!adminToken || authHeader !== `Bearer ${adminToken}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json() as {
      id: string;
      ticker: string;
      name: string;
      contract_address: string;
      network: string;
      mint_price: number;
      tokens_per_mint: number;
      mintable_supply: number;
      creator_wallet: string;
      platform_wallet: string;
    };

    const now = Math.floor(Date.now() / 1000);

    await env.NODES_DB
      .prepare(
        `INSERT INTO promo_tokens (
          id, ticker, name, contract_address, network,
          mint_price, tokens_per_mint, mintable_supply, minted_so_far,
          status, creator_wallet, platform_wallet, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'ACTIVE', ?, ?, ?, ?)`
      )
      .bind(
        body.id,
        body.ticker,
        body.name,
        body.contract_address,
        body.network,
        body.mint_price,
        body.tokens_per_mint,
        body.mintable_supply,
        body.creator_wallet,
        body.platform_wallet,
        now,
        now
      )
      .run();

    return new Response(
      JSON.stringify({ success: true, tokenId: body.id }),
      {
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error registering token:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to register token' }),
      { status: 500, headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Admin: Create genesis page
 */
async function handleAdminCreateGenesisPage(
  request: Request,
  env: Env
): Promise<Response> {
  try {
    // Check admin auth
    const authHeader = request.headers.get('Authorization');
    const adminToken = env.ADMIN_AUTH_TOKEN;
    if (!adminToken || authHeader !== `Bearer ${adminToken}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json() as {
      token_id: string;
      page_id: string;
      owner_wallet: string;
      slot1_wallet: string;
      slot2_wallet: string;
      slot3_wallet: string;
      slot4_wallet: string;
      slot5_wallet: string;
      slot1_label?: string;
      slot2_label?: string;
      slot3_label?: string;
      slot4_label?: string;
      slot5_label?: string;
    };

    const now = Math.floor(Date.now() / 1000);

    // Create genesis page
    await env.NODES_DB
      .prepare(
        `INSERT INTO promo_pages (
          id, token_id, owner_wallet,
          slot1_wallet, slot2_wallet, slot3_wallet, slot4_wallet, slot5_wallet,
          slot1_label, slot2_label, slot3_label, slot4_label, slot5_label,
          status, total_mints, total_volume,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 0, 0, ?, ?)`
      )
      .bind(
        body.page_id,
        body.token_id,
        body.owner_wallet,
        body.slot1_wallet,
        body.slot2_wallet,
        body.slot3_wallet,
        body.slot4_wallet,
        body.slot5_wallet,
        body.slot1_label || null,
        body.slot2_label || null,
        body.slot3_label || null,
        body.slot4_label || null,
        body.slot5_label || null,
        now,
        now
      )
      .run();

    // Update token with genesis page ID
    await env.NODES_DB
      .prepare('UPDATE promo_tokens SET genesis_page_id = ?, updated_at = ? WHERE id = ?')
      .bind(body.page_id, now, body.token_id)
      .run();

    return new Response(
      JSON.stringify({ success: true, pageId: body.page_id }),
      {
        headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error creating genesis page:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create genesis page' }),
      { status: 500, headers: { ...getCorsHeaders(), 'Content-Type': 'application/json' } }
    );
  }
}
