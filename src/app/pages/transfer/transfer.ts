import { MatButtonModule } from '@angular/material/button';
import { MatFormField } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { Navbar } from '../../layouts/navbar/navbar';
import { Ipfs as IpfsService, NftMetadata } from '../../services/ipfs';
import {
  User as UserService,
  CertificateDetails as ICertificateDetails,
} from '../../services/user';
import { Web3 as Web3Service } from '../../services/web3';

import { Snackbar } from '../../components/snackbar/snackbar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-transfer',
  imports: [
    Navbar,
    MatButtonModule,
    MatFormField,
    MatInputModule,
    MatIconModule,
    RouterLink,
    FormsModule,
  ],
  templateUrl: './transfer.html',
  styleUrl: './transfer.scss',
})
export class Transfer implements OnInit {
  private _snackBar = inject(MatSnackBar);
  // Inject services
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private web3Service = inject(Web3Service);
  private userService = inject(UserService);
  private ipfsService = inject(IpfsService);

  // --- Component State as Signals ---
  walletState = toSignal(this.web3Service.walletState$);
  certificateId = signal<string>('');

  certificateDetails = signal<ICertificateDetails | null>(null);
  productDetails = signal<NftMetadata | null>(null);

  recipientAddress = signal('');

  constructor() {
    // 1. Check for data passed via router state first.
    // This provides an instant load without a network call.
    const navigation = this.router.getCurrentNavigation();
    const stateData = navigation?.extras.state?.[
      'data'
    ] as ICertificateDetails & { product: NftMetadata | null };

    if (stateData) {
      console.log(
        'Data received from navigation state. Skipping network call.'
      );
      this.certificateDetails.set(stateData);
      if (stateData.product) {
        this.productDetails.set(stateData.product);
      }
    }

    // 2. Set up a reactive effect to handle data loading on wallet connection/changes.
    effect(() => {
      const state = this.walletState();
      const certId = this.certificateId();

      // Only fetch if we have an ID, a connected user, and no data yet.
      if (
        certId &&
        state?.connected &&
        state.isCorrectNetwork &&
        !this.certificateDetails()
      ) {
        this.loadCertificateData(certId);
      }
    });
  }

  ngOnInit() {
    // 3. Get the certificate ID from the URL.
    // This is essential for the fallback and for deep linking.
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.certificateId.set(id);
    } else {
      this._snackBar.openFromComponent(Snackbar, {
        duration: 2000,
        data: {
          message: 'No Certificate ID found in URL.',
        },
      });
    }
  }

  /**
   * Fetches data from the network. This serves as the fallback for page refreshes
   * or direct navigation.
   * @param tokenId The ID of the certificate to load.
   */
  async loadCertificateData(tokenId: string): Promise<void> {
    try {
      const certDetails = await this.userService.getCertificateDetails(tokenId);
      if (!certDetails) {
        throw new Error('Certificate not found.');
      }
      this.certificateDetails.set(certDetails);

      const prodDetails = await this.ipfsService.getMetadata(
        certDetails.metadataUri
      );
      if (prodDetails?.image) {
        prodDetails.image = this.ipfsService.resolveIpfsUri(prodDetails.image);
      }
      this.productDetails.set(prodDetails);
    } catch (e: any) {
      console.error(e);
    }
  }

  async transferCertificate(): Promise<void> {
    if (this.recipientAddress() === '') {
      this._snackBar.openFromComponent(Snackbar, {
        duration: 2000,
        data: {
          message: 'Recipient address cannot be empty!',
        },
      });

      return;
    }

    if (!this.isValidEthereumAddressFormat(this.recipientAddress())) {
      this._snackBar.openFromComponent(Snackbar, {
        duration: 3000, // Maybe give more time to read this message
        data: {
          message: 'This is not a valid wallet address format.',
        },
      });
      return;
    }
    try {
      const result = await this.userService.transferCertificate(
        this.recipientAddress(),
        this.certificateId()
      );

      if (!result.success) {
        throw new Error(result.error || 'Transaction failed');
      }

      this._snackBar.openFromComponent(Snackbar, {
        duration: 2000,
        data: {
          message: 'Successfully transferred certificate.',
        },
      });

      this.router.navigate(['/verify']);
    } catch (e: any) {
      this._snackBar.openFromComponent(Snackbar, {
        duration: 2000,
        data: {
          message: 'Error transferring certificate.',
        },
      });
      console.error(e);
    }
  }

  private isValidEthereumAddressFormat(address: string): boolean {
    // Check if the address is a 42-character hex string starting with '0x'
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethAddressRegex.test(address);
  }
}
