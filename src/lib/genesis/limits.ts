import { htmlToPlainText } from '@/lib/richText/html';

export const GENESIS_MESSAGE_LIMITS = {
  min: 20,
  max: 5000,
} as const;

export function genesisPlainTextLength(html: string): number {
  return htmlToPlainText(html).length;
}

export function validateGenesisMessageHtml(html: string): string | null {
  const plain = htmlToPlainText(html);
  if (!plain) return 'Message cannot be empty';
  if (plain.length < GENESIS_MESSAGE_LIMITS.min) {
    return `Message must be at least ${GENESIS_MESSAGE_LIMITS.min} characters`;
  }
  if (plain.length > GENESIS_MESSAGE_LIMITS.max) {
    return `Message must be ${GENESIS_MESSAGE_LIMITS.max} characters or fewer`;
  }
  return null;
}
