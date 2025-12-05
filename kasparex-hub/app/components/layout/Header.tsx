import { Link } from "@remix-run/react";
import { useState } from "react";
import { MobileMenu } from "./MobileMenu";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:supports-[backdrop-filter]:bg-zinc-950/80">
        <div className="flex h-16 items-center justify-between w-full">
          {/* Left side: Logo and Title */}
          <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 lg:pl-6">
            <Link
              to="/"
              className="flex items-center gap-2 sm:gap-3 relative group"
              title="Back to main page"
            >
              {/* Logo placeholder - will be replaced with actual image */}
              <div className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                <span className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  K
                </span>
              </div>
              <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-zinc-900 dark:text-zinc-100 whitespace-nowrap flex items-center gap-2">
                <span className="uppercase">
                  <span className="font-bold">KASPA</span>
                  <span className="font-normal">REX</span>
                </span>
                <span className="text-[#02abb8]">𐤊</span>
              </h1>
            </Link>
          </div>

          {/* Right side: Menu Icon */}
          <div className="flex items-center pr-2 sm:pr-4 lg:pr-6">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Open menu"
            >
              <svg
                className="w-6 h-6 text-zinc-900 dark:text-zinc-100"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </>
  );
}



