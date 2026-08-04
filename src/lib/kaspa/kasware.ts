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
  /** Broadcast a signed Safe-JSON transaction (KasCoven / covenant flows). */
  pushTx?(txJsonString: string): Promise<string>;
  getPublicKey?(): Promise<string>;
  getAccounts?(): Promise<string[]>;
  
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
    type: string | number,
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
 * Broadcast a signed Safe-JSON transaction.
 */
export async function pushTx(signedTxJson: string): Promise<string> {
  const kasware = getKasWare();
  if (!kasware) {
    throw new Error('KasWare wallet is not installed');
  }

  if (!isKasWareConnected()) {
    throw new Error('KasWare wallet is not connected');
  }

  if (typeof kasware.pushTx !== 'function') {
    throw new Error('pushTx() method is not available. Please update your KasWare extension.');
  }

  return await kasware.pushTx(signedTxJson);
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
  type: string | number,
  destAddr: string,
  priorityFee?: number | string
): Promise<string> {
  const kasware = getKasWare();
  if (!kasware) {
    throw new Error('KasWare wallet is not installed');
  }
  
  // Skip connection check - if the wallet wasn't connected, the actual API call will fail with a better error
  // The widget already validates connection state before calling this function
  // Also, if getKRC20Balance() works (which it does, since balance is displayed), the wallet is connected
  
  if (typeof kasware.signKRC20Transaction !== 'function') {
    throw new Error('signKRC20Transaction() method is not available. Please update your KasWare extension.');
  }
  
  // Validate that inscribeJsonString is actually a string
  if (typeof inscribeJsonString !== 'string') {
    console.error('[KasWare] Invalid inscribeJsonString type:', typeof inscribeJsonString, inscribeJsonString);
    throw new Error(`inscribeJsonString must be a string, received ${typeof inscribeJsonString}. Did you forget to JSON.stringify()?`);
  }
  
  // Ensure type is a number (KasWare API expects number: 2=deploy, 3=mint, 4=transfer)
  const typeParam = typeof type === 'number' ? type : (typeof type === 'string' ? parseInt(type, 10) : 4);
  if (isNaN(typeParam) || typeParam < 2 || typeParam > 4) {
    throw new Error(`Invalid type parameter: must be 2 (deploy), 3 (mint), or 4 (transfer), received ${type}`);
  }
  
  // Ensure destAddr is a string
  if (typeof destAddr !== 'string' || !destAddr.trim()) {
    console.error('[KasWare] Invalid destAddr type:', typeof destAddr, destAddr);
    throw new Error(`destAddr must be a non-empty string, received ${typeof destAddr}`);
  }
  const dest = destAddr.trim();
  const destLower = dest.toLowerCase();
  const isTestnetDest = destLower.startsWith('kaspatest:');
  const isMainnetDest = destLower.startsWith('kaspa:') && !isTestnetDest;
  if (!isTestnetDest && !isMainnetDest) {
    throw new Error('The address prefix is missing');
  }

  // Ensure JSON `to` carries the full prefixed address (source of truth for TN10).
  let payload = inscribeJsonString;
  try {
    const parsed = JSON.parse(inscribeJsonString) as Record<string, unknown>;
    if (typeParam === 4) {
      parsed.to = dest;
      payload = JSON.stringify(parsed);
    }
  } catch {
    payload = inscribeJsonString;
  }
  
  // Ensure priorityFee is a number if provided
  let priorityFeeNum: number | undefined = undefined;
  if (priorityFee !== undefined && priorityFee !== null) {
    priorityFeeNum = typeof priorityFee === 'number' ? priorityFee : parseFloat(String(priorityFee));
    if (isNaN(priorityFeeNum)) {
      console.warn('[KasWare] Invalid priorityFee, ignoring:', priorityFee);
      priorityFeeNum = undefined;
    }
  }
  
  try {
    // Final validation: ensure inscribeJsonString is valid JSON
    try {
      JSON.parse(payload);
    } catch (e) {
      throw new Error(`inscribeJsonString is not valid JSON: ${e instanceof Error ? e.message : String(e)}`);
    }
    
    console.log('[KasWare] Calling signKRC20Transaction with:', {
      inscribeJsonString: payload.substring(0, 100) + (payload.length > 100 ? '...' : ''),
      inscribeJsonStringLength: payload.length,
      inscribeJsonStringType: typeof payload,
      type: typeParam,
      typeType: typeof typeParam,
      destAddr: dest,
      destAddrType: typeof dest,
      omitDestAddrArg: isTestnetDest,
      priorityFee: priorityFeeNum,
      priorityFeeType: typeof priorityFeeNum,
    });
    
    // KasWare's destAddr guard often checks the literal 6-char `kaspa:` HRP and rejects
    // `kaspatest:`. On TN10, omit destAddr and pass destination only via JSON `to`.
    const result = isTestnetDest
      ? await (
          kasware.signKRC20Transaction as (
            json: string,
            type: number,
            dest?: string,
            fee?: number,
          ) => Promise<string>
        )(payload, typeParam, undefined, priorityFeeNum)
      : await kasware.signKRC20Transaction(payload, typeParam, dest, priorityFeeNum);
    console.log('[KasWare] signKRC20Transaction success, txHash:', result);
    return result;
  } catch (err) {
    // Enhanced error logging
    console.error('[KasWare] signKRC20Transaction error:', err);
    console.error('[KasWare] Error details:', {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      name: err instanceof Error ? err.name : undefined,
      fullError: err,
    });
    
    // If the API call fails, provide a more helpful error message
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    if (errorMessage.includes('not connected') || errorMessage.includes('disconnected')) {
      throw new Error('KasWare wallet is not connected. Please reconnect your wallet.');
    }
    // Re-throw with original error to preserve details
    throw err;
  }
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

