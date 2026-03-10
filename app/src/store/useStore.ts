import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  Wallet, 
  Identity, 
  Transaction, 
  PendingApproval, 
  Toast,
  TransactionFilter 
} from '@/types';

interface StoreState {
  // Connection
  isConnected: boolean;
  apiKey: string;
  setConnected: (connected: boolean) => void;
  setApiKey: (key: string) => void;
  
  // Wallets
  wallets: Wallet[];
  selectedWallet: Wallet | null;
  addWallet: (wallet: Omit<Wallet, 'id' | 'createdAt'>) => void;
  selectWallet: (wallet: Wallet | null) => void;
  deleteWallet: (id: string) => void;
  
  // Identities
  identities: Identity[];
  addIdentity: (identity: Omit<Identity, 'id' | 'createdAt'>) => void;
  deleteIdentity: (id: string) => void;
  
  // Transactions
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  filterTransactions: (filter: TransactionFilter) => Transaction[];
  
  // Pending Approvals
  pendingApprovals: PendingApproval[];
  approveTransaction: (id: string) => void;
  rejectTransaction: (id: string) => void;
  
  // Toasts
  toasts: Toast[];
  addToast: (type: 'success' | 'error', message: string) => void;
  removeToast: (id: string) => void;
}

// Generate random hash
const generateHash = () => {
  return '0x' + Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
};

// Sample data for demo
const sampleWallets: Wallet[] = [
  {
    id: '1',
    name: 'Main Wallet',
    address: '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b',
    network: 'Base Sepolia',
    balance: '2.456',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Trading Wallet',
    address: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b',
    network: 'ETH Sepolia',
    balance: '0.892',
    createdAt: new Date('2024-02-20'),
  },
  {
    id: '3',
    name: 'NFT Wallet',
    address: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    network: 'Arbitrum Sepolia',
    balance: '1.234',
    createdAt: new Date('2024-03-10'),
  },
];

const sampleIdentities: Identity[] = [
  {
    id: '1',
    name: 'alex.eth',
    type: 'ENS',
    walletAddress: '0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b',
    status: 'verified',
    createdAt: new Date('2024-01-20'),
  },
  {
    id: '2',
    name: '@alex_crypto',
    type: 'Social',
    walletAddress: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b',
    status: 'verified',
    createdAt: new Date('2024-02-25'),
  },
];

const sampleTransactions: Transaction[] = [
  {
    id: '1',
    hash: '0xabc123def456789012345678901234567890123456789012345678901234abcd',
    type: 'received',
    value: '0.5',
    valueUSD: '$1,250.00',
    from: '0x1234...5678',
    to: '0x7a8b...5a6b',
    network: 'Base Sepolia',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    status: 'confirmed',
  },
  {
    id: '2',
    hash: '0xdef456abc7890123456789012345678901234567890123456789012345678901',
    type: 'sent',
    value: '0.1',
    valueUSD: '$250.00',
    from: '0x7a8b...5a6b',
    to: '0x9876...5432',
    network: 'ETH Sepolia',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    status: 'confirmed',
  },
  {
    id: '3',
    hash: '0x7890123456789012345678901234567890123456789012345678901234567890',
    type: 'contract',
    value: '0.0',
    valueUSD: '$0.00',
    from: '0x7a8b...5a6b',
    to: '0xContract...',
    network: 'Arbitrum Sepolia',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    status: 'confirmed',
  },
  {
    id: '4',
    hash: '0x0123456789012345678901234567890123456789012345678901234567890123',
    type: 'received',
    value: '1.2',
    valueUSD: '$3,000.00',
    from: '0xabcd...efgh',
    to: '0x9a8b...1a0b',
    network: 'Base Sepolia',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    status: 'confirmed',
  },
];

const samplePendingApprovals: PendingApproval[] = [
  {
    id: '1',
    value: '0.42',
    valueUSD: '$1,050.00',
    recipient: '0x3b9c...8d2e',
    network: 'Base Sepolia',
    priority: 'high',
    createdAt: new Date(),
  },
  {
    id: '2',
    value: '0.15',
    valueUSD: '$375.00',
    recipient: '0x7f2a...9c1b',
    network: 'ETH Sepolia',
    priority: 'normal',
    createdAt: new Date(Date.now() - 1000 * 60 * 15),
  },
];

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Connection
      isConnected: false,
      apiKey: '',
      setConnected: (connected) => set({ isConnected: connected }),
      setApiKey: (key) => set({ apiKey: key }),
      
      // Wallets
      wallets: sampleWallets,
      selectedWallet: null,
      addWallet: (wallet) => {
        const newWallet: Wallet = {
          ...wallet,
          id: Date.now().toString(),
          createdAt: new Date(),
        };
        set((state) => ({ wallets: [...state.wallets, newWallet] }));
        get().addToast('success', `Wallet "${wallet.name}" created!`);
      },
      selectWallet: (wallet) => set({ selectedWallet: wallet }),
      deleteWallet: (id) => {
        set((state) => ({ 
          wallets: state.wallets.filter((w) => w.id !== id),
          selectedWallet: state.selectedWallet?.id === id ? null : state.selectedWallet,
        }));
        get().addToast('success', 'Wallet deleted');
      },
      
      // Identities
      identities: sampleIdentities,
      addIdentity: (identity) => {
        const newIdentity: Identity = {
          ...identity,
          id: Date.now().toString(),
          createdAt: new Date(),
        };
        set((state) => ({ identities: [...state.identities, newIdentity] }));
        get().addToast('success', `Identity "${identity.name}" added!`);
      },
      deleteIdentity: (id) => {
        set((state) => ({ 
          identities: state.identities.filter((i) => i.id !== id) 
        }));
        get().addToast('success', 'Identity removed');
      },
      
      // Transactions
      transactions: sampleTransactions,
      addTransaction: (transaction) => {
        const newTransaction: Transaction = {
          ...transaction,
          id: Date.now().toString(),
        };
        set((state) => ({ 
          transactions: [newTransaction, ...state.transactions] 
        }));
      },
      filterTransactions: (filter) => {
        const { transactions } = get();
        if (filter === 'all') return transactions;
        return transactions.filter((t) => t.type === filter);
      },
      
      // Pending Approvals
      pendingApprovals: samplePendingApprovals,
      approveTransaction: (id) => {
        const approval = get().pendingApprovals.find((a) => a.id === id);
        if (approval) {
          // Add to transactions
          get().addTransaction({
            hash: generateHash(),
            type: 'sent',
            value: approval.value,
            valueUSD: approval.valueUSD,
            from: get().selectedWallet?.address || '0x...',
            to: approval.recipient,
            network: approval.network,
            timestamp: new Date(),
            status: 'confirmed',
          });
          // Remove from pending
          set((state) => ({ 
            pendingApprovals: state.pendingApprovals.filter((a) => a.id !== id) 
          }));
          get().addToast('success', 'Transaction approved!');
        }
      },
      rejectTransaction: (id) => {
        set((state) => ({ 
          pendingApprovals: state.pendingApprovals.filter((a) => a.id !== id) 
        }));
        get().addToast('error', 'Transaction rejected');
      },
      
      // Toasts
      toasts: [],
      addToast: (type, message) => {
        const id = Date.now().toString();
        set((state) => ({ 
          toasts: [...state.toasts, { id, type, message }] 
        }));
        // Auto-remove after 4 seconds
        setTimeout(() => {
          get().removeToast(id);
        }, 4000);
      },
      removeToast: (id) => {
        set((state) => ({ 
          toasts: state.toasts.filter((t) => t.id !== id) 
        }));
      },
    }),
    {
      name: 'claw-wallet-storage',
      partialize: (state) => ({ 
        wallets: state.wallets,
        identities: state.identities,
        transactions: state.transactions,
      }),
    }
  )
);
