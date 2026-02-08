'use client';

import { useState } from 'react';
import { SophiaChatPanel } from './SophiaChatPanel';

export function SophiaChatButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Sophia Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`
          fixed bottom-6 right-6 z-40
          w-14 h-14 rounded-full
          bg-gradient-to-br from-[#FFD700] to-[#FFA500]
          shadow-lg hover:shadow-xl
          flex items-center justify-center
          transition-all duration-300 hover:scale-105
          ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        `}
        style={{
          boxShadow: '0 0 30px rgba(255, 215, 0, 0.3)',
        }}
        title="Ask Sophia"
      >
        <span className="text-2xl">✧</span>
      </button>

      {/* Chat Panel */}
      <SophiaChatPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
