# {{DAPP_NAME}} Integration Guide

Step-by-step guide for integrating {{DAPP_NAME}} into your application.

---

## Prerequisites

- Node.js 18+ installed
- An EVM-compatible wallet (MetaMask, Rabby, etc.)
- Access to {{NETWORK}} network
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
import { {{NETWORK_NAME}} } from 'wagmi/chains';

export const config = createConfig({
  chains: [{{NETWORK_NAME}}],
  transports: {
    [{{NETWORK_NAME}}.id]: http(),
  },
});
```

---

## Contract Setup

### Contract Address

```typescript
const CONTRACT_ADDRESS = '{{CONTRACT_ADDRESS}}';
```

### Import ABI

```typescript
import { {{CONTRACT_ABI_NAME}} } from '@/lib/contracts/abis';
```

---

## Basic Usage

### 1. Read Contract Data

```typescript
import { useReadContract } from 'wagmi';

function MyComponent() {
  const { data, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: {{CONTRACT_ABI_NAME}},
    functionName: '{{EXAMPLE_READ_FUNCTION}}',
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
      abi: {{CONTRACT_ABI_NAME}},
      functionName: '{{EXAMPLE_WRITE_FUNCTION}}',
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
import { {{CONTRACT_ABI_NAME}} } from '@/lib/contracts/abis';

const CONTRACT_ADDRESS = '{{CONTRACT_ADDRESS}}';

export function use{{HOOK_NAME}}() {
  // Read operations
  const { data: {{READ_DATA}}, isLoading } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: {{CONTRACT_ABI_NAME}},
    functionName: '{{READ_FUNCTION}}',
  });

  // Write operations
  const { writeContract, data: hash, isPending } = useWriteContract();

  const {{WRITE_FUNCTION}} = async ({{PARAMS}}) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: {{CONTRACT_ABI_NAME}},
      functionName: '{{WRITE_FUNCTION_NAME}}',
      args: [{{ARGS}}],
    });
  };

  return {
    {{READ_DATA}},
    isLoading,
    {{WRITE_FUNCTION}},
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

{{#COMPLETE_EXAMPLE}}
```typescript
{{COMPLETE_EXAMPLE_CODE}}
```
{{/COMPLETE_EXAMPLE}}

---

## Network Compatibility

{{DAPP_NAME}} supports the following networks:

{{#NETWORKS}}
- **{{NETWORK_NAME}}** (Chain ID: {{CHAIN_ID}})
  - Contract: `{{CONTRACT_ADDRESS}}`
  - RPC: {{RPC_URL}}
  - Explorer: {{EXPLORER_URL}}

{{/NETWORKS}}

---

## Troubleshooting

### Common Issues

**Issue**: Transaction fails with "insufficient funds"
- **Solution**: Ensure you have enough {{NATIVE_TOKEN}} for gas fees

**Issue**: Contract not found
- **Solution**: Verify the contract address and network are correct

**Issue**: Function not found
- **Solution**: Check that you're using the correct ABI and function name

---

## Additional Resources

- [Contract Reference](./contracts/{{CONTRACT_SLUG}}.md)
- [dApp Overview](./dapps/{{DAPP_SLUG}}.md)
- [Wagmi Documentation](https://wagmi.sh)
- [Viem Documentation](https://viem.sh)

---

*Last updated: {{LAST_UPDATED}}*

