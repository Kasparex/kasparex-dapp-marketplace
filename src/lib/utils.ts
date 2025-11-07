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
 */
export function getErrorMessage(error: unknown, fallback: string = 'An error occurred'): string {
  if (!error) {
    return fallback;
  }

  // If it's already a string, return it
  if (typeof error === 'string') {
    return error;
  }

  // If it's a function, we can't use 'in' operator - return fallback or string representation
  if (typeof error === 'function') {
    try {
      const stringified = error.toString();
      // If it's a meaningful function string (not just [object Function]), use it
      if (stringified && !stringified.startsWith('function') && stringified !== '[object Function]') {
        return stringified;
      }
    } catch {
      // Ignore errors
    }
    return fallback;
  }

  // If it's an Error object, return its message
  if (error instanceof Error) {
    return error.message || fallback;
  }

  // If it's an object (but not a function), try to extract message
  if (typeof error === 'object' && error !== null) {
    // Safely check for message property using hasOwnProperty or direct access
    const errorObj = error as Record<string, unknown>;
    
    // Use hasOwnProperty to safely check without 'in' operator issues
    if (Object.prototype.hasOwnProperty.call(errorObj, 'message') && typeof errorObj.message === 'string') {
      return errorObj.message;
    }

    // Try to stringify if it's a plain object
    if (error.constructor === Object) {
      try {
        const stringified = JSON.stringify(error);
        if (stringified !== '{}') {
          return stringified;
        }
      } catch {
        // Ignore JSON stringify errors
      }
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

