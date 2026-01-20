/**
 * Promo Engine Security Module
 * 
 * Handles reCAPTCHA verification, rate limiting, and bot pattern detection
 */

import type { Env } from '../index';

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retryAfter?: number;
  suspiciousScore?: number;
}

export interface RecaptchaVerification {
  id: string;
  walletAddress: string;
  tokenId: string;
  verifiedAt: number;
  expiresAt: number;
  used: boolean;
}

/**
 * Verify reCAPTCHA token with Google API
 */
export async function verifyRecaptcha(
  token: string,
  secretKey: string
): Promise<{ success: boolean; score?: number; error?: string }> {
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`,
    });

    const data = await response.json() as {
      success: boolean;
      score?: number;
      'error-codes'?: string[];
    };

    if (!data.success) {
      return {
        success: false,
        error: data['error-codes']?.join(', ') || 'reCAPTCHA verification failed',
      };
    }

    // For v3, require score >= 0.5 (adjustable threshold)
    if (data.score !== undefined && data.score < 0.5) {
      return {
        success: false,
        error: 'reCAPTCHA score too low',
        score: data.score,
      };
    }

    return { success: true, score: data.score };
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'reCAPTCHA API error',
    };
  }
}

/**
 * Store reCAPTCHA verification in D1
 */
export async function storeRecaptchaVerification(
  db: D1Database,
  recaptchaToken: string,
  walletAddress: string,
  tokenId: string,
  expiresInSeconds: number = 300 // 5 minutes default
): Promise<boolean> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + expiresInSeconds;
    const verificationId = `recaptcha_${recaptchaToken.slice(0, 16)}_${walletAddress.slice(0, 10)}_${now}`;

    await db
      .prepare(
        `INSERT INTO promo_recaptcha_verifications 
         (id, wallet_address, token_id, verified_at, expires_at, used)
         VALUES (?, ?, ?, ?, ?, 0)`
      )
      .bind(verificationId, walletAddress.toLowerCase(), tokenId, now, expiresAt)
      .run();

    return true;
  } catch (error) {
    console.error('Error storing reCAPTCHA verification:', error);
    return false;
  }
}

/**
 * Validate and mark reCAPTCHA session token as used
 */
export async function validateSessionToken(
  db: D1Database,
  sessionToken: string,
  walletAddress: string
): Promise<{ valid: boolean; reason?: string }> {
  try {
    const now = Math.floor(Date.now() / 1000);

    // Find verification
    const verification = await db
      .prepare(
        `SELECT * FROM promo_recaptcha_verifications 
         WHERE id = ? AND wallet_address = ? AND used = 0`
      )
      .bind(sessionToken, walletAddress.toLowerCase())
      .first<RecaptchaVerification>();

    if (!verification) {
      return { valid: false, reason: 'Session token not found or already used' };
    }

    if (verification.expiresAt < now) {
      return { valid: false, reason: 'Session token expired' };
    }

    // Mark as used
    await db
      .prepare('UPDATE promo_recaptcha_verifications SET used = 1 WHERE id = ?')
      .bind(sessionToken)
      .run();

    return { valid: true };
  } catch (error) {
    console.error('Error validating session token:', error);
    return { valid: false, reason: 'Database error' };
  }
}

/**
 * Check rate limit for wallet and IP
 */
export async function checkRateLimit(
  db: D1Database,
  walletAddress: string,
  ipAddress: string | null,
  request: Request
): Promise<RateLimitResult> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const today = Math.floor(now / 86400); // UTC day index

    // Check wallet rate limit
    const walletKey = `wallet_${walletAddress.toLowerCase()}`;
    const walletLimit = await db
      .prepare('SELECT * FROM promo_rate_limiting WHERE key = ?')
      .bind(walletKey)
      .first<{
        mint_count: number;
        last_mint_at: number | null;
        daily_reset_at: number | null;
        blocked_until: number | null;
        suspicious_score: number;
      }>();

    // Check if blocked
    if (walletLimit?.blocked_until && walletLimit.blocked_until > now) {
      return {
        allowed: false,
        reason: 'Wallet temporarily blocked',
        retryAfter: walletLimit.blocked_until - now,
        suspiciousScore: walletLimit.suspicious_score,
      };
    }

    // Reset daily count if needed
    if (walletLimit && walletLimit.daily_reset_at !== today) {
      await db
        .prepare(
          `UPDATE promo_rate_limiting 
           SET mint_count = 0, daily_reset_at = ? 
           WHERE key = ?`
        )
        .bind(today, walletKey)
        .run();
    }

    // Check IP rate limit (if provided)
    if (ipAddress) {
      const ipKey = `ip_${ipAddress}`;
      const ipLimit = await db
        .prepare('SELECT * FROM promo_rate_limiting WHERE key = ?')
        .bind(ipKey)
        .first<{
          mint_count: number;
          blocked_until: number | null;
          suspicious_score: number;
        }>();

      if (ipLimit?.blocked_until && ipLimit.blocked_until > now) {
        return {
          allowed: false,
          reason: 'IP address temporarily blocked',
          retryAfter: ipLimit.blocked_until - now,
          suspiciousScore: ipLimit.suspicious_score,
        };
      }
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error checking rate limit:', error);
    // Fail open for now (allow request)
    return { allowed: true };
  }
}

/**
 * Update rate limit counters after mint
 */
export async function updateRateLimit(
  db: D1Database,
  walletAddress: string,
  ipAddress: string | null,
  mintCount: number
): Promise<void> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const today = Math.floor(now / 86400);

    // Update wallet rate limit
    const walletKey = `wallet_${walletAddress.toLowerCase()}`;
    await db
      .prepare(
        `INSERT INTO promo_rate_limiting 
         (key, mint_count, last_mint_at, daily_reset_at, suspicious_score)
         VALUES (?, ?, ?, ?, 0)
         ON CONFLICT(key) DO UPDATE SET
           mint_count = mint_count + ?,
           last_mint_at = ?,
           daily_reset_at = ?`
      )
      .bind(walletKey, mintCount, now, today, mintCount, now, today)
      .run();

    // Update IP rate limit (if provided)
    if (ipAddress) {
      const ipKey = `ip_${ipAddress}`;
      await db
        .prepare(
          `INSERT INTO promo_rate_limiting 
           (key, mint_count, last_mint_at, daily_reset_at, suspicious_score)
           VALUES (?, ?, ?, ?, 0)
           ON CONFLICT(key) DO UPDATE SET
             mint_count = mint_count + ?,
             last_mint_at = ?,
             daily_reset_at = ?`
        )
        .bind(ipKey, mintCount, now, today, mintCount, now, today)
        .run();
    }
  } catch (error) {
    console.error('Error updating rate limit:', error);
  }
}

/**
 * Analyze mint pattern for bot detection
 */
export async function analyzeMintPattern(
  db: D1Database,
  walletAddress: string,
  ipAddress: string | null
): Promise<{ riskLevel: 'low' | 'medium' | 'high'; score: number }> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const oneHourAgo = now - 3600;
    const oneDayAgo = now - 86400;

    let score = 0;

    // Check recent mints for wallet
    const recentMints = await db
      .prepare(
        `SELECT COUNT(*) as count, MIN(timestamp) as first_mint, MAX(timestamp) as last_mint
         FROM promo_mint_events
         WHERE minter_wallet = ? AND timestamp > ?`
      )
      .bind(walletAddress.toLowerCase(), oneHourAgo)
      .first<{ count: number; first_mint: number; last_mint: number }>();

    if (recentMints) {
      const count = recentMints.count || 0;
      if (count > 20) {
        score += 50; // Very high activity
      } else if (count > 10) {
        score += 25; // High activity
      } else if (count > 5) {
        score += 10; // Moderate activity
      }

      // Check timing patterns (rapid-fire mints)
      if (recentMints.first_mint && recentMints.last_mint) {
        const timeSpan = recentMints.last_mint - recentMints.first_mint;
        if (timeSpan > 0 && count / timeSpan > 0.1) {
          // More than 1 mint per 10 seconds
          score += 30;
        }
      }
    }

    // Check IP address patterns (multiple wallets from same IP)
    if (ipAddress) {
      const ipWallets = await db
        .prepare(
          `SELECT COUNT(DISTINCT minter_wallet) as unique_wallets
           FROM promo_mint_events
           WHERE ip_address = ? AND timestamp > ?`
        )
        .bind(ipAddress, oneDayAgo)
        .first<{ unique_wallets: number }>();

      if (ipWallets && ipWallets.unique_wallets > 5) {
        score += 40; // Multiple wallets from same IP
      } else if (ipWallets && ipWallets.unique_wallets > 2) {
        score += 20;
      }
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (score >= 70) {
      riskLevel = 'high';
    } else if (score >= 40) {
      riskLevel = 'medium';
    }

    return { riskLevel, score };
  } catch (error) {
    console.error('Error analyzing mint pattern:', error);
    return { riskLevel: 'low', score: 0 };
  }
}

/**
 * Update suspicious score and potentially block
 */
export async function updateSuspiciousScore(
  db: D1Database,
  walletAddress: string,
  ipAddress: string | null,
  additionalScore: number
): Promise<void> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const blockDuration = 3600; // 1 hour block

    // Update wallet score
    const walletKey = `wallet_${walletAddress.toLowerCase()}`;
    const walletRecord = await db
      .prepare('SELECT suspicious_score FROM promo_rate_limiting WHERE key = ?')
      .bind(walletKey)
      .first<{ suspicious_score: number }>();

    const newScore = (walletRecord?.suspicious_score || 0) + additionalScore;

    await db
      .prepare(
        `INSERT INTO promo_rate_limiting 
         (key, suspicious_score, blocked_until)
         VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET
           suspicious_score = ?,
           blocked_until = CASE WHEN ? >= 100 THEN ? + ? ELSE blocked_until END`
      )
      .bind(
        walletKey,
        newScore,
        newScore >= 100 ? now + blockDuration : null,
        newScore,
        newScore,
        now,
        blockDuration
      )
      .run();

    // Update IP score (if provided)
    if (ipAddress) {
      const ipKey = `ip_${ipAddress}`;
      const ipRecord = await db
        .prepare('SELECT suspicious_score FROM promo_rate_limiting WHERE key = ?')
        .bind(ipKey)
        .first<{ suspicious_score: number }>();

      const newIpScore = (ipRecord?.suspicious_score || 0) + additionalScore;

      await db
        .prepare(
          `INSERT INTO promo_rate_limiting 
           (key, suspicious_score, blocked_until)
           VALUES (?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET
             suspicious_score = ?,
             blocked_until = CASE WHEN ? >= 100 THEN ? + ? ELSE blocked_until END`
        )
        .bind(
          ipKey,
          newIpScore,
          newIpScore >= 100 ? now + blockDuration : null,
          newIpScore,
          newIpScore,
          now,
          blockDuration
        )
        .run();
    }
  } catch (error) {
    console.error('Error updating suspicious score:', error);
  }
}

/**
 * Get IP address from request
 */
export function getIpAddress(request: Request): string | null {
  // Cloudflare provides CF-Connecting-IP header
  const cfIp = request.headers.get('CF-Connecting-IP');
  if (cfIp) return cfIp;

  // Fallback to X-Forwarded-For
  const forwarded = request.headers.get('X-Forwarded-For');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  return null;
}
