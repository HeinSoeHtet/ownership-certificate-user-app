import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { WalletState, Web3 as Web3Service } from '../../services/web3';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Observable } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-navbar',
  imports: [MatButtonModule, RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit {
  web3Service = inject(Web3Service);
  walletState$: Observable<WalletState>;
  isConnected = signal(false);

  constructor() {
    this.walletState$ = this.web3Service.walletState$;
  }

  async ngOnInit() {
    this.walletState$.subscribe(async (state) => {
      if (state.connected && state.isCorrectNetwork && state.address) {
        this.isConnected.set(true);
      } else {
        this.isConnected.set(false);
      }
    });
  }

  async connectWallet() {
    const success = await this.web3Service.connectWallet();

    if (success) {
      console.log('Wallet connected successfully! 🎉🎉');
    } else {
      console.log('Failed to connect wallet. Please try again.');
    }
  }

  disconnect() {
    this.web3Service.disconnect();
    console.log('Wallet disconnected!');
  }
}
