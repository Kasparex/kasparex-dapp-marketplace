# TypeScript Error Log & Solutions

This document tracks common TypeScript errors encountered in the codebase and their solutions. Use this as a reference to quickly fix recurring issues.

## Table of Contents
1. [Contract Read Results (unknown type)](#contract-read-results)
2. [Template Files Compilation](#template-files-compilation)
3. [Category Type Errors](#category-type-errors)
4. [Contract Address Type Errors](#contract-address-type-errors)
5. [React Hook Dependencies](#react-hook-dependencies)

---

## Contract Read Results (unknown type)

### Problem
`readContract()` and `useReadContract()` return `unknown` type, causing TypeScript errors when accessing properties or using operators.

### Error Examples
```
Type error: 'count' is of type 'unknown'.
Type error: Type 'unknown' must have a '[Symbol.iterator]()' method that returns an iterator.
Type error: Property 'timestamp' does not exist on type 'unknown'.
```

### Solution Pattern

#### For `bigint` values:
```typescript
const result = await publicClient.readContract({...});
let count: bigint;
if (typeof result === 'bigint') {
  count = result;
} else if (typeof result === 'number') {
  count = BigInt(result);
} else if (typeof result === 'string') {
  count = BigInt(result);
} else {
  count = 0n; // Safe fallback
}
```

#### For arrays:
```typescript
const result = await publicClient.readContract({...});
if (!Array.isArray(result) || result.length !== expectedLength) {
  return []; // or handle error
}
const [item1, item2, item3] = result as [Type1, Type2, Type3];
```

#### For objects/structs:
```typescript
const result = await publicClient.readContract({...});
if (!result || typeof result !== 'object' || !('propertyName' in result)) {
  return null; // or handle error
}
const item = result as {
  property1: bigint;
  property2: string;
  property3: boolean;
};
```

#### For `useReadContract` hook:
```typescript
const { data: rawValue } = useReadContract({...});

const value: bigint | null = useMemo(() => {
  if (!rawValue) return null;
  if (typeof rawValue === 'bigint') return rawValue;
  if (typeof rawValue === 'number') return BigInt(rawValue);
  if (typeof rawValue === 'string') return BigInt(rawValue);
  return null;
}, [rawValue]);
```

### Files Fixed
- `src/hooks/useQuizToEarn.ts` - All contract read results properly typed

### Prevention
- Always type-check `readContract()` results before use
- Never use `BigInt(value || 0)` directly - check type first
- Use `useMemo` for `useReadContract` results to avoid re-renders

---

## Template Files Compilation

### Problem
Template files contain placeholders like `{{CONTRACT_NAME}}` which are not valid TypeScript syntax. These files should not be compiled.

### Error Example
```
Type error: Identifier expected.
import { {{CONTRACT_NAME}}_ABI } from '@/lib/contracts/abis';
```

### Solution
Exclude `templates` directory from TypeScript compilation in `tsconfig.json`:
```json
{
  "exclude": [
    "node_modules",
    "scripts",
    "contracts",
    "test",
    "hardhat.config.js",
    "deployments",
    "templates"  // ✅ Added
  ]
}
```

### Files Fixed
- `tsconfig.json` - Added `templates` to exclude list

### Prevention
- Template files should always be excluded from TypeScript compilation
- Use `.template.ts` or `.template.tsx` extension if needed
- Document template file purpose clearly

---

## Category Type Errors

### Problem
Using invalid category values that don't match the `Category` type definition.

### Error Example
```
Type error: Type '"social"' is not assignable to type 'Category'.
```

### Valid Categories
```typescript
type Category =
  | 'all'
  | 'tracker'
  | 'general'
  | 'minting'
  | 'defi'
  | 'games'
  | 'promotion'
  | 'subscription'
  | 'dao'
  | 'tools'
  | 'collabs'
  | 'airdrops'
  | 'payment';
```

### Solution
Use only valid category values from the `Category` type:
```typescript
// ❌ Wrong
category: 'social',
category: 'education',

// ✅ Correct
category: 'games',  // For gamified dApps
category: 'general', // For general purpose dApps
category: 'tools',   // For utility tools
```

### Files Fixed
- `src/lib/dapps.ts` - Changed Quiz-to-Earn category from 'social' to 'games'

### Prevention
- Always check `src/lib/categories.ts` for valid categories
- Use TypeScript autocomplete to see available options
- Add new categories to the type definition if needed

---

## Contract Address Type Errors

### Problem
Missing contract addresses in type definitions for certain networks.

### Error Example
```
Type error: Property 'QuizToEarn' does not exist on type '{ ... }'.
```

### Solution
Ensure all contracts are defined in all network configurations:
```typescript
const DEFAULT_CONTRACT_ADDRESSES = {
  kasplexL2Testnet: {
    // ... all contracts
    QuizToEarn: "",
  },
  igraCaravelTestnet: {
    // ... all contracts
    QuizToEarn: "", // ✅ Must match other networks
  },
};
```

### Files Fixed
- `src/lib/contracts/addresses.ts` - Added missing `QuizToEarn` to `igraCaravelTestnet`

### Prevention
- When adding a new contract, add it to ALL network configurations
- Use empty string `""` if contract not deployed yet
- Keep network configurations synchronized

---

## React Hook Dependencies

### Problem
Missing dependencies in `useEffect` dependency arrays causing warnings.

### Error Example
```
Warning: React Hook useEffect has missing dependencies: 'chainId', 'refreshBalance', etc.
```

### Solution Options

#### Option 1: Add missing dependencies
```typescript
useEffect(() => {
  // use chainId here
}, [chainId]); // ✅ Add missing dependency
```

#### Option 2: Use useCallback for functions
```typescript
const refreshBalance = useCallback(() => {
  // ...
}, [/* dependencies */]);

useEffect(() => {
  refreshBalance();
}, [refreshBalance]); // ✅ Now safe to include
```

#### Option 3: Disable warning (if intentional)
```typescript
useEffect(() => {
  // Intentional: only run on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // Empty deps intentional
```

### Prevention
- Always include all dependencies used in the effect
- Use `useCallback` for functions passed to effects
- Document intentional empty dependency arrays

---

## Quick Reference: Common Patterns

### Pattern 1: Safe Contract Read
```typescript
const result = await publicClient.readContract({...});
if (!result || typeof result !== 'object') return null;
const typed = result as ExpectedType;
```

### Pattern 2: Safe Array Destructuring
```typescript
const result = await publicClient.readContract({...});
if (!Array.isArray(result) || result.length !== expectedLength) {
  throw new Error('Invalid result format');
}
const [a, b, c] = result as [TypeA, TypeB, TypeC];
```

### Pattern 3: Safe BigInt Conversion
```typescript
const value: bigint = typeof raw === 'bigint' 
  ? raw 
  : typeof raw === 'number' 
    ? BigInt(raw) 
    : typeof raw === 'string' 
      ? BigInt(raw) 
      : 0n;
```

### Pattern 4: Safe Object Property Access
```typescript
if (!obj || typeof obj !== 'object' || !('property' in obj)) {
  return null;
}
const value = obj.property;
```

---

## Testing Checklist

Before pushing, ensure:
- [ ] `npx tsc --noEmit` passes without errors
- [ ] `npm run build` completes successfully
- [ ] All contract reads are properly type-checked
- [ ] All template files are excluded from compilation
- [ ] All categories use valid Category types
- [ ] All contract addresses are defined for all networks

---

---

## "Cannot use 'in' operator" Error (Function-Type Errors)

### Problem
React Query tries to serialize errors using the `in` operator, which fails when wagmi returns function-type errors (contract function signatures).

### Error Example
```
TypeError: Cannot use 'in' operator to search for 'name' in function submitAnswer(uint256 _questionId, uint256 _selectedAnswerIndex) external
```

### Root Cause
According to [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/in_operator_no_object), the `in` operator can only be used on objects, not on primitive types like functions. When wagmi returns a function signature as an error, React Query's serialization fails.

### Solution Pattern

#### In Custom Hooks (useQuizToEarn, etc.):
```typescript
try {
  await writeContract({...});
} catch (err) {
  // CRITICAL: Convert function-type errors immediately
  let errorMessage: string;
  if (typeof err === 'function') {
    // Function-type error from wagmi - convert immediately
    errorMessage = getErrorMessage(err, 'Failed to submit answer');
    const safeError = new Error(errorMessage);
    setError(errorMessage);
    throw safeError; // Always throw Error object, never function
  } else {
    errorMessage = getErrorMessage(err, 'Failed to submit answer');
  }
  setError(errorMessage);
  throw new Error(errorMessage); // Always Error object
}
```

#### Global Solution (Already Implemented):
- `SafeMutationCache` in `src/components/Providers.tsx` intercepts errors at the React Query level
- Proxy on `mutation.state` intercepts `has()` trap (which handles `in` operator)
- `getErrorMessage()` utility safely converts all error types

### Files Fixed
- `src/components/Providers.tsx` - SafeMutationCache with Proxy interception
- `src/hooks/useQuizToEarn.ts` - submitAnswer error handling
- `src/lib/utils.ts` - getErrorMessage utility

### Prevention
- Always check `typeof err === 'function'` before using error
- Always throw `Error` objects, never raw errors or functions
- Use `getErrorMessage()` utility for safe conversion
- The global SafeMutationCache should catch most cases, but hooks should also handle defensively
- **CRITICAL: Validate contract addresses BEFORE calling writeContract/readContract**
  - Check if address is not empty: `if (!contractAddress || contractAddress === '')`
  - Check if address is valid Ethereum format: `contractAddress.startsWith('0x') && contractAddress.length === 42`
  - Empty/invalid addresses cause wagmi to return function-type errors

### Common Cause: Missing Contract Deployment
If the error occurs when calling a contract function, check:
1. Is the contract deployed on the current network?
2. Is the contract address valid (not empty string)?
3. Is the user on the correct network (check chainId)?

**Solution**: Add address validation before all contract calls:
```typescript
const contractAddress = getContractAddress(chainId, 'ContractName');
// Validate BEFORE using
if (!contractAddress || contractAddress === '' || !contractAddress.startsWith('0x') || contractAddress.length !== 42) {
  setError('Contract not deployed on this network');
  return;
}
```

### References
- [MDN: Cannot use 'in' operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/in_operator_no_object)
- [Ethers.js Issue #4182](https://github.com/ethers-io/ethers.js/issues/4182)
- [Ethereum StackExchange: Cannot call function](https://ethereum.stackexchange.com/questions/71056/cannot-call-function-even-though-it-is-present-in-the-jsoninteface)

---

## Last Updated
- Date: 2025-11-13
- Fixed Issues: Contract read types, template compilation, category types, contract addresses, 'in' operator errors

