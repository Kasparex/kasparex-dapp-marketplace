import { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { KrexNodeDocSidebar } from '@/components/nodes/KrexNodeDocSidebar';
import { KrexNodeRunGuideContent } from '@/components/nodes/KrexNodeRunGuideContent';

export const metadata: Metadata = {
  title: 'Run a KREX Node · Join Kasparex',
  description: 'Kasparex is a community-powered layer that keeps the Kasparex dApp Marketplace online, fast, and censorship-resistant.',
};

export default function KREXNodePage() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="flex min-h-[calc(100vh-4rem)] flex-1 flex-col lg:flex-row">
        <KrexNodeDocSidebar />
        <div className="min-w-0 flex-1 overflow-y-auto border-l border-zinc-200 p-4 sm:p-6 lg:p-12 dark:border-zinc-800">
          <KrexNodeRunGuideContent />
        </div>
      </main>

      <Footer />
    </div>
  );
}

