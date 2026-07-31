'use client';

import { KxSegmentToggle } from '@/components/ui/KxSegmentToggle';
import { KxFileUpload } from '@/components/ui/KxFileUpload';

type ImageSource = 'url' | 'file';

function isLikelyImageUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('ipfs://')) return true;
  if (!/^https?:\/\//i.test(trimmed)) return false;
  try {
    const u = new URL(trimmed);
    if (/\.(png|jpe?g|gif|webp|svg|avif)(\?|$)/i.test(u.pathname)) return true;
    // Gateway /ipfs/CID paths often omit extensions.
    if (u.pathname.includes('/ipfs/')) return true;
    return true;
  } catch {
    return false;
  }
}

export function KxImageSourceField({
  source,
  onSourceChange,
  url,
  onUrlChange,
  urlPlaceholder = 'https://...',
  urlHint = 'Direct HTTPS image URL. PNG, JPG, or WebP.',
  fileName,
  onClearFile,
  onFileChange,
  uploadHint,
  isUploading,
  inputClassName = 'k-modal-field-input',
  accent = 'default',
  showUrlPreview = true,
}: {
  source: ImageSource;
  onSourceChange: (next: ImageSource) => void;
  url: string;
  onUrlChange: (next: string) => void;
  urlPlaceholder?: string;
  urlHint?: string;
  fileName?: string | null;
  onClearFile?: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadHint?: string;
  isUploading?: boolean;
  inputClassName?: string;
  accent?: 'default' | 'emerald';
  /** Show a live thumbnail when Image URL mode has a resolvable URL. */
  showUrlPreview?: boolean;
}) {
  const previewUrl = source === 'url' && showUrlPreview && isLikelyImageUrl(url) ? url.trim() : null;

  return (
    <div className="space-y-3">
      <KxSegmentToggle
        value={source}
        onChange={onSourceChange}
        options={[
          { value: 'url', label: 'Image URL' },
          { value: 'file', label: 'Upload (IPFS)' },
        ]}
        ariaLabel="Image source"
      />
      {source === 'url' ? (
        <div className="space-y-3">
          <div>
            <input
              type="url"
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder={urlPlaceholder}
              className={inputClassName}
            />
            <p className="mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-500">{urlHint}</p>
          </div>
          {previewUrl ? (
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Image preview"
                className="mx-auto max-h-40 w-full object-contain p-2"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          ) : null}
        </div>
      ) : (
        <KxFileUpload
          label=""
          hint={uploadHint}
          accept="image/*"
          fileName={fileName}
          onClear={onClearFile}
          onChange={onFileChange}
          disabled={isUploading}
          accent={accent}
        />
      )}
    </div>
  );
}
