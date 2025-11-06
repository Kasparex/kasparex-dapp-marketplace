'use client';

import { useState } from 'react';
import { DApp, DAppStatus } from '@/lib/dapps';
import { Category, categories } from '@/lib/categories';

interface FormStepProps {
  formData: Partial<DApp>;
  onUpdate: (updates: Partial<DApp>) => void;
}

export function BasicInfoStep({ formData, onUpdate }: FormStepProps) {
  const statusOptions: DAppStatus[] = ['Mainnet', 'Testnet', 'Concept', 'Prototype', 'U/C', 'Suspended', 'Devnet'];
  const networkOptions = ['Mainnet', 'Testnet', 'Devnet'];
  const categoryOptions = categories.filter((cat) => cat.id !== 'all');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Basic Information
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
          Provide essential information about your dApp.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          dApp Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name || ''}
          onChange={(e) => onUpdate({ name: e.target.value })}
          placeholder="e.g., Subscription Checker"
          className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.category || 'general'}
            onChange={(e) => onUpdate({ category: e.target.value as Category })}
            className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
          >
            {categoryOptions.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.emoji} {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Version
          </label>
          <input
            type="text"
            value={formData.version || ''}
            onChange={(e) => onUpdate({ version: e.target.value })}
            placeholder="e.g., 1.0"
            className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Description
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Brief description of your dApp..."
          rows={4}
          className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Utility <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.utility || ''}
          onChange={(e) => onUpdate({ utility: e.target.value })}
          placeholder="What does your dApp do?"
          rows={3}
          className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Process <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.process || ''}
          onChange={(e) => onUpdate({ process: e.target.value })}
          placeholder="How does it work?"
          rows={3}
          className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Benefits
        </label>
        <textarea
          value={formData.benefits || ''}
          onChange={(e) => onUpdate({ benefits: e.target.value })}
          placeholder="What are the benefits for users?"
          rows={3}
          className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Status
          </label>
          <select
            value={formData.status || 'Concept'}
            onChange={(e) => onUpdate({ status: e.target.value as DAppStatus })}
            className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Network
          </label>
          <select
            value={formData.network || 'Testnet'}
            onChange={(e) => onUpdate({ network: e.target.value })}
            className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
          >
            {networkOptions.map((network) => (
              <option key={network} value={network}>
                {network}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Developer Name
        </label>
        <input
          type="text"
          value={formData.developer || ''}
          onChange={(e) => onUpdate({ developer: e.target.value })}
          placeholder="Your name or organization"
          className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
        />
      </div>
    </div>
  );
}

export function MediaLinksStep({ formData, onUpdate }: FormStepProps) {
  const website = formData.developerLinks?.find((l) => l.label.toLowerCase().includes('website'))?.url || '';
  const twitter = formData.developerLinks?.find((l) => l.label.toLowerCase().includes('twitter') || l.label.toLowerCase().includes('x'))?.url || '';
  const telegram = formData.developerLinks?.find((l) => l.label.toLowerCase().includes('telegram'))?.url || '';

  const updateLinks = (field: 'website' | 'twitter' | 'telegram', value: string) => {
    const links = [
      field === 'website' ? (value.trim() && { label: 'Website', url: value.trim() }) : (website.trim() && { label: 'Website', url: website.trim() }),
      field === 'twitter' ? (value.trim() && { label: 'Twitter', url: value.trim() }) : (twitter.trim() && { label: 'Twitter', url: twitter.trim() }),
      field === 'telegram' ? (value.trim() && { label: 'Telegram', url: value.trim() }) : (telegram.trim() && { label: 'Telegram', url: telegram.trim() }),
    ].filter(Boolean) as { label: string; url: string }[];

    onUpdate({ developerLinks: links });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Media & Links
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
          Add images, URLs, and social media links for your dApp.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          dApp Image URL
        </label>
        <input
          type="url"
          value={formData.image || ''}
          onChange={(e) => onUpdate({ image: e.target.value })}
          placeholder="https://example.com/image.png"
          className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
        />
        {formData.image && (
          <div className="mt-2">
            <img
              src={formData.image}
              alt="Preview"
              className="w-32 h-32 object-cover rounded-lg border border-zinc-200 dark:border-zinc-800"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          dApp URL
        </label>
        <input
          type="url"
          value={formData.url || ''}
          onChange={(e) => onUpdate({ url: e.target.value })}
          placeholder="https://your-dapp.com"
          className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          Widget/Embed URL
        </label>
        <input
          type="url"
          value={formData.widgetUrl || ''}
          onChange={(e) => onUpdate({ widgetUrl: e.target.value })}
          placeholder="https://your-dapp.com/widget"
          className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          URL for embedded widget/iframe of your dApp
        </p>
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Developer Links (up to 3)
        </h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Website
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => updateLinks('website', e.target.value)}
              placeholder="https://your-website.com"
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Twitter/X
            </label>
            <input
              type="url"
              value={twitter}
              onChange={(e) => updateLinks('twitter', e.target.value)}
              placeholder="https://twitter.com/yourhandle"
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Telegram
            </label>
            <input
              type="url"
              value={telegram}
              onChange={(e) => updateLinks('telegram', e.target.value)}
              placeholder="https://t.me/yourchannel"
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SubscriptionStep({ formData, onUpdate }: FormStepProps) {
  const [enableSubscription, setEnableSubscription] = useState(false);
  const [monthlyPrice, setMonthlyPrice] = useState('');
  const [quarterlyPrice, setQuarterlyPrice] = useState('');
  const [yearlyPrice, setYearlyPrice] = useState('');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Subscription Setup (Optional)
        </h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
          Configure subscription pricing for your dApp. Users can subscribe monthly, quarterly, or yearly.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="enableSubscription"
          checked={enableSubscription}
          onChange={(e) => setEnableSubscription(e.target.checked)}
          className="w-4 h-4 text-[#02abb8] border-zinc-300 rounded focus:ring-[#02abb8]"
        />
        <label htmlFor="enableSubscription" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Enable subscription model for this dApp
        </label>
      </div>

      {enableSubscription && (
        <div className="space-y-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Monthly Price (KAS)
            </label>
            <input
              type="number"
              step="0.001"
              min="0"
              value={monthlyPrice}
              onChange={(e) => setMonthlyPrice(e.target.value)}
              placeholder="0.0"
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Quarterly Price (KAS)
            </label>
            <input
              type="number"
              step="0.001"
              min="0"
              value={quarterlyPrice}
              onChange={(e) => setQuarterlyPrice(e.target.value)}
              placeholder="0.0"
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Typically 10% discount from monthly × 3
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Yearly Price (KAS)
            </label>
            <input
              type="number"
              step="0.001"
              min="0"
              value={yearlyPrice}
              onChange={(e) => setYearlyPrice(e.target.value)}
              placeholder="0.0"
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Typically 20% discount from monthly × 12
            </p>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Note: Subscription plans will be created on-chain after you register your dApp contract.
          </p>
        </div>
      )}
    </div>
  );
}

