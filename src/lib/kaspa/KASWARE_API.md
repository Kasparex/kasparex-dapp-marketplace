# KasWare Wallet API Integration

This document describes the KasWare wallet API integration and how to use all available methods.

## Overview

The KasWare wallet API is integrated through:
- **`src/lib/kaspa/kasware.ts`** - Core service with all API methods
- **`src/hooks/useKasWare.ts`** - React hook for easy wallet interaction
- **`src/components/KasWareWalletButton.tsx`** - UI component for wallet connection

## Installation Check

```typescript
import { isKasWareInstalled, getKasWare } from '@/lib/kaspa/kasware';

if (isKasWareInstalled()) {
  const kasware = getKasWare();
  // Use kasware methods
}
```

## Basic Methods

### Connection

```typescript
import { getKasWare } from '@/lib/kaspa/kasware';

const kasware = getKasWare();
if (!kasware) {
  throw new Error('KasWare not installed');
}

// Request connection
const accounts = await kasware.requestAccounts();
const address = accounts[0];

// Get address
const currentAddress = await kasware.getAddress();

// Check connection
const isConnected = kasware.isConnected();

// Disconnect
await kasware.disconnect();
```

### Balance

```typescript
// Get balance (returns string, number, or object)
const balance = await kasware.getBalance();

// Balance might be in sompis or KAS
// If > 1 million, likely in sompis
const balanceNum = typeof balance === 'object' 
  ? balance.balance 
  : balance;
const kasBalance = balanceNum > 1000000 
  ? balanceNum / 100000000 
  : balanceNum;
```

### Network & Version

```typescript
const network = await kasware.getNetwork(); // 'mainnet' | 'testnet'
const version = await kasware.getVersion(); // e.g., '1.0.0'
```

## Transaction Methods

### Send KAS

```typescript
import { sendKaspa, kasToSompis } from '@/lib/kaspa/kasware';
import { kasToSompis } from '@/lib/kaspa/api';

// Send 1 KAS (100,000,000 sompis)
const txHash = await sendKaspa(
  'kaspa:qzeegrxt993rkwkupx0u8yd8sz94atpeg4e7x8yrjav8x7wgulxszc8svhenj',
  kasToSompis(1),
  {
    // Optional: priority fee, etc.
  }
);

console.log('Transaction hash:', txHash);
```

### Sign PSKT Transaction

```typescript
import { signPskt } from '@/lib/kaspa/kasware';

const txJsonString = JSON.stringify({
  // Transaction data
});

const signedTx = await signPskt(txJsonString, {
  // Optional signing options
});

console.log('Signed transaction:', signedTx);
```

## KRC-20 Token Methods

### Get KRC-20 Balance

```typescript
import { getKRC20Balance } from '@/lib/kaspa/kasware';

const tokens = await getKRC20Balance();
// Returns: Array<{ tick: string; amount: string | number; ... }>

tokens.forEach(token => {
  console.log(`${token.tick}: ${token.amount}`);
});
```

### Get UTXO Entries

```typescript
import { getUtxoEntries } from '@/lib/kaspa/kasware';

const utxos = await getUtxoEntries();
// Returns: Array<{ amount: number | string; ... }>

console.log('UTXO count:', utxos.length);
utxos.forEach(utxo => {
  console.log('UTXO amount:', utxo.amount);
});
```

### Create KRC-20 Order

```typescript
import { createKRC20Order, kasToSompis } from '@/lib/kaspa/kasware';

const txHash = await createKRC20Order({
  krc20Tick: 'KASPA',
  krc20Amount: 1000,
  kasAmount: kasToSompis(1), // 1 KAS
  psktExtraOutput: 'optional',
  priorityFee: 1000, // Optional
});

console.log('Order created:', txHash);
```

### Buy KRC-20 Token

```typescript
import { buyKRC20Token } from '@/lib/kaspa/kasware';

const txHash = await buyKRC20Token({
  txJsonString: JSON.stringify({
    // Transaction data from order
  }),
  extraOutput: 'optional',
  priorityFee: 1000, // Optional
});

console.log('Token purchased:', txHash);
```

### Cancel KRC-20 Order

```typescript
import { cancelKRC20Order } from '@/lib/kaspa/kasware';

const txHash = await cancelKRC20Order({
  krc20Tick: 'KASPA',
  txJsonString: JSON.stringify({
    // Transaction data
  }),
  sendCommitTxId: 'optional', // Optional
});

console.log('Order cancelled:', txHash);
```

### Sign KRC-20 Transaction

```typescript
import { signKRC20Transaction } from '@/lib/kaspa/kasware';

const inscribeJsonString = JSON.stringify({
  // Inscription data
});

const signedTx = await signKRC20Transaction(
  inscribeJsonString,
  'transfer', // Transaction type
  'kaspa:destination_address',
  1000 // Optional priority fee
);

console.log('Signed KRC-20 transaction:', signedTx);
```

## Message Signing

### Sign Message

```typescript
import { signMessage } from '@/lib/kaspa/kasware';

// Basic message signing
const signature = await signMessage('Hello, Kaspa!');

// With message type
const typedSignature = await signMessage('Hello, Kaspa!', 'standard');

console.log('Signature:', signature);
```

## Using React Hook

The `useKasWare` hook provides a convenient way to interact with the wallet in React components:

```typescript
import { useKasWare } from '@/hooks/useKasWare';

function MyComponent() {
  const {
    isInstalled,
    isConnected,
    address,
    balance,
    network,
    version,
    krc20Tokens,
    sendTransaction,
    signMsg,
    createOrder,
    error,
  } = useKasWare();

  if (!isInstalled) {
    return <div>Please install KasWare wallet</div>;
  }

  if (!isConnected) {
    return <div>Please connect your wallet</div>;
  }

  const handleSend = async () => {
    try {
      const txHash = await sendTransaction(
        'kaspa:recipient_address',
        100000000 // 1 KAS in sompis
      );
      console.log('Transaction sent:', txHash);
    } catch (err) {
      console.error('Failed to send:', err);
    }
  };

  return (
    <div>
      <p>Address: {address}</p>
      <p>Balance: {balance} KAS</p>
      <p>Network: {network}</p>
      <p>Version: {version}</p>
      
      {krc20Tokens.length > 0 && (
        <div>
          <h3>KRC-20 Tokens:</h3>
          {krc20Tokens.map((token, idx) => (
            <div key={idx}>
              {token.tick}: {token.amount}
            </div>
          ))}
        </div>
      )}
      
      <button onClick={handleSend}>Send 1 KAS</button>
    </div>
  );
}
```

## Event Listeners

```typescript
import { getKasWare } from '@/lib/kaspa/kasware';

const kasware = getKasWare();

if (kasware) {
  // Listen for account changes
  const handleAccountsChanged = (accounts: string[]) => {
    console.log('Accounts changed:', accounts);
    if (accounts.length > 0) {
      console.log('New address:', accounts[0]);
    } else {
      console.log('Wallet disconnected');
    }
  };

  kasware.on('accountsChanged', handleAccountsChanged);

  // Remove listener
  kasware.removeListener('accountsChanged', handleAccountsChanged);
}
```

## Error Handling

All methods throw errors that should be caught:

```typescript
import { sendKaspa } from '@/lib/kaspa/kasware';

try {
  const txHash = await sendKaspa(address, amount);
  console.log('Success:', txHash);
} catch (error) {
  if (error instanceof Error) {
    console.error('Error:', error.message);
    
    // Handle specific errors
    if (error.message.includes('not installed')) {
      // Show install prompt
    } else if (error.message.includes('not connected')) {
      // Show connection prompt
    } else if (error.message.includes('insufficient funds')) {
      // Show insufficient funds message
    }
  }
}
```

## Type Definitions

All types are exported from `@/lib/kaspa/kasware`:

```typescript
import type { KasWareAPI } from '@/lib/kaspa/kasware';

// KasWareAPI interface includes all methods:
// - requestAccounts()
// - getAddress()
// - getBalance()
// - getKRC20Balance()
// - getUtxoEntries()
// - sendKaspa()
// - signPskt()
// - getNetwork()
// - getVersion()
// - createKRC20Order()
// - buyKRC20Token()
// - cancelKRC20Order()
// - signKRC20Transaction()
// - signMessage()
// - isConnected()
// - disconnect()
// - on()
// - removeListener()
```

## Best Practices

1. **Always check if wallet is installed** before calling methods
2. **Check connection status** before transaction operations
3. **Handle errors gracefully** with user-friendly messages
4. **Listen for account changes** to update UI state
5. **Convert amounts properly** between KAS and sompis (1 KAS = 100,000,000 sompis)
6. **Use the React hook** in components for easier state management
7. **Refresh data periodically** or after transactions

## References

- [KasWare Documentation](https://docs.kasware.xyz/wallet/dev-base/kaspa)
- Kaspa API: `src/lib/kaspa/api.ts`
- KasWare Service: `src/lib/kaspa/kasware.ts`
- React Hook: `src/hooks/useKasWare.ts`

