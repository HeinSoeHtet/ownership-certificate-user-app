import {
  Component,
  effect,
  inject,
  signal,
  WritableSignal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

// Import your existing services and interfaces
import { Navbar } from '../../layouts/navbar/navbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Web3 as Web3Service } from '../../services/web3';
import {
  User as UserService,
  CertificateDetails as ICertificateDetails,
  ProductDetails,
} from '../../services/user';
import { Ipfs as IpfsService } from '../../services/ipfs';
import { RouterLink } from '@angular/router';

// NEW: Create a combined interface for the template
export interface CertificateWithMetadata extends ICertificateDetails {
  product: ProductDetails | null;
}

@Component({
  selector: 'app-vault',
  imports: [MatCardModule, MatButtonModule, Navbar, RouterLink],
  templateUrl: './vault.html',
  styleUrls: ['./vault.css'],
})
export class Vault {
  // Inject services
  private web3Service = inject(Web3Service);
  private userService = inject(UserService);
  private ipfsService = inject(IpfsService);

  // --- State as Signals ---

  // Convert the wallet state observable to a signal for reactive effects
  walletState = toSignal(this.web3Service.walletState$, {
    initialValue: this.web3Service.getCurrentState(),
  });

  // Writable signals to hold the component's state
  certificates: WritableSignal<CertificateWithMetadata[]> = signal([]);

  constructor() {
    // Set up a reactive effect that runs whenever the walletState signal changes
    effect(async () => {
      const state = this.walletState(); // Get the current value of the signal

      if (state.connected && state.isCorrectNetwork && state.address) {
        // User is connected, fetch their data
        await this.loadOwnedCertificates(state.address);

        console.log(this.certificates());
      } else {
        this.certificates.set([]);
      }
    });
  }

  /**
   * Fetches the user's certificates and their associated IPFS metadata,
   * then updates the component's state signals.
   * @param address The user's wallet address.
   */
  private async loadOwnedCertificates(address: string): Promise<void> {
    try {
      this.certificates.set([]); // Clear previous results

      // 1. Get the on-chain certificate details
      const onChainData =
        await this.userService.getOwnedCertificatesWithDetails(address);

      if (onChainData.length === 0) {
        return;
      }

      // 2. Fetch all IPFS metadata concurrently for better performance
      const certificatesWithMetadata = await Promise.all(
        onChainData.map(async (cert) => {
          const product = await this.ipfsService.getMetadata(cert.metadataUri);
          // Also resolve the image URI right away
          if (product?.image) {
            product.image = this.ipfsService.resolveIpfsUri(product.image);
          }
          return { ...cert, product };
        })
      );

      // 3. Update the signal with the final combined data
      this.certificates.set(certificatesWithMetadata);
    } catch (e: any) {
      console.error('Error loading owned certificates:', e);
    }
  }
}
