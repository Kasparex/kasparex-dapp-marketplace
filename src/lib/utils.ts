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
  if (typeof error === 'function') {
    // Try to get function name for better error message
    try {
      const funcName = (error as any).name || String(error).match(/function\s+(\w+)/)?.[1] || 'function';
      return `${fallback} (${funcName})`;
    } catch {
      return fallback;
    }
  }
  
  // If it's an Error object, return its message FIRST (before checking for functions)
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
    
    // NEVER use 'in' operator - it fails on functions
    // Instead, try direct property access with try-catch
    try {
      // Try shortMessage first (wagmi's user-friendly error message)
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

    // Now check if it's a function-like object (AFTER trying to extract messages)
    try {
      // Check if it has a call property (function-like)
      const callProp = (error as any).call;
      if (typeof callProp === 'function') {
        // It's function-like, but we already tried to extract messages above
        // Return a more helpful message
        return `${fallback} (function-type error)`;
      }
      
      // Check if toString returns function signature (wagmi ABI function)
      const toStringResult = String(error);
      if (toStringResult.includes('function') && toStringResult.includes('external')) {
        // This is likely an ABI function that was returned as an error
        // But we should have extracted the real error message above
        // If we get here, the error object itself is the function
        return `${fallback} (contract function error)`;
      }
    } catch {
      // If accessing properties fails, it's likely a function or problematic object
      // But we already tried to extract messages, so return fallback
    }

    // Try to stringify if it's a plain object
    try {
      if (error.constructor === Object) {
        const stringified = JSON.stringify(error);
        if (stringified !== '{}') {
          return stringified;
        }
      }
    } catch {
      // Ignore JSON stringify errors
    }
  }

  // Last resort: try toString() but check if it's a function signature
  try {
    const stringified = String(error);
    // If it looks like a function signature, don't return it as-is
    if (stringified.includes('function') && stringified.includes('external')) {
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

