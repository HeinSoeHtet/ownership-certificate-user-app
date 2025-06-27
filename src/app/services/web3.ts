// src/app/services/web3.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import {
  ethers,
  TransactionReceipt,
  Interface,
  LogDescription,
  InterfaceAbi,
} from 'ethers';
import {
  CONTRACT_ADDRESSES,
  CONTRACT_ABIS,
  NETWORK_CONFIG,
  ContractName,
} from '../config/contracts.config';

export interface WalletState {
  connected: boolean;
  address: string | null;
  balance: string | null;
  networkId: number | null;
  isCorrectNetwork: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class Web3 {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private contracts: Map<string, ethers.Contract> = new Map();

  private walletState = new BehaviorSubject<WalletState>({
    connected: false,
    address: null,
    balance: null,
    networkId: null,
    isCorrectNetwork: false,
  });

  public walletState$ = this.walletState.asObservable();

  constructor() {
    this.checkExistingConnection();
    this.setupEventListeners();
  }

  // =================================================================
  // WALLET CONNECTION
  // =================================================================

  async connectWallet(): Promise<boolean> {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        return false;
      }
      this.provider = new ethers.BrowserProvider(window.ethereum);
      await this.provider.send('eth_requestAccounts', []);
      this.signer = await this.provider.getSigner();
      const address = await this.signer.getAddress();
      const balance = await this.provider.getBalance(address);
      const network = await this.provider.getNetwork();
      const isCorrectNetwork =
        Number(network.chainId) === NETWORK_CONFIG.chainId;

      this.walletState.next({
        connected: true,
        address,
        balance: ethers.formatEther(balance),
        networkId: Number(network.chainId),
        isCorrectNetwork,
      });

      if (!isCorrectNetwork) {
        await this.switchToCorrectNetwork();
      }
      this.contracts.clear();
      return true;
    } catch (error: any) {
      console.error('❌ Failed to connect wallet:', error);
      return false;
    }
  }

  async switchToCorrectNetwork(): Promise<void> {
    try {
      const chainIdHex = `0x${NETWORK_CONFIG.chainId.toString(16)}`;
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${NETWORK_CONFIG.chainId.toString(16)}`,
                chainName: NETWORK_CONFIG.chainName,
                rpcUrls: [NETWORK_CONFIG.rpcUrl],
                nativeCurrency: {
                  name: 'Ethereum',
                  symbol: NETWORK_CONFIG.currencySymbol,
                  decimals: 18,
                },
              },
            ],
          });
        } catch (addError) {
          console.error('❌ Failed to add network:', addError);
        }
      }
    }
  }

  disconnect(): void {
    this.provider = null;
    this.signer = null;
    this.contracts.clear();
    this.walletState.next({
      connected: false,
      address: null,
      balance: null,
      networkId: null,
      isCorrectNetwork: false,
    });
  }

  // =================================================================
  // CONTRACT INTERACTION
  // =================================================================

  getContract(contractName: ContractName): ethers.Contract | null {
    if (!this.signer) {
      console.error('❌ Wallet not connected');
      return null;
    }
    if (this.contracts.has(contractName)) {
      return this.contracts.get(contractName)!;
    }
    try {
      const address = CONTRACT_ADDRESSES[contractName];
      const abi = CONTRACT_ABIS[contractName];
      if (!address || !abi)
        throw new Error(`Contract ${contractName} not configured`);
      // CORRECTED: Removed the incorrect 'as ContractInterface' cast for Ethers v6
      const contract = new ethers.Contract(
        address,
        abi as InterfaceAbi,
        this.signer
      );
      this.contracts.set(contractName, contract);
      return contract;
    } catch (error) {
      console.error(`❌ Failed to create contract ${contractName}:`, error);
      return null;
    }
  }

  getReadOnlyContract(contractName: ContractName): ethers.Contract | null {
    try {
      const provider =
        this.provider || new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
      const address = CONTRACT_ADDRESSES[contractName];
      const abi = CONTRACT_ABIS[contractName];
      // CORRECTED: Removed the incorrect 'as ContractInterface' cast for Ethers v6
      return new ethers.Contract(address, abi as InterfaceAbi, provider);
    } catch (error) {
      console.error(
        `❌ Failed to create read-only contract ${contractName}:`,
        error
      );
      return null;
    }
  }

  async callViewFunction(
    contractName: ContractName,
    functionName: string,
    params: any[] = []
  ): Promise<any> {
    const contract = this.getReadOnlyContract(contractName);
    if (!contract) throw new Error(`Contract ${contractName} not available`);
    return contract[functionName](...params);
  }

  async executeTransaction(
    contractName: ContractName,
    functionName: string,
    params: any[] = [],
    options: { value?: string; gasLimit?: number } = {}
  ): Promise<{
    success: boolean;
    transaction?: any;
    receipt?: TransactionReceipt;
    error?: string;
  }> {
    if (!this.isConnected() || !this.isOnCorrectNetwork()) {
      return {
        success: false,
        error: 'Wallet not connected or on wrong network.',
      };
    }
    const contract = this.getContract(contractName);
    if (!contract)
      return {
        success: false,
        error: `Contract ${contractName} not available`,
      };
    try {
      const txOptions: any = {};
      if (options.value) txOptions.value = ethers.parseEther(options.value);
      if (options.gasLimit) txOptions.gasLimit = options.gasLimit;
      const tx = await contract[functionName](...params, txOptions);
      const receipt = await tx.wait();
      await this.refreshBalance();
      return { success: true, transaction: tx, receipt };
    } catch (error: any) {
      let errorMessage = error.message;
      if (error.code === 4001) errorMessage = 'Transaction rejected by user';
      else if (error.message.includes('insufficient funds'))
        errorMessage = 'Insufficient funds';
      return { success: false, error: errorMessage };
    }
  }

  // =================================================================
  // EVENT & LOG PARSING HELPERS (NEWLY ADDED)
  // =================================================================

  /**
   * Finds the first occurrence of a specific event in a transaction receipt.
   * @param receipt The transaction receipt.
   * @param contractName The name of the contract that emitted the event.
   * @param eventName The name of the event.
   * @returns The parsed event log or null if not found.
   */
  parseEventFromReceipt(
    receipt: TransactionReceipt | undefined,
    contractName: ContractName,
    eventName: string
  ): LogDescription | null {
    if (!receipt) return null;
    const contractInterface = this.getContract(contractName)?.interface;
    if (!contractInterface) return null;

    for (const log of receipt.logs) {
      try {
        const parsedLog = contractInterface.parseLog(log);
        if (parsedLog && parsedLog.name === eventName) {
          return parsedLog;
        }
      } catch (error) {
        // Ignore logs that don't match the interface
      }
    }
    return null;
  }

  /**
   * Finds all occurrences of a specific event in a transaction receipt.
   * @param receipt The transaction receipt.
   * @param contractName The name of the contract that emitted the event.
   * @param eventName The name of the event.
   * @returns An array of parsed event logs.
   */
  parseAllEventsFromReceipt(
    receipt: TransactionReceipt | undefined,
    contractName: ContractName,
    eventName: string
  ): LogDescription[] {
    if (!receipt) return [];
    const contractInterface = this.getContract(contractName)?.interface;
    if (!contractInterface) return [];

    const events: LogDescription[] = [];
    for (const log of receipt.logs) {
      try {
        const parsedLog = contractInterface.parseLog(log);
        if (parsedLog && parsedLog.name === eventName) {
          events.push(parsedLog);
        }
      } catch (error) {
        // Ignore logs that don't match the interface
      }
    }
    return events;
  }

  /**
   * Gets the interface for a contract.
   * @param contractName The name of the contract.
   * @returns The contract's Interface object or undefined.
   */
  getContractInterface(contractName: ContractName): Interface | undefined {
    return this.getContract(contractName)?.interface;
  }

  // =================================================================
  // UTILITY FUNCTIONS
  // =================================================================

  async checkExistingConnection(): Promise<void> {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        });
        if (accounts.length > 0) {
          await this.connectWallet();
        }
      } catch (error) {
        console.error('❌ Error checking existing connection:', error);
      }
    }
  }

  private setupEventListeners(): void {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) this.disconnect();
        else this.connectWallet();
      });
      window.ethereum.on('chainChanged', () => window.location.reload());
    }
  }

  async refreshBalance(): Promise<void> {
    if (this.provider && this.walletState.value.address) {
      const balance = await this.provider.getBalance(
        this.walletState.value.address
      );
      this.walletState.next({
        ...this.walletState.value,
        balance: ethers.formatEther(balance),
      });
    }
  }

  // State getters
  getCurrentState(): WalletState {
    return this.walletState.value;
  }
  isConnected(): boolean {
    return this.walletState.value.connected;
  }
  isOnCorrectNetwork(): boolean {
    return this.walletState.value.isCorrectNetwork;
  }
  getContractAddress(contractName: ContractName): string {
    return CONTRACT_ADDRESSES[contractName];
  }
}

declare global {
  interface Window {
    ethereum?: any;
  }
}
