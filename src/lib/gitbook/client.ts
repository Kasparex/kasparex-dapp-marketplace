/**
 * GitBook API Client
 * 
 * Wrapper for GitBook REST API v1
 * Documentation: https://developer.gitbook.com/
 */

import type { GitBookConfig, GitBookPage, GitBookPageCreate, GitBookPageUpdate, GitBookSpace, GitBookAPIResponse } from './types';

const GITBOOK_API_BASE = 'https://api.gitbook.com/v1';

export class GitBookClient {
  private config: GitBookConfig;
  private baseUrl: string;

  constructor(config: GitBookConfig) {
    this.config = config;
    this.baseUrl = GITBOOK_API_BASE;
  }

  /**
   * Get authorization headers
   */
  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.config.apiToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Make API request with error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<GitBookAPIResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        return {
          error: {
            message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
            code: response.status.toString(),
          },
        };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      };
    }
  }

  /**
   * Get space information
   */
  async getSpace(): Promise<GitBookAPIResponse<GitBookSpace>> {
    return this.request<GitBookSpace>(`/spaces/${this.config.spaceId}`);
  }

  /**
   * List all pages in the space
   */
  async listPages(): Promise<GitBookAPIResponse<GitBookPage[]>> {
    return this.request<GitBookPage[]>(`/spaces/${this.config.spaceId}/content`);
  }

  /**
   * Get a specific page by ID
   */
  async getPage(pageId: string): Promise<GitBookAPIResponse<GitBookPage>> {
    return this.request<GitBookPage>(`/spaces/${this.config.spaceId}/content/page/${pageId}`);
  }

  /**
   * Find a page by path
   */
  async findPageByPath(path: string): Promise<GitBookAPIResponse<GitBookPage | null>> {
    const pagesResponse = await this.listPages();
    if (pagesResponse.error || !pagesResponse.data) {
      return pagesResponse as GitBookAPIResponse<GitBookPage | null>;
    }

    const page = pagesResponse.data.find((p) => p.path === path);
    return { data: page || null };
  }

  /**
   * Create a new page
   */
  async createPage(pageData: GitBookPageCreate): Promise<GitBookAPIResponse<GitBookPage>> {
    return this.request<GitBookPage>(
      `/spaces/${this.config.spaceId}/content`,
      {
        method: 'POST',
        body: JSON.stringify({
          title: pageData.title,
          path: pageData.path,
          content: {
            type: 'markdown',
            markdown: pageData.content,
          },
          parentId: pageData.parentId,
        }),
      }
    );
  }

  /**
   * Update an existing page (overwrites content)
   */
  async updatePage(
    pageId: string,
    updates: GitBookPageUpdate
  ): Promise<GitBookAPIResponse<GitBookPage>> {
    const updatePayload: any = {};
    
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

    return this.request<GitBookPage>(
      `/spaces/${this.config.spaceId}/content/page/${pageId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updatePayload),
      }
    );
  }

  /**
   * Create or update a page (overwrites if exists)
   */
  async createOrUpdatePage(pageData: GitBookPageCreate): Promise<GitBookAPIResponse<GitBookPage>> {
    // Try to find existing page
    const existingPage = await this.findPageByPath(pageData.path);
    
    if (existingPage.error) {
      return existingPage as GitBookAPIResponse<GitBookPage>;
    }

    if (existingPage.data) {
      // Page exists, update it
      return this.updatePage(existingPage.data.id, {
        title: pageData.title,
        content: pageData.content,
      });
    } else {
      // Page doesn't exist, create it
      return this.createPage(pageData);
    }
  }

  /**
   * Delete a page
   */
  async deletePage(pageId: string): Promise<GitBookAPIResponse<void>> {
    return this.request<void>(
      `/spaces/${this.config.spaceId}/content/page/${pageId}`,
      {
        method: 'DELETE',
      }
    );
  }

  /**
   * Test API connection
   */
  async testConnection(): Promise<boolean> {
    const response = await this.getSpace();
    return !response.error && !!response.data;
  }
}

