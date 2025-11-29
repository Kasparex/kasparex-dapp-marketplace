'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import Link from 'next/link';

export default function StyleGuidePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('buttons');

  const categories = [
    { id: 'buttons', label: 'Buttons' },
    { id: 'inputs', label: 'Inputs & Forms' },
    { id: 'checkboxes', label: 'Checkboxes' },
    { id: 'icons', label: 'Icons' },
    { id: 'cards', label: 'Cards' },
    { id: 'modals', label: 'Modals' },
    { id: 'sidebars', label: 'Sidebars' },
    { id: 'badges', label: 'Badges & Tags' },
    { id: 'typography', label: 'Typography' },
    { id: 'colors', label: 'Colors' },
  ];

  const styleElements = {
    buttons: [
      {
        name: 'Primary Button (Turquoise)',
        description: 'Main action buttons, show sidebar buttons',
        className: 'px-4 py-2 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors text-sm',
        example: (
          <button className="px-4 py-2 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors text-sm">
            Primary Button
          </button>
        ),
      },
      {
        name: 'Secondary Button (Dark Gray)',
        description: 'Back to Categories, secondary actions',
        className: 'px-4 py-2 bg-zinc-700 hover:bg-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors text-sm',
        example: (
          <button className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors text-sm">
            Secondary Button
          </button>
        ),
      },
      {
        name: 'Ghost Button',
        description: 'Icon buttons, hide sidebar buttons',
        className: 'p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors',
        example: (
          <button className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ),
      },
      {
        name: 'View Mode Button (Active)',
        description: 'Active state for view switcher buttons',
        className: 'px-3 py-2 text-sm font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100',
        example: (
          <button className="px-3 py-2 text-sm font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
            Active
          </button>
        ),
      },
      {
        name: 'View Mode Button (Inactive)',
        description: 'Inactive state for view switcher buttons',
        className: 'px-3 py-2 text-sm font-medium bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800',
        example: (
          <button className="px-3 py-2 text-sm font-medium bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800">
            Inactive
          </button>
        ),
      },
    ],
    inputs: [
      {
        name: 'Search Input',
        description: 'Search boxes in sidebars',
        className: 'w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02abb8] text-zinc-900 dark:text-zinc-100',
        example: (
          <input
            type="text"
            placeholder="Search..."
            className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#02abb8] text-zinc-900 dark:text-zinc-100"
          />
        ),
      },
      {
        name: 'Dropdown Button',
        description: 'Sort filters, select dropdowns',
        className: 'w-full flex items-center justify-between px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors',
        example: (
          <button className="w-full flex items-center justify-between px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
            <span>Select option</span>
            <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        ),
      },
    ],
    checkboxes: [
      {
        name: 'Custom Checkbox (Checked)',
        description: 'Category filters, status filters',
        className: 'checkbox-custom relative flex items-center gap-3 px-4 py-2 rounded-lg transition-colors pl-8 bg-zinc-50 dark:bg-zinc-900/50',
        example: (
          <label className="checkbox-custom relative flex items-center gap-3 px-4 py-2 rounded-lg transition-colors pl-8 bg-zinc-50 dark:bg-zinc-900/50">
            <input type="checkbox" checked className="hidden" />
            <div className="control__indicator"></div>
            <span className="text-sm text-zinc-700 dark:text-zinc-300">Checked</span>
          </label>
        ),
      },
      {
        name: 'Custom Checkbox (Unchecked)',
        description: 'Category filters, status filters',
        className: 'checkbox-custom relative flex items-center gap-3 px-4 py-2 rounded-lg transition-colors pl-8 hover:bg-zinc-50 dark:hover:bg-zinc-900/30',
        example: (
          <label className="checkbox-custom relative flex items-center gap-3 px-4 py-2 rounded-lg transition-colors pl-8 hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
            <input type="checkbox" className="hidden" />
            <div className="control__indicator"></div>
            <span className="text-sm text-zinc-700 dark:text-zinc-300">Unchecked</span>
          </label>
        ),
      },
    ],
    icons: [
      {
        name: 'Standard Icon',
        description: 'Default icon styling',
        className: 'w-4 h-4 text-zinc-600 dark:text-zinc-400',
        example: (
          <svg className="w-4 h-4 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        ),
      },
      {
        name: 'Icon in Button',
        description: 'Icons inside buttons',
        className: 'w-4 h-4',
        example: (
          <button className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        ),
      },
    ],
    cards: [
      {
        name: 'dApp Card',
        description: 'Main dApp listing cards',
        className: 'bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 hover:shadow-lg transition-shadow',
        example: (
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 hover:shadow-lg transition-shadow">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Card Title</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Card content</p>
          </div>
        ),
      },
      {
        name: 'Status Box',
        description: 'KREX Status, NFT Status boxes',
        className: 'p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800',
        example: (
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Status Box</h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">Content</p>
          </div>
        ),
      },
    ],
    modals: [
      {
        name: 'Modal Backdrop',
        description: 'Modal overlay background',
        className: 'bg-black/70 backdrop-blur-md',
        example: (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 max-w-md">
              <h3 className="text-lg font-semibold mb-4">Modal Content</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Modal body</p>
            </div>
          </div>
        ),
      },
    ],
    sidebars: [
      {
        name: 'Sidebar Container',
        description: 'Main sidebar wrapper',
        className: 'bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 h-screen overflow-y-auto',
        example: (
          <div className="bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 h-64 overflow-y-auto p-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Sidebar content</p>
          </div>
        ),
      },
      {
        name: 'Sidebar Header',
        description: 'Sidebar header section',
        className: 'bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 p-4',
        example: (
          <div className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 p-4">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Header Title</h3>
          </div>
        ),
      },
    ],
    badges: [
      {
        name: 'Count Badge',
        description: 'Category counts, notification badges',
        className: 'text-xs px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400',
        example: (
          <span className="text-xs px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">42</span>
        ),
      },
      {
        name: 'Status Badge',
        description: 'Status indicators',
        className: 'px-2 py-1 text-xs font-medium rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
        example: (
          <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">Active</span>
        ),
      },
    ],
    typography: [
      {
        name: 'Heading 1',
        description: 'Page titles',
        className: 'text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-100',
        example: <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-100">Heading 1</h1>,
      },
      {
        name: 'Heading 2',
        description: 'Section titles',
        className: 'text-2xl font-bold text-zinc-900 dark:text-zinc-100',
        example: <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Heading 2</h2>,
      },
      {
        name: 'Heading 3',
        description: 'Subsection titles',
        className: 'text-sm font-semibold text-zinc-900 dark:text-zinc-100',
        example: <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Heading 3</h3>,
      },
      {
        name: 'Body Text',
        description: 'Regular content',
        className: 'text-sm text-zinc-600 dark:text-zinc-400',
        example: <p className="text-sm text-zinc-600 dark:text-zinc-400">Body text content</p>,
      },
      {
        name: 'Small Text',
        description: 'Labels, captions',
        className: 'text-xs text-zinc-600 dark:text-zinc-400',
        example: <p className="text-xs text-zinc-600 dark:text-zinc-400">Small text</p>,
      },
    ],
    colors: [
      {
        name: 'Primary Turquoise',
        description: 'Main brand color',
        className: 'bg-[#02abb8] text-white',
        example: <div className="w-24 h-24 bg-[#02abb8] rounded-lg flex items-center justify-center text-white font-semibold">#02abb8</div>,
      },
      {
        name: 'Primary Turquoise Hover',
        description: 'Hover state',
        className: 'bg-[#028a94] text-white',
        example: <div className="w-24 h-24 bg-[#028a94] rounded-lg flex items-center justify-center text-white font-semibold">#028a94</div>,
      },
      {
        name: 'Zinc 50',
        description: 'Light backgrounds',
        className: 'bg-zinc-50 dark:bg-zinc-900',
        example: <div className="w-24 h-24 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg"></div>,
      },
      {
        name: 'Zinc 100',
        description: 'Hover states, active states',
        className: 'bg-zinc-100 dark:bg-zinc-800',
        example: <div className="w-24 h-24 bg-zinc-100 dark:bg-zinc-800 rounded-lg"></div>,
      },
      {
        name: 'Zinc 200/800',
        description: 'Borders',
        className: 'border-zinc-200 dark:border-zinc-800',
        example: <div className="w-24 h-24 border-2 border-zinc-200 dark:border-zinc-800 rounded-lg"></div>,
      },
      {
        name: 'Zinc 600/400',
        description: 'Secondary text',
        className: 'text-zinc-600 dark:text-zinc-400',
        example: <div className="w-24 h-24 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-center text-zinc-600 dark:text-zinc-400 text-xs">Text</div>,
      },
      {
        name: 'Zinc 700/800',
        description: 'Dark gray buttons',
        className: 'bg-zinc-700 dark:bg-zinc-800',
        example: <div className="w-24 h-24 bg-zinc-700 dark:bg-zinc-800 rounded-lg flex items-center justify-center text-white text-xs">Button</div>,
      },
    ],
  };

  const currentElements = styleElements[selectedCategory as keyof typeof styleElements] || [];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        <div className="flex flex-col lg:flex-row">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 h-screen overflow-y-auto">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Style Guide</h2>
              <nav className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-[#02abb8]/10 text-[#02abb8] font-medium'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0 p-8">
            <div className="max-w-6xl mx-auto">
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                  Kasparex Design System
                </h1>
                <p className="text-lg text-zinc-600 dark:text-zinc-400">
                  Complete reference guide for all UI components and styling standards
                </p>
              </div>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                  {categories.find(c => c.id === selectedCategory)?.label}
                </h2>
              </div>

              <div className="space-y-6">
                {currentElements.map((element, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6"
                  >
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                        {element.name}
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                        {element.description}
                      </p>
                      <div className="bg-zinc-50 dark:bg-zinc-950 rounded p-3 mb-4">
                        <code className="text-xs text-zinc-700 dark:text-zinc-300 break-all">
                          {element.className}
                        </code>
                      </div>
                    </div>
                    <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                      <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-2 uppercase tracking-wide">
                        Preview
                      </p>
                      <div className="flex items-center gap-4">
                        {element.example}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

