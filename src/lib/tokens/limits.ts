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
