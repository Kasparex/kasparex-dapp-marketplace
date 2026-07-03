'use client';

import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import { KxImageSourceField } from '@/components/ui/KxImageSourceField';
import { useIPFSUpload } from '@/lib/ipfs/hooks';
import { IPFS_MAX_UPLOAD_MB } from '@/lib/ipfs/limits';
import { getBestGatewayUrl } from '@/lib/ipfs/gateway';
import { validateImage } from '@/lib/vblog/limits';

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
}

const PANEL_CLASS =
  'rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-sm space-y-8';

export function TokenListingMediaPanel({ media, onChange, disabled }: TokenListingMediaPanelProps) {
  const { upload, isUploading } = useIPFSUpload();

  const uploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateImage(file);
    if (!validation.valid) return;
    const cid = await upload(file, { filename: file.name });
    if (cid) {
      onChange({
        ...media,
        logoSource: 'file',
        logoCid: cid,
        logoName: file.name,
        logoUrl: '',
      });
    }
    e.target.value = '';
  };

  const uploadFeatured = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateImage(file);
    if (!validation.valid) return;
    const cid = await upload(file, { filename: file.name });
    if (cid) {
      onChange({
        ...media,
        featuredSource: 'file',
        featuredCid: cid,
        featuredName: file.name,
        featuredUrl: '',
      });
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div>
        <DAppSectionHeader title="Listing media" className="mb-3" />
        <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-2 tracking-tight">Logo and banner</h3>
        <p className="kx-body max-w-3xl">
          Upload your token logo and featured banner. Use a direct URL or IPFS upload, same as vBlog article media.
        </p>
      </div>

      <div className={PANEL_CLASS}>
        <div>
          <KxFormFieldLabel>Token logo</KxFormFieldLabel>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-2">Square PNG or JPG recommended (256x256 or larger).</p>
          <KxImageSourceField
            source={media.logoSource}
            onSourceChange={(logoSource) => onChange({ ...media, logoSource })}
            url={media.logoUrl}
            onUrlChange={(logoUrl) => onChange({ ...media, logoUrl, logoCid: null, logoName: null })}
            urlPlaceholder="https://..."
            urlHint="Direct HTTPS image URL. PNG or JPG."
            fileName={media.logoName ?? (media.logoCid ? 'Uploaded logo' : null)}
            onClearFile={() => onChange({ ...media, logoCid: null, logoName: null })}
            onFileChange={uploadLogo}
            uploadHint={`PNG or JPG under ${IPFS_MAX_UPLOAD_MB} MB`}
            isUploading={isUploading}
            inputClassName="k-input"
          />
        </div>

        <div>
          <KxFormFieldLabel>Featured image / banner</KxFormFieldLabel>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mb-2">
            Recommended 1200x630px (1.91:1) for token page header balance.
          </p>
          <KxImageSourceField
            source={media.featuredSource}
            onSourceChange={(featuredSource) => onChange({ ...media, featuredSource })}
            url={media.featuredUrl}
            onUrlChange={(featuredUrl) =>
              onChange({ ...media, featuredUrl, featuredCid: null, featuredName: null })
            }
            urlPlaceholder="https://..."
            urlHint="Direct HTTPS image URL. PNG, JPG, or WebP."
            fileName={media.featuredName ?? (media.featuredCid ? 'Uploaded banner' : null)}
            onClearFile={() => onChange({ ...media, featuredCid: null, featuredName: null })}
            onFileChange={uploadFeatured}
            uploadHint={`PNG, JPG, or WebP under ${IPFS_MAX_UPLOAD_MB} MB`}
            isUploading={isUploading}
            inputClassName="k-input"
          />
        </div>
      </div>
    </div>
  );
}
