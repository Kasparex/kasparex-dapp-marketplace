'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAccount, useChainId } from 'wagmi';
import { DApp } from '@/lib/dapps';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { getChainById } from '@/lib/wagmi';

interface DAppEmbedProps {
  dapp: DApp;
  onClose: () => void;
}

export function DAppEmbed({ dapp, onClose }: DAppEmbedProps) {
  const { address: connectedAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const chain = chainId ? getChainById(chainId) : null;
  const [widthType, setWidthType] = useState<'px' | '%' | 'vw'>('%');
  const [width, setWidth] = useState(100);
  const [heightType, setHeightType] = useState<'px' | 'vh' | '%' | 'auto'>('auto');
  const [height, setHeight] = useState(0);
  const [hideHeader, setHideHeader] = useState(false);
  const [customStyle, setCustomStyle] = useState('max-width: 100%; width: 100%;');
  const [copied, setCopied] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const slug = dapp.slug || dapp.id;
  
  // Build responsive width/height strings
  const widthValue = widthType === 'px' ? `${width}px` : widthType === '%' ? `${width}%` : `${width}vw`;
  const heightValue = heightType === 'auto' ? 'auto' : heightType === 'px' ? `${height}px` : heightType === 'vh' ? `${height}vh` : `${height}%`;
  
  const embedUrl = `${baseUrl}/dapps/${slug}/embed${hideHeader ? '?hideHeader=true' : ''}`;
  
  // Build responsive embed code with improved defaults
  const responsiveStyle = heightType === 'auto' 
    ? `width: ${widthValue}; height: auto; min-height: 600px; border: 0; ${customStyle}`
    : `width: ${widthValue}; height: ${heightValue}; border: 0; ${customStyle}`;
  
  const embedCode = `<iframe
  src="${embedUrl}"
  style="${responsiveStyle}"
  frameborder="0"
  allowtransparency="true"
  loading="lazy"
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
                Use % for responsive width relative to container (recommended: 100%), vw for viewport width
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
                  <option value="auto">auto</option>
                  <option value="%">%</option>
                  <option value="px">px</option>
                  <option value="vh">vh</option>
                </select>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Use &quot;auto&quot; for automatic height adjustment (recommended - adapts to content), &quot;%&quot; for container height, or &quot;vh&quot; for viewport height
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
                placeholder="max-width: 100%; width: 100%; border-radius: 8px;"
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono text-sm"
                rows={3}
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Add additional CSS styles. Default includes max-width: 100% and width: 100% for full-width responsiveness
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

          {/* Debug Info Toggle */}
          <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <ToggleSwitch
              checked={showDebugInfo}
              onChange={setShowDebugInfo}
              label="Show Debug Info"
              description="Display technical details about the embed"
            />
          </div>

          {/* Debug & Status Info Section */}
          {showDebugInfo && (
            <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <CollapsibleSection
                title="Debug & Status Info"
                isOpen={true}
                onToggle={() => {}}
                icon={<span className="text-lg">🔍</span>}
              >
                <div className="space-y-4">
                  {/* Embed Information */}
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                      Embed Information
                    </h4>
                    <div className="space-y-2">
                      <div className="p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded">
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">Base URL:</span>
                        <p className="text-xs font-mono text-zinc-900 dark:text-zinc-100 break-all mt-1">
                          {baseUrl}
                        </p>
                      </div>
                      <div className="p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded">
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">dApp Slug:</span>
                        <p className="text-xs text-zinc-900 dark:text-zinc-100 mt-1">
                          {slug}
                        </p>
                      </div>
                      <div className="p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded">
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">Embed URL:</span>
                        <p className="text-xs font-mono text-zinc-900 dark:text-zinc-100 break-all mt-1">
                          {embedUrl}
                        </p>
                      </div>
                      <div className="p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded">
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">Embed Dimensions:</span>
                        <p className="text-xs text-zinc-900 dark:text-zinc-100 mt-1">
                          Width: {widthValue}, Height: {heightValue}
                        </p>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded">
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">Hide Header:</span>
                        <span className={`text-sm font-medium ${hideHeader ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-600 dark:text-zinc-400'}`}>
                          {hideHeader ? '✓ Yes' : '✗ No'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Current Status */}
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                      Current Status
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded">
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">Wallet Connected:</span>
                        <span className={`text-sm font-medium ${isConnected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {isConnected ? '✓ Yes' : '✗ No'}
                        </span>
                      </div>
                      {isConnected && connectedAddress && (
                        <div className="p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded">
                          <span className="text-xs text-zinc-600 dark:text-zinc-400">Connected Address:</span>
                          <p className="text-xs font-mono text-zinc-900 dark:text-zinc-100 break-all mt-1">
                            {connectedAddress}
                          </p>
                        </div>
                      )}
                      {chain && (
                        <div className="p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded">
                          <span className="text-xs text-zinc-600 dark:text-zinc-400">Current Network:</span>
                          <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 mt-1">
                            {chain.name}
                          </p>
                        </div>
                      )}
                      <div className="p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded">
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">Network Chain ID:</span>
                        <p className="text-xs font-mono text-zinc-900 dark:text-zinc-100 mt-1">
                          {chainId || 'Not detected'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* dApp Information */}
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                      dApp Information
                    </h4>
                    <div className="space-y-2">
                      <div className="p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded">
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">dApp Name:</span>
                        <p className="text-xs text-zinc-900 dark:text-zinc-100 mt-1">
                          {dapp.name}
                        </p>
                      </div>
                      <div className="p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded">
                        <span className="text-xs text-zinc-600 dark:text-zinc-400">dApp ID:</span>
                        <p className="text-xs font-mono text-zinc-900 dark:text-zinc-100 mt-1">
                          {dapp.id}
                        </p>
                      </div>
                      {dapp.widgetUrl && (
                        <div className="p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded">
                          <span className="text-xs text-zinc-600 dark:text-zinc-400">Widget URL:</span>
                          <p className="text-xs text-zinc-900 dark:text-zinc-100 break-all mt-1">
                            {dapp.widgetUrl}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CollapsibleSection>
            </div>
          )}

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

