'use client';

import { motion } from 'framer-motion';

interface PaymentToggleProps {
  mode: 'one-time' | 'subscription';
  onChange: (mode: 'one-time' | 'subscription') => void;
}

export function PaymentToggle({ mode, onChange }: PaymentToggleProps) {
  return (
    <div className="inline-flex p-1 bg-ultraviolet/50 rounded-xl border border-lavender/20">
      <button
        onClick={() => onChange('one-time')}
        className={`relative px-6 py-3 rounded-lg font-medium transition-colors ${
          mode === 'one-time' ? 'text-void' : 'text-gray-400 hover:text-white'
        }`}
      >
        {mode === 'one-time' && (
          <motion.div
            layoutId="payment-toggle"
            className="absolute inset-0 bg-gradient-to-r from-data-cyan to-holographic rounded-lg"
            transition={{ type: 'spring', duration: 0.3 }}
          />
        )}
        <span className="relative z-10">One-Time</span>
      </button>
      <button
        onClick={() => onChange('subscription')}
        className={`relative px-6 py-3 rounded-lg font-medium transition-colors ${
          mode === 'subscription' ? 'text-void' : 'text-gray-400 hover:text-white'
        }`}
      >
        {mode === 'subscription' && (
          <motion.div
            layoutId="payment-toggle"
            className="absolute inset-0 bg-gradient-to-r from-data-cyan to-data-magenta rounded-lg"
            transition={{ type: 'spring', duration: 0.3 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-2">
          Subscription
          <span className="text-xs bg-data-gold/20 text-data-gold px-2 py-0.5 rounded-full">
            +BONUS
          </span>
        </span>
      </button>
    </div>
  );
}
