'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { KxModalHeader, KxModalSectionTitle, KxPaymentSummary } from '@/components/payments/KxPaymentUi';
import { useChroniclesEntitlements } from '@/lib/chronicles/entitlements/useChroniclesEntitlements';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useChroniclesVaultUnlock } from '@/hooks/useChroniclesVaultUnlock';
import { ChronicleThumb } from '@/components/chronicles/ChronicleFeaturedVisual';
import type { ChroniclesContentId } from '@/lib/chronicles/entitlements/types';

export function ChroniclesUnlockModal({
  contentId,
  isOpen,
  onClose,
  onUnlocked,
}: {
  contentId: ChroniclesContentId | null;
  isOpen: boolean;
  onClose: () => void;
  onUnlocked?: () => void;
}) {
  const { state } = useKaspaWallet();
  const { catalog, isUnlocked } = useChroniclesEntitlements(state.address);
  const offer = contentId ? catalog.find((o) => o.id === contentId) : undefined;

  const unlock = useChroniclesVaultUnlock(offer);
  const alreadyUnlocked = contentId ? isUnlocked(contentId) : false;

  useEffect(() => {
    if (isOpen) unlock.resetErrors();
  }, [isOpen, contentId]);

  if (!isOpen || !contentId || typeof document === 'undefined') return null;

  const handlePay = async () => {
    const ok = await unlock.payUnlock();
    if (ok) {
      onUnlocked?.();
      onClose();
    }
  };

  const body = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
      <div
        role="presentation"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
        onMouseDown={(e) => {
          if (e.button !== 0 || unlock.payBusy) return;
          onClose();
        }}
      />
      <div
        className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-xl max-w-xl w-full border border-zinc-200 dark:border-zinc-800 max-h-[90vh] overflow-hidden flex flex-col pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <KxModalHeader
          title={offer?.title ?? 'Unlock premium content'}
          subtitle={offer?.shortDescription}
          onClose={onClose}
        />

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {alreadyUnlocked ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">You already have access to this content.</p>
          ) : !offer ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">This unlock offer is not available.</p>
          ) : (
            <>
              <ChronicleThumb imageUrl={offer.imageUrl} alt={offer.title} className="w-full h-40 rounded-xl" />

              <KxPaymentSummary totalLabel="Unlock price" totalValue={`${unlock.effectiveKas} KAS`}>
                {unlock.hasDiscount ? (
                  <p>
                    Base price: <span className="line-through">{unlock.baseKas} KAS</span>
                  </p>
                ) : (
                  <p>{offer.priceLabel}</p>
                )}
                {unlock.krexDiscount > 0 ? <p>KREX tier discount: −{unlock.krexDiscount}%</p> : null}
                {unlock.nftDiscount > 0 ? <p>NFT holder discount: −{unlock.nftDiscount}%</p> : null}
              </KxPaymentSummary>

              {!unlock.isConnected ? (
                <>
                  <KxModalSectionTitle>Connect wallet</KxModalSectionTitle>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Connect your Kaspa wallet using the site header, then return here to pay and unlock.
                  </p>
                </>
              ) : (
                <>
                  {unlock.payError ? (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-800 dark:text-red-300">
                      {unlock.payError}
                    </div>
                  ) : null}
                  {unlock.verifyNote ? (
                    <p className="text-sm text-amber-700 dark:text-amber-400">{unlock.verifyNote}</p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void handlePay()}
                    disabled={unlock.payBusy || unlock.krexLoading || unlock.baseKas <= 0}
                    className="w-full k-cta-primary !justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {unlock.payBusy ? 'Processing…' : `Pay ${unlock.effectiveKas} KAS to unlock`}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(body, document.body);
}
