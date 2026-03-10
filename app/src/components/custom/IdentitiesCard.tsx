import { useState, useRef } from 'react';
import { Plus, UserCircle, Check, Trash2, Star, Globe, AtSign, Link } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { type IdentityType } from '@/types';

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getTypeIcon(type: IdentityType) {
  switch (type) {
    case 'ENS':
      return <Globe size={16} />;
    case 'Social':
      return <AtSign size={16} />;
    case 'DNS':
      return <Link size={16} />;
    default:
      return <Star size={16} />;
  }
}

function getTypeColor(type: IdentityType): string {
  const colors: Record<IdentityType, string> = {
    'ENS': 'bg-purple-50 text-purple-600 border-purple-100',
    'Social': 'bg-blue-50 text-blue-600 border-blue-100',
    'DNS': 'bg-teal-50 text-teal-600 border-teal-100',
    'Custom': 'bg-rose-50 text-rose-600 border-rose-100',
  };
  return colors[type];
}

// 3D Identity Item Component
function IdentityItem({ 
  identity, 
  onDelete 
}: { 
  identity: { id: string; name: string; type: IdentityType; walletAddress: string; status: string };
  onDelete: () => void;
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
    const rotateX = (y - centerY) / 22;
    const rotateY = (centerX - x) / 22;
    setTransform(`perspective(500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(15px)`);
  };

  const handleMouseLeave = () => {
    setTransform('perspective(500px) rotateX(0deg) rotateY(0deg) translateZ(0)');
  };

  return (
    <div
      ref={itemRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="identity-card-3d group flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-rose-100 transition-all duration-200"
      style={{ 
        transform: transform || 'translateZ(0)',
        transition: 'transform 0.15s ease-out, background-color 0.2s, border-color 0.2s'
      }}
    >
      {/* Avatar */}
      <div className={`identity-avatar w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border ${getTypeColor(identity.type)}`}>
        {getTypeIcon(identity.type)}
      </div>

      {/* Identity Info */}
      <div className="flex-1 min-w-0" style={{ transform: 'translateZ(4px)' }}>
        <div className="flex items-center gap-2">
          <p className="font-medium text-slate-700 text-sm truncate">{identity.name}</p>
          {identity.status === 'verified' && (
            <Check size={14} className="text-green-500 flex-shrink-0" />
          )}
        </div>
        <p className="font-mono text-xs text-slate-400 truncate">
          {truncateAddress(identity.walletAddress)}
        </p>
      </div>

      {/* Type Badge */}
      <span className={`claw-badge text-xs border ${getTypeColor(identity.type)}`} style={{ transform: 'translateZ(6px)' }}>
        {identity.type}
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

export function IdentitiesCard() {
  const { identities, wallets, addIdentity, deleteIdentity, addToast } = useStore();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newIdentityName, setNewIdentityName] = useState('');
  const [newIdentityType, setNewIdentityType] = useState<IdentityType>('ENS');
  const [selectedWalletAddress, setSelectedWalletAddress] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateIdentity = async () => {
    if (!newIdentityName.trim()) {
      addToast('error', 'Please enter an identity name');
      return;
    }
    if (!selectedWalletAddress) {
      addToast('error', 'Please select a wallet');
      return;
    }

    setIsCreating(true);
    
    // Simulate identity creation
    await new Promise((resolve) => setTimeout(resolve, 600));
    
    addIdentity({
      name: newIdentityName,
      type: newIdentityType,
      walletAddress: selectedWalletAddress,
      status: 'verified',
    });

    setNewIdentityName('');
    setNewIdentityType('ENS');
    setSelectedWalletAddress('');
    setIsCreating(false);
    setShowCreateModal(false);
  };

  return (
    <>
      <div className="claw-card-3d h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-100 to-rose-50 flex items-center justify-center">
              <UserCircle size={18} className="text-rose-500" />
            </div>
            <h3 className="font-bold text-lg text-slate-800">Identities</h3>
            <span className="claw-badge claw-badge-rose">{identities.length}</span>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={wallets.length === 0}
            className="claw-btn-3d text-sm py-2 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New Identity</span>
          </button>
        </div>

        {/* Info text when no wallets */}
        {wallets.length === 0 && (
          <p className="text-xs text-slate-400 mb-4 bg-slate-50 rounded-lg p-3 border border-slate-100">
            Create a wallet first to link identities
          </p>
        )}

        {/* Identity List */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 perspective-container">
          {identities.length === 0 ? (
            <div className="text-center py-8">
              <img 
                src="/mascot/lobster-confused.png" 
                alt="No identities" 
                className="w-20 h-20 mx-auto mb-3 opacity-60 float-3d-slow"
              />
              <p className="text-slate-400 text-sm">No identities yet</p>
              {wallets.length > 0 && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="claw-btn-3d mt-3 text-sm"
                >
                  Add your first identity
                </button>
              )}
            </div>
          ) : (
            identities.map((identity) => (
              <IdentityItem
                key={identity.id}
                identity={identity}
                onDelete={() => deleteIdentity(identity.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Create Identity Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="claw-card border-rose-200 max-w-md modal-3d">
          <DialogHeader>
            <DialogTitle className="font-bold text-xl text-slate-800 flex items-center gap-2">
              <Plus size={20} className="text-rose-500" />
              Add New Identity
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm text-slate-500 mb-2 font-medium">
                Identity Name
              </label>
              <input
                type="text"
                value={newIdentityName}
                onChange={(e) => setNewIdentityName(e.target.value)}
                placeholder="e.g., alex.eth"
                className="claw-input w-full"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-500 mb-2 font-medium">
                Type
              </label>
              <select
                value={newIdentityType}
                onChange={(e) => setNewIdentityType(e.target.value as IdentityType)}
                className="claw-input w-full appearance-none cursor-pointer"
              >
                <option value="ENS">ENS</option>
                <option value="Social">Social</option>
                <option value="DNS">DNS</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-500 mb-2 font-medium">
                Link to Wallet
              </label>
              <select
                value={selectedWalletAddress}
                onChange={(e) => setSelectedWalletAddress(e.target.value)}
                className="claw-input w-full appearance-none cursor-pointer"
              >
                <option value="">Select a wallet...</option>
                {wallets.map((wallet) => (
                  <option key={wallet.id} value={wallet.address}>
                    {wallet.name} ({truncateAddress(wallet.address)})
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
                onClick={handleCreateIdentity}
                disabled={isCreating}
                className="claw-btn-3d flex-1 disabled:opacity-50"
              >
                {isCreating ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Adding...
                  </span>
                ) : (
                  <>
                    <Plus size={18} />
                    <span>Add</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
