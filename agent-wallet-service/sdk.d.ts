/**
 * Claw Wallet SDK - Lightweight Client SDK
 * TypeScript Declarations
 */

export interface SDKConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export interface WalletResponse {
  id: string;
  address: string;
  chain: string;
  agentName: string;
  createdAt: string;
}

export interface BalanceResponse {
  address: string;
  chain: string;
  balances: Array<{
    token: string;
    symbol: string;
    balance: string;
    decimals: number;
    valueUsd?: number;
  }>;
}

export interface TransactionResponse {
  hash: string;
  from: string;
  to: string;
  value: string;
  chain: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
}

/**
 * Lightweight SDK client for Claw Wallet
 * 
 * @example
 * ```typescript
 * import { ClawWalletSDK } from 'claw-wallet-sdk/sdk';
 * 
 * const client = new ClawWalletSDK({ apiKey: 'sk_...' });
 * const wallet = await client.createWallet({ agentName: 'MyAgent', chain: 'base' });
 * ```
 */
export class ClawWalletSDK {
  constructor(config: SDKConfig);
  
  // Wallet
  createWallet(params: { agentName: string; chain: string }): Promise<WalletResponse>;
  getWallet(walletId: string): Promise<WalletResponse>;
  listWallets(): Promise<WalletResponse[]>;
  getBalance(address: string): Promise<BalanceResponse>;
  
  // Transactions
  sendTransaction(params: {
    from: string;
    to: string;
    value: string;
    chain: string;
  }): Promise<TransactionResponse>;
  getTransaction(hash: string): Promise<TransactionResponse>;
  
  // Utility
  healthCheck(): Promise<{ status: string; version: string }>;
}

export default ClawWalletSDK;
