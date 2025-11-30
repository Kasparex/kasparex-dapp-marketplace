'use client';

import { useState, useRef, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import Link from 'next/link';

export default function StyleGuidePage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Sidebar state
  const [isHidden, setIsHidden] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Load sidebar state from localStorage
  useEffect(() => {
    const savedHidden = localStorage.getItem('style-guide-sidebar-hidden');
    const savedWidth = localStorage.getItem('style-guide-sidebar-width');
    if (savedHidden === 'true') setIsHidden(true);
    if (savedWidth) setSidebarWidth(parseInt(savedWidth, 10));
  }, []);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('style-guide-sidebar-hidden', String(isHidden));
  }, [isHidden]);

  useEffect(() => {
    localStorage.setItem('style-guide-sidebar-width', String(sidebarWidth));
  }, [sidebarWidth]);

  // Handle resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !sidebarRef.current) return;
      const sidebarRect = sidebarRef.current.getBoundingClientRect();
      const newWidth = e.clientX - sidebarRect.left;
      if (newWidth >= 200 && newWidth <= 500) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const categories = [
    { id: 'buttons', label: 'Buttons', icon: '🔘' },
    { id: 'inputs', label: 'Inputs & Forms', icon: '📝' },
    { id: 'checkboxes', label: 'Checkboxes', icon: '☑️' },
    { id: 'icons', label: 'Icons', icon: '🎨' },
    { id: 'cards', label: 'Cards', icon: '🃏' },
    { id: 'modals', label: 'Modals', icon: '🪟' },
    { id: 'sidebars', label: 'Sidebars', icon: '📋' },
    { id: 'badges', label: 'Badges & Tags', icon: '🏷️' },
    { id: 'typography', label: 'Typography', icon: '✍️' },
    { id: 'colors', label: 'Colors', icon: '🎨' },
  ];

  const styleElements: Record<string, any[]> = {
    buttons: [
      {
        id: 'primary',
        name: 'Primary Button',
        description: 'Main action buttons, primary CTAs',
        className: 'px-4 py-2 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors text-sm',
        example: (
          <button className="px-4 py-2 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors text-sm">
            Primary Button
          </button>
        ),
      },
      {
        id: 'secondary',
        name: 'Secondary Button',
        description: 'Secondary actions, less prominent',
        className: 'px-4 py-2 bg-zinc-700 hover:bg-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors text-sm',
        example: (
          <button className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors text-sm">
            Secondary Button
          </button>
        ),
      },
      {
        id: 'ghost',
        name: 'Ghost Button',
        description: 'Icon buttons, minimal styling',
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
        id: 'outline',
        name: 'Outline Button',
        description: 'Bordered buttons for secondary actions',
        className: 'px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg font-medium transition-colors text-sm',
        example: (
          <button className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg font-medium transition-colors text-sm">
            Outline Button
          </button>
        ),
      },
    ],
    inputs: [
      {
        id: 'search',
        name: 'Search Input',
        description: 'Search boxes in sidebars and headers',
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
        id: 'dropdown',
        name: 'Dropdown Button',
        description: 'Select dropdowns and filters',
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
        id: 'checked',
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
        id: 'unchecked',
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
        id: 'standard',
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
        id: 'button',
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
        id: 'basic',
        name: 'Basic Card',
        description: 'Standard card with border and padding',
        className: 'bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6',
        example: (
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Card Title</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Card content goes here</p>
          </div>
        ),
      },
      {
        id: 'hover',
        name: 'Hover Card',
        description: 'Card with hover shadow effect',
        className: 'bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 hover:shadow-lg transition-shadow',
        example: (
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 hover:shadow-lg transition-shadow">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Hover Card</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Hover to see shadow effect</p>
          </div>
        ),
      },
      {
        id: 'status',
        name: 'Status Box',
        description: 'Status information boxes',
        className: 'p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800',
        example: (
          <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Status Box</h4>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">Status information</p>
          </div>
        ),
      },
    ],
    modals: [
      {
        id: 'basic',
        name: 'Basic Modal',
        description: 'Modal with backdrop and close button',
        className: 'fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center',
        example: (
          <div className="relative">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg font-medium transition-colors text-sm"
            >
              Open Modal
            </button>
          </div>
        ),
      },
    ],
    sidebars: [
      {
        id: 'container',
        name: 'Sidebar Container',
        description: 'Main sidebar wrapper',
        className: 'bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 h-screen overflow-y-auto',
        example: (
          <div className="bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 h-64 overflow-y-auto p-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Sidebar content</p>
          </div>
        ),
      },
    ],
    badges: [
      {
        id: 'count',
        name: 'Count Badge',
        description: 'Category counts, notification badges',
        className: 'text-xs px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400',
        example: (
          <span className="text-xs px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">42</span>
        ),
      },
      {
        id: 'status',
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
        id: 'h1',
        name: 'Heading 1',
        description: 'Page titles',
        className: 'text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-100',
        example: <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-100">Heading 1</h1>,
      },
      {
        id: 'h2',
        name: 'Heading 2',
        description: 'Section titles',
        className: 'text-2xl font-bold text-zinc-900 dark:text-zinc-100',
        example: <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Heading 2</h2>,
      },
      {
        id: 'h3',
        name: 'Heading 3',
        description: 'Subsection titles',
        className: 'text-sm font-semibold text-zinc-900 dark:text-zinc-100',
        example: <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Heading 3</h3>,
      },
      {
        id: 'body',
        name: 'Body Text',
        description: 'Regular content',
        className: 'text-sm text-zinc-600 dark:text-zinc-400',
        example: <p className="text-sm text-zinc-600 dark:text-zinc-400">Body text content</p>,
      },
    ],
    colors: [
      {
        id: 'slate',
        name: 'Slate',
        description: 'Slate color palette',
        colors: ['slate-50', 'slate-100', 'slate-200', 'slate-300', 'slate-400', 'slate-500', 'slate-600', 'slate-700', 'slate-800', 'slate-900', 'slate-950'],
      },
      {
        id: 'gray',
        name: 'Gray',
        description: 'Gray color palette',
        colors: ['gray-50', 'gray-100', 'gray-200', 'gray-300', 'gray-400', 'gray-500', 'gray-600', 'gray-700', 'gray-800', 'gray-900', 'gray-950'],
      },
      {
        id: 'zinc',
        name: 'Zinc',
        description: 'Zinc color palette',
        colors: ['zinc-50', 'zinc-100', 'zinc-200', 'zinc-300', 'zinc-400', 'zinc-500', 'zinc-600', 'zinc-700', 'zinc-800', 'zinc-900', 'zinc-950'],
      },
      {
        id: 'red',
        name: 'Red',
        description: 'Red color palette',
        colors: ['red-50', 'red-100', 'red-200', 'red-300', 'red-400', 'red-500', 'red-600', 'red-700', 'red-800', 'red-900', 'red-950'],
      },
      {
        id: 'orange',
        name: 'Orange',
        description: 'Orange color palette',
        colors: ['orange-50', 'orange-100', 'orange-200', 'orange-300', 'orange-400', 'orange-500', 'orange-600', 'orange-700', 'orange-800', 'orange-900', 'orange-950'],
      },
      {
        id: 'amber',
        name: 'Amber',
        description: 'Amber color palette',
        colors: ['amber-50', 'amber-100', 'amber-200', 'amber-300', 'amber-400', 'amber-500', 'amber-600', 'amber-700', 'amber-800', 'amber-900', 'amber-950'],
      },
      {
        id: 'yellow',
        name: 'Yellow',
        description: 'Yellow color palette',
        colors: ['yellow-50', 'yellow-100', 'yellow-200', 'yellow-300', 'yellow-400', 'yellow-500', 'yellow-600', 'yellow-700', 'yellow-800', 'yellow-900', 'yellow-950'],
      },
      {
        id: 'lime',
        name: 'Lime',
        description: 'Lime color palette',
        colors: ['lime-50', 'lime-100', 'lime-200', 'lime-300', 'lime-400', 'lime-500', 'lime-600', 'lime-700', 'lime-800', 'lime-900', 'lime-950'],
      },
      {
        id: 'green',
        name: 'Green',
        description: 'Green color palette',
        colors: ['green-50', 'green-100', 'green-200', 'green-300', 'green-400', 'green-500', 'green-600', 'green-700', 'green-800', 'green-900', 'green-950'],
      },
      {
        id: 'emerald',
        name: 'Emerald',
        description: 'Emerald color palette',
        colors: ['emerald-50', 'emerald-100', 'emerald-200', 'emerald-300', 'emerald-400', 'emerald-500', 'emerald-600', 'emerald-700', 'emerald-800', 'emerald-900', 'emerald-950'],
      },
      {
        id: 'teal',
        name: 'Teal',
        description: 'Teal color palette',
        colors: ['teal-50', 'teal-100', 'teal-200', 'teal-300', 'teal-400', 'teal-500', 'teal-600', 'teal-700', 'teal-800', 'teal-900', 'teal-950'],
      },
      {
        id: 'cyan',
        name: 'Cyan',
        description: 'Cyan color palette',
        colors: ['cyan-50', 'cyan-100', 'cyan-200', 'cyan-300', 'cyan-400', 'cyan-500', 'cyan-600', 'cyan-700', 'cyan-800', 'cyan-900', 'cyan-950'],
      },
      {
        id: 'sky',
        name: 'Sky',
        description: 'Sky color palette',
        colors: ['sky-50', 'sky-100', 'sky-200', 'sky-300', 'sky-400', 'sky-500', 'sky-600', 'sky-700', 'sky-800', 'sky-900', 'sky-950'],
      },
      {
        id: 'blue',
        name: 'Blue',
        description: 'Blue color palette',
        colors: ['blue-50', 'blue-100', 'blue-200', 'blue-300', 'blue-400', 'blue-500', 'blue-600', 'blue-700', 'blue-800', 'blue-900', 'blue-950'],
      },
      {
        id: 'indigo',
        name: 'Indigo',
        description: 'Indigo color palette',
        colors: ['indigo-50', 'indigo-100', 'indigo-200', 'indigo-300', 'indigo-400', 'indigo-500', 'indigo-600', 'indigo-700', 'indigo-800', 'indigo-900', 'indigo-950'],
      },
      {
        id: 'violet',
        name: 'Violet',
        description: 'Violet color palette',
        colors: ['violet-50', 'violet-100', 'violet-200', 'violet-300', 'violet-400', 'violet-500', 'violet-600', 'violet-700', 'violet-800', 'violet-900', 'violet-950'],
      },
      {
        id: 'purple',
        name: 'Purple',
        description: 'Purple color palette',
        colors: ['purple-50', 'purple-100', 'purple-200', 'purple-300', 'purple-400', 'purple-500', 'purple-600', 'purple-700', 'purple-800', 'purple-900', 'purple-950'],
      },
      {
        id: 'fuchsia',
        name: 'Fuchsia',
        description: 'Fuchsia color palette',
        colors: ['fuchsia-50', 'fuchsia-100', 'fuchsia-200', 'fuchsia-300', 'fuchsia-400', 'fuchsia-500', 'fuchsia-600', 'fuchsia-700', 'fuchsia-800', 'fuchsia-900', 'fuchsia-950'],
      },
      {
        id: 'pink',
        name: 'Pink',
        description: 'Pink color palette',
        colors: ['pink-50', 'pink-100', 'pink-200', 'pink-300', 'pink-400', 'pink-500', 'pink-600', 'pink-700', 'pink-800', 'pink-900', 'pink-950'],
      },
      {
        id: 'rose',
        name: 'Rose',
        description: 'Rose color palette',
        colors: ['rose-50', 'rose-100', 'rose-200', 'rose-300', 'rose-400', 'rose-500', 'rose-600', 'rose-700', 'rose-800', 'rose-900', 'rose-950'],
      },
    ],
  };

  // Tailwind color values mapping
  const colorValues: Record<string, Record<string, string>> = {
    slate: {
      '50': '#f8fafc', '100': '#f1f5f9', '200': '#e2e8f0', '300': '#cbd5e1', '400': '#94a3b8',
      '500': '#64748b', '600': '#475569', '700': '#334155', '800': '#1e293b', '900': '#0f172a', '950': '#020617'
    },
    gray: {
      '50': '#f9fafb', '100': '#f3f4f6', '200': '#e5e7eb', '300': '#d1d5db', '400': '#9ca3af',
      '500': '#6b7280', '600': '#4b5563', '700': '#374151', '800': '#1f2937', '900': '#111827', '950': '#030712'
    },
    zinc: {
      '50': '#fafafa', '100': '#f4f4f5', '200': '#e4e4e7', '300': '#d4d4d8', '400': '#a1a1aa',
      '500': '#71717a', '600': '#52525b', '700': '#3f3f46', '800': '#27272a', '900': '#18181b', '950': '#09090b'
    },
    red: {
      '50': '#fef2f2', '100': '#fee2e2', '200': '#fecaca', '300': '#fca5a5', '400': '#f87171',
      '500': '#ef4444', '600': '#dc2626', '700': '#b91c1c', '800': '#991b1b', '900': '#7f1d1d', '950': '#450a0a'
    },
    orange: {
      '50': '#fff7ed', '100': '#ffedd5', '200': '#fed7aa', '300': '#fdba74', '400': '#fb923c',
      '500': '#f97316', '600': '#ea580c', '700': '#c2410c', '800': '#9a3412', '900': '#7c2d12', '950': '#431407'
    },
    amber: {
      '50': '#fffbeb', '100': '#fef3c7', '200': '#fde68a', '300': '#fcd34d', '400': '#fbbf24',
      '500': '#f59e0b', '600': '#d97706', '700': '#b45309', '800': '#92400e', '900': '#78350f', '950': '#451a03'
    },
    yellow: {
      '50': '#fefce8', '100': '#fef9c3', '200': '#fef08a', '300': '#fde047', '400': '#facc15',
      '500': '#eab308', '600': '#ca8a04', '700': '#a16207', '800': '#854d0e', '900': '#713f12', '950': '#422006'
    },
    lime: {
      '50': '#f7fee7', '100': '#ecfccb', '200': '#d9f99d', '300': '#bef264', '400': '#a3e635',
      '500': '#84cc16', '600': '#65a30d', '700': '#4d7c0f', '800': '#365314', '900': '#1a2e05', '950': '#14532d'
    },
    green: {
      '50': '#f0fdf4', '100': '#dcfce7', '200': '#bbf7d0', '300': '#86efac', '400': '#4ade80',
      '500': '#22c55e', '600': '#16a34a', '700': '#15803d', '800': '#166534', '900': '#14532d', '950': '#052e16'
    },
    emerald: {
      '50': '#ecfdf5', '100': '#d1fae5', '200': '#a7f3d0', '300': '#6ee7b7', '400': '#34d399',
      '500': '#10b981', '600': '#059669', '700': '#047857', '800': '#065f46', '900': '#064e3b', '950': '#022c22'
    },
    teal: {
      '50': '#f0fdfa', '100': '#ccfbf1', '200': '#99f6e4', '300': '#5eead4', '400': '#2dd4bf',
      '500': '#14b8a6', '600': '#0d9488', '700': '#0f766e', '800': '#115e59', '900': '#134e4a', '950': '#042f2e'
    },
    cyan: {
      '50': '#ecfeff', '100': '#cffafe', '200': '#a5f3fc', '300': '#67e8f9', '400': '#22d3ee',
      '500': '#06b6d4', '600': '#0891b2', '700': '#0e7490', '800': '#155e75', '900': '#164e63', '950': '#083344'
    },
    sky: {
      '50': '#f0f9ff', '100': '#e0f2fe', '200': '#bae6fd', '300': '#7dd3fc', '400': '#38bdf8',
      '500': '#0ea5e9', '600': '#0284c7', '700': '#0369a1', '800': '#075985', '900': '#0c4a6e', '950': '#082f49'
    },
    blue: {
      '50': '#eff6ff', '100': '#dbeafe', '200': '#bfdbfe', '300': '#93c5fd', '400': '#60a5fa',
      '500': '#3b82f6', '600': '#2563eb', '700': '#1d4ed8', '800': '#1e40af', '900': '#1e3a8a', '950': '#172554'
    },
    indigo: {
      '50': '#eef2ff', '100': '#e0e7ff', '200': '#c7d2fe', '300': '#a5b4fc', '400': '#818cf8',
      '500': '#6366f1', '600': '#4f46e5', '700': '#4338ca', '800': '#3730a3', '900': '#312e81', '950': '#1e1b4b'
    },
    violet: {
      '50': '#f5f3ff', '100': '#ede9fe', '200': '#ddd6fe', '300': '#c4b5fd', '400': '#a78bfa',
      '500': '#8b5cf6', '600': '#7c3aed', '700': '#6d28d9', '800': '#5b21b6', '900': '#4c1d95', '950': '#2e1065'
    },
    purple: {
      '50': '#faf5ff', '100': '#f3e8ff', '200': '#e9d5ff', '300': '#d8b4fe', '400': '#c084fc',
      '500': '#a855f7', '600': '#9333ea', '700': '#7e22ce', '800': '#6b21a8', '900': '#581c87', '950': '#3b0764'
    },
    fuchsia: {
      '50': '#fdf4ff', '100': '#fae8ff', '200': '#f5d0fe', '300': '#f0abfc', '400': '#e879f9',
      '500': '#d946ef', '600': '#c026d3', '700': '#a21caf', '800': '#86198f', '900': '#701a75', '950': '#4a044e'
    },
    pink: {
      '50': '#fdf2f8', '100': '#fce7f3', '200': '#fbcfe8', '300': '#f9a8d4', '400': '#f472b6',
      '500': '#ec4899', '600': '#db2777', '700': '#be185d', '800': '#9f1239', '900': '#831843', '950': '#500724'
    },
    rose: {
      '50': '#fff1f2', '100': '#ffe4e6', '200': '#fecdd3', '300': '#fda4af', '400': '#fb7185',
      '500': '#f43f5e', '600': '#e11d48', '700': '#be123c', '800': '#9f1239', '900': '#881337', '950': '#4c0519'
    },
  };

  const getColorValue = (colorName: string): string => {
    const [color, shade] = colorName.split('-');
    return colorValues[color]?.[shade] || '#000000';
  };

  const currentCategory = selectedCategory ? categories.find(c => c.id === selectedCategory) : null;
  const currentElements = selectedCategory ? styleElements[selectedCategory] || [] : [];

  // Card templates section
  const cardTemplates = [
    {
      id: 'product',
      name: 'Product Card',
      description: 'Card for displaying products or items',
      example: (
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-lg transition-shadow">
          <div className="h-48 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
            <span className="text-zinc-400">Image</span>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Product Name</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">Product description</p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">$99.99</span>
              <button className="px-4 py-2 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg text-sm font-medium transition-colors">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'profile',
      name: 'Profile Card',
      description: 'User profile information card',
      example: (
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">John Doe</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">@johndoe</p>
            </div>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">Bio information goes here</p>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
              Follow
            </button>
            <button className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
              Message
            </button>
          </div>
        </div>
      ),
    },
    {
      id: 'stats',
      name: 'Stats Card',
      description: 'Statistics display card',
      example: (
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Total Users</span>
            <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">1,234</div>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-green-600 dark:text-green-400">↑ 12%</span>
            <span className="text-zinc-600 dark:text-zinc-400">from last month</span>
          </div>
        </div>
      ),
    },
    {
      id: 'feature',
      name: 'Feature Card',
      description: 'Feature highlight card',
      example: (
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-[#02abb8]/10 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-[#02abb8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Feature Title</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Feature description and benefits explained here</p>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 flex">
        {/* Sidebar */}
        <aside
          ref={sidebarRef}
          className={`
            hidden lg:block flex-shrink-0
            bg-white dark:bg-zinc-950
            border-r border-zinc-200 dark:border-zinc-800
            h-[calc(100vh-4rem)] overflow-y-auto
            transform transition-all duration-300 ease-in-out
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
          {/* Header with Hide Button */}
          <div className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 p-4 sticky top-0 z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Style Guide
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
            <nav className="space-y-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setSelectedElement(null);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${
                    selectedCategory === category.id
                      ? 'bg-[#02abb8]/10 text-[#02abb8] font-medium'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <span>{category.icon}</span>
                  <span>{category.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

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

        {/* Main Content */}
        <div className="flex-1 min-w-0 overflow-y-auto h-[calc(100vh-4rem)]">
          <div className="max-w-6xl mx-auto p-8">
            {/* Back to Categories Button */}
            {selectedCategory && (
              <div className="mb-6">
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedElement(null);
                  }}
                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Categories
                </button>
              </div>
            )}

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                Kasparex Design System
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400">
                Complete reference guide for all UI components and styling standards
              </p>
            </div>

            {/* Categories View */}
            {!selectedCategory && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 hover:shadow-lg transition-shadow text-left"
                  >
                    <div className="text-3xl mb-3">{category.icon}</div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                      {category.label}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      View {category.label.toLowerCase()} components
                    </p>
                  </button>
                ))}
              </div>
            )}

            {/* Category Content */}
            {selectedCategory && (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                    {currentCategory?.label}
                  </h2>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    {currentCategory?.label} components and examples
                  </p>
                </div>

                {/* Colors Section */}
                {selectedCategory === 'colors' && (
                  <div className="space-y-8">
                    {currentElements.map((colorGroup: any) => (
                      <div
                        key={colorGroup.id}
                        className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6"
                      >
                        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                          {colorGroup.name}
                        </h3>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                          {colorGroup.description}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-2">
                          {colorGroup.colors.map((color: string) => {
                            const colorValue = getColorValue(color);
                            const isLight = ['50', '100', '200', '300', '400'].includes(color.split('-')[1]);
                            return (
                              <div key={color} className="flex flex-col items-center">
                                <div
                                  className="w-full h-16 rounded-lg border border-zinc-200 dark:border-zinc-800"
                                  style={{ backgroundColor: colorValue }}
                                />
                                <span className={`text-xs mt-1 ${isLight ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                  {color}
                                </span>
                                <span className="text-xs text-zinc-500 dark:text-zinc-500 font-mono">
                                  {colorValue}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Other Sections */}
                {selectedCategory !== 'colors' && (
                  <div className="space-y-6">
                    {currentElements.map((element: any) => (
                      <div
                        key={element.id}
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
                )}

                {/* Card Templates Section */}
                {selectedCategory === 'cards' && (
                  <div className="mt-12">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
                      Card Templates & Examples
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {cardTemplates.map((template) => (
                        <div
                          key={template.id}
                          className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6"
                        >
                          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                            {template.name}
                          </h3>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                            {template.description}
                          </p>
                          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
                            {template.example}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsModalOpen(false);
            }
          }}
        >
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 max-w-md w-full relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4 pr-8">
              Modal Title
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              This is a modal example. Click the X button or click outside to close.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-[#02abb8] hover:bg-[#028a94] text-white rounded-lg text-sm font-medium transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
