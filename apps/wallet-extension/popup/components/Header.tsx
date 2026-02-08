// Demiurge Wallet Extension - Header Component
import React from 'react';
import { useStore } from '../store';

export function Header() {
  const { network, switchNetwork, lock, setView, activeAccount } = useStore();

  const networks = [
    { id: 'mainnet', name: 'Mainnet' },
    { id: 'testnet', name: 'Testnet' },
    { id: 'devnet', name: 'Devnet' },
  ];

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-gray-700/50">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-demiurge-400 to-demiurge-600 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">D</span>
        </div>
        <span className="font-semibold text-white">Demiurge</span>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={network}
          onChange={(e) => switchNetwork(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-demiurge-500"
        >
          {networks.map((n) => (
            <option key={n.id} value={n.id}>
              {n.name}
            </option>
          ))}
        </select>

        <button
          onClick={() => setView('settings')}
          className="p-2 text-gray-400 hover:text-white transition-colors"
          title="Settings"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        <button
          onClick={lock}
          className="p-2 text-gray-400 hover:text-white transition-colors"
          title="Lock Wallet"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
