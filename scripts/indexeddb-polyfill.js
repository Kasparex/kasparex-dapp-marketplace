/**
 * IndexedDB polyfill for SSR
 * Provides a mock indexedDB object during server-side rendering
 */

// Create a mock indexedDB object
const mockIndexedDB = {
  open: function(dbName, version) {
    const request = {
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
      result: null,
      error: null,
      transaction: null,
      readyState: 'done',
      source: null,
      abort: function() {},
      continue: function() {},
      continuePrimaryKey: function() {},
      delete: function() {},
    };
    
    // Simulate immediate success
    setTimeout(() => {
      if (request.onsuccess) {
        request.onsuccess({ target: request });
      }
    }, 0);
    
    return request;
  },
  
  deleteDatabase: function(dbName) {
    const request = {
      onsuccess: null,
      onerror: null,
      readyState: 'done',
    };
    
    setTimeout(() => {
      if (request.onsuccess) {
        request.onsuccess({ target: request });
      }
    }, 0);
    
    return request;
  },
  
  databases: function() {
    return Promise.resolve([]);
  },
  
  cmp: function(a, b) {
    return 0;
  },
};

// Export for module replacement
if (typeof module !== 'undefined' && module.exports) {
  module.exports = mockIndexedDB;
}

// Set globally for direct indexedDB access
if (typeof globalThis !== 'undefined') {
  globalThis.indexedDB = mockIndexedDB;
}
if (typeof global !== 'undefined') {
  global.indexedDB = mockIndexedDB;
}
if (typeof window !== 'undefined') {
  // Only set if not already defined (browser has real indexedDB)
  if (!window.indexedDB) {
    window.indexedDB = mockIndexedDB;
  }
}
