'use client';

import { WalletDropdown } from './WalletDropdown';
import { QorIdHeader } from './QorIdHeader';

interface PersistentHUDProps {
  walletComponent?: React.ReactNode; // Allow hub app to inject wallet wrapper
  qorIdComponent?: React.ReactNode; // Allow hub app to inject QOR ID header wrapper
}

export function PersistentHUD({ walletComponent, qorIdComponent }: PersistentHUDProps = {}) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel p-4 border-b border-demiurge-cyan/20">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <a href="/" className="text-2xl font-bold bg-gradient-to-r from-demiurge-cyan to-demiurge-violet bg-clip-text text-transparent">
            DEMIURGE
          </a>
        </div>
        <div className="flex gap-6 items-center">
          {/* Center: QOR ID Avatar */}
          <div className="absolute left-1/2 -translate-x-1/2">
            {qorIdComponent}
          </div>
          
          {/* Right: Wallet and Social */}
          <div className="flex gap-6 items-center ml-auto">
            {walletComponent || <WalletDropdown />}
            <a
              href="/wallet"
              className="text-demiurge-cyan hover:text-demiurge-violet transition-colors"
            >
              Wallet
            </a>
            <a
              href="/social"
              className="text-demiurge-cyan hover:text-demiurge-violet transition-colors"
            >
              Social
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
