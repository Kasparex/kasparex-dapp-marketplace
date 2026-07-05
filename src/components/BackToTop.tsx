'use client';

import { useState, useEffect } from 'react';
import { MobileFooterDrawer } from '@/components/MobileFooterDrawer';
import { useFooterInView } from '@/hooks/useFooterInView';

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [siteLinksOpen, setSiteLinksOpen] = useState(false);
  const { isMobile, footerInView } = useFooterInView();

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.pageYOffset > 300);
    };

    window.addEventListener('scroll', toggleVisibility);
    toggleVisibility();

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const showSiteLinks = isMobile && footerInView && !siteLinksOpen;
  const showMobileBackToTop = isMobile && isVisible;
  const showDesktopBackToTop = !isMobile && isVisible;

  return (
    <>
      {showDesktopBackToTop ? (
        <button
          onClick={scrollToTop}
          className="hidden lg:flex fixed bottom-6 right-6 p-2.5 bg-black/50 hover:bg-black/70 dark:bg-black/50 dark:hover:bg-black/70 backdrop-blur-sm rounded-lg text-white transition-all z-50 shadow-lg"
          aria-label="Back to top"
          title="Back to top"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      ) : null}

      {showSiteLinks || showMobileBackToTop ? (
        <div className="lg:hidden fixed bottom-6 inset-x-0 z-50 pointer-events-none px-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            {showSiteLinks ? (
              <button
                type="button"
                onClick={() => setSiteLinksOpen(true)}
                className="pointer-events-auto flex items-center gap-2 h-11 px-4 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md shadow-lg text-sm font-medium text-zinc-800 dark:text-zinc-200"
                aria-label="Open site links menu"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                Site links
              </button>
            ) : (
              <span className="w-0" aria-hidden />
            )}

            {showMobileBackToTop ? (
              <button
                onClick={scrollToTop}
                className="pointer-events-auto p-2.5 bg-black/50 hover:bg-black/70 dark:bg-black/50 dark:hover:bg-black/70 backdrop-blur-sm rounded-lg text-white transition-all shadow-lg ml-auto"
                aria-label="Back to top"
                title="Back to top"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <MobileFooterDrawer open={siteLinksOpen} onOpenChange={setSiteLinksOpen} />
    </>
  );
}
