/**
 * Lightweight IPFS Client Wrapper
 * Lazy-loaded, only initializes when needed
 */

import { getPinataService, type UploadResult } from './pinata';
import { getGatewayUrl, type GatewayConfig } from './gateway';

export interface IPFSClientConfig {
  pinataApiKey?: string;
  pinataApiSecret?: string;
  gatewayConfig?: GatewayConfig;
}

export interface UploadOptions {
  pin?: boolean;
  filename?: string;
}

class IPFSClient {
  private initialized = false;
  private pinataService = getPinataService();

  /**
   * Lazy initialization - only loads when first used
   */
  private ensureInitialized() {
    if (!this.initialized) {
      // Client is ready to use
      this.initialized = true;
    }
  }

  /**
   * Upload a file to IPFS
   */
  async uploadFile(file: File | Blob, options: UploadOptions = {}): Promise<string> {
    this.ensureInitialized();

    try {
      const result: UploadResult = await this.pinataService.uploadFile(
        file,
        options.filename
      );

      // Auto-pin if requested (Pinata auto-pins on upload)
      if (options.pin !== false) {
        // Pinata already pins on upload, but we can ensure it's pinned
        await this.pinataService.pinHash(result.hash);
      }

      return result.hash;
    } catch (error) {
      console.error('IPFS upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload JSON data to IPFS
   */
  async uploadJSON(data: Record<string, unknown>, options: UploadOptions = {}): Promise<string> {
    this.ensureInitialized();

    try {
      const result: UploadResult = await this.pinataService.uploadJSON(data, options.filename);

      // Auto-pin if requested (Pinata auto-pins on upload)
      if (options.pin !== false) {
        // Pinata already pins on upload, but we can ensure it's pinned
        await this.pinataService.pinHash(result.hash);
      }

      return result.hash;
    } catch (error) {
      console.error('IPFS JSON upload failed:', error);
      throw error;
    }
  }

  /**
   * Get file from IPFS with fallback
   */
  async getFile(hash: string): Promise<Blob | null> {
    this.ensureInitialized();

    // Try Pinata first
    const pinataFile = await this.pinataService.getFile(hash);
    if (pinataFile) return pinataFile;

    // Fallback to public gateway
    try {
      const gatewayUrl = getGatewayUrl(hash);
      const response = await fetch(gatewayUrl);
      if (response.ok) {
        return await response.blob();
      }
    } catch (error) {
      console.error('IPFS gateway fallback failed:', error);
    }

    return null;
  }

  /**
   * Get JSON data from IPFS with fallback
   */
  async getJSON<T = unknown>(hash: string): Promise<T | null> {
    this.ensureInitialized();

    // Try Pinata first
    const pinataData = await this.pinataService.getJSON<T>(hash);
    if (pinataData) return pinataData;

    // Fallback to public gateway
    try {
      const gatewayUrl = getGatewayUrl(hash);
      const response = await fetch(gatewayUrl);
      if (response.ok) {
        return await response.json() as T;
      }
    } catch (error) {
      console.error('IPFS JSON gateway fallback failed:', error);
    }

    return null;
  }

  /**
   * Pin a hash to ensure availability
   */
  async pinHash(hash: string): Promise<boolean> {
    this.ensureInitialized();
    return this.pinataService.pinHash(hash);
  }

  /**
   * Get gateway URL for a hash
   */
  getGatewayUrl(hash: string): string {
    return getGatewayUrl(hash);
  }
}

// Singleton instance (lazy-loaded)
let clientInstance: IPFSClient | null = null;

export function getIPFSClient(config?: IPFSClientConfig): IPFSClient {
  if (!clientInstance) {
    clientInstance = new IPFSClient();
  }
  return clientInstance;
}

export default IPFSClient;

