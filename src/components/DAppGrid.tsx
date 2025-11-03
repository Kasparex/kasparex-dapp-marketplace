import { DApp } from '@/lib/dapps';
import { DAppCard } from './DAppCard';

interface DAppGridProps {
  dapps: DApp[];
  // Favorites and likes are handled internally by DAppCard using hooks
}

export function DAppGrid({ dapps }: DAppGridProps) {
  if (dapps.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-500 dark:text-zinc-400">
          No dApps found in this category.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
      {dapps.map((dapp) => (
        <DAppCard 
          key={dapp.id} 
          dapp={dapp}
        />
      ))}
    </div>
  );
}

