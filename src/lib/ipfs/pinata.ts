/**
 * Pinata IPFS Service Integration
 * Handles automatic pinning and file uploads to Pinata IPFS
 */

import { readJsonResponse } from '@/lib/http/readJsonResponse';

export interface PinataConfig {
  apiKey: string;
  apiSecret: string;
}

export interface UploadResult {
  hash: string;
  hashV0: string;
  key: string;
  bucket: string;
}

export interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

class PinataService {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl = 'https://api.pinata.cloud';

  constructor(config?: PinataConfig) {
    this.apiKey = config?.apiKey || process.env.NEXT_PUBLIC_PINATA_API_KEY || '';
    this.apiSecret = config?.apiSecret || process.env.NEXT_PUBLIC_PINATA_API_SECRET || '';
  }

  /**
   * Upload a file to Pinata IPFS
   */
  async uploadFile(file: File | Blob, filename?: string): Promise<UploadResult> {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('Pinata API credentials not configured');
    }

    const formData = new FormData();
    formData.append('file', file, filename || 'file');

    // Pinata metadata
    const metadata = JSON.stringify({
      name: filename || 'file',
    });
    formData.append('pinataMetadata', metadata);

    // Pinata options (auto pin)
    const options = JSON.stringify({
      cidVersion: 1,
    });
    formData.append('pinataOptions', options);

    try {
      const response = await fetch(`${this.baseUrl}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers: {
          pinata_api_key: this.apiKey,
          pinata_secret_api_key: this.apiSecret,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Pinata upload failed: ${error}`);
      }

      const data = await readJsonResponse<PinataResponse>(response);
      return {
        hash: data.IpfsHash,
        hashV0: data.IpfsHash, // Pinata returns CIDv1 by default
        key: data.IpfsHash,
        bucket: 'pinata',
      };
    } catch (error) {
      console.error('Pinata upload error:', error);
      throw error;
    }
  }

  /**
   * Upload JSON data to Pinata IPFS
   */
  async uploadJSON(data: Record<string, unknown>, filename?: string): Promise<UploadResult> {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('Pinata API credentials not configured');
    }

    const metadataName = filename || 'metadata.json';

    try {
      const response = await fetch(`${this.baseUrl}/pinning/pinJSONToIPFS`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          pinata_api_key: this.apiKey,
          pinata_secret_api_key: this.apiSecret,
        },
        body: JSON.stringify({
          pinataContent: data,
          pinataMetadata: {
            name: metadataName,
          },
          pinataOptions: {
            cidVersion: 1,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Pinata JSON upload failed: ${error}`);
      }

      const pinataData = await readJsonResponse<PinataResponse>(response);
      return {
        hash: pinataData.IpfsHash,
        hashV0: pinataData.IpfsHash,
        key: pinataData.IpfsHash,
        bucket: 'pinata',
      };
    } catch (error) {
      console.error('Pinata JSON upload error:', error);
      throw error;
    }
  }

  /**
   * Pin a hash to Pinata (ensures content stays available)
   */
  async pinHash(hash: string): Promise<boolean> {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error('Pinata API credentials not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/pinning/pinByHash`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          pinata_api_key: this.apiKey,
          pinata_secret_api_key: this.apiSecret,
        },
        body: JSON.stringify({
          hashToPin: hash,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Pinata pin error:', error);
      return false;
    }
  }

  /**
   * Get file from Pinata IPFS
   */
  async getFile(hash: string): Promise<Blob | null> {
    try {
      const gatewayUrl = this.getGatewayUrl(hash);
      const response = await fetch(gatewayUrl);
      
      if (!response.ok) {
        return null;
      }

      return await response.blob();
    } catch (error) {
      console.error('Pinata get file error:', error);
      return null;
    }
  }

  /**
   * Get JSON data from Pinata IPFS
   */
  async getJSON<T = unknown>(hash: string): Promise<T | null> {
    try {
      const blob = await this.getFile(hash);
      if (!blob) return null;

      const text = await blob.text();
      return JSON.parse(text) as T;
    } catch (error) {
      console.error('Pinata get JSON error:', error);
      return null;
    }
  }

  /**
   * Get Pinata gateway URL for a hash
   */
  getGatewayUrl(hash: string): string {
    return `https://gateway.pinata.cloud/ipfs/${hash}`;
  }
}

// Singleton instance
let pinataInstance: PinataService | null = null;

export function getPinataService(config?: PinataConfig): PinataService {
  if (!pinataInstance) {
    pinataInstance = new PinataService(config);
  }
  return pinataInstance;
}

export default PinataService;

