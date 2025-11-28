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

  // Get first 4 dApps for demo
  const demoDApps = placeholderDApps.slice(0, 4);

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
    <div className="flex flex-col min-h-screen" style={{ background: '#1d061a' }}>
      <Header />
      
      <main className="flex-1 flex justify-center items-center py-10 px-4">
        <div className="demo-card-container">
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

