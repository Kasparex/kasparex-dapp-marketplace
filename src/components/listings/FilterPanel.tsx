'use client';

import { useState } from 'react';
import { ListingCategory, ListingStatus, ListingFilters } from '@/lib/listings/types';

interface FilterPanelProps {
  filters: ListingFilters;
  onFiltersChange: (filters: ListingFilters) => void;
  availableTags: string[];
}

export function FilterPanel({ filters, onFiltersChange, availableTags }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  const categories = Object.values(ListingCategory);
  const statuses: ListingStatus[] = ['active', 'pending', 'archived'];

  const handleCategoryToggle = (category: ListingCategory) => {
    onFiltersChange({
      ...filters,
      category: filters.category === category ? undefined : category,
    });
  };

  const handleTagToggle = (tag: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    onFiltersChange({
      ...filters,
      tags: newTags.length > 0 ? newTags : undefined,
    });
  };

  const handleStatusToggle = (status: ListingStatus) => {
    onFiltersChange({
      ...filters,
      status: filters.status === status ? undefined : status,
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = filters.category || (filters.tags && filters.tags.length > 0) || filters.status;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Filters</h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          <svg
            className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="space-y-6">
          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="w-full px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              Clear All Filters
            </button>
          )}

          {/* Category Filter */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Category</h4>
            <div className="space-y-2">
              {categories.map(category => (
                <label key={category} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    checked={filters.category === category}
                    onChange={() => handleCategoryToggle(category)}
                    className="w-4 h-4 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700 focus:ring-zinc-500 dark:focus:ring-zinc-400"
                  />
                  <span className="ml-2 text-sm text-zinc-700 dark:text-zinc-300">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Status</h4>
            <div className="space-y-2">
              {statuses.map(status => (
                <label key={status} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    checked={filters.status === status}
                    onChange={() => handleStatusToggle(status)}
                    className="w-4 h-4 text-zinc-900 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700 focus:ring-zinc-500 dark:focus:ring-zinc-400"
                  />
                  <span className="ml-2 text-sm text-zinc-700 dark:text-zinc-300 capitalize">{status}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tags Filter */}
          {availableTags.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {availableTags.slice(0, 20).map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleTagToggle(tag)}
                    className={`px-2 py-1 text-xs font-medium rounded border transition-colors ${
                      filters.tags?.includes(tag)
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                        : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

