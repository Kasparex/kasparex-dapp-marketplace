'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';

interface QuickGuideWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

type WizardStep = 'overview' | 'tokens' | 'flow' | 'nodes' | 'complete';

export function QuickGuideWizard({ isOpen, onClose }: QuickGuideWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('overview');

  const steps = [
    { id: 'overview' as WizardStep, title: 'Overview', number: 1 },
    { id: 'tokens' as WizardStep, title: 'Tokens', number: 2 },
    { id: 'flow' as WizardStep, title: 'How It Works', number: 3 },
    { id: 'nodes' as WizardStep, title: 'Krex Nodes', number: 4 },
    { id: 'complete' as WizardStep, title: 'Complete', number: 5 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].id);
    }
  };

  const handleReset = () => {
    setCurrentStep('overview');
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
        className="relative bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              Kasparex dApp Marketplace - Quick Guide
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Learn how the ecosystem works in simple steps
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

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                      index <= currentStepIndex
                        ? 'bg-[#02abb8] text-white'
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
                  <span className={`text-xs mt-2 text-center ${
                    index <= currentStepIndex
                      ? 'text-zinc-900 dark:text-zinc-100 font-medium'
                      : 'text-zinc-500 dark:text-zinc-400'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 transition-colors ${
                      index < currentStepIndex
                        ? 'bg-[#02abb8]'
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
          {/* Step 1: Overview */}
          {currentStep === 'overview' && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                The Core Concept
              </h3>
              <div className="space-y-3">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Kasparex is a tokenized utility ecosystem where dApps reward users with GRID for real interaction.
                </p>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                    Key Principles:
                  </h4>
                  <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <li className="flex items-start gap-2">
                      <span className="text-[#02abb8] mt-0.5">•</span>
                      <span>Earn GRID and Hub pts through real use, not presales or airdrops</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#02abb8] mt-0.5">•</span>
                      <span>Using dApps can mint GRID on L2 and Hub redeemable pts when Kaspa-linked flows confirm (see /rewards).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#02abb8] mt-0.5">•</span>
                      <span>KREX and NFTs act as multipliers, boosters, and fee reducers</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Tokens */}
          {currentStep === 'tokens' && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Token Roles
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-700">
                      <th className="text-left py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">Token</th>
                      <th className="text-left py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">Role</th>
                      <th className="text-left py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="py-3 px-4 font-medium text-zinc-900 dark:text-zinc-100">KAS</td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">Fuel</td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">Base payment unit for all transactions</td>
                    </tr>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="py-3 px-4 font-medium text-zinc-900 dark:text-zinc-100">KREX</td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">Store-of-Value + Multiplier</td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">Boosts rewards, reduces fees, unlocks perks</td>
                    </tr>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="py-3 px-4 font-medium text-zinc-900 dark:text-zinc-100">NFTs</td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">Boosters</td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">KREXPRIME, PIXELKREX - multipliers & fee reducers</td>
                    </tr>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="py-3 px-4 font-medium text-zinc-900 dark:text-zinc-100">GRID</td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">Ecosystem rewards</td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">Earned across the Kasparex ecosystem (canonical supply on L1 / bridged L2)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  💡 <strong>Default Rewards:</strong> 1 KAS spent ≈ 10,000 GRID + 100 L2 modeled pts in the calculator (Hub pts use the Rewards policy table)
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Flow */}
          {currentStep === 'flow' && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                How It Works - Action-Based Minting
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                    Example: Submitting a DAO Proposal
                  </h4>
                  <ol className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                    <li className="flex items-start gap-2">
                      <span className="font-semibold text-[#02abb8]">1.</span>
                      <span>User performs action (e.g., submits proposal) - pays 10 KAS fee</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold text-[#02abb8]">2.</span>
                      <span>Fee is split: Kasparex Treasury, GRID Treasury, dApp Treasury</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold text-[#02abb8]">3.</span>
                      <span>User receives GRID, L2 modeled pts, Hub pts when applicable, and multipliers if holding KREX/NFTs</span>
                    </li>
                  </ol>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                    The Value Funnel
                  </h4>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                    <p><strong>KAS</strong> → Fees split into treasuries</p>
                    <p><strong>GRID</strong> → Ecosystem reward token (rates vary by activity and chain)</p>
                    <p><strong>KREX</strong> → Multiplies GRID rewards and reduces fees</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Nodes */}
          {currentStep === 'nodes' && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Krex Nodes
              </h3>
              <div className="space-y-3">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Krex Nodes support the Kasparex ecosystem infrastructure and earn rewards based on uptime and contribution.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-700">
                        <th className="text-left py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">Node Type</th>
                        <th className="text-left py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">Description</th>
                        <th className="text-left py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">Benefits</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="py-3 px-4 font-medium text-zinc-900 dark:text-zinc-100">Light Node</td>
                        <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">Lightweight node for ecosystem support</td>
                        <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">Earn rewards based on uptime</td>
                      </tr>
                      <tr className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="py-3 px-4 font-medium text-zinc-900 dark:text-zinc-100">Mirror Node</td>
                        <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">Full mirror node for network support</td>
                        <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">Earn rewards based on contribution</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <p className="text-xs text-purple-700 dark:text-purple-300">
                    💡 Node operators earn rewards over time for supporting the Kasparex ecosystem infrastructure.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Complete */}
          {currentStep === 'complete' && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                You&apos;re All Set!
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                You now understand how the Kasparex ecosystem works. Start using dApps to earn rewards, hold KREX and NFTs for multipliers, and support the network with Krex Nodes.
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
                onClick={currentStep === 'overview' ? onClose : handleBack}
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                {currentStep === 'overview' ? 'Close' : 'Back'}
              </button>
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors"
              >
                {currentStepIndex === steps.length - 2 ? 'Complete' : 'Next'}
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

