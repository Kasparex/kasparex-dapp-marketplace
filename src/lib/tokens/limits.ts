/** Token listing content limits (aligned with vBlog patterns). */

export const TOKEN_CONTENT_LIMITS = {
  symbol: { min: 2, max: 12 },
  name: { min: 2, max: 80 },
  shortDescription: { min: 10, max: 200 },
  description: { min: 20, max: 5000 },
  tags: { max: 12, tagMaxLength: 32 },
  contractAddress: { max: 128 },
} as const;

export function getTokenCharacterCount(text: string): number {
  return text.replace(/<[^>]*>/g, '').trim().length;
}

/** Max upload size for token logo and featured banner (500 KB). */
export const TOKEN_MEDIA_MAX_BYTES = 500 * 1024;
export const TOKEN_MEDIA_MAX_KB = 500;

export function validateTokenImage(file: File): { valid: boolean; error?: string } {
  const allowedMime = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (file.size > TOKEN_MEDIA_MAX_BYTES) {
    return { valid: false, error: `Image must be ${TOKEN_MEDIA_MAX_KB} KB or smaller.` };
  }
  if (!allowedMime.includes(file.type.toLowerCase())) {
    return { valid: false, error: 'Use a PNG, JPG, or WebP image.' };
  }
  return { valid: true };
}
