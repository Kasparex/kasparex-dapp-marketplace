'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { CopyableAddress } from '@/components/donations/CopyableAddress';
import { BRIDGE_URLS, getAddressExplorerUrl } from '@/lib/walletUi';
import { KX_METADATA_STAT_CARD, KX_SURFACE_NESTED } from '@/lib/hub/shellTokens';

interface KREXBuyWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

type WizardStep = 'select' | 'buy' | 'bridge' | 'complete';
type BuyOption = 'l2' | 'l1' | null;

const KASPLEX_KREX_TOKEN_CA = '0x0FD8d408cE707f4E4f8E54193c4C55a3b969834B';
const IGRA_KREX_TOKEN_CA = '0x9C31bB7A012A99dA04AAD94a1CB9176DAF28270D';

const KASPLEX_EXPLORER_BASE = 'https://explorer.kasplex.org';
const IGRA_EXPLORER_BASE = 'https://explorer.igralabs.com';

const KASPLEX_DEXS = [
  {
    name: 'Zealous Swap',
    url: `https://app.zealousswap.com/swap?from=KAS&to=${KASPLEX_KREX_TOKEN_CA}`,
    description: 'Swap KAS for KREX',
  },
  {
    name: 'KaspaCom',
    url: 'https://defi.kaspa.com/swap',
    description: 'KaspaCom DEX',
  },
  {
    name: 'KSPR',
    url: 'https://app.kspr.exchange/trade',
    description: 'KSPR Exchange',
  },
];

const IGRA_DEXS = [
  {
    name: 'Zealous Swap',
    url: `https://app.zealousswap.com/swap?from=iKAS&to=${IGRA_KREX_TOKEN_CA}`,
    description: 'Swap iKAS for KREX on Zealous (IGRA)',
  },
  {
    name: 'KaspaCom',
    url: 'https://defi.kaspa.com/swap',
    description: 'KaspaCom swap (IGRA supported)',
  },
];

const L1_EXCHANGES = [
  {
    name: 'CoinEx',
    url: 'https://www.coinex.com/en/exchange/krex-usdt',
    description: 'KREX/USDT',
  },
  {
    name: 'KSPR Bot',
    url: 'https://t.me/kspr_home_bot?start=AXFM1TM',
    description: 'Telegram bot',
  },
  {
    name: 'KaspaCom',
    url: 'https://www.kaspa.com/?ref=01boeP91',
    description: 'KaspaCom',
  },
  {
    name: 'XT.com',
    url: 'https://www.xt.com/en/trade/krex_usdt',
    description: 'KREX/USDT',
  },
];

export function KREXBuyWizard({ isOpen, onClose }: KREXBuyWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('select');
  const [selectedOption, setSelectedOption] = useState<BuyOption>(null);

  const steps = [
    { id: 'select' as WizardStep, title: 'Select Option', number: 1 },
    { id: 'buy' as WizardStep, title: 'Buy KREX', number: 2 },
    { id: 'bridge' as WizardStep, title: 'Bridge to L2', number: 3 },
    { id: 'complete' as WizardStep, title: 'Complete', number: 4 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const canGoToStep = (step: WizardStep): boolean => {
    if (step === 'select') return true;
    if (step === 'buy') return Boolean(selectedOption);
    if (step === 'bridge') return selectedOption === 'l1';
    if (step === 'complete') return selectedOption === 'l2' || selectedOption === 'l1';
    return false;
  };

  const handleNext = () => {
    if (currentStep === 'select' && selectedOption) {
      setCurrentStep('buy');
    } else if (currentStep === 'buy') {
      if (selectedOption === 'l1') {
        setCurrentStep('bridge');
      } else {
        setCurrentStep('complete');
      }
    } else if (currentStep === 'bridge') {
      setCurrentStep('complete');
    }
  };

  const handleBack = () => {
    if (currentStep === 'buy') {
      setCurrentStep('select');
    } else if (currentStep === 'bridge') {
      setCurrentStep('buy');
    } else if (currentStep === 'complete') {
      if (selectedOption === 'l1') {
        setCurrentStep('bridge');
      } else {
        setCurrentStep('buy');
      }
    }
  };

  const handleReset = () => {
    setCurrentStep('select');
    setSelectedOption(null);
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      
      {/* Modal Content */}
      <div
        className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Buy & Bridge KREX
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Follow these steps to buy KREX and bridge it to L2
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Steps (clickable) */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (!canGoToStep(step.id)) return;
                      setCurrentStep(step.id);
                    }}
                    disabled={!canGoToStep(step.id)}
                    className="flex flex-col items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    title={canGoToStep(step.id) ? `Open step: ${step.title}` : 'Complete previous steps first'}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                        index <= currentStepIndex
                          ? 'bg-[color:var(--hub-accent)] text-white'
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {index < currentStepIndex ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        step.number
                      )}
                    </div>
                    <span
                      className={`text-xs mt-2 text-center ${
                        index <= currentStepIndex
                          ? 'text-zinc-900 dark:text-zinc-100 font-medium'
                          : 'text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      {step.title}
                    </span>
                  </button>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 transition-colors ${
                      index < currentStepIndex
                        ? 'bg-[color:var(--hub-accent)]'
                        : 'bg-zinc-200 dark:bg-zinc-800'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6">
          {/* Step 1: Select Option */}
          {currentStep === 'select' && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Where do you want to buy KREX?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setSelectedOption('l1')}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedOption === 'l1'
                      ? 'border-[color:var(--hub-accent)] bg-[color:var(--hub-accent-muted)]'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-[color:var(--hub-accent)]'
                  }`}
                >
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                    Buy on L1
                  </div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">
                    Purchase on L1. You can bridge to L2 later (optional).
                  </div>
                </button>
                <button
                  onClick={() => setSelectedOption('l2')}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedOption === 'l2'
                      ? 'border-[color:var(--hub-accent)] bg-[color:var(--hub-accent-muted)]'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-[color:var(--hub-accent)]'
                  }`}
                >
                  <div className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                    Buy on L2
                  </div>
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">
                    Get KREX on L2 directly on Kasplex or IGRA (no bridging needed).
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Buy KREX */}
          {currentStep === 'buy' && selectedOption && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                {selectedOption === 'l2' ? 'Buy KREX on L2' : 'Buy KREX on L1'}
              </h3>
              
              {selectedOption === 'l2' ? (
                <div className="space-y-3">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                    Choose a network and DEX to get KREX directly on L2:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className={`${KX_SURFACE_NESTED} p-3`}>
                      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        Kasplex
                      </div>
                      <div className="space-y-2">
                        {KASPLEX_DEXS.map((dex, index) => (
                          <a
                            key={`${dex.name}-${index}`}
                            href={dex.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${KX_METADATA_STAT_CARD} flex-row items-center justify-between !p-3`}
                          >
                            <div>
                              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{dex.name}</div>
                              <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{dex.description}</div>
                            </div>
                            <svg className="h-4 w-4 text-[color:var(--hub-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        ))}
                      </div>
                      <div className="mt-3 rounded-xl border border-[color:var(--hub-accent-border)] bg-[color:var(--hub-accent-muted)] p-3">
                        <p className="mb-2 text-xs font-medium text-[color:var(--hub-accent)]">KREX contract (Kasplex)</p>
                        <CopyableAddress
                          value={KASPLEX_KREX_TOKEN_CA}
                          explorerUrl={
                            getAddressExplorerUrl({
                              kind: 'evm',
                              address: KASPLEX_KREX_TOKEN_CA,
                              chainExplorerBaseUrl: KASPLEX_EXPLORER_BASE,
                            }) || '#'
                          }
                          explorerLabel="Open in Kasplex explorer"
                          className={`${KX_METADATA_STAT_CARD} !p-3`}
                          truncate={false}
                        />
                      </div>
                    </div>

                    <div className={`${KX_SURFACE_NESTED} p-3`}>
                      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                        IGRA
                      </div>
                      <div className="space-y-2">
                        {IGRA_DEXS.map((dex, index) => (
                          <a
                            key={`${dex.name}-${index}`}
                            href={dex.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`${KX_METADATA_STAT_CARD} flex-row items-center justify-between !p-3`}
                          >
                            <div>
                              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{dex.name}</div>
                              <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{dex.description}</div>
                            </div>
                            <svg className="h-4 w-4 text-[color:var(--hub-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        ))}
                      </div>
                      <div className="mt-3 rounded-xl border border-[color:var(--hub-accent-border)] bg-[color:var(--hub-accent-muted)] p-3">
                        <p className="mb-2 text-xs font-medium text-[color:var(--hub-accent)]">KREX contract (IGRA)</p>
                        <CopyableAddress
                          value={IGRA_KREX_TOKEN_CA}
                          explorerUrl={
                            getAddressExplorerUrl({
                              kind: 'evm',
                              address: IGRA_KREX_TOKEN_CA,
                              chainExplorerBaseUrl: IGRA_EXPLORER_BASE,
                            }) || '#'
                          }
                          explorerLabel="Open in IGRA explorer"
                          className={`${KX_METADATA_STAT_CARD} !p-3`}
                          truncate={false}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                    Choose an exchange to buy KREX on L1 (you can keep it on L1, or bridge later if you want):
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {L1_EXCHANGES.map((exchange, index) => (
                      <a
                        key={index}
                        href={exchange.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${KX_METADATA_STAT_CARD} flex-row items-center justify-between !p-3`}
                      >
                        <div>
                          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            {exchange.name}
                          </div>
                          <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                            {exchange.description}
                          </div>
                        </div>
                        <svg className="h-4 w-4 text-[color:var(--hub-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ))}
                  </div>
                  <div className="rounded-xl border border-[color:var(--hub-accent-border)] bg-[color:var(--hub-accent-muted)] p-3">
                    <p className="text-xs text-[color:var(--hub-accent)]">
                      After buying on L1, use the bridge step if you want KREX on L2.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Bridge to L2 */}
          {currentStep === 'bridge' && selectedOption === 'l1' && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Bridge KREX to L2
              </h3>
              <div className={`${KX_SURFACE_NESTED} p-4`}>
                <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                  Use KAT Bridge to transfer KREX (KRC-20) from L1 to L2.
                </p>
                <a
                  href={BRIDGE_URLS.katBridge}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-3 inline-flex items-center gap-2 rounded-lg bg-[color:var(--hub-accent)] px-6 py-3 font-medium text-white transition-colors hover:bg-[color:var(--hub-accent-hover)]"
                >
                  <span>Open KAT Bridge</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
              
              {/* KAS Bridge Option */}
              <div className={`${KX_SURFACE_NESTED} p-4`}>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                  Need native gas on L2?
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">
                  Bridge KAS for Kasplex (wKAS) or iKAS for IGRA to pay network fees.
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={BRIDGE_URLS.kasplexKasBridge}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium transition-colors"
                  >
                    <span>Kasplex: KAS ↔ wKAS</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <a
                    href={BRIDGE_URLS.igraIkasBridge}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium transition-colors"
                  >
                    <span>IGRA: KAS ↔ iKAS</span>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>

              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-xs text-green-700 dark:text-green-300">
                  ✓ Once bridged, your KREX will be available on L2 and you&apos;ll start earning tier benefits automatically.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Complete */}
          {currentStep === 'complete' && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                All Set!
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Your KREX tokens are now on L2. You can use them in dApps to unlock tier benefits, multipliers, and fee reductions.
              </p>
              <div className="pt-4">
                <button
                  onClick={handleReset}
                  className="px-6 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  Start Over
                </button>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          {currentStep !== 'complete' && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={currentStep === 'select' ? onClose : handleBack}
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                {currentStep === 'select' ? 'Cancel' : 'Back'}
              </button>
              <button
                onClick={handleNext}
                disabled={currentStep === 'select' && !selectedOption}
                className="px-6 py-2 rounded-lg bg-[color:var(--hub-accent)] font-medium text-white transition-colors hover:bg-[color:var(--hub-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {currentStep === 'bridge' || (currentStep === 'buy' && selectedOption === 'l2') ? 'Complete' : 'Next'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof window === 'undefined') return null;

  return createPortal(modalContent, document.body);
}

