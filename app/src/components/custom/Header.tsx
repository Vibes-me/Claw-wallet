import { useState } from 'react';
import { Search, Key, Power, Sparkles } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function Header() {
  const { isConnected, setConnected, setApiKey, addToast } = useStore();
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (!inputKey.trim()) {
      addToast('error', 'Please enter an API key');
      return;
    }

    setIsConnecting(true);
    
    // Simulate API connection
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setApiKey(inputKey);
    setConnected(true);
    setIsConnecting(false);
    setShowConnectModal(false);
    addToast('success', 'Successfully connected to CLAW!');
  };

  const handleDisconnect = () => {
    setConnected(false);
    setApiKey('');
    addToast('error', 'Disconnected from service');
  };

  return (
    <>
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-bold text-2xl sm:text-3xl text-slate-800 mb-1">
            Dashboard
          </h2>
          <p className="text-slate-400 text-sm">
            Manage wallets, identities, and approvals
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search..."
              className="claw-input pl-10 pr-4 py-2.5 w-48 lg:w-64 hover-lift-3d"
            />
          </div>

          {/* Connect Button */}
          {isConnected ? (
            <button
              onClick={handleDisconnect}
              className="claw-btn-outline hover-lift-3d"
            >
              <Power size={18} />
              <span>Disconnect</span>
            </button>
          ) : (
            <button
              onClick={() => setShowConnectModal(true)}
              className="claw-btn-3d"
            >
              <Sparkles size={18} />
              <span>Connect</span>
            </button>
          )}
        </div>
      </header>

      {/* Not Connected Warning */}
      {!isConnected && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-center gap-4">
          <img 
            src="/mascot/lobster-sweating.png" 
            alt="Not connected" 
            className="w-12 h-12 object-contain"
          />
          <div>
            <p className="text-slate-700 font-medium">Not Connected</p>
            <p className="text-slate-400 text-sm">
              Connect your API key to access all features
            </p>
          </div>
        </div>
      )}

      {/* Connect Modal */}
      <Dialog open={showConnectModal} onOpenChange={setShowConnectModal}>
        <DialogContent className="claw-card border-pink-200 max-w-md modal-3d">
          <DialogHeader>
            <DialogTitle className="font-bold text-xl text-slate-800 flex items-center gap-2">
              <Key size={20} className="text-pink-500" />
              Connect to CLAW
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm text-slate-500 mb-2 font-medium">
                API Key
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="Enter your API key..."
                  className="claw-input pl-10 pr-4 py-3 w-full"
                  onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowConnectModal(false)}
                className="claw-btn-outline flex-1 hover-lift-3d"
              >
                Cancel
              </button>
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="claw-btn-3d flex-1 disabled:opacity-50"
              >
                {isConnecting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Connecting...
                  </span>
                ) : (
                  <>
                    <Power size={18} />
                    <span>Connect</span>
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
