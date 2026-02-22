/**
 * Default featured image for donation campaign cards when no image is set.
 * Use as background or img src fallback.
 */
export const DEFAULT_DONATION_IMAGE =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225" viewBox="0 0 400 225"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%2310b981"/><stop offset="100%" style="stop-color:%23059669"/></linearGradient></defs><rect width="400" height="225" fill="url(%23g)"/><path fill="rgba(255,255,255,0.3)" d="M200 90c-24.3 0-44 19.7-44 44s19.7 44 44 44 44-19.7 44-44-19.7-44-44-44zm0 72c-15.5 0-28-12.5-28-28s12.5-28 28-28 28 12.5 28 28-12.5 28-28 28z"/><path fill="rgba(255,255,255,0.4)" d="M200 105v-10l-20 12 20 12v-8c11 0 20 9 20 20h10c0-16.6-13.4-30-30-30z"/></svg>'
  );
