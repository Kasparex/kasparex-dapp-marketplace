'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AuthorDashboard } from '@/components/vblog/AuthorDashboard';
import { VBlogSidebar } from '@/components/vblog/VBlogSidebar';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useVBlog } from '@/hooks/useVBlog';
import { useSearchParams } from 'next/navigation';
import { detectKaspaWallets } from '@/lib/kaspa/wallet';

export default function VBlogDashboardPage() {
  const { state, connect } = useKaspaWallet();
  const { articles } = useVBlog();
  const searchParams = useSearchParams();
  const initialCreateIntent = searchParams.get('tab') === 'create' ? 1 : 0;
  const [createIntentKey, setCreateIntentKey] = useState(initialCreateIntent);

  // Filter state for sidebar (though dashboard mostly manages its own)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);

  const handleConnectWallet = async () => {
    const hasKasware = detectKaspaWallets().some((w) => w.id === 'kasware' && w.isInstalled);
    if (!hasKasware) {
      window.open('https://chrome.google.com/webstore/detail/hklhheigdmpoolooomdihmhlpjjdbklf', '_blank');
      return;
    }
    setIsConnectingWallet(true);
    try {
      await connect('kasware', {
        enableSIWK: true,
        siwkParams: { appName: 'Kasparex dApps' },
      });
    } finally {
      setIsConnectingWallet(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="flex-1 min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col lg:flex-row h-full">
          {/* Sidebar - Integrated */}
          <VBlogSidebar
            articles={articles}
            selectedCategory={selectedCategory}
            selectedTags={selectedTags}
            searchQuery={searchQuery}
            onCategoryChange={setSelectedCategory}
            onTagToggle={(tag) => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])}
            onSearchChange={setSearchQuery}
            onCreateArticle={() => setCreateIntentKey((x) => x + 1)}
            activeView="dashboard"
          />

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 p-4 sm:p-8 lg:p-12 overflow-y-auto border-l border-zinc-200 dark:border-zinc-800 text-base sm:text-lg">
            <div className="max-w-6xl mx-auto">
              <div className="mb-12">
                <p className="text-sm font-black uppercase tracking-widest text-[#02abb8] mb-2">Creator dashboard</p>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-900 dark:text-zinc-100 mb-3 tracking-tight">
                  Creator <span className="text-orange-500">Center</span>
                </h1>
                <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
                  Manage your decentralized vBlog publications
                </p>
              </div>

              {!state.isConnected ? (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-12 text-center shadow-2xl shadow-orange-500/5">
                  <div className="w-20 h-20 bg-[#02abb8]/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <svg className="w-10 h-10 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-3">
                    Wallet Not Connected
                  </h2>
                  <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-md mx-auto font-medium">
                    Please connect your Kaspa or EVM wallet to access your personal dashboard and manage your syndicated articles.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => void handleConnectWallet()}
                      disabled={isConnectingWallet}
                      className="k-control-btn !bg-[#02abb8] hover:!bg-[#0296a1] !text-white !border-[#02abb8]/50 px-6"
                    >
                      {isConnectingWallet ? 'Connecting...' : 'Connect Wallet'}
                    </button>
                  </div>
                </div>
              ) : (
                <AuthorDashboard createIntentKey={createIntentKey} />
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
