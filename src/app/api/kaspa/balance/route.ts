/**
 * Next.js API Route for Kaspa Balance
 * 
 * Proxies balance requests to Kaspa REST API server-side
 * Uses official Kaspa REST API: https://api.kaspa.org/docs
 * Based on Integration Guide: https://kaspa.org/wp-content/uploads/2023/03/Integration_Guide_for_Kaspa_BlockDAG.pdf
 * 
 * NOTE: This route is not available in static export mode (CF_PAGES).
 * For Cloudflare Pages, this functionality should be moved to Cloudflare Workers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { isValidKaspaAddress } from '@/lib/kaspa/sdk';

// Note: This route is skipped during static export (CF_PAGES mode)
// Remove dynamic/runtime exports to allow static export to proceed

/**
 * GET /api/kaspa/balance?address=...
 * Fetches balance for a Kaspa address using official Kaspa REST API
 * 
 * According to Kaspa Integration Guide:
 * - Use GetUtxosByAddresses to fetch UTXOs for an address
 * - Calculate balance from UTXOs (sum of all UTXO amounts)
 */
export async function GET(request: NextRequest) {
  // Skip in static export mode
  if (process.env.CF_PAGES) {
    return NextResponse.json(
      {
        success: false,
        error: 'API routes are not available in static export mode. This endpoint should be moved to Cloudflare Workers.',
      },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    // Validate address using SDK
    if (!isValidKaspaAddress(address)) {
      return NextResponse.json(
        { success: false, error: 'Invalid Kaspa address format' },
        { status: 400 }
      );
    }

    // Normalize address (ensure kaspa: prefix for API calls)
    const addressWithoutPrefix = address.replace(/^kaspa:/i, '');
    const fullAddress = address.startsWith('kaspa:') ? address : `kaspa:${addressWithoutPrefix}`;

    // Method 1: Use official Kaspa REST API - GetUtxosByAddresses
    // According to Integration Guide, this is the recommended way to get balance
    try {
      const utxoResponse = await fetch('https://api.kaspa.org/v1/addresses/utxos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          addresses: [fullAddress],
        }),
        cache: 'no-store',
        signal: AbortSignal.timeout(10000),
      });

      if (utxoResponse.ok) {
        const data = await utxoResponse.json();
        
        // Calculate balance from UTXOs
        // Each UTXO has an amount, sum all amounts to get total balance
        if (data.entries && Array.isArray(data.entries)) {
          let totalBalance = 0;
          for (const entry of data.entries) {
            if (entry.amount) {
              // Amount is in sompis (smallest unit), 1 KAS = 10^8 sompis
              const amount = typeof entry.amount === 'string' ? parseFloat(entry.amount) : entry.amount;
              if (!isNaN(amount) && amount > 0) {
                totalBalance += amount;
              }
            }
          }

          if (totalBalance >= 0) {
            return NextResponse.json({
              success: true,
              balance: totalBalance.toString(),
              source: 'api.kaspa.org (UTXOs)',
            });
          }
        } else if (data.utxos && Array.isArray(data.utxos)) {
          // Alternative response format
          let totalBalance = 0;
          for (const utxo of data.utxos) {
            if (utxo.amount) {
              const amount = typeof utxo.amount === 'string' ? parseFloat(utxo.amount) : utxo.amount;
              if (!isNaN(amount) && amount > 0) {
                totalBalance += amount;
              }
            }
          }

          if (totalBalance >= 0) {
            return NextResponse.json({
              success: true,
              balance: totalBalance.toString(),
              source: 'api.kaspa.org (UTXOs)',
            });
          }
        }
      }
    } catch (utxoError: any) {
      if (utxoError.name !== 'AbortError') {
        console.debug('Kaspa REST API UTXO endpoint failed:', utxoError.message);
      }
    }

    // Method 2: Try direct balance endpoint from Kaspa REST API
    const kaspaOrgEndpoints = [
      `https://api.kaspa.org/v1/addresses/${addressWithoutPrefix}/balance`,
      `https://api.kaspa.org/addresses/${addressWithoutPrefix}/balance`,
      `https://api.kaspa.org/v1/address/${addressWithoutPrefix}`,
    ];

    for (const endpoint of kaspaOrgEndpoints) {
      try {
        const kaspaOrgResponse = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          cache: 'no-store',
          signal: AbortSignal.timeout(10000),
        });

        if (kaspaOrgResponse.ok) {
          const data = await kaspaOrgResponse.json();
          
          let balance: string | number | null = null;

          // Try various response formats
          if (data.balance !== undefined) {
            balance = data.balance;
          } else if (data.totalBalance !== undefined) {
            balance = data.totalBalance;
          } else if (data.data?.balance !== undefined) {
            balance = data.data.balance;
          } else if (data.result?.balance !== undefined) {
            balance = data.result.balance;
          } else if (data.utxos && Array.isArray(data.utxos)) {
            // Calculate from UTXOs if provided
            let totalBalance = 0;
            for (const utxo of data.utxos) {
              if (utxo.amount) {
                const amount = typeof utxo.amount === 'string' ? parseFloat(utxo.amount) : utxo.amount;
                if (!isNaN(amount) && amount > 0) {
                  totalBalance += amount;
                }
              }
            }
            balance = totalBalance > 0 ? totalBalance : null;
          }

          if (balance !== null) {
            const balanceNum = typeof balance === 'string' ? parseFloat(balance) : balance;
            if (!isNaN(balanceNum) && balanceNum >= 0) {
              return NextResponse.json({
                success: true,
                balance: balanceNum.toString(),
                source: 'api.kaspa.org',
              });
            }
          }
        }
      } catch (kaspaOrgError: any) {
        if (kaspaOrgError.name !== 'AbortError') {
          console.debug(`kaspa.org endpoint ${endpoint} failed:`, kaspaOrgError.message);
        }
      }
    }

    // Method 3: Try alternative: kaspa-explorer or other explorers (minimal fallback)
    const explorerEndpoints = [
      `https://explorer.kaspa.org/api/address/${addressWithoutPrefix}`,
      `https://explorer.kaspa.org/api/v1/address/${addressWithoutPrefix}`,
      `https://kaspalytics.com/api/address/${addressWithoutPrefix}`,
    ];

    for (const endpoint of explorerEndpoints) {
      try {
        const explorerResponse = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          cache: 'no-store',
          signal: AbortSignal.timeout(10000),
        });

        if (explorerResponse.ok) {
          const data = await explorerResponse.json();
          
          if (data.balance !== undefined) {
            const balanceNum = typeof data.balance === 'string' ? parseFloat(data.balance) : data.balance;
            if (!isNaN(balanceNum) && balanceNum >= 0) {
              return NextResponse.json({
                success: true,
                balance: balanceNum.toString(),
                source: new URL(endpoint).hostname,
              });
            }
          }
        }
      } catch (explorerError: any) {
        if (explorerError.name !== 'AbortError') {
          console.debug(`Explorer endpoint ${endpoint} failed:`, explorerError.message);
        }
      }
    }

    // If all APIs fail, return success: false but status 200 to allow client to handle gracefully
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch balance from Kaspa REST API. The API may be temporarily unavailable.',
        balance: null,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in balance API route:', error);
    // Return 200 with error instead of 500 to prevent client-side error handling issues
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch balance',
        balance: null,
      },
      { status: 200 }
    );
  }
}
