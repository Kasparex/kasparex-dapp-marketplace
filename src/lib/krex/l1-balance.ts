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
 */
async function tryKasWareBalance(address: string): Promise<number | null> {
  if (typeof window === 'undefined') return null;
  
  try {
    // Check if KasWare is available
    const win = window as any;
    if (!win.kasware || typeof win.kasware.getKRC20Balance !== 'function') {
      return null;
    }

    const tokens = await win.kasware.getKRC20Balance();
    const krexToken = tokens.find((t: any) => t.tick === KREX_TICKER || t.tick?.toUpperCase() === KREX_TICKER);
    
    if (krexToken && krexToken.amount !== undefined) {
      const balance = typeof krexToken.amount === 'string' 
        ? parseFloat(krexToken.amount) 
        : Number(krexToken.amount);
      
      if (!isNaN(balance)) {
        console.log(`[KREX L1] ✓ Balance from KasWare: ${balance}`);
        return balance;
      }
    }
    
    return null;
  } catch (error) {
    console.warn('[KREX L1] KasWare balance check failed:', error);
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
        console.log('[KREX L1] No KREX balance found for address');
        return 0;
      }
      
      // Other errors
      console.warn(`[KREX L1] API error: ${response.status} ${response.statusText}`);
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
