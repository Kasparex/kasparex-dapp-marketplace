'use client';

export function VBlogExplainer() {
  return (
    <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
          How vBlog Works
        </h2>
        
        <p className="kx-body mb-6">
          Kasparex vBlog is designed as an on-chain blog platform that combines decentralized storage with BlockDAG transactions. Each article&apos;s content is stored off-chain using a Content Identifier (CID), which allows for verifiable and immutable content storage while keeping on-chain costs low.
        </p>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
            <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#e30d1b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              CID Storage
            </h4>
            <p className="kx-body">
              Article content is stored via CID on decentralized storage networks (IPFS, etc.)
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
            <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#e30d1b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Article Creation
            </h4>
            <p className="kx-body">
              Creating a new article costs KAS (e.g., 5 KAS) to ensure quality and prevent spam
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
            <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#e30d1b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Article Updates
            </h4>
            <p className="kx-body">
              Updating an article costs a smaller KAS fee (e.g., 2 KAS) compared to creation
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
            <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#e30d1b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Comment Credits
            </h4>
            <p className="kx-body">
              Comments use a pre-paid credit system where users purchase batches (e.g., 10 KAS for 10 comments)
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* About Section */}
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#e30d1b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              About Kasparex vBlog
            </h3>
            <p className="kx-body mb-4">
              Kasparex vBlog is a decentralized publishing platform built on the Kaspa BlockDAG. It enables authors to create, publish, and manage content with on-chain verification while keeping content storage efficient through CID-based decentralized storage.
            </p>
          </div>

          {/* What's Coming Next */}
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#e30d1b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              What&apos;s Coming Next
            </h3>
            <p className="kx-body mb-4">
              vBlog will integrate with other Kasparex dApps to create a comprehensive content ecosystem:
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Premium Content</h4>
                <p className="kx-body">
                  Premium posts unlocked with NFTs or tokens
                </p>
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Author Features</h4>
                <p className="kx-body">
                  Special author features and gated categories
                </p>
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Reward Systems</h4>
                <p className="kx-body">
                  Reward systems for quality content and engagement
                </p>
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Content Sharing</h4>
                <p className="kx-body">
                  Cross-dApp content sharing and discovery
                </p>
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Ecosystem Integration</h4>
                <p className="kx-body">
                  Integration with Kasparex rewards, tokens, and subscription systems
                </p>
              </div>
            </div>
          </div>

          {/* Technical Details */}
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#e30d1b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Technical Details
            </h3>
            <p className="kx-body">
              This is a front-end prototype version of vBlog. All smart contract interactions and KAS fee logic are currently mocked, but the UX reflects how the final system will behave. The codebase is structured to easily integrate real smart contract calls, IPFS storage, and on-chain BlockDAG transaction handling in future updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

