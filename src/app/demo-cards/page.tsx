'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DemoCard } from '@/components/DemoCard';
import { placeholderDApps } from '@/lib/dapps';
import { extractColorsFromImage, getCategoryGradientColors } from '@/lib/utils/colorExtraction';
import { loadDAppLogo } from '@/lib/dapps/contractData';

export default function DemoCardsPage() {
  const [cardGradients, setCardGradients] = useState<Map<number, [string, string]>>(new Map());

  // Get first 3 dApps for demo
  const demoDApps = placeholderDApps.slice(0, 3);

  useEffect(() => {
    // Extract colors for each dApp
    const extractAllColors = async () => {
      const gradients = new Map<number, [string, string]>();

      for (let i = 0; i < demoDApps.length; i++) {
        const dapp = demoDApps[i];
        
        // Try to get logo URL
        let logoUrl: string | null = null;
        
        // Check if dApp has image property
        if (dapp.image) {
          logoUrl = dapp.image;
        } else {
          // Try to load from localStorage
          logoUrl = loadDAppLogo(dapp.id);
        }

        if (logoUrl) {
          try {
            const colors = await extractColorsFromImage(logoUrl);
            gradients.set(i, colors);
          } catch (error) {
            // Fallback to category-based colors
            const fallbackColors = getCategoryGradientColors(dapp.category);
            gradients.set(i, fallbackColors);
          }
        } else {
          // No logo, use category-based colors
          const fallbackColors = getCategoryGradientColors(dapp.category);
          gradients.set(i, fallbackColors);
        }
      }

      setCardGradients(gradients);
    };

    extractAllColors();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            Demo: Gradient Mouse Follow Effect
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400">
            Move your mouse over the cards to see the subtle gradient effect following your cursor
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {demoDApps.map((dapp, index) => {
            const gradient = cardGradients.get(index) || getCategoryGradientColors(dapp.category);
            return (
              <DemoCard
                key={dapp.id}
                dapp={dapp}
                gradientColors={gradient}
                index={index}
              />
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}

