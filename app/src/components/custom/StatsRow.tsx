import { Wallet, UserCircle, Link2, Clock } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useRef, useState } from 'react';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: 'pink' | 'rose' | 'purple' | 'slate';
  delay: number;
}

function StatCard({ icon: Icon, label, value, color, delay }: StatCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');

  const colorClasses = {
    pink: 'bg-gradient-to-br from-pink-100 to-pink-50 text-pink-600',
    rose: 'bg-gradient-to-br from-rose-100 to-rose-50 text-rose-600',
    purple: 'bg-gradient-to-br from-purple-100 to-purple-50 text-purple-600',
    slate: 'bg-gradient-to-br from-slate-100 to-slate-50 text-slate-600',
  };

  // 3D tilt effect on mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 12;
    const rotateY = (centerX - x) / 12;
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(15px)`);
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)');
  };

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`claw-card-3d stat-card-3d card-entrance stagger-${delay} cursor-pointer`}
      style={{ 
        animationDelay: `${delay * 0.05}s`,
        transform: transform || 'translateZ(0)',
        transition: 'transform 0.15s ease-out, box-shadow 0.3s ease'
      }}
    >
      <div className={`stat-icon w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
        <Icon size={22} strokeWidth={2} />
      </div>
      <div>
        <p className="stat-label text-slate-400 text-sm mb-0.5 font-medium">{label}</p>
        <p className="stat-value font-bold text-2xl text-slate-800">{value}</p>
      </div>
    </div>
  );
}

export function StatsRow() {
  const { wallets, identities, pendingApprovals } = useStore();

  // Get unique chains count
  const uniqueChains = new Set(wallets.map((w) => w.network)).size;

  const stats = [
    { 
      icon: Wallet, 
      label: 'Wallets', 
      value: wallets.length,
      color: 'pink' as const,
    },
    { 
      icon: UserCircle, 
      label: 'Identities', 
      value: identities.length,
      color: 'rose' as const,
    },
    { 
      icon: Link2, 
      label: 'Chains', 
      value: uniqueChains,
      color: 'purple' as const,
    },
    { 
      icon: Clock, 
      label: 'Pending', 
      value: pendingApprovals.length,
      color: 'slate' as const,
    },
  ];

  return (
    <section className="perspective-container grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => (
        <StatCard
          key={stat.label}
          {...stat}
          delay={index + 1}
        />
      ))}
    </section>
  );
}
