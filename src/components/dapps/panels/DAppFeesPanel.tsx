'use client';

import { DApp } from '@/lib/dapps';
import { useDAppFeeCalculations } from '@/hooks/useDAppFeeCalculations';
import { getNativeCurrencySymbol } from '@/lib/wagmi';
import { formatPrice } from '@/lib/payments/calculator';
import { DAppInfoTimeline } from './DAppDescriptionsPanel';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';

interface DAppFeesPanelProps {
  dapp: DApp;
  contractAddress?: string;
}

export function DAppFeesPanel({ dapp, contractAddress }: DAppFeesPanelProps) {
  const {
    chainId,
    isConnected,
    actions,
    baseFee,
    feePercent,
    costReductionPercent,
    krexBalance,
    tier,
  } = useDAppFeeCalculations(dapp, contractAddress);

  const nativeSymbol = getNativeCurrencySymbol(chainId);

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <DAppSectionHeader title="Fees & costs" />
        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead>
              <tr className="bg-zinc-100 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Action</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Cost</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Fee</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Total</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((action, index) => {
                const totalPaid = action.costKAS * (1 - costReductionPercent / 100);
                const feeAmount = (totalPaid * feePercent) / 100;
                const toRecipient = totalPaid - feeAmount;
                return (
                  <tr
                    key={index}
                    className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">{action.action}</td>
                    <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400 text-right">
                      {costReductionPercent > 0 ? (
                        <>
                          <span className="line-through text-zinc-400 dark:text-zinc-600 mr-1">
                            {formatPrice(action.costKAS)}
                          </span>
                          <span className="text-green-600 dark:text-green-400">
                            {formatPrice(toRecipient)} {nativeSymbol}
                          </span>
                        </>
                      ) : (
                        `${formatPrice(toRecipient)} ${nativeSymbol}`
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400 text-right">
                      {feePercent < baseFee ? (
                        <>
                          <span className="line-through text-zinc-400 dark:text-zinc-600 mr-1">
                            {formatPrice((totalPaid * baseFee) / 100)}
                          </span>
                          <span className="text-green-600 dark:text-green-400">
                            {formatPrice(feeAmount)} {nativeSymbol}
                          </span>
                        </>
                      ) : (
                        `${formatPrice(feeAmount)} ${nativeSymbol}`
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-semibold text-right">
                      {formatPrice(totalPaid)} {nativeSymbol}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {(costReductionPercent > 0 || feePercent < baseFee) && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-t border-zinc-200 dark:border-zinc-700">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {costReductionPercent > 0 && `Cost reduction: -${costReductionPercent}% `}
                {feePercent < baseFee && `Fee reduction: -${(baseFee - feePercent).toFixed(2)}%`}
                {isConnected && krexBalance > 0 && ` (Tier ${tier})`}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4 pt-2 border-t border-zinc-200 dark:border-zinc-800">
        <DAppSectionHeader title="Ecosystem timeline" />
        <DAppInfoTimeline dapp={dapp} contractAddress={contractAddress} />
      </section>
    </div>
  );
}
