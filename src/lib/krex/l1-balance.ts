/**
 * L1 KREX Balance Query
 * Fetches KREX token balance from Kaspa L1 (KRC-20) using Kasplex Indexer API
 * Falls back to KasWare wallet's getKRC20Balance() if available
 */

const KASPLEX_INDEXER_API_BASE = 'https://api.kasplex.org';
const KREX_TICKER = 'KREX';

/**
 * Normalize Kaspa address (remove kaspa: prefix if present)
 */
function normalizeKaspaAddress(address: string): string {
  if (!address) return '';
  // Remove kaspa: prefix (case insensitive)
  return address.replace(/^kaspa:/i, '').trim();
}

/**
 * Get API URL - use proxy in browser, direct API on server
 */
function getApiUrl(endpoint: string): string {
  // In browser, use Next.js API proxy to avoid CORS
  if (typeof window !== 'undefined') {
    return `/api/kasplex-indexer?endpoint=${encodeURIComponent(endpoint)}`;
  }
  // Server-side, use direct API
  return `${KASPLEX_INDEXER_API_BASE}${endpoint}`;
}

/**
 * Try to get KREX balance from KasWare wallet if available
 * Verifies that the address matches before using the balance
 */
async function tryKasWareBalance(address: string): Promise<number | null> {
  if (typeof window === 'undefined') {
    console.log('[KREX L1] KasWare check skipped (server-side)');
    return null;
  }
  
  try {
    // Check if KasWare is available
    const win = window as any;
    console.log('[KREX L1] Checking for KasWare wallet...', {
      hasKasware: !!win.kasware,
      hasGetKRC20Balance: !!(win.kasware && typeof win.kasware.getKRC20Balance === 'function'),
      hasGetAddress: !!(win.kasware && typeof win.kasware.getAddress === 'function'),
    });
    
    if (!win.kasware) {
      console.log('[KREX L1] KasWare not found in window object');
      return null;
    }
    
    // Verify address matches (if getAddress is available)
    let kaswareAddress: string | null = null;
    try {
      if (typeof win.kasware.getAddress === 'function') {
        kaswareAddress = await win.kasware.getAddress();
        const normalizedKasware = normalizeKaspaAddress(kaswareAddress || '');
        const normalizedQuery = normalizeKaspaAddress(address);
        
        if (normalizedKasware && normalizedQuery && normalizedKasware.toLowerCase() !== normalizedQuery.toLowerCase()) {
          console.log('[KREX L1] KasWare address does not match query address:', {
            kasware: normalizedKasware,
            query: normalizedQuery,
          });
          // Still try to get balance, but log the mismatch
        } else if (normalizedKasware && normalizedQuery) {
          console.log('[KREX L1] ✓ Address matches KasWare wallet');
        }
      }
    } catch (error) {
      console.warn('[KREX L1] Could not verify KasWare address:', error);
      // Continue anyway - address verification is not critical
    }
    
    if (typeof win.kasware.getKRC20Balance !== 'function') {
      console.log('[KREX L1] KasWare found but getKRC20Balance() method not available');
      return null;
    }

    console.log('[KREX L1] Attempting to get KRC20 balance from KasWare...');
    const tokens = await win.kasware.getKRC20Balance();
    console.log('[KREX L1] KasWare returned tokens:', tokens?.length || 0, 'tokens');
    
    if (!tokens || !Array.isArray(tokens)) {
      console.warn('[KREX L1] KasWare returned invalid token list:', tokens);
      return null;
    }
    
    const krexToken = tokens.find((t: any) => {
      const tick = t.tick?.toUpperCase();
      return tick === KREX_TICKER;
    });
    
    if (krexToken) {
      console.log('[KREX L1] Found KREX token in KasWare:', krexToken);
      const balance = typeof krexToken.amount === 'string' 
        ? parseFloat(krexToken.amount) 
        : Number(krexToken.amount);
      
      if (!isNaN(balance) && balance > 0) {
        console.log(`[KREX L1] ✓ Balance from KasWare: ${balance}`);
        return balance;
      } else {
        console.warn('[KREX L1] Invalid or zero balance from KasWare:', krexToken.amount);
      }
    } else {
      console.log('[KREX L1] KREX token not found in KasWare token list. Available ticks:', 
        tokens.map((t: any) => t.tick).filter(Boolean).slice(0, 10));
    }
    
    return null;
  } catch (error) {
    console.warn('[KREX L1] KasWare balance check failed:', error);
    if (error instanceof Error) {
      console.warn('[KREX L1] Error details:', error.message, error.stack?.substring(0, 200));
    }
    return null;
  }
}

/**
 * Query KREX balance from L1 (Kaspa KRC-20) using Kasplex Indexer API
 * Falls back to KasWare wallet if available
 * 
 * @param address - Kaspa address (with or without kaspa: prefix)
 * @returns KREX balance as number, or 0 if error/invalid address
 */
export async function queryL1KREXBalance(address: string): Promise<number> {
  if (!address || typeof address !== 'string') {
    console.warn('[KREX L1] Invalid address provided');
    return 0;
  }

  // Try KasWare first (if available and address matches)
  try {
    const kaswareBalance = await tryKasWareBalance(address);
    if (kaswareBalance !== null) {
      return kaswareBalance;
    }
  } catch (error) {
    console.warn('[KREX L1] KasWare fallback failed, trying API:', error);
  }

  try {
    // Normalize address (remove kaspa: prefix)
    const normalizedAddress = normalizeKaspaAddress(address);
    
    if (!normalizedAddress) {
      console.warn('[KREX L1] Empty address after normalization');
      return 0;
    }

    // Build API endpoint
    const endpoint = `/v1/krc20/address/${encodeURIComponent(normalizedAddress)}/token/${KREX_TICKER}`;
    const apiUrl = getApiUrl(endpoint);
    
    console.log('[KREX L1] Fetching balance from:', apiUrl);

    // Fetch balance from Kasplex Indexer API (via proxy in browser)
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // If 404, address likely has no KREX balance (not an error)
      if (response.status === 404) {
        console.log('[KREX L1] No KREX balance found for address (404)');
        return 0;
      }
      
      // Log error details for debugging
      const errorText = await response.text().catch(() => 'Could not read error response');
      console.error(`[KREX L1] API error: ${response.status} ${response.statusText}`, {
        url: apiUrl,
        status: response.status,
        errorPreview: errorText.substring(0, 200),
      });
      
      // For 403, the API might be blocking the request - this is a known issue
      if (response.status === 403) {
        console.warn('[KREX L1] API returned 403 Forbidden - Kasplex Indexer API may require authentication or have restrictions');
      }
      
      return 0;
    }

    const data = await response.json();
    
    // Parse response - API should return balance information
    // Expected format may vary, handle common cases
    if (data.balance !== undefined) {
      const balance = typeof data.balance === 'string' 
        ? parseFloat(data.balance) 
        : Number(data.balance);
      
      if (isNaN(balance)) {
        console.warn('[KREX L1] Invalid balance format in response:', data);
        return 0;
      }
      
      console.log(`[KREX L1] ✓ Balance: ${balance}`);
      return balance;
    }
    
    // Alternative response format (if balance is nested or named differently)
    if (data.amount !== undefined) {
      const balance = typeof data.amount === 'string' 
        ? parseFloat(data.amount) 
        : Number(data.amount);
      
      if (isNaN(balance)) {
        console.warn('[KREX L1] Invalid amount format in response:', data);
        return 0;
      }
      
      console.log(`[KREX L1] ✓ Balance (from amount): ${balance}`);
      return balance;
    }

    // If response structure is unexpected, log and return 0
    console.warn('[KREX L1] Unexpected response format:', data);
    return 0;
  } catch (error) {
    console.error('[KREX L1] Error fetching balance:', error);
    return 0;
  }
}
