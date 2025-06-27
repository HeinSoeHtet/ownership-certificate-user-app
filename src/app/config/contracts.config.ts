// src/app/config/contracts.config.ts
import { CONTRACT_ABIS, ContractName } from './abis';

export interface ContractAddresses {
  multiSig: string;
  registry: string;
  businessManager: string;
  certificate: string;
}

// 🔥 REPLACE THESE WITH YOUR ACTUAL DEPLOYED ADDRESSES
export const CONTRACT_ADDRESSES: ContractAddresses = {
  multiSig: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  registry: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  businessManager: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
  certificate: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9',
};

export const NETWORK_CONFIG = {
  chainId: 31337,
  chainName: 'Hardhat Local',
  rpcUrl: 'http://127.0.0.1:8545',
  currencySymbol: 'ETH',
};

export { CONTRACT_ABIS };
export type { ContractName };
