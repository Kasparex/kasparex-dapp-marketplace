import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="text-center max-w-md">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            404
          </h1>
          <h2 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-200 mb-4">
            dApp Not Found
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            The dApp you&apos;re looking for doesn&apos;t exist or may have been removed.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Categories
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

