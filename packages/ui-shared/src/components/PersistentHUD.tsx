'use client';

import { WalletDropdown } from './WalletDropdown';
import { QorIdHeader } from './QorIdHeader';

export function PersistentHUD() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel p-4 border-b border-demiurge-cyan/20">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <a href="/" className="text-2xl font-bold bg-gradient-to-r from-demiurge-cyan to-demiurge-violet bg-clip-text text-transparent">
            DEMIURGE
          </a>
        </div>
        <div className="flex gap-6 items-center">
          <QorIdHeader />
          <WalletDropdown />
          <a
            href="/social"
            className="text-demiurge-cyan hover:text-demiurge-violet transition-colors"
          >
            Social
          </a>
        </div>
      </div>
    </nav>
  );
}
