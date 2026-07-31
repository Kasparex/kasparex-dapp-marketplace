'use client';

import { useMemo, useState } from 'react';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import { kxTagChipClass } from '@/components/ui/KxTagChip';
import {
  HUB_MAX_LISTING_TAGS,
  HUB_SUGGESTED_TAGS,
  HUB_TAG_MAX_LENGTH,
  mergeTagSuggestions,
  normalizeHubTag,
  normalizeHubTags,
} from '@/lib/hub/suggestedTags';

type KxTagsFieldProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  maxTags?: number;
  disabled?: boolean;
  label?: string;
  hint?: string;
  placeholder?: string;
};

/**
 * Global Hub tags lookup: search suggestions, select chips, max 3 by default.
 */
export function KxTagsField({
  value,
  onChange,
  suggestions,
  maxTags = HUB_MAX_LISTING_TAGS,
  disabled,
  label = 'Tags',
  hint,
  placeholder = 'Search or add a tag…',
}: KxTagsFieldProps) {
  const [query, setQuery] = useState('');
  const selected = useMemo(() => normalizeHubTags(value, maxTags), [value, maxTags]);
  const pool = useMemo(
    () => mergeTagSuggestions(HUB_SUGGESTED_TAGS, suggestions),
    [suggestions],
  );

  const filtered = useMemo(() => {
    const q = normalizeHubTag(query);
    const available = pool.filter((tag) => !selected.includes(tag));
    if (!q) return available.slice(0, 12);
    return available.filter((tag) => tag.includes(q)).slice(0, 12);
  }, [pool, query, selected]);

  const canAddMore = selected.length < maxTags;
  const exact = normalizeHubTag(query);
  const canCreate =
    Boolean(exact) &&
    canAddMore &&
    !selected.includes(exact) &&
    !pool.includes(exact) &&
    exact.length >= 2;

  const addTag = (raw: string) => {
    if (disabled || !canAddMore) return;
    const next = normalizeHubTags([...selected, raw], maxTags);
    if (next.length === selected.length) return;
    onChange(next);
    setQuery('');
  };

  const removeTag = (tag: string) => {
    if (disabled) return;
    onChange(selected.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-2">
      {label ? (
        <div className="flex items-center justify-between gap-2">
          <KxFormFieldLabel>{label}</KxFormFieldLabel>
          <span className="text-xs text-zinc-500">
            {selected.length} / {maxTags}
          </span>
        </div>
      ) : null}

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((tag) => (
            <button
              key={tag}
              type="button"
              disabled={disabled}
              onClick={() => removeTag(tag)}
              className={`${kxTagChipClass(true)} disabled:opacity-50`}
              title="Remove tag"
            >
              #{tag} ×
            </button>
          ))}
        </div>
      ) : null}

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value.slice(0, HUB_TAG_MAX_LENGTH))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            if (filtered[0]) addTag(filtered[0]);
            else if (canCreate) addTag(exact);
          }
        }}
        placeholder={canAddMore ? placeholder : `Maximum ${maxTags} tags`}
        className="k-input w-full"
        disabled={disabled || !canAddMore}
        autoComplete="off"
      />

      {canAddMore && (filtered.length > 0 || canCreate) ? (
        <div className="flex flex-wrap gap-1.5">
          {filtered.map((tag) => (
            <button
              key={tag}
              type="button"
              disabled={disabled}
              onClick={() => addTag(tag)}
              className={`${kxTagChipClass(false)} disabled:opacity-50`}
            >
              #{tag}
            </button>
          ))}
          {canCreate ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => addTag(exact)}
              className={`${kxTagChipClass(false)} disabled:opacity-50`}
            >
              Add #{exact}
            </button>
          ) : null}
        </div>
      ) : null}

      {hint ? <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p> : null}
    </div>
  );
}
