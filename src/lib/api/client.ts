/**
 * Cloudflare Workers API Client
 * 
 * Centralized client for making requests to Cloudflare Workers API
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_KASPAREX_API_URL || 'https://api.kasparex.com';

export interface ApiError {
  error: string;
  retryAfter?: number;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/**
 * API Client class
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * Make a request with error handling and retries
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      // Handle rate limiting
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : 60;
        throw new ApiClientError(
          'Too many requests',
          429,
          retryAfterSeconds
        );
      }

      // Handle errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new ApiClientError(
          errorData.error || `HTTP ${response.status}`,
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      
      // Network or other errors
      throw new ApiClientError(
        error instanceof Error ? error.message : 'Network error',
        0
      );
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export convenience functions
export const api = {
  get: <T>(endpoint: string, options?: RequestInit) => apiClient.get<T>(endpoint, options),
  post: <T>(endpoint: string, data?: unknown, options?: RequestInit) => apiClient.post<T>(endpoint, data, options),
  put: <T>(endpoint: string, data?: unknown, options?: RequestInit) => apiClient.put<T>(endpoint, data, options),
  delete: <T>(endpoint: string, options?: RequestInit) => apiClient.delete<T>(endpoint, options),
};


