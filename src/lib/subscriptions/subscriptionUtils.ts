/**
 * Subscription Utilities
 * 
 * Helper functions for subscription management and checking
 */

/**
 * Payment frequency types
 */
export enum PaymentFrequency {
  Monthly = 0,
  Quarterly = 1,
  Yearly = 2,
}

/**
 * Subscription status
 */
export interface SubscriptionStatus {
  platformSubscribed: boolean;
  platformExpiry: bigint;
  dAppSubscribed: boolean;
  dAppExpiry: bigint;
  hasAccess: boolean;
}

/**
 * Format timestamp to readable date
 * @param timestamp Timestamp in seconds
 * @returns Formatted date string
 */
export function formatExpiryDate(timestamp: bigint): string {
  if (timestamp === 0n) return "Never";
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Check if subscription is expired
 * @param expiryTimestamp Expiry timestamp
 * @returns True if expired
 */
export function isExpired(expiryTimestamp: bigint): boolean {
  if (expiryTimestamp === 0n) return true;
  return BigInt(Math.floor(Date.now() / 1000)) > expiryTimestamp;
}

/**
 * Get days until expiry
 * @param expiryTimestamp Expiry timestamp
 * @returns Number of days until expiry (negative if expired)
 */
export function getDaysUntilExpiry(expiryTimestamp: bigint): number {
  if (expiryTimestamp === 0n) return 0;
  const now = BigInt(Math.floor(Date.now() / 1000));
  const diff = expiryTimestamp - now;
  const days = Number(diff) / (24 * 60 * 60);
  return Math.floor(days);
}

/**
 * Get payment frequency label
 * @param frequency PaymentFrequency enum value
 * @returns Human-readable label
 */
export function getFrequencyLabel(frequency: PaymentFrequency): string {
  switch (frequency) {
    case PaymentFrequency.Monthly:
      return "Monthly";
    case PaymentFrequency.Quarterly:
      return "Quarterly";
    case PaymentFrequency.Yearly:
      return "Yearly";
    default:
      return "Unknown";
  }
}

/**
 * Get payment frequency period in days
 * @param frequency PaymentFrequency enum value
 * @returns Number of days
 */
export function getFrequencyPeriod(frequency: PaymentFrequency): number {
  switch (frequency) {
    case PaymentFrequency.Monthly:
      return 30;
    case PaymentFrequency.Quarterly:
      return 90;
    case PaymentFrequency.Yearly:
      return 365;
    default:
      return 0;
  }
}

