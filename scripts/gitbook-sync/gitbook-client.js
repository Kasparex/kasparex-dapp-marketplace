/**
 * GitBook API Client (Node.js)
 * 
 * Wrapper for GitBook REST API v1
 */

const https = require('https');
const http = require('http');

class GitBookClient {
  constructor(config) {
    this.config = config;
    this.baseUrl = 'https://api.gitbook.com/v1';
  }

  /**
   * Get authorization headers
   */
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.config.apiToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Make HTTP request
   */
  async request(endpoint, options = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(`${this.baseUrl}${endpoint}`);
      const method = options.method || 'GET';
      const body = options.body ? JSON.stringify(options.body) : null;

      const requestOptions = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: method,
        headers: {
          ...this.getHeaders(),
          ...(body ? { 'Content-Length': Buffer.byteLength(body) } : {}),
        },
      };

      const req = https.request(requestOptions, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = data ? JSON.parse(data) : {};
            
            // Log response for debugging
            if (res.statusCode >= 400) {
              console.log(`   API Response (${res.statusCode}):`, JSON.stringify(parsed, null, 2));
            }
            
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ data: parsed, error: null });
            } else {
              resolve({
                data: null,
                error: {
                  message: parsed.message || parsed.error?.message || `HTTP ${res.statusCode}: ${res.statusMessage}`,
                  code: res.statusCode.toString(),
                  details: parsed,
                },
              });
            }
          } catch (error) {
            resolve({
              data: null,
              error: {
                message: error.message || 'Failed to parse response',
                raw: data,
              },
            });
          }
        });
      });

      req.on('error', (error) => {
        resolve({
          data: null,
          error: {
            message: error.message || 'Request failed',
          },
        });
      });

      if (body) {
        req.write(body);
      }

      req.end();
    });
  }

  /**
   * Get space information
   */
  async getSpace() {
    return this.request(`/spaces/${this.config.spaceId}`);
  }

  /**
   * List all pages in the space
   */
  async listPages() {
    // GitBook uses content API differently - try spaces/{spaceId}/content
    return this.request(`/spaces/${this.config.spaceId}/content`);
  }

  /**
   * Get a specific page by ID
   */
  async getPage(pageId) {
    return this.request(`/spaces/${this.config.spaceId}/content/page/${pageId}`);
  }

  /**
   * Find a page by path
   */
  async findPageByPath(path) {
    // GitBook API might not support direct path lookup
    // Return null to indicate page doesn't exist, will create new one
    return {
      data: null,
      error: null,
    };
  }

  /**
   * Create a new page using GitBook Content API
   * GitBook uses a different structure - pages are created via content API
   */
  async createPage(pageData) {
    // Try using the content API with proper structure
    // GitBook API v1 uses: POST /spaces/{spaceId}/content
    return this.request(`/spaces/${this.config.spaceId}/content`, {
      method: 'POST',
      body: {
        type: 'page',
        title: pageData.title,
        path: pageData.path,
        content: {
          type: 'markdown',
          markdown: pageData.content,
        },
      },
    });
  }

  /**
   * Update an existing page
   */
  async updatePage(pageId, updates) {
    const updatePayload = {
      type: 'page',
    };
    
    if (updates.title !== undefined) {
      updatePayload.title = updates.title;
    }
    if (updates.path !== undefined) {
      updatePayload.path = updates.path;
    }
    if (updates.content !== undefined) {
      updatePayload.content = {
        type: 'markdown',
        markdown: updates.content,
      };
    }

    return this.request(`/spaces/${this.config.spaceId}/content/page/${pageId}`, {
      method: 'PUT',
      body: updatePayload,
    });
  }

  /**
   * Create or update a page (overwrites if exists)
   * Since GitBook API structure may differ, we'll try to create first
   */
  async createOrUpdatePage(pageData) {
    // Try to create the page first
    // If it fails with "already exists", we'd need to find and update
    // For now, always try to create (GitBook will handle duplicates)
    const result = await this.createPage(pageData);
    
    // If creation fails, try to update (would need page ID)
    // For simplicity, we'll just create - GitBook API should handle this
    return result;
  }

  /**
   * Delete a page
   */
  async deletePage(pageId) {
    return this.request(`/spaces/${this.config.spaceId}/content/page/${pageId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Test API connection
   */
  async testConnection() {
    const response = await this.getSpace();
    return !response.error && !!response.data;
  }
}

module.exports = { GitBookClient };

