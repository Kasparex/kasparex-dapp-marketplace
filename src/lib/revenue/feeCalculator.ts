/**
 * Fee Calculator Utilities
 * 
 * Helper functions for calculating fees and payment amounts
 */

/**
 * Calculate fee amount from total amount and fee percentage
 * @param amount Total amount in wei
 * @param feePercentage Fee percentage in basis points (100 = 1%)
 * @returns Fee amount in wei
 */
export function calculateFee(amount: bigint, feePercentage: number): bigint {
  return (amount * BigInt(feePercentage)) / BigInt(10000);
}

/**
 * Calculate payment amount after deducting fee
 * @param amount Total amount in wei
 * @param feePercentage Fee percentage in basis points (100 = 1%)
 * @returns Payment amount after fee in wei
 */
export function calculatePaymentAmount(
  amount: bigint,
  feePercentage: number
): bigint {
  const fee = calculateFee(amount, feePercentage);
  return amount - fee;
}

/**
 * Format wei to KAS (assuming 18 decimals)
 * @param amount Amount in wei
 * @param decimals Number of decimals (default: 18)
 * @returns Formatted string
 */
export function formatKAS(amount: bigint, decimals: number = 18): string {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const remainder = amount % divisor;
  
  if (remainder === 0n) {
    return whole.toString();
  }
  
  const remainderStr = remainder.toString().padStart(decimals, "0");
  const trimmed = remainderStr.replace(/0+$/, "");
  
  return `${whole}.${trimmed}`;
}

/**
 * Parse KAS string to wei
 * @param amount Amount as string (e.g., "1.5")
 * @param decimals Number of decimals (default: 18)
 * @returns Amount in wei
 */
export function parseKAS(amount: string, decimals: number = 18): bigint {
  const parts = amount.split(".");
  const whole = parts[0] || "0";
  const fractional = parts[1] || "";
  
  const wholeBig = BigInt(whole) * BigInt(10 ** decimals);
  const fractionalBig = BigInt(fractional.padEnd(decimals, "0").slice(0, decimals));
  
  return wholeBig + fractionalBig;
}

/**
 * Default fee percentage (1% = 100 basis points)
 */
export const DEFAULT_FEE_PERCENTAGE = 100;

/**
 * Revenue distribution percentages (basis points)
 */
export const REVENUE_DISTRIBUTION = {
  TREASURY: 4000, // 40%
  DEVELOPER: 3000, // 30%
  BUILDER: 3000, // 30%
} as const;


