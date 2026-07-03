/**
 * Transaction Tracker
 * 
 * Tracks transaction details, fees, and rewards for display to users
 */

export interface TransactionDetails {
  txHash: string;
  network: 'L1' | 'L2' | 'vProgs';
  dAppId: string;
  actionType: string;
  timestamp: number;
  
  // Transaction amounts
  amount: number; // Total amount sent
  fee: number; // Fee deducted
  netAmount: number; // Amount after fee
  
  // Cost breakdown
  baseCost?: number;
  costReduction?: number;
  finalCost?: number;
  
  // Fee breakdown
  feePercentage?: number;
  feeToProject?: number;
  feeToKasparex?: number;
  
  // Reward information
  rewardId?: string;
  rewardStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  gridReward?: number;
  xpReward?: number;
  
  // User info
  userAddress: string;
  recipientAddress?: string;
  
  // Contract info (for L2)
  contractAddress?: string;
  contractCallSuccess?: boolean;
  
  // Status
  status: 'pending' | 'confirmed' | 'failed';
  error?: string;
}

const TRANSACTION_STORAGE_KEY = 'kasparex_transactions';

/**
 * Store transaction in local storage
 */
export function storeTransaction(tx: TransactionDetails): void {
  try {
    const stored = localStorage.getItem(TRANSACTION_STORAGE_KEY);
    const transactions: TransactionDetails[] = stored ? JSON.parse(stored) : [];
    
    // Add new transaction at the beginning
    transactions.unshift(tx);
    
    // Keep only last 50 transactions
    const limited = transactions.slice(0, 50);
    
    localStorage.setItem(TRANSACTION_STORAGE_KEY, JSON.stringify(limited));
  } catch (error) {
    console.error('Error storing transaction:', error);
  }
}

/**
 * Get all stored transactions
 */
export function getStoredTransactions(): TransactionDetails[] {
  try {
    const stored = localStorage.getItem(TRANSACTION_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading transactions:', error);
    return [];
  }
}

/**
 * Get transaction by hash
 */
export function getTransactionByHash(txHash: string): TransactionDetails | null {
  const transactions = getStoredTransactions();
  return transactions.find(tx => tx.txHash === txHash) || null;
}

/**
 * Update transaction reward information
 */
export function updateTransactionReward(
  txHash: string,
  rewardInfo: {
    rewardId?: string;
    rewardStatus?: 'pending' | 'processing' | 'completed' | 'failed';
    gridReward?: number;
    xpReward?: number;
  }
): void {
  try {
    const transactions = getStoredTransactions();
    const index = transactions.findIndex(tx => tx.txHash === txHash);
    
    if (index !== -1) {
      transactions[index] = {
        ...transactions[index],
        ...rewardInfo,
      };
      
      localStorage.setItem(TRANSACTION_STORAGE_KEY, JSON.stringify(transactions));
    }
  } catch (error) {
    console.error('Error updating transaction reward:', error);
  }
}

/**
 * Clear old transactions (older than 30 days)
 */
export function clearOldTransactions(): void {
  try {
    const transactions = getStoredTransactions();
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    const filtered = transactions.filter(tx => tx.timestamp > thirtyDaysAgo);
    
    localStorage.setItem(TRANSACTION_STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error clearing old transactions:', error);
  }
}
