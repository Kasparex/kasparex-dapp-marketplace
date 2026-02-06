'use client';

import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function SupportPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto py-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 mb-8 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </Link>

          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
              Support Center
            </h1>
            <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
              We&apos;re here to help you navigate the Kasparex ecosystem. Get in touch with our team or join our community.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#02abb8]/10 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[#02abb8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">Email Support</h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                For general inquiries, technical issues, or account assistance, reach out to our support team.
              </p>
              <a
                href="mailto:support@kasparex.com"
                className="inline-flex items-center text-[#02abb8] font-semibold hover:underline"
              >
                support@kasparex.com
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>

            <div className="p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-[#02abb8]/10 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[#02abb8]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">Telegram Community</h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                Join our active Telegram group to get real-time help from the community and the team.
              </p>
              <a
                href="https://t.me/KasparexHub"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-[#02abb8] font-semibold hover:underline"
              >
                Join Kasparex Hub
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </div>

          <div className="p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-center">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">Looking for Documentation?</h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Browse our Knowledge Base for detailed guides on how to use Kasparex Hub, KREX tokens, and dApps.
            </p>
            <Link
              href="/knowledge-base"
              className="inline-flex items-center justify-center px-6 py-3 bg-[#02abb8] text-white font-bold rounded-xl hover:bg-[#02abb8]/90 transition-colors shadow-lg shadow-[#02abb8]/20"
            >
              Browse Knowledge Base
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
