'use client';

import { useVBlogPricing } from '@/hooks/useVBlogPricing';
import { Alert } from '@/components/Alert';
import { KxAlertRegion } from '@/components/ui/KxAlertRegion';

export function PricingTable() {
  const pricing = useVBlogPricing();

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
        vBlog Pricing & Benefits
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="text-left py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">Action</th>
              <th className="text-left py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">Standard Cost</th>
              <th className="text-left py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">KREX Holder (10M+)</th>
              <th className="text-left py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">Benefits</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300 font-medium">Create Article</td>
              <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100">10 KAS base + size fees</td>
              <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-medium">Discount on total fee</td>
              <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                <ul className="list-disc list-inside space-y-1">
                  <li>Title: 100 chars (150 for NFT holders)</li>
                  <li>Description: 300 chars (500 for NFT holders)</li>
                  <li>Content: 10,000 chars (20,000 for NFT holders)</li>
                </ul>
              </td>
            </tr>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300 font-medium">Edit Article</td>
              <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100">2 KAS base + size fees</td>
              <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-medium">Discount on total fee</td>
              <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                Update existing articles with new content
              </td>
            </tr>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300 font-medium">Delete Article</td>
              <td className="py-3 px-4 text-zinc-900 dark:text-zinc-100">0.1 KAS</td>
              <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-medium">Fixed</td>
              <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                One on-chain delete authorization payment
              </td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-zinc-700 dark:text-zinc-300 font-medium">NFT Perks</td>
              <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">-</td>
              <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">-</td>
              <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                KREXPRIME & PIXELKREX holders get increased text limits
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg">
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          <strong>Note:</strong> KREX holder discounts apply when you hold 10M+ KREX tokens. 
          NFT perks (KREXPRIME, PIXELKREX) provide increased content limits regardless of KREX balance.
        </p>
      </div>

      <KxAlertRegion>
        {pricing.tier.hasKREXDiscount ? (
          <Alert type="success" compact region>
            You qualify for KREX holder discounts! (10M+ KREX)
          </Alert>
        ) : null}
        {pricing.tier.hasNFTPerks ? (
          <Alert type="info" compact region>
            NFT Perks Active: {pricing.tier.nftCollections.join(', ')} - Increased text limits enabled
          </Alert>
        ) : null}
      </KxAlertRegion>
    </div>
  );
}

