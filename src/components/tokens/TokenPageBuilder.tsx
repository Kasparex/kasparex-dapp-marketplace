'use client';

import { useMemo, useState } from 'react';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import type { TokenPageSectionType } from '@/lib/tokens/listingRecord';
import type { TokenContentTab } from '@/lib/tokens/sections';
import {
  TOKEN_PAGE_SECTION_LABELS,
  TOKEN_TAB_LABELS,
  OVERVIEW_CANVAS_BLOCKS,
  getBuilderModel,
  getLibraryBlocks,
  sectionToTab,
  type TokenBuilderBlock,
} from '@/lib/tokens/pageConfig';
import type { TokenPageConfig } from '@/lib/tokens/listingRecord';

const DRAG_HANDLE = (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 6h.01M8 12h.01M8 18h.01M16 6h.01M16 12h.01M16 18h.01"
    />
  </svg>
);

interface TokenPageBuilderProps {
  pageConfig: TokenPageConfig;
  sectionToggles: Record<string, boolean>;
  sectionOrder: TokenPageSectionType[];
  disabled?: boolean;
  onAddSection: (type: TokenPageSectionType) => void;
  onRemoveSection: (type: TokenPageSectionType) => void;
  onReorderSections: (from: TokenPageSectionType, to: TokenPageSectionType) => void;
}

function isSectionEnabled(
  toggles: Record<string, boolean>,
  type: TokenPageSectionType,
): boolean {
  if (type === 'overview') return true;
  return toggles[type] ?? (type === 'comments' || type === 'links'  );
}

/** Maps each content tab to its primary section type (used for tab-order drag). */
const TOKEN_BUILDER_TAB_PRIMARY: Partial<Record<TokenPageSectionType, TokenPageSectionType>> = {
  roadmap: 'roadmap',
  markets: 'markets',
  swap: 'swap',
  utility: 'utility',
  comments: 'comments',
};

function TabOrderChip({
  label,
  isDragging,
  disabled,
  onDragStart,
  onDragEnd,
  onDragOver,
}: {
  label: string;
  isDragging: boolean;
  disabled?: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
}) {
  return (
    <div
      draggable={!disabled}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      className={`flex cursor-grab items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 active:cursor-grabbing dark:border-zinc-700 dark:bg-zinc-800/60 ${
        isDragging ? 'opacity-60' : ''
      }`}
    >
      <span className="text-zinc-400" aria-hidden="true">
        {DRAG_HANDLE}
      </span>
      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{label}</span>
    </div>
  );
}

function BlockCard({
  block,
  draggable,
  isDragging,
  onDragStart,
  onDragEnd,
  onDragOver,
  onRemove,
  disabled,
}: {
  block: TokenBuilderBlock;
  draggable: boolean;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onRemove?: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      draggable={draggable && !disabled}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      className={`flex items-start gap-2 rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 dark:border-zinc-700 dark:bg-zinc-800/40 transition ${
        isDragging ? 'opacity-60' : ''
      } ${block.locked ? 'border-cyan-500/20 bg-cyan-500/[0.04]' : ''}`}
    >
      {draggable && !block.locked ? (
        <span
          className="mt-0.5 flex h-8 w-6 shrink-0 cursor-grab items-center justify-center text-zinc-400 active:cursor-grabbing"
          aria-hidden="true"
          title="Drag to reorder"
        >
          {DRAG_HANDLE}
        </span>
      ) : (
        <span className="mt-0.5 flex h-8 w-6 shrink-0 items-center justify-center text-zinc-300 dark:text-zinc-600">
          {block.locked ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          ) : null}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{block.label}</p>
          {block.locked ? (
            <span className="rounded-md bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-cyan-700 dark:text-cyan-300">
              Always on
            </span>
          ) : null}
        </div>
        {block.description ? (
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{block.description}</p>
        ) : null}
      </div>
      {onRemove && !block.locked && !disabled ? (
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-zinc-500 hover:bg-zinc-200/80 hover:text-zinc-800 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
        >
          Remove
        </button>
      ) : null}
    </div>
  );
}

export function TokenPageBuilder({
  pageConfig,
  sectionToggles,
  sectionOrder,
  disabled,
  onAddSection,
  onRemoveSection,
  onReorderSections,
}: TokenPageBuilderProps) {
  const builderModel = useMemo(() => getBuilderModel(pageConfig), [pageConfig]);
  const libraryGroups = useMemo(() => getLibraryBlocks(), []);

  const enabledTabIds = useMemo(
    () => builderModel.tabs.filter((t) => t.enabled || t.tab === 'overview').map((t) => t.tab),
    [builderModel],
  );

  const [selectedTab, setSelectedTab] = useState<TokenContentTab>('overview');
  const [dragSection, setDragSection] = useState<TokenPageSectionType | null>(null);

  const activeTab =
    enabledTabIds.includes(selectedTab) ? selectedTab : (enabledTabIds[0] ?? 'overview');

  const activeTabModel = builderModel.tabs.find((t) => t.tab === activeTab);

  /** Primary section for each enabled tab, in current sectionOrder (for tab-order drag). */
  const tabOrderSections = useMemo(() => {
    const seen = new Set<TokenContentTab>();
    const result: TokenPageSectionType[] = [];
    for (const type of sectionOrder) {
      const tab = sectionToTab(type);
      if (!tab || tab === 'overview') continue;
      if (seen.has(tab)) continue;
      if (!isSectionEnabled(sectionToggles, type)) continue;
      if (TOKEN_BUILDER_TAB_PRIMARY[type] !== type) continue;
      seen.add(tab);
      result.push(type);
    }
    return result;
  }, [sectionOrder, sectionToggles]);

  const handleCanvasDragOver = (target: TokenPageSectionType) => (e: React.DragEvent) => {
    e.preventDefault();
    if (!dragSection || dragSection === target || disabled) return;

    if (activeTab === 'overview') {
      if (!OVERVIEW_CANVAS_BLOCKS.includes(dragSection) || !OVERVIEW_CANVAS_BLOCKS.includes(target)) {
        return;
      }
    }

    onReorderSections(dragSection, target);
  };

  return (
    <div className="space-y-4">
      <DAppSectionHeader title="Page builder" className="mb-1" />
      <p className="kx-body-sm">
        Add blocks from the library, arrange them per tab, and drag to reorder. Tab order on the live page
        follows the order of enabled blocks.
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
        {/* Block library sidebar */}
        <aside className="space-y-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/60 lg:self-start">
          <p className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Block library
          </p>
          {libraryGroups.map((group) => (
            <div key={group.tab} className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                {group.tabLabel}
              </p>
              {group.blocks.map((type) => {
                const enabled = isSectionEnabled(sectionToggles, type);
                return (
                  <div
                    key={type}
                    className={`flex items-center justify-between gap-1.5 rounded-lg border px-2 py-1.5 ${
                      enabled
                        ? 'border-zinc-200 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-800/30'
                        : 'border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900'
                    }`}
                  >
                    <p className="min-w-0 truncate text-xs font-medium text-zinc-800 dark:text-zinc-200">
                      {TOKEN_PAGE_SECTION_LABELS[type]}
                    </p>
                    {enabled ? (
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => onRemoveSection(type)}
                        aria-label={`Remove ${TOKEN_PAGE_SECTION_LABELS[type]}`}
                        className="shrink-0 rounded-md px-1.5 py-0.5 text-xs font-semibold text-red-600 hover:bg-red-500/10 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => onAddSection(type)}
                        aria-label={`Add ${TOKEN_PAGE_SECTION_LABELS[type]}`}
                        className="shrink-0 rounded-md bg-[#02abb8]/10 px-1.5 py-0.5 text-xs font-semibold text-[#02abb8] hover:bg-[#02abb8]/20 disabled:opacity-50"
                      >
                        Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </aside>

        {/* Tab canvas */}
        <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
          <p className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Tab canvas
          </p>

          <div className="flex flex-wrap gap-1.5">
            {enabledTabIds.map((tabId) => (
              <button
                key={tabId}
                type="button"
                disabled={disabled}
                onClick={() => setSelectedTab(tabId)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === tabId
                    ? 'bg-[#02abb8] text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                }`}
              >
                {TOKEN_TAB_LABELS[tabId]}
              </button>
            ))}
          </div>

          {tabOrderSections.length > 1 ? (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Tab order
              </p>
              <div className="flex flex-wrap gap-2">
                {tabOrderSections.map((type) => (
                  <TabOrderChip
                    key={type}
                    label={TOKEN_PAGE_SECTION_LABELS[type]}
                    isDragging={dragSection === type}
                    disabled={disabled}
                    onDragStart={() => setDragSection(type)}
                    onDragEnd={() => setDragSection(null)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (!dragSection || dragSection === type || disabled) return;
                      onReorderSections(dragSection, type);
                    }}
                  />
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            {activeTab === 'overview' ? (
              activeTabModel?.blocks.map((block) => (
                <BlockCard
                  key={block.type}
                  block={block}
                  draggable={!block.locked && OVERVIEW_CANVAS_BLOCKS.includes(block.type)}
                  isDragging={dragSection === block.type}
                  disabled={disabled}
                  onDragStart={() => setDragSection(block.type)}
                  onDragEnd={() => setDragSection(null)}
                  onDragOver={handleCanvasDragOver(block.type)}
                  onRemove={
                    !block.locked && block.enabled
                      ? () => onRemoveSection(block.type)
                      : undefined
                  }
                />
              ))
            ) : (
              activeTabModel?.blocks.map((block) => (
                <BlockCard
                  key={block.type}
                  block={block}
                  draggable={false}
                  isDragging={false}
                  disabled={disabled}
                  onDragStart={() => {}}
                  onDragEnd={() => {}}
                  onDragOver={() => {}}
                  onRemove={block.enabled ? () => onRemoveSection(block.type) : undefined}
                />
              ))
            )}

            {activeTab !== 'overview' && activeTabModel && !activeTabModel.blocks.some((b) => b.enabled) ? (
              <p className="rounded-lg border border-dashed border-zinc-300 px-3 py-6 text-center text-xs text-zinc-500 dark:border-zinc-700">
                No blocks on this tab. Add one from the library.
              </p>
            ) : null}
          </div>

          {activeTab !== 'overview' ? (
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
              Use Tab order above to rearrange tabs. Remove a block to hide its tab.
            </p>
          ) : (
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
              Drag overview blocks to change their order below the About section.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
