'use client';

import { useState, useEffect } from 'react';
import { calculateTraitFrequencies, type CollectionTraitStats } from '@/lib/nft/traits';
import { getCollectionById } from '@/lib/nft/collections';
import { getCollectionMetadata } from '@/lib/nft/collection-loader';
import { getCachedTraitStats, setCachedTraitStats } from '@/lib/nft/cache';

interface TraitAnalysisProps {
  collectionId: string;
}

export function TraitAnalysis({ collectionId }: TraitAnalysisProps) {
  const [stats, setStats] = useState<CollectionTraitStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [selectedTraitType, setSelectedTraitType] = useState<string | null>(null);

  const collection = getCollectionById(collectionId);

  useEffect(() => {
    // Reset when collection changes
    setStats(null);
    setSelectedTraitType(null);
  }, [collectionId]);

  // Background refresh function
  const loadStatsInBackground = async () => {
    try {
      const metadataList = await getCollectionMetadata(collectionId, false); // Force refresh
      if (metadataList.length > 0) {
        const traitStats = calculateTraitFrequencies(metadataList);
        setCachedTraitStats(collectionId, traitStats).catch(console.error);
        // Update stats if still on same collection
        setStats((currentStats) => {
          if (currentStats && currentStats.totalNFTs === traitStats.totalNFTs) {
            return traitStats;
          }
          return currentStats;
        });
      }
    } catch (error) {
      console.error('Background trait stats refresh failed:', error);
    }
  };

  const handleLoadStats = async () => {
    if (!collection) {
      setError('Collection not found');
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingProgress('Loading collection metadata...');

    try {
      // Check cache first
      setLoadingProgress('Loading trait statistics...');
      const cachedStats = await getCachedTraitStats<CollectionTraitStats>(collectionId);
      
      if (cachedStats) {
        setLoadingProgress('');
        setStats(cachedStats);
        // Select first trait type by default
        if (cachedStats.traitTypes.length > 0) {
          setSelectedTraitType(cachedStats.traitTypes[0].traitType);
        }
        setIsLoading(false);
        
        // Refresh in background
        loadStatsInBackground();
        return;
      }

      // Load full collection metadata for accurate trait analysis
      setLoadingProgress('Loading collection metadata...');
      const metadataList = await getCollectionMetadata(collectionId);
      setLoadingProgress('Analyzing traits...');

      if (metadataList.length === 0) {
        setError('No metadata found for this collection');
        setIsLoading(false);
        return;
      }

      const traitStats = calculateTraitFrequencies(metadataList);
      
      // Cache the trait stats
      setCachedTraitStats(collectionId, traitStats).catch(console.error);
      
      setLoadingProgress('');
      setStats(traitStats);
      
      // Select first trait type by default
      if (traitStats.traitTypes.length > 0) {
        setSelectedTraitType(traitStats.traitTypes[0].traitType);
      }
    } catch (err) {
      console.error('Error loading trait stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load trait statistics');
      setLoadingProgress('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Load Button */}
      {!stats && (
        <div>
            <button
              onClick={handleLoadStats}
              disabled={isLoading}
              className="px-6 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (loadingProgress || 'Loading...') : 'Load Trait Statistics'}
            </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Statistics */}
      {stats && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
              <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                Total NFTs Analyzed
              </div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {stats.totalNFTs}
              </div>
            </div>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
              <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                Trait Types
              </div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {stats.traitTypes.length}
              </div>
            </div>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg">
              <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                Total Unique Traits
              </div>
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {stats.traitTypes.reduce((sum, tt) => sum + tt.uniqueValues, 0)}
              </div>
            </div>
          </div>

          {/* Trait Type Selector */}
          {stats.traitTypes.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Select Trait Type
              </label>
              <select
                value={selectedTraitType || ''}
                onChange={(e) => setSelectedTraitType(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
              >
                {stats.traitTypes.map((tt) => (
                  <option key={tt.traitType} value={tt.traitType}>
                    {tt.traitType} ({tt.uniqueValues} values)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Trait Distribution */}
          {selectedTraitType && stats && (
            <div>
              <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                {selectedTraitType} Distribution
              </h4>
              <div className="space-y-2">
                {stats.traitTypes
                  .find((tt) => tt.traitType === selectedTraitType)
                  ?.frequencies.map((freq, index) => (
                    <div
                      key={index}
                      className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {freq.value}
                        </span>
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">
                          {freq.count} ({freq.percentage.toFixed(2)}%)
                        </span>
                      </div>
                      <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                        <div
                          className="bg-zinc-900 dark:bg-zinc-100 h-2 rounded-full transition-all"
                          style={{ width: `${freq.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* All Trait Types Overview */}
          <div>
            <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
              All Trait Types
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.traitTypes.map((traitType) => (
                <div
                  key={traitType.traitType}
                  className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                  onClick={() => setSelectedTraitType(traitType.traitType)}
                >
                  <div className="font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                    {traitType.traitType}
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    {traitType.uniqueValues} unique values
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

