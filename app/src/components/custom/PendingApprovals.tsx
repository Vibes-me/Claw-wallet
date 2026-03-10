import { useRef, useState } from 'react';
import { Check, X, AlertCircle, Clock } from 'lucide-react';
import { useStore } from '@/store/useStore';
import type { Network } from '@/types';

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

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  
  const minutes = Math.floor(diff / 1000 / 60);
  const hours = Math.floor(minutes / 60);
  
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return new Date(date).toLocaleDateString();
}

// 3D Approval Item Component
function ApprovalItem({ 
  approval, 
  onApprove, 
  onReject,
  index
}: { 
  approval: { 
    id: string; 
    value: string; 
    valueUSD: string; 
    recipient: string; 
    network: Network; 
    priority: 'high' | 'normal';
    createdAt: Date;
  };
  onApprove: () => void;
  onReject: () => void;
  index: number;
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
    setTransform(`perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(15px)`);
  };

  const handleMouseLeave = () => {
    setTransform('perspective(600px) rotateX(0deg) rotateY(0deg) translateZ(0)');
  };

  return (
    <div
      ref={itemRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="approval-3d flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-slate-50 border border-pink-100 hover:border-pink-200 transition-all duration-300"
      style={{ 
        animationDelay: `${index * 0.1}s`,
        transform: transform || 'translateZ(0)',
        transition: 'transform 0.15s ease-out, border-color 0.3s, box-shadow 0.3s',
        boxShadow: approval.priority === 'high' 
          ? '0 4px 15px rgba(236, 72, 153, 0.1)' 
          : '0 4px 10px rgba(0, 0, 0, 0.02)'
      }}
    >
      {/* Priority & Value */}
      <div className="flex items-center gap-3">
        {/* Priority Indicator */}
        <div 
          className={`
            w-3 h-3 rounded-full flex-shrink-0
            ${approval.priority === 'high' ? 'bg-pink-500 animate-pulse' : 'bg-pink-300'}
          `}
          style={{ transform: 'translateZ(12px)' }}
        />
        
        {/* Value */}
        <div style={{ transform: 'translateZ(8px)' }}>
          <p className="font-bold text-lg text-slate-800">
            {approval.value} ETH
          </p>
          <p className="text-xs text-slate-400">{approval.valueUSD}</p>
        </div>
      </div>

      {/* Recipient & Network */}
      <div className="flex-1 sm:text-center" style={{ transform: 'translateZ(4px)' }}>
        <p className="font-mono text-sm text-slate-700">
          → {truncateAddress(approval.recipient)}
        </p>
        <div className="flex items-center gap-2 sm:justify-center mt-1">
          <span className={`claw-badge text-xs border ${getNetworkColor(approval.network)}`}>
            {approval.network}
          </span>
          <span className="text-xs text-slate-400">{formatTimeAgo(approval.createdAt)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2" style={{ transform: 'translateZ(12px)' }}>
        <button
          onClick={onApprove}
          className="claw-btn-3d flex items-center gap-1.5 px-4 py-2 text-sm"
          style={{ 
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            boxShadow: '0 4px 0 #15803d, 0 6px 15px rgba(34, 197, 94, 0.35)'
          }}
        >
          <Check size={16} />
          <span>Approve</span>
        </button>
        <button
          onClick={onReject}
          className="claw-btn-3d flex items-center gap-1.5 px-4 py-2 text-sm"
          style={{ 
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            boxShadow: '0 4px 0 #b91c1c, 0 6px 15px rgba(239, 68, 68, 0.35)'
          }}
        >
          <X size={16} />
          <span>Reject</span>
        </button>
      </div>
    </div>
  );
}

export function PendingApprovals() {
  const { pendingApprovals, approveTransaction, rejectTransaction } = useStore();

  if (pendingApprovals.length === 0) {
    return null;
  }

  return (
    <div className="claw-card-3d border-pink-200 glow-3d">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5" style={{ transform: 'translateZ(8px)' }}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-100 to-pink-50 flex items-center justify-center">
          <Clock size={18} className="text-pink-500" />
        </div>
        <h3 className="font-bold text-lg text-slate-800">Pending Approvals</h3>
        <span className="claw-badge claw-badge-pink">{pendingApprovals.length}</span>
      </div>

      {/* Approval List */}
      <div className="space-y-3 perspective-container">
        {pendingApprovals.map((approval, index) => (
          <ApprovalItem
            key={approval.id}
            approval={approval}
            onApprove={() => approveTransaction(approval.id)}
            onReject={() => rejectTransaction(approval.id)}
            index={index}
          />
        ))}
      </div>

      {/* Warning */}
      <div 
        className="flex items-center gap-2 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-100"
        style={{ transform: 'translateZ(4px)' }}
      >
        <AlertCircle size={16} className="text-rose-500 flex-shrink-0" />
        <p className="text-xs text-slate-500">
          Please review carefully before approving. Transactions cannot be reversed.
        </p>
      </div>
    </div>
  );
}
