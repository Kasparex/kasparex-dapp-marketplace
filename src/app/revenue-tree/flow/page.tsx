import { redirect } from 'next/navigation';

/**
 * /revenue-tree/flow → redirect to primary demo flow (wallet-1).
 * User's own tree: /revenue-tree/flow/{wallet-address}
 */
export default function RevenueTreeFlowIndexPage() {
  redirect('/revenue-tree/flow/wallet-1');
}
