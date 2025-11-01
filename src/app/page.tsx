'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { DAppGrid } from '@/components/DAppGrid';
import { DAppDetail } from '@/components/DAppDetail';
import { Footer } from '@/components/Footer';
import { placeholderDApps } from '@/lib/dapps';
import { filterDAppsByCategory } from '@/lib/dapps';
import type { Category } from '@/lib/categories';
import type { DApp } from '@/lib/dapps';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [selectedDApp, setSelectedDApp] = useState<DApp | null>(null);

  const filteredDApps = filterDAppsByCategory(placeholderDApps, selectedCategory);

  const handleCategoryChange = (category: Category) => {
    setSelectedCategory(category);
    setSelectedDApp(null); // Reset selected dApp when changing category
  };

  const handleDAppClick = (dapp: DApp) => {
    setSelectedDApp(dapp);
  };

  const handleBack = () => {
    setSelectedDApp(null);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar */}
        <div className="hidden lg:block w-full lg:w-1/4 lg:max-w-xs flex-shrink-0">
          <Sidebar
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />
        </div>
        {/* Mobile sidebar (fixed positioning handled in component) */}
        <div className="lg:hidden">
          <Sidebar
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 lg:pl-6">
          {selectedDApp ? (
            <DAppDetail dapp={selectedDApp} onBack={handleBack} />
          ) : (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                  Available dApps
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400">
                  {filteredDApps.length} dApp{filteredDApps.length !== 1 ? 's' : ''} found
                </p>
              </div>
              <DAppGrid dapps={filteredDApps} onDAppClick={handleDAppClick} />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
