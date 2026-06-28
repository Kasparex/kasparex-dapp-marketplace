'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface RevenueTreeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RevenueTreeGuideModal({ isOpen, onClose }: RevenueTreeGuideModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const content = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            Revenue Tree System Guide
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Overview */}
          <section>
            <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 mb-3">Overview</h3>
            <p className="kx-body">
              The Revenue Tree System is a multi-level revenue-sharing referral system that allows users to earn rewards by promoting dApps, articles, games, products, and magazines. When someone uses your referral link and pays for content, you automatically receive a percentage of that payment.
            </p>
          </section>

          {/* How It Works */}
          <section>
            <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 mb-3">How It Works</h3>
            <div className="space-y-4">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#02abb8] text-white font-black flex items-center justify-center text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">Activate Your Tree</h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Use a dApp or purchase content (minimum 100 KAS). This activates your Revenue Tree for that specific content and places you at Level 01.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#02abb8] text-white font-black flex items-center justify-center text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">Get Your Referral Link</h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Once activated, you receive a unique referral link. Share this link with others to promote the content.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#02abb8] text-white font-black flex items-center justify-center text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">Earn Revenue</h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      When someone uses your referral link and pays, revenue is automatically distributed across up to 5 levels. You move up one level in their tree, and they start at Level 01 in their own tree.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#02abb8] text-white font-black flex items-center justify-center text-sm">
                    4
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">Tree Growth</h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Your tree grows both horizontally (many referrals) and vertically (5 levels deep). Each new user can refer more users, creating an expanding network.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Revenue Distribution */}
          <section>
            <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 mb-3">Revenue Distribution</h3>
            <div className="bg-gradient-to-br from-green-500/10 to-[#02abb8]/10 rounded-xl p-4 border border-green-500/20">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Level 05 (Top)</span>
                  <span className="font-black text-green-600 dark:text-green-400">45%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Level 04</span>
                  <span className="font-black text-green-600 dark:text-green-400">20%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Level 03</span>
                  <span className="font-black text-green-600 dark:text-green-400">10%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Level 02</span>
                  <span className="font-black text-green-600 dark:text-green-400">5%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Level 01 (You)</span>
                  <span className="font-black text-green-600 dark:text-green-400">2%</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-green-500/20">
                  <span className="text-zinc-600 dark:text-zinc-400">Platform</span>
                  <span className="font-black text-zinc-600 dark:text-zinc-400">18%</span>
                </div>
              </div>
            </div>
          </section>

          {/* Key Rules */}
          <section>
            <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 mb-3">Key Rules</h3>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="text-[#02abb8] font-black mt-0.5">•</span>
                <span>One Revenue Tree per wallet per content item</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#02abb8] font-black mt-0.5">•</span>
                <span>Activation requires a minimum payment (typically 100 KAS)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#02abb8] font-black mt-0.5">•</span>
                <span>Your upline chain is fixed after first activation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#02abb8] font-black mt-0.5">•</span>
                <span>Repeat usage pays the same upline chain</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#02abb8] font-black mt-0.5">•</span>
                <span>Maximum 5 upline levels receive revenue</span>
              </li>
            </ul>
          </section>

          {/* Genesis Wallets / Genesis Levels */}
          <section>
            <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 mb-3">Genesis Wallets &amp; Levels</h3>
            <p className="kx-body mb-2">
              <strong>Genesis wallets</strong> (or genesis levels) are five preset platform wallets configured per deployment - one for each level (L1-L5). They are used in two cases:
            </p>
            <ul className="list-disc list-inside text-sm text-zinc-600 dark:text-zinc-400 space-y-1.5 mb-2 ml-2">
              <li><strong>First users who do not come from a referral link:</strong> When a user activates without a referrer, their upline slots are filled by the genesis wallets. The revenue split from their payments goes to these five platform wallets instead of to referrers.</li>
              <li><strong>Inactive upline:</strong> When an upline wallet at a level is inactive (e.g. did not meet maintenance), that level’s share is sent to the same-level genesis wallet instead.</li>
            </ul>
            <p className="kx-body">
              Genesis wallets are used for platform development, ecosystem funding, and other designated purposes. Once a user has a referrer and an active upline, revenue flows to real referrers at each level as usual.
            </p>
          </section>

          {/* Demo Link */}
          <section className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Link
              href="/revenue-tree/demo"
              className="block w-full px-6 py-4 bg-gradient-to-r from-[#02abb8] to-purple-500 hover:from-[#0299a6] hover:to-purple-600 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all text-center"
            >
              View Interactive Demo
            </Link>
          </section>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
