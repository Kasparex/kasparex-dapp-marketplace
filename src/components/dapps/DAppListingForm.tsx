'use client';

import { useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { categories, type Category } from '@/lib/categories';
import {
  DAPP_LISTING_FEE_KAS,
  saveDAppListingSubmission,
} from '@/lib/dapps/listingSubmissions';

const LISTING_CATEGORIES = categories.filter((c) => c.id !== 'all');

export function DAppListingForm({ onSubmitted }: { onSubmitted?: () => void }) {
  const { state } = useKaspaWallet();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('general');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [paymentPreference, setPaymentPreference] = useState<'KAS' | 'KREX'>('KAS');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('dApp name is required.');
      return;
    }
    if (!description.trim()) {
      setError('Description is required.');
      return;
    }

    try {
      saveDAppListingSubmission({
        name: name.trim(),
        category,
        description: description.trim(),
        websiteUrl: websiteUrl.trim(),
        contactEmail: contactEmail.trim(),
        paymentPreference,
        submitterAddress: state.address || undefined,
      });
      setSubmitted(true);
      onSubmitted?.();
    } catch {
      setError('Could not save submission. Please try again.');
    }
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4 text-center">
        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">Submission received</p>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Your listing request was saved locally for review. Promotional listings are informational only and do not
          connect to on-chain dApp contracts yet.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 p-3">
        <p className="text-[11px] font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider mb-1">
          Informational listing only
        </p>
        <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
          Listing fee: <strong>{DAPP_LISTING_FEE_KAS} KAS or KREX</strong>. Submissions appear as promotional entries
          in the marketplace (no direct contract integration). Category sorting applies once approved.
        </p>
      </div>

      {error ? (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
      ) : null}

      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">dApp name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
          placeholder="My Kaspa dApp"
        />
      </div>

      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as Category)}
          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
        >
          {LISTING_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm resize-none"
          placeholder="What does your dApp do?"
        />
      </div>

      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Website URL</label>
        <input
          type="url"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
          placeholder="https://"
        />
      </div>

      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Contact email</label>
        <input
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">
          Preferred listing fee payment
        </label>
        <div className="flex gap-2">
          {(['KAS', 'KREX'] as const).map((cur) => (
            <button
              key={cur}
              type="button"
              onClick={() => setPaymentPreference(cur)}
              className={`flex-1 rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${
                paymentPreference === cur
                  ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-800 dark:text-cyan-300'
                  : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {DAPP_LISTING_FEE_KAS} {cur}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-white hover:from-cyan-700 hover:to-teal-700 transition-colors"
      >
        Submit listing request
      </button>
      <p className="text-[10px] text-zinc-500 leading-relaxed">
        No payment is collected here. A Kasparex operator will follow up on approved promotional listings.
      </p>
    </form>
  );
}
