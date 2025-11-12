import { DApp } from './dapps';

/**
 * Converts a string to a URL-friendly slug
 * Example: "Subscription Checker" → "subscription-checker"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generates a slug from a dApp name
 */
export function generateDAppSlug(dappName: string): string {
  return slugify(dappName);
}

/**
 * Finds a dApp by its slug
 */
export function getDAppBySlug(
  dapps: DApp[],
  slug: string
): DApp | undefined {
  return dapps.find((dapp) => {
    const dappSlug = dapp.slug || generateDAppSlug(dapp.name);
    return dappSlug === slug;
  });
}

/**
 * Check if the current page is embedded in an iframe
 */
export function isEmbedded(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.parent !== window;
}

/**
 * Safely extract error message from various error types
 * Handles Error objects, strings, wagmi errors, functions, and other types
 * CRITICAL: This function MUST never use the 'in' operator on functions
 * 
 * The error message "Cannot use 'in' operator to search for 'name' in function..."
 * occurs when React tries to serialize an error that is actually a function.
 * This function prevents that by converting functions to fallback messages immediately.
 */
/**
 * CRITICAL: This function MUST be called BEFORE React/React Query tries to serialize errors
 * React Query tries to serialize errors for DevTools and internal state BEFORE onError callbacks run
 * This function converts function-type errors to strings immediately to prevent serialization errors
 */
export function getErrorMessage(error: unknown, fallback: string = 'An error occurred'): string {
  // Handle null/undefined
  if (!error) {
    return fallback;
  }

  // If it's already a string, return it immediately
  if (typeof error === 'string') {
    return error;
  }

  // CRITICAL: Check for functions FIRST - functions are objects in JS but can't use 'in' operator
  // This is the root cause of "Cannot use 'in' operator to search for 'name' in function..."
  // React's error serialization tries to check properties using 'in', which fails on functions
  // React Query's DevTools and internal state also try to serialize errors, causing this error
  // Check both typeof === 'function' AND if it has call/apply properties (function-like objects)
  if (typeof error === 'function') {
    // IMMEDIATELY return a safe string - never try to access properties on functions
    // This prevents React from trying to serialize the function
    try {
      // Check if it's a contract function signature by checking toString
      // We use String() instead of .toString() to avoid potential issues
      const str = String(error);
      if (str.includes('function') && (str.includes('external') || str.includes('public') || str.includes('payable'))) {
        // Extract function name from signature if possible
        // Match patterns like "function tip(address _recipient, address _referral) external payable"
        const match = str.match(/function\s+(\w+)\s*\(/);
        if (match && match[1]) {
          return `${fallback} (${match[1]})`;
        }
        return `${fallback} (contract function)`;
      }
      // Regular function - try to get name safely without using 'in' operator
      // Use try-catch and direct property access instead of 'in'
      try {
        const funcName = (error as any).name;
        if (typeof funcName === 'string' && funcName) {
          return `${fallback} (${funcName})`;
        }
      } catch {
        // Ignore - name property access failed
      }
      return `${fallback} (function-type error)`;
    } catch {
      // If even String() fails, return fallback immediately
      return fallback;
    }
  }

  // Check if it's a function-like object BEFORE treating it as a regular object
  // This prevents 'in' operator errors when React tries to serialize
  // NEVER use 'in' operator - use try-catch with direct property access instead
  if (typeof error === 'object' && error !== null) {
    // Check if it's function-like by safely accessing call/apply properties
    try {
      const errorAny = error as any;
      // Try to access call and apply properties directly (without 'in' operator)
      // If accessing these properties throws or they're functions, it might be function-like
      const callProp = errorAny.call;
      const applyProp = errorAny.apply;
      
      // If both call and apply exist and call is a function, it's likely function-like
      if (callProp !== undefined && applyProp !== undefined && typeof callProp === 'function') {
        // It's function-like - check if toString reveals a function signature
        const str = String(error);
        if (str.includes('function') && (str.includes('external') || str.includes('public'))) {
          const match = str.match(/function\s+(\w+)\s*\(/);
          if (match && match[1]) {
            return `${fallback} (${match[1]})`;
          }
          return `${fallback} (contract function)`;
        }
        return `${fallback} (function-like object)`;
      }
    } catch {
      // If checking properties fails, it might be a function - return fallback immediately
      return fallback;
    }
  }
  
  // If it's an Error object, return its message
  if (error instanceof Error) {
    // Try to get the actual error message from wagmi errors
    const wagmiError = error as any;
    try {
      // Wagmi errors often have shortMessage which is more user-friendly
      if (wagmiError.shortMessage && typeof wagmiError.shortMessage === 'string') {
        return wagmiError.shortMessage;
      }
      // Try details property
      if (wagmiError.details && typeof wagmiError.details === 'string') {
        return wagmiError.details;
      }
      // Try cause (nested error)
      if (wagmiError.cause) {
        const causeMsg = getErrorMessage(wagmiError.cause, '');
        if (causeMsg && causeMsg !== 'An error occurred') {
          return causeMsg;
        }
      }
    } catch {
      // If accessing properties fails, fall through to error.message
    }
    return error.message || fallback;
  }

  // If it's an object (and we've confirmed it's not a function), try to extract message
  // IMPORTANT: Extract error messages BEFORE checking for function signatures
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;
    
    // NEVER use 'in' operator directly - use try-catch with property access
    // Try shortMessage first (wagmi's user-friendly error message)
    try {
      const shortMessage = errorObj.shortMessage;
      if (typeof shortMessage === 'string' && shortMessage) {
        return shortMessage;
      }
    } catch {
      // Property access failed, continue to next attempt
    }

    try {
      // Try standard message property
      const message = errorObj.message;
      if (typeof message === 'string' && message) {
        return message;
      }
    } catch {
      // Property access failed, continue to next attempt
    }

    try {
      // Try details property
      const details = errorObj.details;
      if (typeof details === 'string' && details) {
        return details;
      }
    } catch {
      // Ignore
    }

    try {
      // Try cause (nested error) - recursively extract
      const cause = errorObj.cause;
      if (cause) {
        const causeMsg = getErrorMessage(cause, '');
        if (causeMsg && causeMsg !== 'An error occurred') {
          return causeMsg;
        }
      }
    } catch {
      // Ignore
    }

    // Check if toString returns function signature (wagmi ABI function)
    // This catches cases where the error object itself represents a function
    try {
      const toStringResult = String(error);
      if (toStringResult.includes('function') && (toStringResult.includes('external') || toStringResult.includes('public'))) {
        // Extract function name if possible
        const match = toStringResult.match(/function\s+(\w+)\s*\(/);
        if (match && match[1]) {
          return `${fallback} (${match[1]})`;
        }
        return `${fallback} (contract function error)`;
      }
    } catch {
      // If toString fails, it might be a problematic object
    }

    // Try to stringify if it's a plain object
    // CRITICAL: Check for function BEFORE trying JSON.stringify
    // JSON.stringify will fail on functions and cause issues
    try {
      // Double-check it's not a function before stringifying
      if (typeof error === 'object' && error !== null && typeof error !== 'function') {
        // Check if it's a plain object (not an Error instance, Array, etc.)
        if (error.constructor === Object) {
          const stringified = JSON.stringify(error);
          if (stringified !== '{}') {
            return stringified;
          }
        }
      }
    } catch {
      // Ignore JSON stringify errors - might be circular reference or function
    }
  }

  // Last resort: try toString() but check if it's a function signature
  try {
    const stringified = String(error);
    // If it looks like a function signature, don't return it as-is
    if (stringified.includes('function') && (stringified.includes('external') || stringified.includes('public'))) {
      const match = stringified.match(/function\s+(\w+)\s*\(/);
      if (match && match[1]) {
        return `${fallback} (${match[1]})`;
      }
      return `${fallback} (contract function)`;
    }
    if (stringified !== '[object Object]' && stringified !== 'null' && stringified !== 'undefined') {
      return stringified;
    }
  } catch {
    // Ignore toString errors
  }

  return fallback;
}

