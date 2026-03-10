import { useState } from 'react';
import { 
  LayoutDashboard, 
  Wallet, 
  UserCircle, 
  History, 
  Menu,
  X,
  Settings,
  LogOut
} from 'lucide-react';
import { useStore } from '@/store/useStore';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'wallets', label: 'Wallets', icon: Wallet },
  { id: 'identities', label: 'Identities', icon: UserCircle },
  { id: 'activity', label: 'Activity', icon: History },
];

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { isConnected } = useStore();

  const handleNavClick = (id: string) => {
    onSectionChange(id);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden w-10 h-10 rounded-xl bg-white border border-pink-200 flex items-center justify-center text-slate-600 shadow-soft hover-lift-3d"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed left-0 top-0 h-screen w-[260px] claw-sidebar z-50
          transform transition-transform duration-300 ease-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{ perspective: '1000px' }}
      >
        <div className="flex flex-col h-full p-5">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10 logo-3d">
            <div className="logo-3d-inner w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center shadow-pink">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <div>
              <h1 className="font-bold text-xl text-slate-800 leading-tight">CLAW</h1>
              <p className="text-xs text-slate-400 font-medium">Wallet</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1" style={{ transformStyle: 'preserve-3d' }}>
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`nav-item-3d w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer ${isActive ? 'active' : ''}`}
                  style={{ 
                    transform: isActive ? 'translateX(6px) translateZ(12px)' : 'translateZ(0)',
                    animationDelay: `${index * 0.1}s`
                  }}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Connection Status */}
          <div className="mb-4 float-3d-fast">
            <div className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
              ${isConnected 
                ? 'bg-green-50 text-green-600 border border-green-100' 
                : 'bg-slate-50 text-slate-400 border border-slate-100'
              }
            `}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="space-y-1 border-t border-pink-100 pt-4">
            <button className="nav-item-3d w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-slate-500 hover:text-pink-600">
              <Settings size={20} />
              <span className="font-medium">Settings</span>
            </button>
            <button className="nav-item-3d w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-rose-500 hover:text-rose-600">
              <LogOut size={20} />
              <span className="font-medium">Disconnect</span>
            </button>
          </div>

          {/* Mascot */}
          <div className="mt-6 flex justify-center" style={{ perspective: '500px' }}>
            <div className="relative mascot-3d">
              <img 
                src="/mascot/lobster-happy.png" 
                alt="CLAW Mascot" 
                className="w-24 h-24 object-contain drop-shadow-lg"
              />
              {/* 3D Sparkles */}
              <div className="absolute -top-1 -right-1 text-pink-400 sparkle-3d">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z"/>
                </svg>
              </div>
              <div className="absolute top-3 -left-2 text-rose-400 sparkle-3d" style={{ animationDelay: '1s', animationDirection: 'reverse' }}>
                <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
