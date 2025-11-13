/**
 * GitBook Utility Functions
 */

/**
 * Sanitize path for GitBook (remove special characters, ensure proper format)
 */
export function sanitizePath(path: string): string {
  return path
    .toLowerCase()
    .replace(/[^a-z0-9/-]/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/\/+/g, '/');
}

/**
 * Generate a slug from a dApp name
 */
export function generateSlug(name: string): string {
  return sanitizePath(name);
}

/**
 * Format markdown content for GitBook
 */
export function formatMarkdown(content: string): string {
  // Ensure proper markdown formatting
  return content.trim();
}

/**
 * Get parent path for organizing pages
 */
export function getParentPath(basePath: string, category: string): string {
  return `${basePath}/${category}`;
}

/**
 * Generate page path for a dApp
 */
export function generateDAppPagePath(dappName: string, basePath: string = 'dapps'): string {
  const slug = generateSlug(dappName);
  return `${basePath}/${slug}`;
}

/**
 * Generate contract reference page path
 */
export function generateContractPagePath(contractName: string, basePath: string = 'contracts'): string {
  const slug = generateSlug(contractName);
  return `${basePath}/${slug}`;
}

/**
 * Generate integration guide page path
 */
export function generateIntegrationPagePath(dappName: string, basePath: string = 'integration'): string {
  const slug = generateSlug(dappName);
  return `${basePath}/${slug}`;
}

