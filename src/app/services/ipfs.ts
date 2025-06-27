// src/app/services/ipfs.service.ts

import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface NftMetadata {
  name: string;
  description: string;
  image: string;
  // Add any other properties your metadata might have
}

@Injectable({
  providedIn: 'root',
})
export class Ipfs {
  private readonly PINATA_API_KEY = environment.pinataApiKey;
  private readonly PINATA_API_SECRET = environment.pinataApiSecret;
  private readonly PINATA_URL = 'https://api.pinata.cloud';

  private readonly IPFS_GATEWAY = 'https://ipfs.io/ipfs/';

  private readonly http = inject(HttpClient);

  /**
   * Uploads a file (like an image) to Pinata.
   * @param file The file to upload.
   * @returns The IPFS hash of the uploaded file.
   */
  async uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.PINATA_URL}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: {
        pinata_api_key: this.PINATA_API_KEY,
        pinata_secret_api_key: this.PINATA_API_SECRET,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload file to IPFS');
    }

    const result = await response.json();
    return result.IpfsHash;
  }

  /**
   * Uploads a JSON metadata object to Pinata.
   * @param metadata The JSON object to upload.
   * @returns The IPFS hash of the uploaded JSON file.
   */
  async uploadMetadata(metadata: object): Promise<string> {
    const response = await fetch(`${this.PINATA_URL}/pinning/pinJSONToIPFS`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        pinata_api_key: this.PINATA_API_KEY,
        pinata_secret_api_key: this.PINATA_API_SECRET,
      },
      body: JSON.stringify({
        pinataContent: metadata,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to upload JSON metadata to IPFS');
    }

    const result = await response.json();
    return result.IpfsHash;
  }

  /**
   * Converts an "ipfs://" URI to a full HTTP URL using a public gateway.
   * @param ipfsUri The "ipfs://..." URI.
   * @returns A usable HTTP URL string.
   */
  resolveIpfsUri(ipfsUri: string): string {
    if (!ipfsUri || !ipfsUri.startsWith('ipfs://')) {
      console.error('Invalid IPFS URI provided:', ipfsUri);
      return ''; // Return a fallback or empty string
    }
    // Replace 'ipfs://' with the gateway URL
    return ipfsUri.replace('ipfs://', this.IPFS_GATEWAY);
  }

  /**
   * Fetches the JSON metadata file from an IPFS URI.
   * @param ipfsUri The "ipfs://..." URI of the metadata file.
   * @returns A promise that resolves to the parsed NftMetadata object.
   */
  async getMetadata(ipfsUri: string): Promise<NftMetadata | null> {
    const url = this.resolveIpfsUri(ipfsUri);
    if (!url) {
      return null;
    }
    try {
      // Use Angular's HttpClient to fetch the JSON data
      return await firstValueFrom(this.http.get<NftMetadata>(url));
    } catch (error) {
      console.error('Failed to fetch IPFS metadata:', error);
      return null;
    }
  }
}
