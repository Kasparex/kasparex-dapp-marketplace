# DAO Voting Integration Guide

Step-by-step guide for integrating DAO Voting into your application.

---

## Prerequisites

- Node.js 18+ installed
- An EVM-compatible wallet (MetaMask, Rabby, etc.)
- Access to Kasplex L2 Testnet network
- Basic knowledge of React/Next.js and TypeScript

---

## Installation

### 1. Install Dependencies

```bash
npm install wagmi viem @tanstack/react-query
# or
pnpm add wagmi viem @tanstack/react-query
```

### 2. Configure Wagmi

```typescript
import { createConfig, http } from 'wagmi';
import {  } from 'wagmi/chains';

export const config = createConfig({
  chains: [],
  transports: {
    [.id]: http(),
  },
});
```

---

## Contract Setup

### Contract Address

```typescript
const CONTRACT_ADDRESS = '';
```

### Import ABI

```typescript
import { DAO_VOTING_ABI } from '@/lib/contracts/abis';
```

---

## Basic Usage

### 1. Read Contract Data

```typescript
import { useReadContract } from 'wagmi';

function MyComponent() {
  const { data, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DAO_VOTING_ABI,
    functionName: 'getData',
  });

  if (isLoading) return <div>Loading...</div>;
  
  return <div>Data: {data?.toString()}</div>;
}
```

### 2. Write Contract Functions

```typescript
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

function MyComponent() {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const handleAction = async () => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: DAO_VOTING_ABI,
      functionName: 'setData',
      args: [/* your arguments */],
    });
  };

  return (
    <button onClick={handleAction} disabled={isPending || isConfirming}>
      {isPending ? 'Confirming...' : 'Execute'}
    </button>
  );
}
```

---

## Custom Hook Example

```typescript
import { useReadContract, useWriteContract } from 'wagmi';
import { DAO_VOTING_ABI } from '@/lib/contracts/abis';

const CONTRACT_ADDRESS = '';

export function useDAOVoting() {
  // Read operations
  const { data: data, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DAO_VOTING_ABI,
    functionName: 'getData',
  });

  // Write operations
  const { writeContract, data: hash, isPending } = useWriteContract();

  const setData = async () => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: DAO_VOTING_ABI,
      functionName: 'setData',
      args: [],
    });
  };

  return {
    data,
    isLoading,
    setData,
    isPending,
    hash,
  };
}
```

---

## Error Handling

```typescript
import { useSafeError } from '@/hooks/useSafeError';

function MyComponent() {
  const { writeContract, error } = useWriteContract();
  const safeError = useSafeError(error);

  // Handle errors
  if (safeError) {
    console.error('Transaction error:', safeError.message);
  }
}
```

---

## Complete Example



---

## Network Compatibility

DAO Voting supports the following networks:


- **** (Chain ID: 167012)
  - Contract: ``
  - RPC: https://evmrpc-testnet.kasplex.org
  - Explorer: https://explorer-testnet.kasplex.org



---

## Troubleshooting

### Common Issues

**Issue**: Transaction fails with "insufficient funds"
- **Solution**: Ensure you have enough KAS for gas fees

**Issue**: Contract not found
- **Solution**: Verify the contract address and network are correct

**Issue**: Function not found
- **Solution**: Check that you're using the correct ABI and function name

---

## Additional Resources

- [Contract Reference](./contracts/dao-voting.md)
- [dApp Overview](./dapps/dao-voting.md)
- [Wagmi Documentation](https://wagmi.sh)
- [Viem Documentation](https://viem.sh)

---

*Last updated: 2025-11-13*

