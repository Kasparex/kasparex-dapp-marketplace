/**
 * IndexedDB polyfill for SSR
 * Returns a mock object during server-side rendering
 */
if (typeof window !== 'undefined' && window.indexedDB) {
  module.exports = window.indexedDB;
} else {
  // Return a mock object that won't cause errors
  module.exports = {
    open: () => ({ onsuccess: null, onerror: null }),
    deleteDatabase: () => ({ onsuccess: null, onerror: null }),
    databases: () => Promise.resolve([]),
  };
}

