import Link from 'next/link';
import { FooterAds } from '@/components/ads/FooterAds';
import { FooterSocialIcons } from '@/components/footer/FooterSocialIcons';
import { footerLinkSections } from '@/lib/footerLinks';

export function Footer() {
  return (
    <footer id="site-footer" className="bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 mt-auto pb-20 lg:pb-0">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div id="ad-slot-footer" className="hidden lg:block mb-8 scroll-mt-4">
          <FooterAds />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8">
          <div className="lg:col-span-4">
            <h3 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2 sm:mb-3">
              Kasparex dApp Marketplace
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-prose">
              Your unified gateway to the Kasparex ecosystem. Explore modular dApps, media, games, and infrastructure built for the future of finance on Kaspa.
            </p>
            <FooterSocialIcons className="mt-4 sm:mt-6 justify-start" />
          </div>

          {footerLinkSections.map((section, index) => (
            <div
              key={section.id}
              className={`hidden lg:block ${index === 0 ? 'lg:col-span-3' : index === 1 ? 'lg:col-span-3' : 'lg:col-span-2'}`}
            >
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-4">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={`${section.id}-${link.href}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-2"
                    >
                      {link.icon}
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-zinc-200 dark:border-zinc-800 text-center">
          <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-500">
            © 2025 Kasparex.com | Built with ❤️ by Krex
          </p>
        </div>
      </div>
    </footer>
  );
}
