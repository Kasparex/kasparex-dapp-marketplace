'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { knowledgeBaseCategories, type KnowledgeBaseCategory } from '@/lib/knowledgeBase';

interface KnowledgeBaseSidebarProps {
  selectedCategory: KnowledgeBaseCategory | 'all';
  onCategoryChange: (category: KnowledgeBaseCategory | 'all') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function KnowledgeBaseSidebar({
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
}: KnowledgeBaseSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedHidden = localStorage.getItem('kb-sidebar-hidden');
    const savedWidth = localStorage.getItem('kb-sidebar-width');
    if (savedHidden === 'true') setIsHidden(true);
    if (savedWidth) setSidebarWidth(parseInt(savedWidth, 10));
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('kb-sidebar-hidden', String(isHidden));
  }, [isHidden]);

  useEffect(() => {
    localStorage.setItem('kb-sidebar-width', String(sidebarWidth));
  }, [sidebarWidth]);

  // Handle mouse move for resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !sidebarRef.current) return;

      const newWidth = e.clientX;
      const minWidth = 200;
      const maxWidth = 500;

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-20 left-4 z-50 p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg"
        aria-label="Toggle sidebar"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Show Sidebar Button - Fixed when hidden */}
      {isHidden && (
        <button
          onClick={() => setIsHidden(false)}
          className="hidden lg:block fixed left-0 top-20 z-[60] p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
          aria-label="Show sidebar"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`
          fixed lg:sticky top-16 lg:top-0 left-0 z-40
          h-[calc(100vh-4rem)] lg:h-screen
          bg-white dark:bg-zinc-950
          border-r border-zinc-200 dark:border-zinc-800
          transform transition-all duration-300 ease-in-out
          overflow-y-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isHidden ? 'lg:translate-x-[-100%]' : ''}
        `}
        style={{
          width: isHidden ? 0 : `${sidebarWidth}px`,
          minWidth: isHidden ? 0 : `${sidebarWidth}px`,
          maxWidth: isHidden ? 0 : `${sidebarWidth}px`,
          cursor: isResizing ? 'col-resize' : ''
        }}
        onMouseMove={(e) => {
          if (!isHidden && !isResizing && sidebarRef.current) {
            const rect = sidebarRef.current.getBoundingClientRect();
            const isOnBorder = e.clientX >= rect.right - 4 && e.clientX <= rect.right;
            sidebarRef.current.style.cursor = isOnBorder ? 'col-resize' : '';
            if (isOnBorder) {
              sidebarRef.current.style.borderRight = '2px solid #06b6d4';
            } else {
              sidebarRef.current.style.borderRight = '';
            }
          }
        }}
        onMouseLeave={() => {
          if (sidebarRef.current && !isResizing) {
            sidebarRef.current.style.borderRight = '';
          }
        }}
        onMouseDown={(e) => {
          if (!isHidden && sidebarRef.current) {
            const rect = sidebarRef.current.getBoundingClientRect();
            if (e.clientX >= rect.right - 4 && e.clientX <= rect.right) {
              e.preventDefault();
              setIsResizing(true);
            }
          }
        }}
      >
        {/* Header with Hide Button and Search */}
        <div className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Knowledge Base
            </h3>
            <button
              onClick={() => setIsHidden(true)}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
              aria-label="Hide sidebar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02abb8] text-zinc-900 dark:text-zinc-100"
          />
        </div>

        {/* Categories */}
        {!isHidden && (
          <div className="p-4">
            <div className="mb-4">
              <button
                onClick={() => onCategoryChange('all')}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-[#02abb8]/10 text-[#02abb8] font-medium'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                All Articles
              </button>
            </div>

            <div className="space-y-1">
              {knowledgeBaseCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => onCategoryChange(category.id)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-[#02abb8]/10 text-[#02abb8] font-medium'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

