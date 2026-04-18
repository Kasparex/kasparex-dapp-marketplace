'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';

export interface UnifiedSidebarProps {
  /** Prefix for localStorage keys: {prefix}-sidebar-hidden, {prefix}-sidebar-width */
  storageKeyPrefix: string;
  /** Fixed header (e.g. back link + hide button). Receives onHide to close sidebar. */
  header: (onHide: () => void) => ReactNode;
  /** Scrollable body content. */
  children: ReactNode;
  /** Optional fixed footer (e.g. branding). */
  footer?: ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  /** When true, sidebar is collapsed on desktop. */
  isHidden?: boolean;
  onHiddenChange?: (hidden: boolean) => void;
  /** Optional: control open state for mobile (internal state if not provided). */
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Optional class for the aside. */
  className?: string;
}

const DEFAULT_WIDTH = 256;
const MIN_WIDTH = 200;
const MAX_WIDTH = 500;

export function UnifiedSidebar({
  storageKeyPrefix,
  header,
  children,
  footer,
  defaultWidth = DEFAULT_WIDTH,
  minWidth = MIN_WIDTH,
  maxWidth = MAX_WIDTH,
  isHidden: controlledHidden,
  onHiddenChange,
  isOpen: controlledOpen,
  onOpenChange,
  className = '',
}: UnifiedSidebarProps) {
  const [internalHidden, setInternalHidden] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const isControlledHidden = controlledHidden !== undefined;
  const isHidden = isControlledHidden ? controlledHidden : internalHidden;
  const setHidden = (value: boolean) => {
    if (!isControlledHidden) setInternalHidden(value);
    onHiddenChange?.(value);
  };

  const isControlledOpen = controlledOpen !== undefined;
  const isOpen = isControlledOpen ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (!isControlledOpen) setInternalOpen(value);
    onOpenChange?.(value);
  };

  const hiddenKey = `${storageKeyPrefix}-sidebar-hidden`;
  const widthKey = `${storageKeyPrefix}-sidebar-width`;

  useEffect(() => {
    try {
      const savedHidden = localStorage.getItem(hiddenKey);
      const savedWidth = localStorage.getItem(widthKey);
      if (savedHidden === 'true' && !isControlledHidden) setInternalHidden(true);
      if (savedWidth) {
        const w = parseInt(savedWidth, 10);
        if (w >= minWidth && w <= maxWidth) setSidebarWidth(w);
      }
    } catch (_) {}
  }, [hiddenKey, widthKey, minWidth, maxWidth, isControlledHidden]);

  useEffect(() => {
    try {
      localStorage.setItem(hiddenKey, String(isHidden));
    } catch (_) {}
  }, [hiddenKey, isHidden]);

  useEffect(() => {
    try {
      localStorage.setItem(widthKey, String(sidebarWidth));
    } catch (_) {}
  }, [widthKey, sidebarWidth]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !sidebarRef.current) return;
      const rect = sidebarRef.current.getBoundingClientRect();
      const newWidth = e.clientX - rect.left;
      if (newWidth >= minWidth && newWidth <= maxWidth) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
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
  }, [isResizing, minWidth, maxWidth]);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setOpen(!isOpen)}
        className="lg:hidden fixed left-4 z-40 k-control-icon-btn h-10 w-10 shadow-lg"
        style={{ top: '5.5rem' }}
        aria-label="Toggle menu"
      >
        <svg className="h-6 w-6 text-zinc-900 dark:text-zinc-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setOpen(false)} aria-hidden />
      )}

      {isHidden && (
        <button
          onClick={() => setHidden(false)}
          className="hidden lg:block fixed left-0 top-20 z-[60] k-control-icon-btn h-9 w-9"
          aria-label="Show sidebar"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      <aside
        ref={sidebarRef}
        className={`
          fixed lg:sticky top-16 lg:top-0 left-0 z-40
          h-[calc(100vh-4rem)] lg:h-screen
          bg-white dark:bg-zinc-950
          border-r border-zinc-200 dark:border-zinc-800
          transform transition-all duration-300 ease-in-out
          flex flex-col
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isHidden ? 'lg:translate-x-[-100%]' : ''}
          ${className}
        `}
        style={{
          width: isHidden ? 0 : `${sidebarWidth}px`,
          minWidth: isHidden ? 0 : `${sidebarWidth}px`,
          maxWidth: isHidden ? 0 : `${sidebarWidth}px`,
          cursor: isResizing ? 'col-resize' : '',
        }}
        onMouseMove={(e) => {
          if (!isHidden && !isResizing && sidebarRef.current) {
            const rect = sidebarRef.current.getBoundingClientRect();
            const isOnBorder = e.clientX >= rect.right - 4 && e.clientX <= rect.right;
            sidebarRef.current.style.cursor = isOnBorder ? 'col-resize' : '';
            sidebarRef.current.style.borderRight = isOnBorder ? '2px solid #02abb8' : '';
          }
        }}
        onMouseLeave={() => {
          if (sidebarRef.current && !isResizing) sidebarRef.current.style.borderRight = '';
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
        <div className="flex flex-col h-full">
          <div className="flex-1 min-h-0 overflow-y-auto">
            {header(() => setHidden(true))}
            <div className="p-4">
              {children}
            </div>
          </div>
          {footer != null && <div className="flex-shrink-0">{footer}</div>}
        </div>
      </aside>
    </>
  );
}
