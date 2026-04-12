# ABI Format Guide

## Critical: Always Use JSON Objects, Never String Signatures

When defining ABIs for use with viem/wagmi, **ALWAYS use JSON objects**, never string function signatures.

## Why This Matters

viem/wagmi internally checks `'name' in abiItem` to determine if an ABI item is a function or event. If you use string signatures, this check fails with:

```
TypeError: Cannot use 'in' operator to search for 'name' in function submitAnswer(...)
```

## ❌ WRONG Format (Causes Errors)

```typescript
export const MY_CONTRACT_ABI = [
  "function submitAnswer(uint256 _questionId, uint256 _selectedAnswerIndex) external",
  "function getQuestion(uint256 _questionId) external view returns (uint256, string)",
  "event AnswerSubmitted(address indexed user, uint256 indexed questionId)",
] as const;
```

## ✅ CORRECT Format (Fixed)

```typescript
export const MY_CONTRACT_ABI = [
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
  {
    type: "function",
    name: "getQuestion",
    stateMutability: "view",
    inputs: [
      { internalType: "uint256", name: "_questionId", type: "uint256" }
    ],
    outputs: [
      { internalType: "uint256", name: "id", type: "uint256" },
      { internalType: "string", name: "questionText", type: "string" }
    ]
  },
  {
    type: "event",
    name: "AnswerSubmitted",
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "uint256", name: "questionId", type: "uint256" }
    ],
    anonymous: false
  }
] as const;
```

## Function Format Requirements

### Required Fields:
- `type`: `"function"` or `"event"`
- `name`: Function/event name (string)
- `stateMutability`: `"nonpayable"`, `"view"`, `"payable"`, or `"pure"` (for functions)
- `inputs`: Array of input parameters
- `outputs`: Array of output parameters (for functions, empty array `[]` if no return value)

### Input/Output Parameter Format:
```typescript
{
  internalType: "uint256",  // Full type name
  name: "_questionId",      // Parameter name
  type: "uint256"           // Type (same as internalType for simple types)
}
```

### For Structs/Tuples:
```typescript
{
  components: [
    { internalType: "uint256", name: "id", type: "uint256" },
    { internalType: "string", name: "text", type: "string" }
  ],
  internalType: "struct MyContract.Question",
  name: "",
  type: "tuple"
}
```

### Event Format:
```typescript
{
  type: "event",
  name: "AnswerSubmitted",
  inputs: [
    { indexed: true, internalType: "address", name: "user", type: "address" },
    { indexed: false, internalType: "uint256", name: "amount", type: "uint256" }
  ],
  anonymous: false
}
```

## How to Get Proper ABI Format

### Option 1: Use Hardhat Compilation Artifacts
```typescript
import QuizToEarnArtifact from '../artifacts/contracts/QuizToEarn.sol/QuizToEarn.json';
export const QUIZ_TO_EARN_ABI = QuizToEarnArtifact.abi;
```

### Option 2: Use TypeChain Generated Types
```typescript
import { QuizToEarn } from '../typechain-types';
export const QUIZ_TO_EARN_ABI = QuizToEarn.abi;
```

### Option 3: Convert from String Signatures Manually
1. Identify function signature: `"function submitAnswer(uint256 _questionId, uint256 _selectedAnswerIndex) external"`
2. Extract:
   - Name: `submitAnswer`
   - State mutability: `external` → `nonpayable`
   - Inputs: `uint256 _questionId`, `uint256 _selectedAnswerIndex`
3. Convert to JSON:
   ```typescript
   {
     type: "function",
     name: "submitAnswer",
     stateMutability: "nonpayable",
     inputs: [
       { internalType: "uint256", name: "_questionId", type: "uint256" },
       { internalType: "uint256", name: "_selectedAnswerIndex", type: "uint256" }
     ],
     outputs: []
   }
   ```

## Validation Checklist

Before committing an ABI:
- [ ] All entries are objects, not strings
- [ ] Each function has `type`, `name`, `stateMutability`, `inputs`, `outputs`
- [ ] Each event has `type`, `name`, `inputs`, `anonymous`
- [ ] All input/output parameters have `internalType`, `name`, `type`
- [ ] Structs/tuples have `components` array
- [ ] Events have `indexed` flags on inputs

## Quick Validation Function

```typescript
function validateABI(abi: any[]): boolean {
  return abi.every(item => 
    item && 
    typeof item === 'object' && 
    'type' in item && 
    'name' in item
  );
}

// Usage
if (!validateABI(QUIZ_TO_EARN_ABI)) {
  throw new Error('ABI contains invalid entries (strings instead of objects)');
}
```

## Related Files

- `src/lib/contracts/abis.ts` - All contract ABIs (use as reference)
- `docs/archive/docs-moved/TYPESCRIPT_ERROR_LOG.md` - Historical error notes (archived)
- `contracts/*.sol` - Source contracts (for reference)

## Status

✅ **RESOLVED** - QUIZ_TO_EARN_ABI converted to proper JSON format
- Date: 2025-01-XX
- Commit: `ed35cb7`

