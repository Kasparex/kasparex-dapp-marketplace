'use client';

export function VBlogExplainer() {
  return (
    <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
          About Kasparex vBlog
        </h2>
        
        <div className="space-y-6">
          {/* How It Works */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#02abb8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              How the System Works
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              Kasparex vBlog is designed as an on-chain blog platform that combines decentralized storage with blockchain transactions. Each article's content is stored off-chain using a Content Identifier (CID), which allows for verifiable and immutable content storage while keeping on-chain costs low.
            </p>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400 ml-4">
              <li className="list-disc">Article content is stored via CID on decentralized storage networks (IPFS, etc.)</li>
              <li className="list-disc">Creating a new article costs KAS (e.g., 5 KAS) to ensure quality and prevent spam</li>
              <li className="list-disc">Updating an article costs a smaller KAS fee (e.g., 2 KAS) compared to creation</li>
              <li className="list-disc">Comments use a pre-paid credit system where users purchase batches (e.g., 10 KAS for 10 comments)</li>
            </ul>
          </div>

          {/* What's Coming Next */}
          <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#02abb8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              What's Coming Next
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              vBlog will integrate with other Kasparex dApps to create a comprehensive content ecosystem:
            </p>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400 ml-4">
              <li className="list-disc">Premium posts unlocked with NFTs or tokens</li>
              <li className="list-disc">Special author features and gated categories</li>
              <li className="list-disc">Reward systems for quality content and engagement</li>
              <li className="list-disc">Cross-dApp content sharing and discovery</li>
              <li className="list-disc">Integration with Kasparex rewards, tokens, and subscription systems</li>
            </ul>
          </div>

          {/* Technical Details */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-[#02abb8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              Technical Details
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              This is a front-end prototype version of vBlog. All smart contract interactions and KAS fee logic are currently mocked, but the UX reflects how the final system will behave. The codebase is structured to easily integrate real smart contract calls, IPFS storage, and on-chain transaction handling in future updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

