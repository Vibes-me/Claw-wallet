import { useState, useRef } from 'react';
import { History, ArrowUpRight, ArrowDownLeft, FileCode, Filter } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { TransactionFilter, Network } from '@/types';

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
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

function getTypeIcon(type: string) {
  switch (type) {
    case 'sent':
      return <ArrowUpRight size={16} className="text-rose-500" />;
    case 'received':
      return <ArrowDownLeft size={16} className="text-green-500" />;
    case 'contract':
      return <FileCode size={16} className="text-purple-500" />;
    default:
      return <History size={16} className="text-slate-400" />;
  }
}

function getTypeColor(type: string): string {
  switch (type) {
    case 'sent':
      return 'bg-rose-50 text-rose-600 border-rose-100';
    case 'received':
      return 'bg-green-50 text-green-600 border-green-100';
    case 'contract':
      return 'bg-purple-50 text-purple-600 border-purple-100';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-100';
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

const filters: { value: TransactionFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'sent', label: 'Sent' },
  { value: 'received', label: 'Received' },
  { value: 'contract', label: 'Contract' },
];

// 3D Transaction Row Component
function TransactionRow({ 
  tx, 
  index 
}: { 
  tx: { 
    id: string; 
    hash: string; 
    type: string; 
    value: string; 
    valueUSD: string; 
    from: string; 
    to: string; 
    network: Network; 
    timestamp: Date;
  };
  index: number;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rowRef.current) return;
    const rect = rowRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 28;
    const rotateY = (centerX - x) / 28;
    setTransform(`perspective(500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(8px) translateX(3px)`);
  };

  const handleMouseLeave = () => {
    setTransform('perspective(500px) rotateX(0deg) rotateY(0deg) translateZ(0) translateX(0)');
  };

  return (
    <div
      ref={rowRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="tx-row-3d group flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-pink-100 transition-all duration-200"
      style={{ 
        animationDelay: `${index * 0.05}s`,
        transform: transform || 'translateZ(0)',
        transition: 'transform 0.15s ease-out, background-color 0.2s, border-color 0.2s'
      }}
    >
      {/* Type Icon */}
      <div className={`tx-icon w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border ${getTypeColor(tx.type)}`}>
        {getTypeIcon(tx.type)}
      </div>

      {/* Transaction Info */}
      <div className="flex-1 min-w-0" style={{ transform: 'translateZ(4px)' }}>
        <div className="flex items-center gap-2">
          <code className="font-mono text-sm text-slate-700">
            {truncateAddress(tx.hash)}
          </code>
          <span className={`claw-badge text-xs border ${getNetworkColor(tx.network)}`}>
            {tx.network.split(' ')[0]}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          {truncateAddress(tx.from)} → {truncateAddress(tx.to)}
        </p>
      </div>

      {/* Value & Time */}
      <div className="text-right" style={{ transform: 'translateZ(2px)' }}>
        <p className={`font-mono text-sm font-medium ${
          tx.type === 'sent' ? 'text-rose-500' : 
          tx.type === 'received' ? 'text-green-500' : 'text-slate-700'
        }`}>
          {tx.type === 'sent' ? '-' : tx.type === 'received' ? '+' : ''}
          {tx.value} ETH
        </p>
        <p className="text-xs text-slate-400">{formatTimeAgo(tx.timestamp)}</p>
      </div>
    </div>
  );
}

export function ActivityCard() {
  const { transactions, filterTransactions } = useStore();
  const [activeFilter, setActiveFilter] = useState<TransactionFilter>('all');

  const filteredTransactions = filterTransactions(activeFilter);

  return (
    <div className="claw-card-3d">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
            <History size={18} className="text-purple-500" />
          </div>
          <h3 className="font-bold text-lg text-slate-800">Recent Activity</h3>
          <span className="claw-badge claw-badge-purple">{transactions.length}</span>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1 border border-slate-100" style={{ transform: 'translateZ(4px)' }}>
          <Filter size={14} className="text-slate-400 ml-2 mr-1" />
          {filters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`
                filter-tab-3d px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                ${activeFilter === filter.value
                  ? 'active bg-pink-500 text-white'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white'
                }
              `}
              style={{
                transform: activeFilter === filter.value ? 'translateZ(8px)' : 'translateZ(0)',
                boxShadow: activeFilter === filter.value ? '0 4px 12px rgba(236, 72, 153, 0.3)' : 'none'
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 perspective-container">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8">
            <img 
              src="/mascot/lobster-confused.png" 
              alt="No transactions" 
              className="w-20 h-20 mx-auto mb-3 opacity-60 float-3d-slow"
            />
            <p className="text-slate-400 text-sm">No transactions yet</p>
          </div>
        ) : (
          filteredTransactions.map((tx, index) => (
            <TransactionRow
              key={tx.id}
              tx={tx}
              index={index}
            />
          ))
        )}
      </div>
    </div>
  );
}
