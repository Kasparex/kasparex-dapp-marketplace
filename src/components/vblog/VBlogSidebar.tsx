'use client';

import { useState } from 'react';
import { VBlogArticle } from '@/lib/vblog/types';

interface VBlogSidebarProps {
  articles: VBlogArticle[];
  selectedCategory: string | null;
  selectedTags: string[];
  searchQuery: string;
  onCategoryChange: (category: string | null) => void;
  onTagToggle: (tag: string) => void;
  onSearchChange: (query: string) => void;
}

export function VBlogSidebar({
  articles,
  selectedCategory,
  selectedTags,
  searchQuery,
  onCategoryChange,
  onTagToggle,
  onSearchChange,
}: VBlogSidebarProps) {
  // Extract unique categories and tags from articles
  const categories = Array.from(new Set(articles.map(a => a.category))).sort();
  const allTags = Array.from(new Set(articles.flatMap(a => a.tags))).sort();

  return (
    <div className="w-full lg:w-64 lg:flex-shrink-0">
      <div className="sticky top-20 space-y-6">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Search Articles
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by title or content..."
            className="w-full px-3 py-2 text-base bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02abb8] text-zinc-900 dark:text-zinc-100"
          />
        </div>

        {/* Categories */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
            Categories
          </label>
          <div className="space-y-2">
            <button
              onClick={() => onCategoryChange(null)}
              className={`w-full text-left px-3 py-2 rounded-lg text-base transition-colors ${
                selectedCategory === null
                  ? 'bg-[#02abb8] text-white'
                  : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => onCategoryChange(category)}
                className={`w-full text-left px-3 py-2 rounded-lg text-base transition-colors ${
                  selectedCategory === category
                    ? 'bg-[#02abb8] text-white'
                    : 'bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        {allTags.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => onTagToggle(tag)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-[#02abb8] text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Clear Filters */}
        {(selectedCategory !== null || selectedTags.length > 0 || searchQuery) && (
          <button
            onClick={() => {
              onCategoryChange(null);
              onSearchChange('');
              selectedTags.forEach(tag => onTagToggle(tag));
            }}
            className="w-full px-3 py-2 text-base text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Clear All Filters
          </button>
        )}
      </div>
    </div>
  );
}

