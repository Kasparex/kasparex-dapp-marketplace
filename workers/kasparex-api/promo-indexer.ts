/**
 * Promo Engine Event Indexer
 * 
 * Processes MintExecuted events from Igra blockchain and updates D1 database
 */

import type { Env } from '../index';
import { updateRateLimit, analyzeMintPattern, updateSuspiciousScore, getIpAddress } from './promo-security';

export interface MintExecutedEvent {
  tokenId: string;
  pageId: string;
  minter: string;
  mintCount: number;
  mintPrice: string;
  totalPaid: string;
  creator: string;
  platform: string;
  slotsBefore: string[];
  creatorAmount: string;
  platformAmount: string;
  slotAmounts: string[];
  timestamp: number;
  txHash: string;
  blockNumber: number;
}

/**
 * Process mint events from blockchain
 * This would typically be called by a cron job or external indexer
 */
export async function processMintEvents(
  env: Env,
  limit: number = 50
): Promise<{ processed: number; errors: number }> {
  // In a real implementation, this would:
  // 1. Query Igra RPC for new MintExecuted events since last processed block
  // 2. For each event, call processSingleMintEvent
  // 3. Update last_processed_block in D1 or KV

  // For now, this is a placeholder that shows the structure
  // You would integrate with an Igra RPC provider (e.g., via ethers.js or viem)
  
  console.log(`[Promo Indexer] Processing up to ${limit} mint events...`);
  
  // TODO: Implement actual blockchain event fetching
  // Example structure:
  // const provider = new ethers.JsonRpcProvider(env.IGRA_RPC_URL);
  // const contract = new ethers.Contract(routerAddress, abi, provider);
  // const events = await contract.queryFilter('MintExecuted', fromBlock, 'latest');
  
  return { processed: 0, errors: 0 };
}

/**
 * Process a single mint event
 */
export async function processSingleMintEvent(
  env: Env,
  event: MintExecutedEvent,
  ipAddress?: string | null,
  userAgent?: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = env.NODES_DB;

    // Start transaction-like operations (D1 doesn't support true transactions, but we'll do our best)
    
    // 1. Update token supply
    await db
      .prepare(
        `UPDATE promo_tokens 
         SET minted_so_far = minted_so_far + ?,
             updated_at = ?
         WHERE id = ?`
      )
      .bind(
        parseInt(event.mintCount) * (await getTokenConfig(db, event.tokenId))?.tokens_per_mint || 0,
        Math.floor(Date.now() / 1000),
        event.tokenId
      )
      .run();

    // Check if token is fully minted
    const token = await db
      .prepare('SELECT * FROM promo_tokens WHERE id = ?')
      .bind(event.tokenId)
      .first<{
        mintable_supply: number;
        minted_so_far: number;
        status: string;
      }>();

    if (token && token.minted_so_far >= token.mintable_supply) {
      // Mark token as completed and archive all pages
      await db
        .prepare('UPDATE promo_tokens SET status = ? WHERE id = ?')
        .bind('COMPLETED', event.tokenId)
        .run();

      await db
        .prepare('UPDATE promo_pages SET status = ? WHERE token_id = ?')
        .bind('ARCHIVED', event.tokenId)
        .run();
    }

    // 2. Record mint event
    const now = Math.floor(Date.now() / 1000);
    const userAgentHash = userAgent ? await hashString(userAgent) : null;

    await db
      .prepare(
        `INSERT INTO promo_mint_events (
          token_id, page_id, minter_wallet, mint_count, mint_price, total_paid,
          creator_amount, platform_amount, slot1_amount, slot2_amount, slot3_amount, slot4_amount, slot5_amount,
          slot1_before, slot2_before, slot3_before, slot4_before, slot5_before,
          tx_hash, network, timestamp, ip_address, user_agent_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        event.tokenId,
        event.pageId,
        event.minter.toLowerCase(),
        event.mintCount,
        parseFloat(event.mintPrice),
        parseFloat(event.totalPaid),
        parseFloat(event.creatorAmount),
        parseFloat(event.platformAmount),
        parseFloat(event.slotAmounts[0] || '0'),
        parseFloat(event.slotAmounts[1] || '0'),
        parseFloat(event.slotAmounts[2] || '0'),
        parseFloat(event.slotAmounts[3] || '0'),
        parseFloat(event.slotAmounts[4] || '0'),
        event.slotsBefore[0] || '',
        event.slotsBefore[1] || '',
        event.slotsBefore[2] || '',
        event.slotsBefore[3] || '',
        event.slotsBefore[4] || '',
        event.txHash,
        'igraCaravelTestnet', // or detect from event
        event.timestamp || now,
        ipAddress || null,
        userAgentHash
      )
      .run();

    // 3. Update promo page (slot rotation and analytics)
    const page = await db
      .prepare('SELECT * FROM promo_pages WHERE id = ?')
      .bind(event.pageId)
      .first<{
        slot1_wallet: string;
        slot2_wallet: string;
        slot3_wallet: string;
        slot4_wallet: string;
        slot5_wallet: string;
        total_mints: number;
        total_volume: number;
        earn_slot1: number;
        earn_slot2: number;
        earn_slot3: number;
        earn_slot4: number;
        earn_slot5: number;
      }>();

    if (page) {
      // Rotate slots: slot2->slot1, slot3->slot2, slot4->slot3, slot5->slot4, minter->slot5
      const newSlot1 = page.slot2_wallet;
      const newSlot2 = page.slot3_wallet;
      const newSlot3 = page.slot4_wallet;
      const newSlot4 = page.slot5_wallet;
      const newSlot5 = event.minter.toLowerCase();

      // Update earnings for slots (based on amounts from event)
      await db
        .prepare(
          `UPDATE promo_pages SET
           slot1_wallet = ?,
           slot2_wallet = ?,
           slot3_wallet = ?,
           slot4_wallet = ?,
           slot5_wallet = ?,
           total_mints = total_mints + ?,
           total_volume = total_volume + ?,
           earn_slot1 = earn_slot1 + ?,
           earn_slot2 = earn_slot2 + ?,
           earn_slot3 = earn_slot3 + ?,
           earn_slot4 = earn_slot4 + ?,
           earn_slot5 = earn_slot5 + ?,
           updated_at = ?
           WHERE id = ?`
        )
        .bind(
          newSlot1,
          newSlot2,
          newSlot3,
          newSlot4,
          newSlot5,
          event.mintCount,
          parseFloat(event.totalPaid),
          parseFloat(event.slotAmounts[0] || '0'),
          parseFloat(event.slotAmounts[1] || '0'),
          parseFloat(event.slotAmounts[2] || '0'),
          parseFloat(event.slotAmounts[3] || '0'),
          parseFloat(event.slotAmounts[4] || '0'),
          now,
          event.pageId
        )
        .run();
    }

    // 4. Check if minter needs a new page (one page per token per wallet rule)
    const existingPage = await db
      .prepare(
        'SELECT id FROM promo_pages WHERE token_id = ? AND owner_wallet = ? AND status = ?'
      )
      .bind(event.tokenId, event.minter.toLowerCase(), 'ACTIVE')
      .first<{ id: string }>();

    if (!existingPage) {
      // Create new page for minter
      // Use rotated slots from the page they minted through, with minter at slot5
      const newPageId = `page_${event.tokenId}_${event.minter.toLowerCase()}_${now}`;
      
      await db
        .prepare(
          `INSERT INTO promo_pages (
            id, token_id, owner_wallet,
            slot1_wallet, slot2_wallet, slot3_wallet, slot4_wallet, slot5_wallet,
            status, total_mints, total_volume,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)`
        )
        .bind(
          newPageId,
          event.tokenId,
          event.minter.toLowerCase(),
          page?.slot2_wallet || event.slotsBefore[1] || '',
          page?.slot3_wallet || event.slotsBefore[2] || '',
          page?.slot4_wallet || event.slotsBefore[3] || '',
          page?.slot5_wallet || event.slotsBefore[4] || '',
          event.minter.toLowerCase(), // minter becomes slot5
          'ACTIVE',
          now,
          now
        )
        .run();
    }

    // 5. Update rate limiting and analyze patterns
    await updateRateLimit(env.NODES_DB, event.minter, ipAddress || null, event.mintCount);

    const pattern = await analyzeMintPattern(env.NODES_DB, event.minter, ipAddress || null);
    if (pattern.riskLevel === 'high') {
      await updateSuspiciousScore(env.NODES_DB, event.minter, ipAddress || null, 20);
    } else if (pattern.riskLevel === 'medium') {
      await updateSuspiciousScore(env.NODES_DB, event.minter, ipAddress || null, 10);
    }

    return { success: true };
  } catch (error) {
    console.error('Error processing mint event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Helper: Get token config
 */
async function getTokenConfig(
  db: D1Database,
  tokenId: string
): Promise<{ tokens_per_mint: number } | null> {
  try {
    return await db
      .prepare('SELECT tokens_per_mint FROM promo_tokens WHERE id = ?')
      .bind(tokenId)
      .first<{ tokens_per_mint: number }>();
  } catch (error) {
    console.error('Error getting token config:', error);
    return null;
  }
}

/**
 * Helper: Hash string (simple hash for user agent)
 */
async function hashString(str: string): Promise<string> {
  // Simple hash using Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}
