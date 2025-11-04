/**
 * Next.js API Route for Kaspa Balance
 * 
 * Proxies balance requests to Kaspa APIs server-side
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/kaspa/balance?address=...
 * Fetches balance for a Kaspa address
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    const addressWithoutPrefix = address.replace(/^kaspa:/i, '');

    // Try kas.fyi API - try multiple endpoint variations
    const kasFyiEndpoints = [
      `https://api.kas.fyi/v1/addresses/${addressWithoutPrefix}/balance`,
      `https://api.kas.fyi/v1/addresses/${addressWithoutPrefix}`,
      `https://api.kas.fyi/api/v1/addresses/${addressWithoutPrefix}/balance`,
    ];

    for (const endpoint of kasFyiEndpoints) {
      try {
        const kasFyiResponse = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          cache: 'no-store',
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (kasFyiResponse.ok) {
          const data = await kasFyiResponse.json();
          
          // Try to extract balance from various response formats
          let balance: string | number | null = null;

          if (data.balance !== undefined) {
            balance = data.balance;
          } else if (data.balanceInfo?.balance !== undefined) {
            balance = data.balanceInfo.balance;
          } else if (data.data?.balance !== undefined) {
            balance = data.data.balance;
          } else if (data.result?.balance !== undefined) {
            balance = data.result.balance;
          } else if (data.balanceInfo?.balanceInfo?.balance !== undefined) {
            balance = data.balanceInfo.balanceInfo.balance;
          }

          if (balance !== null) {
            const balanceNum = typeof balance === 'string' ? parseFloat(balance) : balance;
            if (!isNaN(balanceNum) && balanceNum >= 0) {
              return NextResponse.json({
                success: true,
                balance: balanceNum.toString(),
                source: 'kas.fyi',
              });
            }
          }
        }
      } catch (kasFyiError: any) {
        // Continue to next endpoint
        if (kasFyiError.name !== 'AbortError') {
          console.debug(`kas.fyi endpoint ${endpoint} failed:`, kasFyiError.message);
        }
      }
    }

    // Fallback: Try kaspa.org API with multiple endpoint variations
    const kaspaOrgEndpoints = [
      `https://api.kaspa.org/addresses/${addressWithoutPrefix}/balance`,
      `https://api.kaspa.org/api/v1/addresses/${addressWithoutPrefix}/balance`,
      `https://api.kaspa.org/v1/addresses/${addressWithoutPrefix}/balance`,
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

          if (data.balance !== undefined) {
            balance = data.balance;
          } else if (data.data?.balance !== undefined) {
            balance = data.data.balance;
          } else if (data.result?.balance !== undefined) {
            balance = data.result.balance;
          }

          if (balance !== null) {
            const balanceNum = typeof balance === 'string' ? parseFloat(balance) : balance;
            if (!isNaN(balanceNum) && balanceNum >= 0) {
              return NextResponse.json({
                success: true,
                balance: balanceNum.toString(),
                source: 'kaspa.org',
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

    // Try alternative: kaspa-explorer or other explorers
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
        error: 'Failed to fetch balance from all API endpoints. The APIs may be temporarily unavailable or the endpoint format may have changed.',
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

