'use client';

import { useState } from 'react';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import { KxImageSourceField } from '@/components/ui/KxImageSourceField';
import { useIPFSUpload } from '@/lib/ipfs/hooks';
import { getBestGatewayUrl, normalizeIpfsUrlForForm } from '@/lib/ipfs/gateway';
import { TOKEN_MEDIA_MAX_KB, validateTokenImage } from '@/lib/tokens/limits';

export type TokenListingMediaState = {
  logoSource: 'url' | 'file';
  logoUrl: string;
  logoCid: string | null;
  logoName: string | null;
  featuredSource: 'url' | 'file';
  featuredUrl: string;
  featuredCid: string | null;
  featuredName: string | null;
};

export const EMPTY_TOKEN_LISTING_MEDIA: TokenListingMediaState = {
  logoSource: 'file',
  logoUrl: '',
  logoCid: null,
  logoName: null,
  featuredSource: 'file',
  featuredUrl: '',
  featuredCid: null,
  featuredName: null,
};

export function resolveTokenListingMedia(state: TokenListingMediaState): {
  logoUrl?: string;
  logoCid?: string;
  featuredImageUrl?: string;
  featuredImageCid?: string;
} {
  const logoUrl =
    state.logoSource === 'url'
      ? state.logoUrl.trim() || undefined
      : state.logoCid
        ? getBestGatewayUrl(state.logoCid)
        : undefined;
  const featuredImageUrl =
    state.featuredSource === 'url'
      ? state.featuredUrl.trim() || undefined
      : state.featuredCid
        ? getBestGatewayUrl(state.featuredCid)
        : undefined;
  return {
    logoUrl,
    logoCid: state.logoCid ?? undefined,
    featuredImageUrl,
    featuredImageCid: state.featuredCid ?? undefined,
  };
}

interface TokenListingMediaPanelProps {
  media: TokenListingMediaState;
  onChange: (next: TokenListingMediaState) => void;
  disabled?: boolean;
  /** When true, render fields only (no outer heading) for embedding inside another form. */
  embedded?: boolean;
}

const PANEL_CLASS =
  'rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-sm space-y-8';

export function TokenListingMediaPanel({ media, onChange, disabled, embedded = false }: TokenListingMediaPanelProps) {
  const { upload, isUploading } = useIPFSUpload();
  const [logoError, setLogoError] = useState<string | null>(null);
  const [featuredError, setFeaturedError] = useState<string | null>(null);

  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setLogoError(null);
    const validation = validateTokenImage(file);
    if (!validation.valid) {
      setLogoError(validation.error ?? 'Invalid image.');
      return;
    }
    const cid = await upload(file, { filename: file.name });
    if (cid) {
      onChange({
        ...media,
        logoSource: 'url',
        logoCid: cid,
        logoName: file.name,
        logoUrl: normalizeIpfsUrlForForm(null, cid),
      });
    }
  };

  const uploadFeatured = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setFeaturedError(null);
    const validation = validateTokenImage(file);
    if (!validation.valid) {
      setFeaturedError(validation.error ?? 'Invalid image.');
      return;
    }
    const cid = await upload(file, { filename: file.name });
    if (cid) {
      onChange({
        ...media,
        featuredSource: 'url',
        featuredCid: cid,
        featuredName: file.name,
        featuredUrl: normalizeIpfsUrlForForm(null, cid),
      });
    }
  };

  const fields = (
    <>
      <div>
        <KxFormFieldLabel>Token logo</KxFormFieldLabel>
        <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-2">
          Square PNG, JPG, or WebP recommended (256x256 or larger). Max {TOKEN_MEDIA_MAX_KB} KB.
        </p>
        <KxImageSourceField
          source={media.logoSource}
          onSourceChange={(logoSource) => onChange({ ...media, logoSource })}
          url={media.logoUrl}
          onUrlChange={(logoUrl) =>
            onChange({ ...media, logoUrl: normalizeIpfsUrlForForm(logoUrl), logoCid: null, logoName: null })
          }
          urlPlaceholder="https://..."
          urlHint="Direct HTTPS image URL. PNG, JPG, or WebP."
          fileName={media.logoName ?? (media.logoCid ? 'Uploaded logo' : null)}
          onClearFile={() => onChange({ ...media, logoCid: null, logoName: null })}
          onFileChange={uploadLogo}
          uploadHint={`PNG, JPG, or WebP under ${TOKEN_MEDIA_MAX_KB} KB`}
          isUploading={isUploading || disabled}
          inputClassName="k-input"
        />
        {logoError ? <p className="mt-1.5 text-xs font-medium text-red-500">{logoError}</p> : null}
      </div>

      <div>
        <KxFormFieldLabel>Featured image / banner</KxFormFieldLabel>
        <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-2">
          Recommended 1200x630px (1.91:1) for token page header balance. Max {TOKEN_MEDIA_MAX_KB} KB.
        </p>
        <KxImageSourceField
          source={media.featuredSource}
          onSourceChange={(featuredSource) => onChange({ ...media, featuredSource })}
          url={media.featuredUrl}
          onUrlChange={(featuredUrl) =>
            onChange({
              ...media,
              featuredUrl: normalizeIpfsUrlForForm(featuredUrl),
              featuredCid: null,
              featuredName: null,
            })
          }
          urlPlaceholder="https://..."
          urlHint="Direct HTTPS image URL. PNG, JPG, or WebP."
          fileName={media.featuredName ?? (media.featuredCid ? 'Uploaded banner' : null)}
          onClearFile={() => onChange({ ...media, featuredCid: null, featuredName: null })}
          onFileChange={uploadFeatured}
          uploadHint={`PNG, JPG, or WebP under ${TOKEN_MEDIA_MAX_KB} KB`}
          isUploading={isUploading || disabled}
          inputClassName="k-input"
        />
        {featuredError ? <p className="mt-1.5 text-xs font-medium text-red-500">{featuredError}</p> : null}
      </div>
    </>
  );

  if (embedded) {
    return <div className="space-y-6">{fields}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <DAppSectionHeader title="Listing media" className="mb-3" />
        <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-2 tracking-tight">Logo and banner</h3>
        <p className="kx-body max-w-3xl">
          Upload your token logo and featured banner. Use a direct URL or IPFS upload, same as vBlog article media.
        </p>
      </div>
      <div className={PANEL_CLASS}>{fields}</div>
    </div>
  );
}
