/**
 * Kaspa Dashboard Page
 * 
 * Displays real-time Kaspa network information with BlockDAG visualizer
 */

'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { KaspaStatCard } from '@/components/KaspaStatCard';
import { BlockDAGVisualizer } from '@/components/BlockDAGVisualizer';
import { fetchNetworkStats, fetchLatestBlocks } from '@/lib/kaspa/api';
import type { KaspaNetworkStats, KaspaBlock } from '@/lib/kaspa/types';

export default function DashboardPage() {
  const [networkStats, setNetworkStats] = useState<KaspaNetworkStats | null>(null);
  const [blocks, setBlocks] = useState<KaspaBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      loadData();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [stats, latestBlocks] = await Promise.all([
        fetchNetworkStats(),
        fetchLatestBlocks(20),
      ]);

      setNetworkStats(stats);
      setBlocks(latestBlocks);
      setLastUpdate(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load network data';
      setError(errorMessage);
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatHashrate = (hashrate?: number): string => {
    if (!hashrate) return 'N/A';
    if (hashrate >= 1e18) return `${(hashrate / 1e18).toFixed(2)} EH/s`;
    if (hashrate >= 1e15) return `${(hashrate / 1e15).toFixed(2)} PH/s`;
    if (hashrate >= 1e12) return `${(hashrate / 1e12).toFixed(2)} TH/s`;
    if (hashrate >= 1e9) return `${(hashrate / 1e9).toFixed(2)} GH/s`;
    return `${(hashrate / 1e6).toFixed(2)} MH/s`;
  };

  const formatSupply = (supply?: number, maxSupply?: number): string => {
    if (!supply) return 'N/A';
    const formatted = (supply / 1e8).toFixed(2); // Kaspa has 8 decimals
    if (maxSupply) {
      const maxFormatted = (maxSupply / 1e8).toFixed(2);
      return `${formatted} / ${maxFormatted} KAS`;
    }
    return `${formatted} KAS`;
  };

  const getHealthIcon = (health?: string) => {
    switch (health) {
      case 'healthy':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'degraded':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Kaspa Network Dashboard
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Real-time Kaspa blockchain network information and BlockDAG visualization
            </p>
            {lastUpdate && (
              <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-2">
                Last updated: {lastUpdate.toLocaleTimeString()}
              </p>
            )}
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-red-800 dark:text-red-300 font-medium mb-2">{error}</p>
              <button
                onClick={loadData}
                className="px-4 py-2 bg-[#02abb8] text-white rounded-lg hover:bg-[#028a94] transition-colors text-sm font-medium"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && !networkStats && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#02abb8]"></div>
            </div>
          )}

          {/* Network Stats Cards */}
          {networkStats && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <KaspaStatCard
                  title="Block Height"
                  value={networkStats.networkInfo.blockHeight}
                  subtitle={`Blue Score: ${networkStats.networkInfo.blueScore?.toLocaleString() || 'N/A'}`}
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                  isLoading={isLoading}
                />

                <KaspaStatCard
                  title="Hashrate"
                  value={formatHashrate(networkStats.networkInfo.hashrate)}
                  subtitle="Network hashing power"
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  }
                  isLoading={isLoading}
                />

                <KaspaStatCard
                  title="Supply"
                  value={formatSupply(networkStats.networkInfo.supply, networkStats.networkInfo.maxSupply)}
                  subtitle="Circulating / Max"
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  isLoading={isLoading}
                />

                <KaspaStatCard
                  title="Network Health"
                  value={networkStats.health || 'unknown'}
                  subtitle={networkStats.networkInfo.nodeCount ? `${networkStats.networkInfo.nodeCount} nodes` : 'N/A'}
                  icon={getHealthIcon(networkStats.health)}
                  isLoading={isLoading}
                  variant={networkStats.health === 'healthy' ? 'success' : networkStats.health === 'degraded' ? 'warning' : 'danger'}
                />

                <KaspaStatCard
                  title="Transactions"
                  value={networkStats.networkInfo.totalTransactions}
                  subtitle={networkStats.networkInfo.tps ? `${networkStats.networkInfo.tps.toFixed(2)} TPS` : 'N/A'}
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  }
                  isLoading={isLoading}
                />

                <KaspaStatCard
                  title="Difficulty"
                  value={networkStats.networkInfo.difficulty}
                  subtitle={`DAA Score: ${networkStats.networkInfo.daaScore?.toLocaleString() || 'N/A'}`}
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  }
                  isLoading={isLoading}
                />

                <KaspaStatCard
                  title="Block Time"
                  value={networkStats.networkInfo.averageBlockTime ? `${networkStats.networkInfo.averageBlockTime.toFixed(2)}s` : 'N/A'}
                  subtitle="Average time between blocks"
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  isLoading={isLoading}
                />

                <KaspaStatCard
                  title="Nodes"
                  value={networkStats.networkInfo.nodeCount}
                  subtitle="Active network nodes"
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                    </svg>
                  }
                  isLoading={isLoading}
                />
              </div>

              {/* BlockDAG Visualizer */}
              <div className="mb-8">
                <BlockDAGVisualizer
                  blocks={blocks}
                  autoRefresh={true}
                  refreshInterval={10000}
                />
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

