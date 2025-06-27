// src/app/config/abis/index.ts
import BusinessManagerABI from './BusinessManager.json';
import CertificateMultiSigABI from './CertificateMultiSig.json';
import OwnershipCertificateABI from './OwnershipCertificate.json';
import SystemRegistryABI from './SystemRegistry.json';

export const CONTRACT_ABIS = {
  businessManager: BusinessManagerABI,
  multiSig: CertificateMultiSigABI,
  certificate: OwnershipCertificateABI,
  registry: SystemRegistryABI,
} as const;

export type ContractName = keyof typeof CONTRACT_ABIS;
