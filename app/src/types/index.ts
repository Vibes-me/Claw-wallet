// Wallet types
export interface Wallet {
  id: string;
  name: string;
  address: string;
  network: Network;
  balance: string;
  createdAt: Date;
}

export type Network = 
  | 'Base Sepolia' 
  | 'ETH Sepolia' 
  | 'Arbitrum Sepolia' 
  | 'Optimism Sepolia' 
  | 'Polygon Mumbai';

export const NETWORKS: Network[] = [
  'Base Sepolia',
  'ETH Sepolia',
  'Arbitrum Sepolia',
  'Optimism Sepolia',
  'Polygon Mumbai',
];

// Identity types
export interface Identity {
  id: string;
  name: string;
  type: IdentityType;
  walletAddress: string;
  status: 'verified' | 'pending';
  createdAt: Date;
}

export type IdentityType = 'ENS' | 'Social' | 'DNS' | 'Custom';

// Transaction types
export interface Transaction {
  id: string;
  hash: string;
  type: TransactionType;
  value: string;
  valueUSD: string;
  from: string;
  to: string;
  network: Network;
  timestamp: Date;
  status: 'confirmed' | 'pending' | 'failed';
}

export type TransactionType = 'sent' | 'received' | 'contract';

export type TransactionFilter = 'all' | 'sent' | 'received' | 'contract';

// Pending Approval types
export interface PendingApproval {
  id: string;
  value: string;
  valueUSD: string;
  recipient: string;
  network: Network;
  priority: 'high' | 'normal';
  createdAt: Date;
}

// Toast types
export interface Toast {
  id: string;
  type: 'success' | 'error';
  message: string;
}

// App state
export interface AppState {
  isConnected: boolean;
  apiKey: string;
  wallets: Wallet[];
  identities: Identity[];
  transactions: Transaction[];
  pendingApprovals: PendingApproval[];
  selectedWallet: Wallet | null;
  toasts: Toast[];
}
