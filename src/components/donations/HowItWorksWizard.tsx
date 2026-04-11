'use client';

import { useState } from 'react';
import Link from 'next/link';

type Role = 'donor' | 'creator';
type Method = 'l2' | 'l1';

function buildSteps(role: Role, method: Method): { title: string; body: string }[] {
  if (method === 'l2') {
    return [
      {
        title: 'Where the funds are stored',
        body:
          'Your donation is held by a smart-contract escrow on the chosen L2 network.\n\nThe creator cannot access the funds early, and the rules are enforced by the contract.',
      },
      {
        title: 'What happens at the deadline',
        body:
          'Two outcomes:\n- Goal reached: the creator can claim the escrowed funds.\n- Goal not reached: donors can claim refunds.',
      },
      {
        title: 'Refunds (important)',
        body:
          role === 'donor'
            ? 'Refunds are available via a “Claim refund” action. They are not automatically pushed to every donor in one big transaction.'
            : 'If the campaign fails, donors can claim refunds. Refunds are not pushed automatically to every donor in one transaction.',
      },
      {
        title: 'Safety in plain language',
        body:
          'The rules are public and on-chain. Anyone can verify campaign state (raised amount, deadline, goal) and the contract will only allow the allowed actions at the allowed times.',
      },
    ];
  }

  return [
    {
      title: 'Where the funds are stored',
      body:
        'Donations go directly to the campaign’s Kaspa L1 address.\n\nThere is no escrow contract holding the funds.',
    },
    {
      title: 'What happens after the deadline',
      body:
        role === 'donor'
          ? 'The deadline is informational. The creator already received the funds as donations arrived.'
          : 'The deadline is informational. You already received the funds as donations arrived.',
    },
    {
      title: 'Refunds (important)',
      body:
        'Because funds are direct-to-address, refunds are not enforced automatically by an escrow contract.\nIf refunds are offered, they must be handled manually by the project (or by a dedicated refund mechanism in a future version).',
    },
    {
      title: 'Safety in plain language',
      body:
        'Kaspa L1 donations are normal on-chain payments. Anyone can verify they happened. The “safety” is about transparency — not escrow custody.',
    },
  ];
}

export function HowItWorksWizard() {
  const [role, setRole] = useState<Role>('donor');
  const [method, setMethod] = useState<Method>('l2');
  const steps = buildSteps(role, method);

  return (
    <>
      <div className="mt-6 flex flex-wrap gap-3">
        <div className="inline-flex rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <button
            type="button"
            onClick={() => setRole('donor')}
            className={`px-4 py-2 text-sm font-bold ${role === 'donor' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'}`}
          >
            I’m a donor
          </button>
          <button
            type="button"
            onClick={() => setRole('creator')}
            className={`px-4 py-2 text-sm font-bold ${role === 'creator' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'}`}
          >
            I’m a creator
          </button>
        </div>

        <div className="inline-flex rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <button
            type="button"
            onClick={() => setMethod('l2')}
            className={`px-4 py-2 text-sm font-bold ${method === 'l2' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'}`}
          >
            L2 escrow
          </button>
          <button
            type="button"
            onClick={() => setMethod('l1')}
            className={`px-4 py-2 text-sm font-bold ${method === 'l1' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'}`}
          >
            L1 direct
          </button>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {steps.map((s, idx) => (
          <div key={s.title} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 bg-zinc-50 dark:bg-zinc-950/30">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-black">
                {idx + 1}
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">{s.title}</h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 whitespace-pre-wrap">{s.body}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Revenue Tree (simple view)</h3>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          If a donation happens through a referral link, the Revenue Tree can attribute that donation and distribute rewards/points based on the configured fee rules.
          For escrow campaigns, this can be derived from on-chain donation events. For L1 direct donations, attribution typically needs a recorded donation entry or a payload-based binding.
        </p>
      </div>

      <div className="mt-6 text-center">
        <Link href="/donations/studio" className="inline-block px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">
          Open CrowdKAS Studio
        </Link>
      </div>
    </>
  );
}
