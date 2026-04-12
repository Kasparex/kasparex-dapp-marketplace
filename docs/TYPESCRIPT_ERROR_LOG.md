# TypeScript Error Log & Solutions

This document tracks common TypeScript errors encountered in the codebase and their solutions. Use this as a reference to quickly fix recurring issues.

## Table of Contents
1. [Contract Read Results (unknown type)](#contract-read-results)
2. [Template Files Compilation](#template-files-compilation)
3. [Category Type Errors](#category-type-errors)
4. [Contract Address Type Errors](#contract-address-type-errors)
5. [React Hook Dependencies](#react-hook-dependencies)
6. ["Cannot use 'in' operator" Error (ABI Format Issue)](#cannot-use-in-operator-error-abi-format-issue-resolved)

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
  igraGalleonTestnet: {
    // ... all contracts
    QuizToEarn: "", // ✅ Must match other networks
  },
};
```

### Files Fixed
- `src/lib/contracts/addresses.ts` - Added missing `QuizToEarn` to `igraGalleonTestnet`

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

## "Cannot use 'in' operator" Error (ABI Format Issue) ✅ RESOLVED

### Problem
Error occurs when viem/wagmi tries to inspect ABI items using the `in` operator. The error message shows:
```
TypeError: Cannot use 'in' operator to search for 'name' in function submitAnswer(uint256 _questionId, uint256 _selectedAnswerIndex) external
```

### Root Cause (FINAL SOLUTION)
**The error comes from viem/wagmi internally, NOT from React Query serialization.**

When viem/wagmi processes an ABI array, it checks `'name' in abiItem` to determine if an item is a function/event. If the ABI contains **string function signatures** instead of **JSON objects**, this check fails because:
- Strings don't support the `in` operator
- viem expects JSON objects with `{ type, name, inputs, outputs }` structure

**Example of WRONG format (causes error):**
```typescript
export const QUIZ_TO_EARN_ABI = [
  "function submitAnswer(uint256 _questionId, uint256 _selectedAnswerIndex) external", // ❌ String signature
  "function getQuestion(uint256 _questionId) external view returns (...)", // ❌ String signature
] as const;
```

**Example of CORRECT format (fixed):**
```typescript
export const QUIZ_TO_EARN_ABI = [
  {
    type: "function",
    name: "submitAnswer",
    stateMutability: "nonpayable",
    inputs: [
      { internalType: "uint256", name: "_questionId", type: "uint256" },
      { internalType: "uint256", name: "_selectedAnswerIndex", type: "uint256" }
    ],
    outputs: []
  },
  // ... other functions as JSON objects
] as const;
```

### Solution (IMPLEMENTED)
Convert all ABI entries from string signatures to proper JSON objects:

1. **For functions:**
   - `type`: "function"
   - `name`: function name (string)
   - `stateMutability`: "nonpayable", "view", "payable", etc.
   - `inputs`: array of `{ internalType, name, type }`
   - `outputs`: array of `{ internalType, name, type }` (empty array for non-view functions)

2. **For events:**
   - `type`: "event"
   - `name`: event name (string)
   - `inputs`: array with `indexed` boolean flag
   - `anonymous`: boolean

### Files Fixed
- ✅ `src/lib/contracts/abis.ts` - Converted `QUIZ_TO_EARN_ABI` from string signatures to JSON objects
- ✅ `src/components/Providers.tsx` - Added `SafeQueryCache` and `SafeMutationCache` for defensive error handling
- ✅ `src/hooks/useQuizToEarn.ts` - Added comprehensive error handling
- ✅ `src/lib/utils.ts` - Enhanced `getErrorMessage` utility

### Prevention Checklist
- ✅ **ALWAYS use JSON objects in ABI arrays**, never string signatures
- ✅ When adding new ABIs, ensure each entry has `type`, `name`, `inputs`, `outputs`
- ✅ Use contract compilation artifacts or typechain-generated ABIs when possible
- ✅ Validate ABI format before committing: all entries must be objects, not strings

### Related Error Handling (Defensive Measures)
While the root cause was ABI format, we also implemented defensive error handling:

#### Global Error Interception:
- `SafeMutationCache` in `src/components/Providers.tsx` - Intercepts mutation errors
- `SafeQueryCache` in `src/components/Providers.tsx` - Intercepts query errors
- Proxy wrappers on `query.state` and `query.error` to catch serialization issues
- `getErrorMessage()` utility safely converts all error types

#### In Custom Hooks:
```typescript
try {
  await writeContract({...});
} catch (err) {
  // CRITICAL: Convert function-type errors immediately
  if (typeof err === 'function') {
    const errorMessage = getErrorMessage(err, 'Failed to submit answer');
    setError(errorMessage);
    throw new Error(errorMessage);
  }
  // ... handle other error types
}
```

### Status: ✅ RESOLVED
- **Date Fixed**: 2025-01-XX
- **Root Cause**: ABI format (string signatures instead of JSON objects)
- **Solution**: Converted `QUIZ_TO_EARN_ABI` from string signatures to proper JSON objects
- **Verification**: Error no longer occurs in Quiz-to-Earn dApp
- **Commit**: `ed35cb7` - CRITICAL FIX: Convert QUIZ_TO_EARN_ABI from string signatures to JSON objects

### Additional Prevention Measures
- ✅ **CRITICAL: Validate contract addresses BEFORE calling writeContract/readContract**
  - Check if address is not empty: `if (!contractAddress || contractAddress === '')`
  - Check if address is valid Ethereum format: `contractAddress.startsWith('0x') && contractAddress.length === 42`
  - Empty/invalid addresses can cause wagmi to return unexpected errors
- ✅ Use `getErrorMessage()` utility for safe error conversion
- ✅ The global `SafeMutationCache` and `SafeQueryCache` provide defensive error handling

### Common Causes & Solutions

#### Missing Contract Deployment
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

#### Mixed ABI Format
If an ABI array contains both strings and objects, convert ALL entries to objects:
```typescript
// ❌ WRONG - Mixed format
export const MY_ABI = [
  { type: "function", name: "func1", ... }, // Object
  "function func2(...) external", // String - will cause error
] as const;

// ✅ CORRECT - All objects
export const MY_ABI = [
  { type: "function", name: "func1", ... },
  { type: "function", name: "func2", ... },
] as const;
```

### References
- [MDN: Cannot use 'in' operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/in_operator_no_object)
- [Ethers.js Issue #4182](https://github.com/ethers-io/ethers.js/issues/4182)
- [Ethereum StackExchange: Cannot call function](https://ethereum.stackexchange.com/questions/71056/cannot-call-function-even-though-it-is-present-in-the-jsoninteface)

---

## Last Updated
- Date: 2025-01-XX
- Fixed Issues: Contract read types, template compilation, category types, contract addresses, 'in' operator errors (ABI format)
- Latest Fix: Converted QUIZ_TO_EARN_ABI from string signatures to JSON objects (RESOLVED ✅)

