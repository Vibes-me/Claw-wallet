import { useState, useRef } from 'react';
import { Plus, Copy, ExternalLink, Send, Download, Trash2, X, Wallet as WalletIcon } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { NETWORKS, type Network } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getNetworkColor(network: Network): string {
  const colors: Record<Network, string> = {
    'Base Sepolia': 'bg-blue-50 text-blue-600 border-blue-100',
    'ETH Sepolia': 'bg-purple-50 text-purple-600 border-purple-100',
    'Arbitrum Sepolia': 'bg-indigo-50 text-indigo-600 border-indigo-100',
    'Optimism Sepolia': 'bg-rose-50 text-rose-600 border-rose-100',
    'Polygon Mumbai': 'bg-teal-50 text-teal-600 border-teal-100',
  };
  return colors[network] || 'bg-slate-50 text-slate-600 border-slate-100';
}

// 3D Wallet Item Component
function WalletItem({ 
  wallet, 
  isSelected, 
  onClick, 
  onDelete 
}: { 
  wallet: { id: string; name: string; address: string; network: Network };
  isSelected: boolean;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const itemRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!itemRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 18;
    const rotateY = (centerX - x) / 18;
    setTransform(`perspective(500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(12px) translateX(4px)`);
  };

  const handleMouseLeave = () => {
    setTransform('perspective(500px) rotateX(0deg) rotateY(0deg) translateZ(0) translateX(0)');
  };

  return (
    <div
      ref={itemRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`
        wallet-item-3d group flex items-center gap-3 p-3 rounded-xl cursor-pointer
        transition-all duration-200
        ${isSelected 
          ? 'bg-pink-50 border border-pink-200' 
          : 'hover:bg-slate-50 border border-transparent hover:border-pink-100'
        }
      `}
      style={{ 
        transform: transform || 'translateZ(0)',
        transition: 'transform 0.15s ease-out, background-color 0.2s, border-color 0.2s'
      }}
    >
      {/* Wallet Icon */}
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-100 to-pink-50 flex items-center justify-center flex-shrink-0" style={{ transform: 'translateZ(8px)' }}>
        <WalletIcon size={18} className="text-pink-500" />
      </div>

      {/* Wallet Info */}
      <div className="flex-1 min-w-0" style={{ transform: 'translateZ(4px)' }}>
        <p className="font-medium text-slate-700 text-sm truncate">{wallet.name}</p>
        <p className="font-mono text-xs text-slate-400 truncate">
          {truncateAddress(wallet.address)}
        </p>
      </div>

      {/* Network Badge */}
      <span className={`claw-badge text-xs border ${getNetworkColor(wallet.network)}`} style={{ transform: 'translateZ(6px)' }}>
        {wallet.network.split(' ')[0]}
      </span>

      {/* Delete Button */}
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-500 transition-all"
        style={{ transform: 'translateZ(10px)' }}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export function WalletsCard() {
  const { 
    wallets, 
    selectedWallet, 
    selectWallet, 
    addWallet, 
    deleteWallet,
    addToast 
  } = useStore();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [walletToDelete, setWalletToDelete] = useState<string | null>(null);
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletNetwork, setNewWalletNetwork] = useState<Network>('Base Sepolia');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateWallet = async () => {
    if (!newWalletName.trim()) {
      addToast('error', 'Please enter a wallet name');
      return;
    }

    setIsCreating(true);
    
    // Simulate wallet creation
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    // Generate random address
    const address = '0x' + Array.from({ length: 40 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    addWallet({
      name: newWalletName,
      address,
      network: newWalletNetwork,
      balance: '0.000',
    });

    setNewWalletName('');
    setNewWalletNetwork('Base Sepolia');
    setIsCreating(false);
    setShowCreateModal(false);
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    addToast('success', 'Address copied to clipboard!');
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWalletToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (walletToDelete) {
      deleteWallet(walletToDelete);
      setWalletToDelete(null);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <div className="claw-card-3d h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-100 to-pink-50 flex items-center justify-center">
              <WalletIcon size={18} className="text-pink-500" />
            </div>
            <h3 className="font-bold text-lg text-slate-800">Wallets</h3>
            <span className="claw-badge claw-badge-pink">{wallets.length}</span>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="claw-btn-3d text-sm py-2 px-3"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New Wallet</span>
          </button>
        </div>

        {/* Wallet List */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 perspective-container">
          {wallets.length === 0 ? (
            <div className="text-center py-8">
              <img 
                src="/mascot/lobster-confused.png" 
                alt="No wallets" 
                className="w-20 h-20 mx-auto mb-3 opacity-60 float-3d-slow"
              />
              <p className="text-slate-400 text-sm">No wallets yet</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="claw-btn-3d mt-3 text-sm"
              >
                Create your first wallet
              </button>
            </div>
          ) : (
            wallets.map((wallet) => (
              <WalletItem
                key={wallet.id}
                wallet={wallet}
                isSelected={selectedWallet?.id === wallet.id}
                onClick={() => selectWallet(wallet)}
                onDelete={(e) => handleDeleteClick(wallet.id, e)}
              />
            ))
          )}
        </div>
      </div>

      {/* Wallet Detail Panel */}
      {selectedWallet && (
        <div className="claw-card-3d mt-4 hover-rotate-3d">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="font-bold text-lg text-slate-800">{selectedWallet.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className={`claw-badge text-xs border ${getNetworkColor(selectedWallet.network)}`}>
                  {selectedWallet.network}
                </span>
              </div>
            </div>
            <button
              onClick={() => selectWallet(null)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors hover-lift-3d"
            >
              <X size={18} />
            </button>
          </div>

          {/* Address */}
          <div className="bg-slate-50 rounded-xl p-3 mb-4 border border-slate-100" style={{ transform: 'translateZ(8px)' }}>
            <p className="text-xs text-slate-400 mb-1 font-medium">Address</p>
            <div className="flex items-center gap-2">
              <code className="font-mono text-sm text-slate-700 flex-1 break-all">
                {selectedWallet.address}
              </code>
              <button
                onClick={() => handleCopyAddress(selectedWallet.address)}
                className="p-2 rounded-lg hover:bg-pink-100 text-slate-400 hover:text-pink-500 transition-colors flex-shrink-0 hover-lift-3d"
              >
                <Copy size={16} />
              </button>
            </div>
          </div>

          {/* Balance */}
          <div className="mb-4" style={{ transform: 'translateZ(4px)' }}>
            <p className="text-xs text-slate-400 mb-1 font-medium">Balance</p>
            <p className="font-bold text-2xl text-slate-800">
              {selectedWallet.balance} <span className="text-lg text-slate-400 font-medium">ETH</span>
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button className="claw-btn-3d flex-1 text-sm py-2">
              <Send size={16} />
              <span>Send</span>
            </button>
            <button className="claw-btn-outline flex-1 text-sm py-2 hover-lift-3d">
              <Download size={16} />
              <span>Receive</span>
            </button>
            <button 
              className="claw-btn-outline px-3 py-2 hover-lift-3d"
              onClick={() => {
                const explorerUrl = `https://sepolia.basescan.org/address/${selectedWallet.address}`;
                window.open(explorerUrl, '_blank');
              }}
            >
              <ExternalLink size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Create Wallet Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="claw-card border-pink-200 max-w-md modal-3d">
          <DialogHeader>
            <DialogTitle className="font-bold text-xl text-slate-800 flex items-center gap-2">
              <Plus size={20} className="text-pink-500" />
              Create New Wallet
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm text-slate-500 mb-2 font-medium">
                Wallet Name
              </label>
              <input
                type="text"
                value={newWalletName}
                onChange={(e) => setNewWalletName(e.target.value)}
                placeholder="e.g., My Main Wallet"
                className="claw-input w-full"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateWallet()}
              />
            </div>

            <div>
              <label className="block text-sm text-slate-500 mb-2 font-medium">
                Network
              </label>
              <select
                value={newWalletNetwork}
                onChange={(e) => setNewWalletNetwork(e.target.value as Network)}
                className="claw-input w-full appearance-none cursor-pointer"
              >
                {NETWORKS.map((network) => (
                  <option key={network} value={network}>
                    {network}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="claw-btn-outline flex-1 hover-lift-3d"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateWallet}
                disabled={isCreating}
                className="claw-btn-3d flex-1 disabled:opacity-50"
              >
                {isCreating ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  <>
                    <Plus size={18} />
                    <span>Create</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="claw-card border-rose-200 max-w-md modal-3d">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold text-xl text-slate-800">
              Delete Wallet?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              This action cannot be undone. Make sure you have backed up your private keys.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="claw-btn-outline hover-lift-3d">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="claw-btn-3d !bg-rose-500 hover:!bg-rose-600"
            >
              <Trash2 size={16} />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
