/**
 * KasWare Wallet API Service
 * 
 * Comprehensive wrapper for all KasWare wallet API methods
 * Documentation: https://docs.kasware.xyz/wallet/dev-base/kaspa
 */

/**
 * Extended KasWare Window interface with all API methods
 */
export interface KasWareAPI {
  // Basic connection methods
  requestAccounts(): Promise<string[]>;
  getAddress(): Promise<string | null>;
  getBalance(): Promise<string | number | { balance: string | number } | null>;
  isConnected(): boolean;
  disconnect(): Promise<void>;
  
  // Message signing
  signMessage(msg: string, type?: string): Promise<string>;
  
  // Transaction methods
  sendKaspa(toAddress: string, sompi: number | string, options?: Record<string, any>): Promise<string>;
  signPskt(params: { txJsonString: string; options?: Record<string, any> }): Promise<string>;
  
  // KRC-20 token methods
  getKRC20Balance(): Promise<Array<{ tick: string; amount: string | number; [key: string]: any }>>;
  getUtxoEntries(): Promise<Array<{ amount: number | string; [key: string]: any }>>;
  
  // KRC-20 order methods
  createKRC20Order(params: {
    krc20Tick: string;
    krc20Amount: string | number;
    kasAmount: string | number;
    psktExtraOutput?: string;
    priorityFee?: number | string;
  }): Promise<string>;
  
  buyKRC20Token(params: {
    txJsonString: string;
    extraOutput?: string;
    priorityFee?: number | string;
  }): Promise<string>;
  
  cancelKRC20Order(params: {
    krc20Tick: string;
    txJsonString: string;
    sendCommitTxId?: string;
  }): Promise<string>;
  
  signKRC20Transaction(
    inscribeJsonString: string,
    type: string,
    destAddr: string,
    priorityFee?: number | string
  ): Promise<string>;
  
  // Network and version info
  getNetwork(): Promise<string>;
  getVersion(): Promise<string>;
  
  // Event listeners
  on(event: 'accountsChanged', callback: (accounts: string[]) => void): void;
  removeListener(event: 'accountsChanged', callback: (accounts: string[]) => void): void;
}

/**
 * Get KasWare wallet instance from window
 */
export function getKasWare(): KasWareAPI | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const win = window as any;
  return win.kasware || null;
}

/**
 * Check if KasWare is installed
 */
export function isKasWareInstalled(): boolean {
  return typeof window !== 'undefined' && !!(window as any).kasware;
}

/**
 * Check if KasWare is connected
 */
export function isKasWareConnected(): boolean {
  const kasware = getKasWare();
  if (!kasware || typeof kasware.isConnected !== 'function') {
    return false;
  }
  return kasware.isConnected();
}

/**
 * Get KRC-20 token balance
 * 
 * @returns Array of KRC-20 tokens with their balances
 */
export async function getKRC20Balance(): Promise<Array<{ tick: string; amount: string | number; [key: string]: any }>> {
  const kasware = getKasWare();
  if (!kasware) {
    throw new Error('KasWare wallet is not installed');
  }
  
  if (typeof kasware.getKRC20Balance !== 'function') {
    throw new Error('getKRC20Balance() method is not available. Please update your KasWare extension.');
  }
  
  return await kasware.getKRC20Balance();
}

/**
 * Get UTXO entries
 * 
 * @returns Array of UTXO entries
 */
export async function getUtxoEntries(): Promise<Array<{ amount: number | string; [key: string]: any }>> {
  const kasware = getKasWare();
  if (!kasware) {
    throw new Error('KasWare wallet is not installed');
  }
  
  if (typeof kasware.getUtxoEntries !== 'function') {
    throw new Error('getUtxoEntries() method is not available. Please update your KasWare extension.');
  }
  
  return await kasware.getUtxoEntries();
}

/**
 * Send KAS transaction
 * 
 * @param toAddress - Recipient address
 * @param sompi - Amount in sompis
 * @param options - Optional transaction options
 * @returns Transaction hash
 */
export async function sendKaspa(
  toAddress: string,
  sompi: number | string,
  options?: Record<string, any>
): Promise<string> {
  const kasware = getKasWare();
  if (!kasware) {
    throw new Error('KasWare wallet is not installed');
  }
  
  if (!isKasWareConnected()) {
    throw new Error('KasWare wallet is not connected');
  }
  
  if (typeof kasware.sendKaspa !== 'function') {
    throw new Error('sendKaspa() method is not available. Please update your KasWare extension.');
  }
  
  return await kasware.sendKaspa(toAddress, sompi, options);
}

/**
 * Sign PSKT transaction
 * 
 * @param txJsonString - Transaction JSON string
 * @param options - Optional signing options
 * @returns Signed transaction
 */
export async function signPskt(
  txJsonString: string,
  options?: Record<string, any>
): Promise<string> {
  const kasware = getKasWare();
  if (!kasware) {
    throw new Error('KasWare wallet is not installed');
  }
  
  if (!isKasWareConnected()) {
    throw new Error('KasWare wallet is not connected');
  }
  
  if (typeof kasware.signPskt !== 'function') {
    throw new Error('signPskt() method is not available. Please update your KasWare extension.');
  }
  
  return await kasware.signPskt({ txJsonString, options });
}

/**
 * Get network information
 * 
 * @returns Network name (e.g., 'mainnet', 'testnet')
 */
export async function getNetwork(): Promise<string> {
  const kasware = getKasWare();
  if (!kasware) {
    throw new Error('KasWare wallet is not installed');
  }
  
  if (typeof kasware.getNetwork !== 'function') {
    throw new Error('getNetwork() method is not available. Please update your KasWare extension.');
  }
  
  return await kasware.getNetwork();
}

/**
 * Get KasWare version
 * 
 * @returns Version string
 */
export async function getVersion(): Promise<string> {
  const kasware = getKasWare();
  if (!kasware) {
    throw new Error('KasWare wallet is not installed');
  }
  
  if (typeof kasware.getVersion !== 'function') {
    throw new Error('getVersion() method is not available. Please update your KasWare extension.');
  }
  
  return await kasware.getVersion();
}

/**
 * Create KRC-20 order
 * 
 * @param params - Order parameters
 * @returns Transaction hash
 */
export async function createKRC20Order(params: {
  krc20Tick: string;
  krc20Amount: string | number;
  kasAmount: string | number;
  psktExtraOutput?: string;
  priorityFee?: number | string;
}): Promise<string> {
  const kasware = getKasWare();
  if (!kasware) {
    throw new Error('KasWare wallet is not installed');
  }
  
  if (!isKasWareConnected()) {
    throw new Error('KasWare wallet is not connected');
  }
  
  if (typeof kasware.createKRC20Order !== 'function') {
    throw new Error('createKRC20Order() method is not available. Please update your KasWare extension.');
  }
  
  return await kasware.createKRC20Order(params);
}

/**
 * Buy KRC-20 token
 * 
 * @param params - Buy parameters
 * @returns Transaction hash
 */
export async function buyKRC20Token(params: {
  txJsonString: string;
  extraOutput?: string;
  priorityFee?: number | string;
}): Promise<string> {
  const kasware = getKasWare();
  if (!kasware) {
    throw new Error('KasWare wallet is not installed');
  }
  
  if (!isKasWareConnected()) {
    throw new Error('KasWare wallet is not connected');
  }
  
  if (typeof kasware.buyKRC20Token !== 'function') {
    throw new Error('buyKRC20Token() method is not available. Please update your KasWare extension.');
  }
  
  return await kasware.buyKRC20Token(params);
}

/**
 * Cancel KRC-20 order
 * 
 * @param params - Cancel parameters
 * @returns Transaction hash
 */
export async function cancelKRC20Order(params: {
  krc20Tick: string;
  txJsonString: string;
  sendCommitTxId?: string;
}): Promise<string> {
  const kasware = getKasWare();
  if (!kasware) {
    throw new Error('KasWare wallet is not installed');
  }
  
  if (!isKasWareConnected()) {
    throw new Error('KasWare wallet is not connected');
  }
  
  if (typeof kasware.cancelKRC20Order !== 'function') {
    throw new Error('cancelKRC20Order() method is not available. Please update your KasWare extension.');
  }
  
  return await kasware.cancelKRC20Order(params);
}

/**
 * Sign KRC-20 transaction
 * 
 * @param inscribeJsonString - Inscription JSON string
 * @param type - Transaction type
 * @param destAddr - Destination address
 * @param priorityFee - Optional priority fee
 * @returns Signed transaction
 */
export async function signKRC20Transaction(
  inscribeJsonString: string,
  type: string,
  destAddr: string,
  priorityFee?: number | string
): Promise<string> {
  const kasware = getKasWare();
  if (!kasware) {
    throw new Error('KasWare wallet is not installed');
  }
  
  // Check connection - try to get address as a reliable connection check
  let isConnected = false;
  try {
    if (typeof kasware.getAddress === 'function') {
      const address = await kasware.getAddress();
      isConnected = address !== null && address !== undefined;
    } else if (typeof kasware.isConnected === 'function') {
      isConnected = kasware.isConnected();
    }
  } catch (err) {
    // If we can't check, assume not connected
    isConnected = false;
  }
  
  if (!isConnected) {
    throw new Error('KasWare wallet is not connected');
  }
  
  if (typeof kasware.signKRC20Transaction !== 'function') {
    throw new Error('signKRC20Transaction() method is not available. Please update your KasWare extension.');
  }
  
  return await kasware.signKRC20Transaction(inscribeJsonString, type, destAddr, priorityFee);
}

/**
 * Sign message with optional type
 * 
 * @param message - Message to sign
 * @param type - Optional message type
 * @returns Signature
 */
export async function signMessage(message: string, type?: string): Promise<string> {
  const kasware = getKasWare();
  if (!kasware) {
    throw new Error('KasWare wallet is not installed');
  }
  
  if (!isKasWareConnected()) {
    throw new Error('KasWare wallet is not connected');
  }
  
  if (typeof kasware.signMessage !== 'function') {
    throw new Error('signMessage() method is not available. Please update your KasWare extension.');
  }
  
  return await kasware.signMessage(message, type);
}

