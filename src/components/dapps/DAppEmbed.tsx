'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAccount, useChainId } from 'wagmi';
import { DApp } from '@/lib/dapps';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { getChainById } from '@/lib/wagmi';
import { useTheme } from '@/components/ThemeProvider';

interface DAppEmbedProps {
  dapp: DApp;
  onClose: () => void;
}

export function DAppEmbed({ dapp, onClose }: DAppEmbedProps) {
  const { address: connectedAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const chain = chainId ? getChainById(chainId) : null;
  const { theme, toggleTheme } = useTheme();
  // Map kaspa theme to dark for embed preview
  const getEmbedTheme = (t: typeof theme): 'light' | 'dark' => {
    return t === 'kaspa' ? 'dark' : t;
  };
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark'>(getEmbedTheme(theme));

  const [widthType, setWidthType] = useState<'px' | '%' | 'vw'>('%');
  const [width, setWidth] = useState(100);
  const [heightType, setHeightType] = useState<'px' | 'vh' | '%' | 'auto'>('auto');
  const [height, setHeight] = useState(0);
  const [hideHeader, setHideHeader] = useState(false);
  const [hideFooter, setHideFooter] = useState(false);
  const [hideIcons, setHideIcons] = useState(false);
  const [showStarIcon, setShowStarIcon] = useState(true);
  const [showHeartIcon, setShowHeartIcon] = useState(true);
  const [showInfoIcon, setShowInfoIcon] = useState(true);
  const [showEmbedIcon, setShowEmbedIcon] = useState(true);
  const [accentColor, setAccentColor] = useState('#02abb8');
  const [customStyle, setCustomStyle] = useState('max-width: 100%; width: 100%;');
  const [copied, setCopied] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  // Sync theme with global theme
  useEffect(() => {
    setSelectedTheme(getEmbedTheme(theme));
  }, [theme]);

  const handleThemeSelect = (newTheme: 'light' | 'dark') => {
    setSelectedTheme(newTheme);
    // If current theme is kaspa, we need to toggle to get to the right theme
    if (theme === 'kaspa' && newTheme === 'dark') {
      // Already dark-like, no change needed
      return;
    }
    if (newTheme !== getEmbedTheme(theme)) {
      toggleTheme();
    }
  };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const slug = dapp.slug || dapp.id;
  
  // Build responsive width/height strings
  const widthValue = widthType === 'px' ? `${width}px` : widthType === '%' ? `${width}%` : `${width}vw`;
  const heightValue = heightType === 'auto' ? 'auto' : heightType === 'px' ? `${height}px` : heightType === 'vh' ? `${height}vh` : `${height}%`;
  
  // Build query parameters
  const params = new URLSearchParams();
  if (hideHeader) params.append('hideHeader', 'true');
  if (hideFooter) params.append('hideFooter', 'true');
  if (hideIcons) params.append('hideIcons', 'true');
  if (!showStarIcon) params.append('hideStar', 'true');
  if (!showHeartIcon) params.append('hideHeart', 'true');
  if (!showInfoIcon) params.append('hideInfo', 'true');
  if (!showEmbedIcon) params.append('hideEmbed', 'true');
  if (accentColor !== '#02abb8') params.append('accentColor', accentColor);
  
  const queryString = params.toString();
  const embedUrl = `${baseUrl}/dapps/${slug}/embed${queryString ? `?${queryString}` : ''}`;
  
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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                Embed {dapp.name}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Copy the embed code below and paste it into your website&apos;s HTML. The widget will be fully functional and responsive on your site.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors ml-4"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content - 2 Column Layout */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
            {/* Left Column - Input Fields (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Dimensions */}
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Dimensions</h3>
                
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
                    Use % for responsive width (recommended: 100%), vw for viewport width
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
                    Use &quot;auto&quot; for automatic height (recommended), &quot;%&quot; for container height, or &quot;vh&quot; for viewport height
                  </p>
                </div>
              </div>

              {/* Style Options */}
              <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Style Options</h3>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Accent Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-16 h-10 border border-zinc-200 dark:border-zinc-800 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="flex-1 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono text-sm"
                      placeholder="#02abb8"
                    />
                  </div>
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
                </div>
              </div>

              {/* Embed Code */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
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
            </div>

            {/* Right Column - Switchers & Buttons (1/3 width) */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                {/* Theme Switcher */}
                <div className="space-y-4">
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Page Theme</h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">
                    Choose a theme for the entire page. This will change the appearance of all components.
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => handleThemeSelect('light')}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        selectedTheme === 'light'
                          ? 'border-[#02abb8] bg-[#02abb8]/10 dark:bg-[#02abb8]/20'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white border-2 border-zinc-200 flex items-center justify-center">
                            <svg className="w-5 h-5 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100">Light</div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">Clean and bright</div>
                          </div>
                        </div>
                        {selectedTheme === 'light' && (
                          <svg className="w-4 h-4 text-[#02abb8]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>

                    <button
                      onClick={() => handleThemeSelect('dark')}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        selectedTheme === 'dark'
                          ? 'border-[#02abb8] bg-[#02abb8]/10 dark:bg-[#02abb8]/20'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center">
                            <svg className="w-5 h-5 text-zinc-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                          </div>
                          <div>
                            <div className="font-medium text-sm text-zinc-900 dark:text-zinc-100">Dark</div>
                            <div className="text-xs text-zinc-500 dark:text-zinc-400">Easy on the eyes</div>
                          </div>
                        </div>
                        {selectedTheme === 'dark' && (
                          <svg className="w-4 h-4 text-[#02abb8]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Visibility */}
                <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Visibility</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer">
                        Show Header
                      </label>
                      <ToggleSwitch
                        checked={!hideHeader}
                        onChange={(checked) => setHideHeader(!checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer">
                        Show Footer
                      </label>
                      <ToggleSwitch
                        checked={!hideFooter}
                        onChange={(checked) => setHideFooter(!checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer">
                        Show Icon Section
                      </label>
                      <ToggleSwitch
                        checked={!hideIcons}
                        onChange={(checked) => setHideIcons(!checked)}
                      />
                    </div>
                  </div>
                </div>

                {/* Icon Selection */}
                {!hideIcons && (
                  <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Icon Selection</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                          Star (Favorites)
                        </label>
                        <ToggleSwitch
                          checked={showStarIcon}
                          onChange={setShowStarIcon}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          Heart (Like)
                        </label>
                        <ToggleSwitch
                          checked={showHeartIcon}
                          onChange={setShowHeartIcon}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Info
                        </label>
                        <ToggleSwitch
                          checked={showInfoIcon}
                          onChange={setShowInfoIcon}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Embed
                        </label>
                        <ToggleSwitch
                          checked={showEmbedIcon}
                          onChange={setShowEmbedIcon}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Debug Info Toggle */}
                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <ToggleSwitch
                    checked={showDebugInfo}
                    onChange={setShowDebugInfo}
                    label="Show Debug Info"
                    description="Display technical details about the embed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Debug Info Section */}
          {showDebugInfo && (
            <div className="px-8 pb-8">
              <CollapsibleSection
                title="Debug & Status Info"
                isOpen={true}
                onToggle={() => {}}
                icon={<span className="text-lg">🔍</span>}
              >
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Embed Information</h4>
                    <div className="space-y-2 text-xs">
                      <div className="p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded">
                        <span className="text-zinc-600 dark:text-zinc-400">Base URL:</span>
                        <p className="font-mono text-zinc-900 dark:text-zinc-100 break-all mt-1">{baseUrl}</p>
                      </div>
                      <div className="p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded">
                        <span className="text-zinc-600 dark:text-zinc-400">Embed URL:</span>
                        <p className="font-mono text-zinc-900 dark:text-zinc-100 break-all mt-1">{embedUrl}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleSection>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#02abb8] text-white rounded-lg hover:bg-[#0299a3] transition-colors font-medium text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof window === 'undefined') {
    return null;
  }

  return createPortal(modalContent, document.body);
}
