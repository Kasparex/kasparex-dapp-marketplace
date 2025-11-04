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

    // Try kas.fyi API first
    try {
      const kasFyiResponse = await fetch(
        `https://api.kas.fyi/v1/addresses/${addressWithoutPrefix}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        }
      );

      if (kasFyiResponse.ok) {
        const data = await kasFyiResponse.json();
        console.log('kas.fyi response:', JSON.stringify(data, null, 2));
        
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
        } else if (typeof data === 'object') {
          // Try to find any numeric value that looks like a balance
          const findBalance = (obj: any): number | null => {
            if (typeof obj === 'number' && obj > 0) return obj;
            if (typeof obj === 'string' && /^\d+$/.test(obj)) return parseFloat(obj);
            if (Array.isArray(obj)) {
              for (const item of obj) {
                const found = findBalance(item);
                if (found !== null) return found;
              }
            }
            if (obj && typeof obj === 'object') {
              for (const key in obj) {
                if (key.toLowerCase().includes('balance')) {
                  const val = obj[key];
                  if (typeof val === 'number') return val;
                  if (typeof val === 'string' && /^\d+$/.test(val)) return parseFloat(val);
                }
                const found = findBalance(obj[key]);
                if (found !== null) return found;
              }
            }
            return null;
          };
          balance = findBalance(data);
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
    } catch (kasFyiError) {
      console.debug('kas.fyi API failed:', kasFyiError);
    }

    // Fallback: Try kaspa.org API
    try {
      const kaspaOrgResponse = await fetch(
        `https://api.kaspa.org/addresses/${addressWithoutPrefix}/balance`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          cache: 'no-store',
        }
      );

      if (kaspaOrgResponse.ok) {
        const data = await kaspaOrgResponse.json();
        console.log('kaspa.org response:', JSON.stringify(data, null, 2));
        
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
    } catch (kaspaOrgError) {
      console.debug('kaspa.org API failed:', kaspaOrgError);
    }

    // Try alternative: kaspa-explorer or other explorers
    try {
      const explorerResponse = await fetch(
        `https://explorer.kaspa.org/api/address/${addressWithoutPrefix}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          cache: 'no-store',
        }
      );

      if (explorerResponse.ok) {
        const data = await explorerResponse.json();
        console.log('explorer response:', JSON.stringify(data, null, 2));
        
        if (data.balance !== undefined) {
          const balanceNum = typeof data.balance === 'string' ? parseFloat(data.balance) : data.balance;
          if (!isNaN(balanceNum) && balanceNum >= 0) {
            return NextResponse.json({
              success: true,
              balance: balanceNum.toString(),
              source: 'explorer.kaspa.org',
            });
          }
        }
      }
    } catch (explorerError) {
      console.debug('explorer API failed:', explorerError);
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch balance from all API endpoints',
      },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('Error in balance API route:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch balance',
      },
      { status: 500 }
    );
  }
}

