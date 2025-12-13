/**
 * Cloudflare Workers Middleware
 * 
 * Handles rate limiting, CORS, request logging, and error handling
 */

export interface Env {
  KASPAREX_CACHE: KVNamespace;
  NODES_DB: D1Database;
  RATE_LIMIT?: KVNamespace;
}

export interface MiddlewareContext {
  request: Request;
  env: Env;
  ip: string;
}

/**
 * Get client IP address from request
 */
function getClientIP(request: Request): string {
  const cfConnectingIP = request.headers.get('CF-Connecting-IP');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback to X-Forwarded-For header
  const xForwardedFor = request.headers.get('X-Forwarded-For');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  
  return 'unknown';
}

/**
 * Rate limiting middleware
 * Limits: 100 requests per minute per IP
 */
export async function rateLimit(
  request: Request,
  env: Env
): Promise<{ allowed: boolean; retryAfter?: number }> {
  // Skip rate limiting if RATE_LIMIT KV is not configured
  if (!env.RATE_LIMIT) {
    return { allowed: true };
  }

  const ip = getClientIP(request);
  const key = `rate_limit:${ip}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100;

  try {
    // Get current count
    const countData = await env.RATE_LIMIT.get(key);
    let count = 0;
    let resetTime = now + windowMs;

    if (countData) {
      const parsed = JSON.parse(countData);
      if (parsed.resetTime > now) {
        count = parsed.count;
        resetTime = parsed.resetTime;
      }
    }

    if (count >= maxRequests) {
      const retryAfter = Math.ceil((resetTime - now) / 1000);
      return { allowed: false, retryAfter };
    }

    // Increment count
    count++;
    await env.RATE_LIMIT.put(
      key,
      JSON.stringify({ count, resetTime }),
      { expirationTtl: Math.ceil((resetTime - now) / 1000) }
    );

    return { allowed: true };
  } catch (error) {
    console.error('Rate limit error:', error);
    // On error, allow the request
    return { allowed: true };
  }
}

/**
 * CORS headers
 */
export function getCorsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreflight(): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(),
  });
}

/**
 * Apply middleware to request
 */
export async function applyMiddleware(
  request: Request,
  env: Env
): Promise<Response | null> {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return handleCorsPreflight();
  }

  // Apply rate limiting
  const rateLimitResult = await rateLimit(request, env);
  if (!rateLimitResult.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Too many requests',
        retryAfter: rateLimitResult.retryAfter,
      }),
      {
        status: 429,
        headers: {
          ...getCorsHeaders(),
          'Content-Type': 'application/json',
          'Retry-After': String(rateLimitResult.retryAfter || 60),
        },
      }
    );
  }

  // Log request (optional, for debugging)
  const url = new URL(request.url);
  console.log(`${request.method} ${url.pathname} - IP: ${getClientIP(request)}`);

  return null; // Continue processing
}


