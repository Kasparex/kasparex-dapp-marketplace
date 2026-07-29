/**
 * Shared guidance for Hub listing forms: when a premium module is toggled on,
 * its nested fields must be filled before pay/publish.
 *
 * Product-specific validators:
 * - vBlog: `validateVBlogModulesForPublish` (`src/lib/vblog/formValidation.ts`)
 * - CrowdKas: `validatePremiumSectionModules` in `src/lib/donations/formValidation.ts`
 * - Tokens: `validateTokenModulesForPublish` (`src/lib/tokens/formValidation.ts`)
 * - Store: buyer_support URL check in `StoreProductForm`
 *
 * Magazines / Chronicles / Games / dApps mostly use fee-only toggles today
 * (no nested content). Add a required-when-enabled check there when nested
 * config fields are introduced.
 */
export const HUB_ENABLED_MODULE_VALIDATION_NOTE =
  'Enabled premium modules require their content and pricing fields before publish.';
