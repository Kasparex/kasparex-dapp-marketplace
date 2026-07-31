'use client';

import Image from 'next/image';
import { getTokenImageUrl } from '@/lib/tokens/metadata';
import { getBaseTokenLogoUrl } from '@/lib/tokens/baseLogos';

interface TokenLogoImageProps {
  tokenId: 'kas' | 'krex' | 'grid';
  size?: number;
  className?: string;
}

/**
 * Simple token logo image component for KAS, KREX, and GRID
 */
export function TokenLogoImage({ tokenId, size = 24, className = '' }: TokenLogoImageProps) {
  const logoUrl = getBaseTokenLogoUrl(tokenId);
  
  if (!logoUrl) {
    // Fallback to initials if logo not found
    return (
      <div 
        className={`flex items-center justify-center bg-zinc-200 dark:bg-zinc-700 rounded-full ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
          {tokenId.toUpperCase().slice(0, 1)}
        </span>
      </div>
    );
  }

  // Local path / absolute URL as-is; otherwise resolve CID via gateway
  const imageUrl =
    logoUrl.startsWith('http') || logoUrl.startsWith('/')
      ? logoUrl
      : getTokenImageUrl(logoUrl) || logoUrl;

  return (
    <Image
      src={imageUrl}
      alt={`${tokenId.toUpperCase()} logo`}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      unoptimized
      onError={(e) => {
        // Fallback to initials on error
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
        const parent = target.parentElement;
        if (parent) {
          parent.innerHTML = `
            <div class="flex items-center justify-center bg-zinc-200 dark:bg-zinc-700 rounded-full" style="width: ${size}px; height: ${size}px">
              <span class="text-xs font-semibold text-zinc-600 dark:text-zinc-400">${tokenId.toUpperCase().slice(0, 1)}</span>
            </div>
          `;
        }
      }}
    />
  );
}
