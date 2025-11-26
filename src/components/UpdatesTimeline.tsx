'use client';

import { useState, useEffect } from 'react';
import type { UpdatesData, TimelineEntry, Category } from '@/lib/updates';
import { getCategoryLabel, sortEntriesByDate, formatDate, getRelativeTime } from '@/lib/updates';
import { getErrorMessage } from '@/lib/utils';

interface UpdatesTimelineProps {
  onEdit?: (entry: TimelineEntry, category: Category) => void;
  refreshKey?: number;
  showEditButton?: boolean;
}

export function UpdatesTimeline({ onEdit, refreshKey, showEditButton = false }: UpdatesTimelineProps) {
  const [activeTab, setActiveTab] = useState<Category>('updates');
  const [data, setData] = useState<UpdatesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayedCount, setDisplayedCount] = useState<Record<Category, number>>({
    updates: 15,
    tasks: 15,
    ideas: 15,
    bugFixes: 15,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      // Add cache-busting parameter to ensure fresh data
      const response = await fetch(`/api/updates?t=${Date.now()}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to load updates');
      }
    } catch (err: any) {
      setError(getErrorMessage(err, 'Failed to load updates'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  // Reset displayed count when tab changes
  useEffect(() => {
    setDisplayedCount((prev) => ({
      ...prev,
      [activeTab]: 15, // Reset to initial count when switching tabs
    }));
  }, [activeTab]);

  const categories: Category[] = ['updates', 'tasks', 'ideas', 'bugFixes'];

  const getStatusBadge = (entry: TimelineEntry) => {
    if (!entry.status) return null;
    const statusColors: Record<string, string> = {
      completed: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      'in-progress': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
    };
    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${statusColors[entry.status] || ''}`}
      >
        {entry.status.replace('-', ' ')}
      </span>
    );
  };

  const getPriorityBadge = (entry: TimelineEntry) => {
    if (!entry.priority) return null;
    const priorityColors: Record<string, string> = {
      high: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
      medium: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
      low: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300',
    };
    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${priorityColors[entry.priority] || ''}`}
      >
        {entry.priority}
      </span>
    );
  };

  const getTypeBadge = (entry: TimelineEntry) => {
    const typeColors: Record<string, string> = {
      deployment: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
      feature: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300',
      improvement: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300',
      fix: 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300',
      other: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300',
    };
    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${typeColors[entry.type] || typeColors.other}`}
      >
        {entry.type}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-zinc-600 dark:text-zinc-400">Loading updates...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-600 dark:text-red-400">Error: {error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-zinc-600 dark:text-zinc-400">No data available</div>
      </div>
    );
  }

  const activeEntries = sortEntriesByDate(data[activeTab] || []);
  const displayedEntries = activeEntries.slice(0, displayedCount[activeTab]);
  const hasMore = activeEntries.length > displayedCount[activeTab];

  const handleLoadMore = () => {
    setDisplayedCount((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab] + 15, // Load 15 more items
    }));
  };

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 mb-6">
        <nav className="flex space-x-1 overflow-x-auto" aria-label="Tabs">
          {categories.map((category) => {
            const count = (data[category] || []).length;
            const isActive = activeTab === category;
            return (
              <button
                key={category}
                onClick={() => setActiveTab(category)}
                className={`
                  px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                  ${
                    isActive
                      ? 'border-[#02abb8] text-[#02abb8]'
                      : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }
                `}
              >
                {getCategoryLabel(category)}
                {count > 0 && (
                  <span
                    className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                      isActive
                        ? 'bg-[#02abb8]/20 text-[#02abb8]'
                        : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Timeline */}
      <div className="relative">
        {activeEntries.length === 0 ? (
          <div className="text-center py-12 text-zinc-600 dark:text-zinc-400">
            No {getCategoryLabel(activeTab).toLowerCase()} yet. Add one using the editor below.
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {displayedEntries.map((entry, index) => (
              <div
                key={entry.id}
                className="relative pl-8 pb-6 border-l-2 border-zinc-200 dark:border-zinc-800 last:border-l-0 last:pb-0"
              >
                {/* Timeline dot */}
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[#02abb8] border-2 border-white dark:border-zinc-950"></div>

                {/* Entry content */}
                <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                        {entry.title}
                      </h3>
                      <p className="text-zinc-600 dark:text-zinc-400 mb-3">{entry.description}</p>
                    </div>
                    {onEdit && showEditButton && (
                      <button
                        onClick={() => onEdit(entry, activeTab)}
                        className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors flex-shrink-0"
                        aria-label="Edit entry"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {getTypeBadge(entry)}
                    {getStatusBadge(entry)}
                    {getPriorityBadge(entry)}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-500">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{formatDate(entry.date)}</span>
                    <span className="text-zinc-400 dark:text-zinc-600">•</span>
                    <span>{getRelativeTime(entry.date)}</span>
                  </div>
                </div>
              </div>
              ))}
            </div>
            
            {/* Load More Button */}
            {hasMore && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  className="px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                >
                  Load More ({activeEntries.length - displayedCount[activeTab]} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

