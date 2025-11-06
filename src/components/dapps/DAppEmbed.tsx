'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DApp } from '@/lib/dapps';

interface DAppEmbedProps {
  dapp: DApp;
  onClose: () => void;
}

export function DAppEmbed({ dapp, onClose }: DAppEmbedProps) {
  const [widthType, setWidthType] = useState<'px' | '%' | 'vw'>('%');
  const [width, setWidth] = useState(100);
  const [heightType, setHeightType] = useState<'px' | 'vh' | '%' | 'auto'>('%');
  const [height, setHeight] = useState(100);
  const [hideHeader, setHideHeader] = useState(false);
  const [customStyle, setCustomStyle] = useState('max-width: 100%;');
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const slug = dapp.slug || dapp.id;
  
  // Build responsive width/height strings
  const widthValue = widthType === 'px' ? `${width}px` : widthType === '%' ? `${width}%` : `${width}vw`;
  const heightValue = heightType === 'auto' ? 'auto' : heightType === 'px' ? `${height}px` : heightType === 'vh' ? `${height}vh` : `${height}%`;
  
  const embedUrl = `${baseUrl}/dapps/${slug}/embed${hideHeader ? '?hideHeader=true' : ''}`;
  
  // Build responsive embed code
  const responsiveStyle = `width: ${widthValue}; height: ${heightValue}; border: 0; ${customStyle}`;
  
  const embedCode = `<iframe
  src="${embedUrl}"
  style="${responsiveStyle}"
  frameborder="0"
  allowtransparency="true"
></iframe>`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              Embed {dapp.name}
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Customization Options */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Width
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="flex-1 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  min={widthType === 'px' ? 300 : widthType === '%' ? 10 : 10}
                  max={widthType === 'px' ? 2000 : widthType === '%' ? 100 : 100}
                />
                <select
                  value={widthType}
                  onChange={(e) => setWidthType(e.target.value as 'px' | '%' | 'vw')}
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="px">px</option>
                  <option value="%">%</option>
                  <option value="vw">vw</option>
                </select>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Use % for responsive width relative to container, vw for viewport width
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Height
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="flex-1 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  min={heightType === 'px' ? 300 : heightType === '%' || heightType === 'vh' ? 10 : 0}
                  max={heightType === 'px' ? 2000 : heightType === '%' || heightType === 'vh' ? 100 : 0}
                  disabled={heightType === 'auto'}
                />
                <select
                  value={heightType}
                  onChange={(e) => setHeightType(e.target.value as 'px' | 'vh' | '%' | 'auto')}
                  className="px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="%">%</option>
                  <option value="auto">auto</option>
                  <option value="px">px</option>
                  <option value="vh">vh</option>
                </select>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Use &quot;%&quot; for container height (recommended), &quot;auto&quot; for automatic adjustment, or &quot;vh&quot; for viewport height
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="hideHeader"
                checked={hideHeader}
                onChange={(e) => setHideHeader(e.target.checked)}
                className="w-4 h-4 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-800 rounded focus:ring-zinc-500"
              />
              <label htmlFor="hideHeader" className="text-sm text-zinc-700 dark:text-zinc-300">
                Hide header
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Custom Style (CSS) - Optional
              </label>
              <textarea
                value={customStyle}
                onChange={(e) => setCustomStyle(e.target.value)}
                placeholder="border: 1px solid #ccc; border-radius: 8px; max-width: 100%;"
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono text-sm"
                rows={3}
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Add additional CSS styles. Recommended: max-width: 100% for mobile responsiveness
              </p>
            </div>
          </div>

          {/* Embed Code */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Embed Code
              </label>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <textarea
              value={embedCode}
              readOnly
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-sm"
              rows={8}
            />
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-5 py-3 bg-[#02abb8] text-white rounded-lg hover:bg-[#0299a3] transition-colors font-medium text-base"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof window === 'undefined') {
    return null;
  }

  return createPortal(modalContent, document.body);
}

