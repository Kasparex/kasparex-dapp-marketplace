import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BuildListSidebar } from '@/components/BuildListSidebar';

export default function BuildDAppPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar */}
        <BuildListSidebar title="Build dApp" />

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 lg:pl-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Build dApp
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8">
              Create and deploy your dApp on the Kasparex marketplace. This feature will be available soon with Connect Wallet integration.
            </p>
            
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-8 text-center">
              <div className="text-6xl mb-4">🚧</div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Coming Soon
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400">
                The Build dApp feature is under development. You will be able to create and deploy dApps directly from this page with wallet integration.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

