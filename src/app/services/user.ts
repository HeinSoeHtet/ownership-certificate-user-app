// src/app/services/user.service.ts

import { Injectable } from '@angular/core';
import { Web3 as Web3Service } from './web3'; // Assuming web3.service.ts path
import { ethers } from 'ethers';

// Define the data structure for a certificate from a user's perspective
export interface CertificateDetails {
  tokenId: string;
  owner: string;
  ipfsHash: string;
  metadataUri: string;
  originalMinter: string;
  mintTimestamp: number;
  isAuthentic: boolean;
  businessName: string;
  history: OwnershipRecord[];
}

export interface OwnershipRecord {
  owner: string;
  timestamp: number;
}

export interface ProductDetails {
  name: string;
  description: string;
  image: string;
}

@Injectable({
  providedIn: 'root',
})
export class User {
  constructor(private web3Service: Web3Service) {}

  /**
   * Fetches all details for a single certificate, including its full history.
   * This is the primary function for the verification and certificate details pages.
   * @param tokenId The ID of the token to look up.
   * @returns A detailed certificate object or null if not found.
   */
  async getCertificateDetails(
    tokenId: string
  ): Promise<CertificateDetails | null> {
    try {
      console.log(
        `📖 Verifying and fetching details for certificate #${tokenId}...`
      );

      const [owner, productInfo, verification, history, tokenUri] =
        await Promise.all([
          this.web3Service.callViewFunction('certificate', 'ownerOf', [
            tokenId,
          ]),
          this.web3Service.callViewFunction('certificate', 'getProductInfo', [
            tokenId,
          ]),
          this.web3Service.callViewFunction(
            'certificate',
            'verifyAuthenticity',
            [tokenId]
          ),
          this.web3Service.callViewFunction(
            'certificate',
            'getOwnershipHistory',
            [tokenId]
          ),
          this.web3Service.callViewFunction('certificate', 'tokenURI', [
            tokenId,
          ]),
        ]);

      const formattedHistory = history.map((record: any) => ({
        owner: record.owner,
        timestamp: Number(record.timestamp),
      }));

      return {
        tokenId,
        owner,
        ipfsHash: productInfo.ipfsHash,
        metadataUri: tokenUri,
        originalMinter: productInfo.originalMinter,
        mintTimestamp: Number(productInfo.mintTimestamp),
        isAuthentic: verification?.isAuthentic || false,
        businessName: verification?.businessName || 'Unknown',
        history: formattedHistory,
      };
    } catch (error: any) {
      console.error(`❌ Failed to get certificate ${tokenId}:`, error);
      return null;
    }
  }

  /**
   * Fetches the token IDs for all certificates owned by a specific address.
   * @param userAddress The address of the user.
   * @returns An array of token ID strings.
   */
  async getOwnedCertificateIds(userAddress: string): Promise<string[]> {
    try {
      if (!ethers.isAddress(userAddress)) return [];

      const tokenIds = await this.web3Service.callViewFunction(
        'certificate',
        'getOwnerTokens',
        [userAddress]
      );
      // Convert BigNumber instances to strings
      return tokenIds.map((id: any) => id.toString());
    } catch (error) {
      console.error(`❌ Failed to get certificates for ${userAddress}:`, error);
      return [];
    }
  }

  /**
   * NEW: Fetches a list of certificates owned by a user, including their full details.
   * This is perfect for the "My Wallet" page.
   * @param userAddress The address of the user.
   * @returns An array of full CertificateDetails objects.
   */
  async getOwnedCertificatesWithDetails(
    userAddress: string
  ): Promise<CertificateDetails[]> {
    try {
      console.log(`🖼️ Getting all certificate details for ${userAddress}...`);

      // 1. Get the list of token IDs the user owns.
      const tokenIds = await this.getOwnedCertificateIds(userAddress);
      if (tokenIds.length === 0) {
        return [];
      }

      // 2. Create an array of promises, where each promise fetches the details for one token.
      const certificatePromises = tokenIds.map((id) =>
        this.getCertificateDetails(id)
      );

      // 3. Resolve all promises concurrently for better performance.
      const certificates = await Promise.all(certificatePromises);

      // 4. Filter out any null results (in case a fetch failed for some reason).
      const validCertificates = certificates.filter(
        (cert): cert is CertificateDetails => cert !== null
      );

      console.log(
        `✅ Found ${validCertificates.length} full certificate objects.`
      );
      return validCertificates;
    } catch (error: any) {
      console.error(`❌ Failed to get owned certificates with details:`, error);
      return [];
    }
  }

  /**
   * Transfers a certificate from the connected user to a new recipient.
   * @param recipientAddress The address to send the certificate to.
   * @param tokenId The ID of the token to transfer.
   * @returns A promise that resolves with the transaction result.
   */
  async transferCertificate(
    recipientAddress: string,
    tokenId: string
  ): Promise<{ success: boolean; error?: string; txHash?: string }> {
    try {
      const fromAddress = this.web3Service.getCurrentState().address;
      if (!fromAddress) {
        throw new Error('Wallet not connected');
      }

      console.log(
        `📮 Transferring certificate #${tokenId} from ${fromAddress} to ${recipientAddress}...`
      );

      // CORRECTED: Use the full function signature to resolve ambiguity
      const result = await this.web3Service.executeTransaction(
        'certificate',
        'safeTransferFrom(address,address,uint256)', // <-- Change this line
        [fromAddress, recipientAddress, tokenId]
      );

      if (!result.success) {
        throw new Error(result.error || 'Transaction failed');
      }

      return { success: true, txHash: result.receipt?.hash };
    } catch (error: any) {
      console.error('❌ Transfer failed:', error);
      return { success: false, error: error.message };
    }
  }
}
