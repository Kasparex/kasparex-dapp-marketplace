import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ChroniclesSidebar } from '@/components/chronicles/ChroniclesSidebar';

export default function ChroniclesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <div className="flex flex-1">
        <ChroniclesSidebar />
        <main className="flex-1 w-full p-6 sm:p-8 lg:p-10 lg:pl-8 overflow-y-auto bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 text-[15px] sm:text-[16px] leading-relaxed">
          <div className="max-w-7xl mx-auto px-1 sm:px-2">{children}</div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
