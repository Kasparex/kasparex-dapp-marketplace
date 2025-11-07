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
  // Check typeof first, then check for call property WITHOUT using 'in' operator
  if (typeof error === 'function') {
    return fallback;
  }
  
  // Additional check: try to detect function-like objects WITHOUT using 'in' operator
  try {
    if (typeof error === 'object' && error !== null) {
      // Try direct property access - if it throws, it's likely a function
      const callProp = (error as any).call;
      if (typeof callProp === 'function') {
        return fallback;
      }
    }
  } catch {
    // If accessing properties fails, it's likely a function
    return fallback;
  }

  // If it's an Error object, return its message
  if (error instanceof Error) {
    return error.message || fallback;
  }

  // If it's an object (and we've confirmed it's not a function), try to extract message
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;
    
    // NEVER use 'in' operator - it fails on functions
    // Instead, try direct property access with try-catch
    try {
      const message = errorObj.message;
      if (typeof message === 'string' && message) {
        return message;
      }
    } catch {
      // Property access failed, continue to next attempt
    }

    // Try accessing other common error properties
    try {
      const shortMessage = errorObj.shortMessage;
      if (typeof shortMessage === 'string' && shortMessage) {
        return shortMessage;
      }
    } catch {
      // Ignore
    }

    try {
      const details = errorObj.details;
      if (typeof details === 'string' && details) {
        return details;
      }
    } catch {
      // Ignore
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

  // Last resort: try toString()
  try {
    const stringified = String(error);
    if (stringified !== '[object Object]' && stringified !== 'null' && stringified !== 'undefined') {
      return stringified;
    }
  } catch {
    // Ignore toString errors
  }

  return fallback;
}

