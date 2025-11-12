'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { DApp, DAppStatus } from '@/lib/dapps';
import { Category, categories } from '@/lib/categories';
import { validateDAppData } from '@/lib/dapps/management';
import { generateDAppSlug } from '@/lib/utils';
import { BasicInfoStep } from './DAppFormSteps';
import { MediaLinksStep } from './DAppFormSteps';
import { ContractStep } from './ContractDeployment';
import { SubscriptionStep } from './DAppFormSteps';
import { DAppPreview } from './DAppPreview';

interface BuildDAppWizardProps {
  onComplete: (dapp: Partial<DApp>) => void;
  onCancel: () => void;
}

export type WizardStep = 'basic' | 'media' | 'contract' | 'subscription' | 'review';

export function BuildDAppWizard({ onComplete, onCancel }: BuildDAppWizardProps) {
  const { address, isConnected } = useAccount();
  const [currentStep, setCurrentStep] = useState<WizardStep>('basic');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<DApp>>({
    name: '',
    category: 'general',
    description: '',
    utility: '',
    process: '',
    benefits: '',
    developer: '',
    developerLinks: [],
    status: 'Testnet',
    network: 'Testnet',
    provider: 'Kasparex',
    version: '1.0',
    url: '',
    widgetUrl: '',
    image: '',
    contractAddress: '',
    deployerAddress: address || '',
  });

  // Update deployer address when wallet connects
  useEffect(() => {
    if (address) {
      setFormData((prev) => ({ ...prev, deployerAddress: address }));
    }
  }, [address]);

  const steps: { id: WizardStep; title: string; description: string }[] = [
    { id: 'basic', title: 'Basic Info', description: 'Name, category, and description' },
    { id: 'media', title: 'Media & Links', description: 'Images, URLs, and social links' },
    { id: 'contract', title: 'Smart Contract', description: 'Deploy or link existing contract' },
    { id: 'subscription', title: 'Subscription', description: 'Configure pricing (optional)' },
    { id: 'review', title: 'Review', description: 'Preview and submit' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const validateStep = (step: WizardStep): boolean => {
    const stepErrors: string[] = [];
    const validation = validateDAppData(formData);

    if (step === 'basic') {
      if (!formData.name || formData.name.trim().length === 0) {
        stepErrors.push('Name is required');
      }
      if (!formData.utility || formData.utility.trim().length === 0) {
        stepErrors.push('Utility is required');
      }
      if (!formData.process || formData.process.trim().length === 0) {
        stepErrors.push('Process is required');
      }
    }

    if (validation.errors.length > 0) {
      stepErrors.push(...validation.errors);
    }

    if (stepErrors.length > 0) {
      setErrors({ [step]: stepErrors });
      return false;
    }

    setErrors({});
    return true;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      return;
    }

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

  const handleSubmit = async () => {
    if (!validateStep('review')) {
      return;
    }

    if (!isConnected || !address) {
      setErrors({ review: ['Please connect your wallet'] });
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate slug if not provided
      const slug = formData.slug || generateDAppSlug(formData.name || '');
      const id = `dapp_${Date.now()}_${slug}`;

      const finalDApp: Partial<DApp> = {
        ...formData,
        id,
        slug,
        createdAt: new Date().toISOString(),
        deployerAddress: address,
      };

      onComplete(finalDApp);
    } catch (error) {
      console.error('Error submitting dApp:', error);
      setErrors({ review: ['Failed to submit dApp. Please try again.'] });
      setIsSubmitting(false);
    }
  };

  const updateFormData = (updates: Partial<DApp>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔐</div>
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          Connect Your Wallet
        </h3>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          Please connect your wallet to build a dApp.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    index <= currentStepIndex
                      ? 'bg-[#02abb8] text-white'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="mt-2 text-center">
                  <div
                    className={`text-sm font-medium ${
                      index <= currentStepIndex
                        ? 'text-zinc-900 dark:text-zinc-100'
                        : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    {step.title}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {step.description}
                  </div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-1 flex-1 mx-2 transition-colors ${
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
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
        {errors[currentStep] && errors[currentStep].length > 0 && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400">
              {errors[currentStep].map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {currentStep === 'basic' && (
          <BasicInfoStep formData={formData} onUpdate={updateFormData} />
        )}
        {currentStep === 'media' && (
          <MediaLinksStep formData={formData} onUpdate={updateFormData} />
        )}
        {currentStep === 'contract' && (
          <ContractStep formData={formData} onUpdate={updateFormData} />
        )}
        {currentStep === 'subscription' && (
          <SubscriptionStep formData={formData} onUpdate={updateFormData} />
        )}
        {currentStep === 'review' && (
          <DAppPreview formData={formData} />
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
          <div>
            {currentStepIndex > 0 && (
              <button
                onClick={handleBack}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                Back
              </button>
            )}
            {currentStepIndex === 0 && (
              <button
                onClick={onCancel}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            )}
          </div>
          <div className="flex gap-3">
            {currentStepIndex < steps.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={isSubmitting}
                className="px-6 py-2 text-sm font-medium text-white bg-[#02abb8] rounded-lg hover:bg-[#0299a3] transition-colors disabled:opacity-50"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 text-sm font-medium text-white bg-[#02abb8] rounded-lg hover:bg-[#0299a3] transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit dApp'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

