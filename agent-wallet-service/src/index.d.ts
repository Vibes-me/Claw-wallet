/**
 * Claw Wallet SDK - TypeScript Declarations
 * Stripe for AI Agent Wallets
 */

export interface WalletConfig {
  agentName: string;
  chain: string;
  metadata?: Record<string, unknown>;
}

export interface Wallet {
  id: string;
  address: string;
  chain: string;
  agentName: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface Balance {
  address: string;
  chain: string;
  balances: TokenBalance[];
}

export interface TokenBalance {
  token: string;
  symbol: string;
  balance: string;
  decimals: number;
  valueUsd?: number;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  chain: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
}

export interface Policy {
  id: string;
  walletId: string;
  type: 'spend_limit' | 'whitelist' | 'blacklist' | 'approval_required';
  config: Record<string, unknown>;
  enabled: boolean;
}

export interface Identity {
  id: string;
  walletId: string;
  ensName?: string;
  metadata: Record<string, unknown>;
}

export interface SendTransactionParams {
  from: string;
  to: string;
  value: string;
  chain: string;
  data?: string;
  gasLimit?: number;
}

export interface SwapParams {
  fromToken: string;
  toToken: string;
  amount: string;
  chain: string;
  slippage?: number;
}

// Main Wallet Service
export class WalletService {
  constructor(config?: { apiKey?: string; baseUrl?: string });
  
  // Wallet operations
  createWallet(config: WalletConfig): Promise<Wallet>;
  getWallet(walletId: string): Promise<Wallet>;
  listWallets(): Promise<Wallet[]>;
  getBalance(address: string, chain?: string): Promise<Balance>;
  
  // Transaction operations
  sendTransaction(params: SendTransactionParams): Promise<Transaction>;
  getTransaction(hash: string, chain?: string): Promise<Transaction>;
  getTransactionHistory(address: string, chain?: string): Promise<Transaction[]>;
  
  // Policy management
  createPolicy(walletId: string, policy: Omit<Policy, 'id' | 'walletId'>): Promise<Policy>;
  getPolicy(policyId: string): Promise<Policy>;
  listPolicies(walletId: string): Promise<Policy[]>;
  updatePolicy(policyId: string, updates: Partial<Policy>): Promise<Policy>;
  deletePolicy(policyId: string): Promise<void>;
  
  // Identity management
  createIdentity(walletId: string, metadata?: Record<string, unknown>): Promise<Identity>;
  getIdentity(identityId: string): Promise<Identity>;
  registerENS(identityId: string, name: string): Promise<{ ensName: string; transaction: Transaction }>;
  
  // DeFi operations
  swap(params: SwapParams): Promise<Transaction>;
  stake(token: string, amount: string, chain: string): Promise<Transaction>;
  unstake(token: string, amount: string, chain: string): Promise<Transaction>;
  
  // Multi-chain support
  getSupportedChains(): string[];
}

// MCP Server
export class MCPServer {
  constructor(config?: { port?: number; apiKey?: string });
  start(): Promise<void>;
  stop(): Promise<void>;
}

// WebSocket Events
export interface WalletEvent {
  type: 'wallet.created' | 'wallet.updated' | 'wallet.deleted';
  wallet: Wallet;
  timestamp: string;
}

export interface TransactionEvent {
  type: 'transaction.pending' | 'transaction.confirmed' | 'transaction.failed';
  transaction: Transaction;
  timestamp: string;
}

export interface ApprovalEvent {
  type: 'approval.requested' | 'approval.approved' | 'approval.rejected';
  approvalId: string;
  walletId: string;
  details: Record<string, unknown>;
  timestamp: string;
}

// Default export
export default WalletService;
