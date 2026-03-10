import { ExternalLink, Heart } from 'lucide-react';

const footerLinks = [
  { label: 'Docs', href: '#' },
  { label: 'Support', href: '#' },
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
];

export function Footer() {
  return (
    <footer className="mt-12 py-8 border-t border-pink-100">
      <div className="flex flex-col items-center text-center">
        {/* Mascot */}
        <div className="relative mb-4" style={{ perspective: '500px' }}>
          <div className="mascot-3d">
            <img 
              src="/mascot/lobster-excited.png" 
              alt="CLAW Mascot" 
              className="w-24 h-24 object-contain drop-shadow-xl"
            />
          </div>
          {/* 3D Sparkles */}
          <div className="absolute -top-2 -right-2 text-pink-400 sparkle-3d">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z"/>
            </svg>
          </div>
          <div className="absolute top-2 -left-3 text-rose-400 sparkle-3d" style={{ animationDelay: '0.5s', animationDirection: 'reverse' }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z"/>
            </svg>
          </div>
          <div className="absolute bottom-0 right-2 text-purple-400 sparkle-3d" style={{ animationDelay: '1.5s' }}>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0L9.5 6.5L16 8L9.5 9.5L8 16L6.5 9.5L0 8L6.5 6.5L8 0Z"/>
            </svg>
          </div>
        </div>

        {/* Tagline */}
        <p className="font-bold text-xl text-slate-800 mb-2" style={{ transform: 'translateZ(10px)' }}>
          Your crypto, your identity
        </p>
        <p className="text-slate-400 text-sm mb-6">
          Cute & secure ✨
        </p>

        {/* Links */}
        <div className="flex items-center gap-6 mb-6">
          {footerLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-slate-400 hover:text-pink-500 transition-colors flex items-center gap-1 hover-lift-3d"
            >
              {link.label}
              <ExternalLink size={12} />
            </a>
          ))}
        </div>

        {/* Copyright */}
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <span>Made with</span>
          <Heart size={12} className="text-pink-500 fill-pink-500 animate-pulse" />
          <span>by CLAW Labs</span>
        </div>
        <p className="text-xs text-slate-300 mt-1">
          © 2026 CLAW Wallet. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
