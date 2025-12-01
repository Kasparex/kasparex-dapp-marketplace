'use client';

export function VBlogHeader() {
  return (
    <div className="mb-8">
      <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
        Kasparex vBlog
      </h1>
      <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6">
        An on-chain style blog hub where posts are linked to CIDs, actions cost KAS, and comments are treated as limited credits.
      </p>
      <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-[#02abb8]/10 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-[#02abb8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              How vBlog Works
            </h2>
            <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="text-[#02abb8] mt-1">•</span>
                <span>Articles are stored off-chain using Content Identifiers (CIDs) for verifiable, decentralized storage</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#02abb8] mt-1">•</span>
                <span>Creating and editing articles requires KAS payments, ensuring quality and preventing spam</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#02abb8] mt-1">•</span>
                <span>Comments use a pre-paid credit model - users purchase batches of comments with KAS</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#02abb8] mt-1">•</span>
                <span>All article metadata (IDs, transaction hashes) are recorded on-chain for transparency</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

