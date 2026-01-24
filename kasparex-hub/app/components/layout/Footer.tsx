import { Link } from "@remix-run/react";

export function Footer() {
  return (
    <footer className="bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8">
          {/* About Section */}
          <div className="lg:col-span-4">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
              Kasparex Hub
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
              A tokenized utility ecosystem where each dApp has its own token. Earn rewards through real interaction with dApps, unlock multipliers with KREX and NFTs, and support the network with Krex Nodes.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3 mt-6">
              <a
                href="https://www.kasparex.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-[#02abb8] dark:hover:text-[#02abb8] hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                aria-label="Website"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </a>
              <a
                href="https://t.me/KasparexHub"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-[#02abb8] dark:hover:text-[#02abb8] hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                aria-label="Telegram"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
              </a>
              <a
                href="https://x.com/kasparex_hub"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-[#02abb8] dark:hover:text-[#02abb8] hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                aria-label="X (Twitter)"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://github.com/Kasparex/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-[#02abb8] dark:hover:text-[#02abb8] hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                aria-label="GitHub"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-3">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/points"
                  className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-2"
                >
                  <span>XP Points & Perks</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/knowledge-base"
                  className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-2"
                >
                  <span>Knowledge Base</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="lg:col-span-3">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-4">
              Resources
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/api"
                  className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-2"
                >
                  <span>Kasparex API</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-4">
              Support
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://t.me/KasparexHub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-2"
                >
                  <span>Support</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800 text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            © 2025 Kasparex.com | Built with ❤️ by Krex
          </p>
        </div>
      </div>
    </footer>
  );
}



