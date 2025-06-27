import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { Navbar } from '../../layouts/navbar/navbar';
import { CertificateWithMetadata } from '../vault/vault';
import { User as UserService } from '../../services/user';
import { Ipfs as IpfsService } from '../../services/ipfs';
import { Router } from '@angular/router';
import { Snackbar } from '../../components/snackbar/snackbar';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-verify',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    Navbar,
  ],
  templateUrl: './verify.html',
  styleUrl: './verify.css',
})
export class Verify {
  private userService = inject(UserService);

  certificateId = signal('');
  private ipfsService = inject(IpfsService);
  private router = inject(Router);
  private _snackBar = inject(MatSnackBar);

  async findCertificate(): Promise<void> {
    if (this.certificateId() === '') {
      this._snackBar.openFromComponent(Snackbar, {
        duration: 2000,
        data: {
          message: 'Certificate ID cannot be empty!',
        },
      });

      return;
    }
    try {
      // 1. Get the single on-chain certificate details
      const certificateDetails = await this.userService.getCertificateDetails(
        this.certificateId()
      );

      // 2. Check if the certificate was found
      if (!certificateDetails) {
        throw new Error('Certificate not found.');
      }

      // 3. Fetch the IPFS metadata for this specific certificate
      // No .map() or Promise.all needed here
      const productMetadata = await this.ipfsService.getMetadata(
        certificateDetails.metadataUri
      );

      // 4. Resolve the IPFS image URI if it exists
      if (productMetadata?.image) {
        productMetadata.image = this.ipfsService.resolveIpfsUri(
          productMetadata.image
        );
      }
      // 5. Combine the on-chain data and the product metadata into a single object
      const certificateWithMetadata: CertificateWithMetadata = {
        ...certificateDetails, // Spread the on-chain properties
        product: productMetadata, // Add the fetched metadata as a 'product' property
      };

      this.router.navigate(['/certificate', this.certificateId()], {
        state: { data: certificateWithMetadata },
      });
    } catch (e: any) {
      this._snackBar.openFromComponent(Snackbar, {
        duration: 2000,
        data: {
          message: 'Certificate not found.',
        },
      });
      console.error(
        `Error loading certificate details for token ${this.certificateId()}:`,
        e
      );
    }
  }
}
