'use client';

import Link from 'next/link';
import { HubDocPageShell, HubStandaloneIntro } from '@/components/hub/HubDocPageShell';

export default function SupportPage() {
  return (
    <HubDocPageShell standalone projectId="kasparex-dapps">
      <HubStandaloneIntro
        projectId="kasparex-dapps"
        title="Support center"
        count={2}
        countLabel="contact channel"
        description="We are here to help you navigate the Kasparex ecosystem. Get in touch with our team or join our community."
      />

      <div className="mb-16 grid gap-8 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#02abb8]/10">
            <svg className="h-6 w-6 text-[#02abb8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Email Support</h2>
          <p className="kx-body mb-6">
            For general inquiries, technical issues, or account assistance, reach out to our support team.
          </p>
          <a href="mailto:support@kasparex.com" className="inline-flex items-center font-semibold text-[#02abb8] hover:underline">
            support@kasparex.com
            <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-[#02abb8]/10">
            <svg className="h-6 w-6 text-[#02abb8]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
          </div>
          <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Telegram Community</h2>
          <p className="kx-body mb-6">
            Join our active Telegram group to get real-time help from the community and the team.
          </p>
          <a
            href="https://t.me/KasparexHub"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center font-semibold text-[#02abb8] hover:underline"
          >
            @KasparexHub
            <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-2xl font-bold text-zinc-900 dark:text-zinc-100">Before you reach out</h2>
        <p className="kx-body mb-6">
          Many questions are answered in the Knowledge Base and Rewards docs. Check these resources first.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/knowledge-base" className="k-control-btn">
            Knowledge Base
          </Link>
          <Link href="/rewards" className="k-control-btn">
            Rewards Hub
          </Link>
        </div>
      </div>
    </HubDocPageShell>
  );
}
