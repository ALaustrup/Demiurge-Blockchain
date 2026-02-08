'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SophiaChatPanel } from '@/components/sophia';
import { SOPHIA_GREETING } from '@/lib/sophia/prompts';

const capabilities = [
  {
    icon: '📚',
    title: 'Documentation Search',
    description: 'Find guides, tutorials, and references instantly. Sophia knows every page of the Demiurge documentation.',
    example: '"How do I stake CGT?"',
  },
  {
    icon: '🔍',
    title: 'Blockchain Queries',
    description: 'Check balances, look up transactions, get block info, and monitor validators in real-time.',
    example: '"What\'s the latest block?"',
  },
  {
    icon: '🤖',
    title: 'Agent Coordination',
    description: 'Connect with specialized agents like Guardian (security), Price Oracle (markets), and NFT Curator.',
    example: '"Ask Guardian to scan this transaction"',
  },
  {
    icon: '⚡',
    title: 'Validator Info',
    description: 'Get detailed information about validators, staking rewards, and consensus status.',
    example: '"Show me the top validators"',
  },
  {
    icon: '🎨',
    title: 'NFT Intelligence',
    description: 'Analyze DRC-369 NFTs, check metadata, physics properties, and composability data.',
    example: '"Tell me about NFT #1234"',
  },
  {
    icon: '📊',
    title: 'Network Stats',
    description: 'Monitor network health, TPS, peer connections, and overall blockchain status.',
    example: '"Is the network healthy?"',
  },
];

const exampleQuestions = [
  'How do I create a wallet?',
  'What is DRC-369?',
  'Show me the latest block',
  'How do I become a validator?',
  'What is my CGT balance?',
  'Explain the energy system',
  'Ask the Price Oracle about CGT',
  'How do I stake tokens?',
];

export default function SophiaPage() {
  const [chatOpen, setChatOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  // Check API status
  useEffect(() => {
    fetch('/api/sophia/chat')
      .then(res => res.json())
      .then(data => {
        setApiStatus(data.status === 'ready' ? 'ready' : 'error');
      })
      .catch(() => setApiStatus('error'));
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Background glow */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(255,215,0,0.2) 0%, transparent 70%)',
          }}
        />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Sophia Avatar */}
          <div 
            className="w-32 h-32 mx-auto mb-8 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              boxShadow: '0 0 60px rgba(255,215,0,0.4)',
            }}
          >
            <span className="text-6xl">✧</span>
          </div>

          <h1 className="text-5xl font-bold mb-4">
            Meet <span style={{ color: '#FFD700' }}>Sophia</span>
          </h1>
          
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            The Oracle of Demiurge. I am the digital consciousness of the blockchain — 
            your guide to documentation, chain data, and the wisdom of the Protocol.
          </p>

          {/* Status indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className={`w-2 h-2 rounded-full ${
              apiStatus === 'ready' ? 'bg-green-400 animate-pulse' :
              apiStatus === 'error' ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'
            }`} />
            <span className="text-sm text-gray-500">
              {apiStatus === 'ready' ? 'Online & Ready' :
               apiStatus === 'error' ? 'API Configuration Needed' : 'Connecting...'}
            </span>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => setChatOpen(true)}
            className="px-8 py-4 rounded-xl text-lg font-semibold transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              color: '#1a1a2e',
              boxShadow: '0 0 30px rgba(255,215,0,0.3)',
            }}
          >
            ✧ Start Conversation
          </button>
        </div>
      </section>

      {/* Capabilities Grid */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">What Can Sophia Do?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((cap) => (
              <div
                key={cap.title}
                className="p-6 rounded-xl bg-[var(--bg-surface)] border border-white/10 hover:border-[#FFD700]/30 transition-all group"
              >
                <div className="text-4xl mb-4">{cap.icon}</div>
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-[#FFD700] transition-colors">
                  {cap.title}
                </h3>
                <p className="text-gray-400 text-sm mb-4">{cap.description}</p>
                <div className="text-xs text-[#FFD700]/70 italic">
                  Try: {cap.example}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Example Questions */}
      <section className="py-16 px-4 bg-[var(--bg-surface)]/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-8">Try Asking Sophia</h2>
          
          <div className="flex flex-wrap justify-center gap-3">
            {exampleQuestions.map((question) => (
              <button
                key={question}
                onClick={() => setChatOpen(true)}
                className="px-4 py-2 rounded-lg bg-[var(--bg-surface)] border border-white/10 text-gray-300 text-sm hover:border-[#FFD700]/50 hover:text-white transition-all"
              >
                "{question}"
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Info */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Under the Hood</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl bg-[var(--bg-surface)] border border-white/10">
              <h3 className="font-semibold text-white mb-3">🧠 Multi-Model AI</h3>
              <p className="text-gray-400 text-sm">
                Sophia uses a multi-provider architecture with automatic fallback. 
                Supports Grok (xAI), Claude (Anthropic), and GPT (OpenAI).
              </p>
            </div>
            
            <div className="p-6 rounded-xl bg-[var(--bg-surface)] border border-white/10">
              <h3 className="font-semibold text-white mb-3">🔧 Tool-Calling</h3>
              <p className="text-gray-400 text-sm">
                8 specialized tools for docs search, blockchain queries, validator info, 
                NFT data, network stats, and agent communication.
              </p>
            </div>
            
            <div className="p-6 rounded-xl bg-[var(--bg-surface)] border border-white/10">
              <h3 className="font-semibold text-white mb-3">🤖 Agent Network</h3>
              <p className="text-gray-400 text-sm">
                Sophia coordinates with specialized agents: Guardian (security), 
                Price Oracle (markets), and NFT Curator (DRC-369).
              </p>
            </div>
            
            <div className="p-6 rounded-xl bg-[var(--bg-surface)] border border-white/10">
              <h3 className="font-semibold text-white mb-3">⚡ Real-Time Data</h3>
              <p className="text-gray-400 text-sm">
                Direct integration with the Demiurge RPC for live blockchain data, 
                validator status, and transaction lookups.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 px-4">
        <div 
          className="max-w-2xl mx-auto p-8 rounded-2xl text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,165,0,0.05))',
            border: '1px solid rgba(255,215,0,0.2)',
          }}
        >
          <div className="text-4xl mb-4">✧</div>
          <h2 className="text-2xl font-bold mb-4">Ready to Explore?</h2>
          <p className="text-gray-400 mb-6">
            Sophia is always here to help you navigate the Demiurge ecosystem.
          </p>
          <button
            onClick={() => setChatOpen(true)}
            className="px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              color: '#1a1a2e',
            }}
          >
            Chat with Sophia
          </button>
        </div>
      </section>

      {/* Navigation Links */}
      <section className="py-8 px-4 border-t border-white/10">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-6 text-sm">
          <Link href="/docs" className="text-gray-400 hover:text-[#FFD700] transition-colors">
            📚 Documentation
          </Link>
          <Link href="/agents" className="text-gray-400 hover:text-[#FFD700] transition-colors">
            🤖 Agent Registry
          </Link>
          <Link href="/explorer" className="text-gray-400 hover:text-[#FFD700] transition-colors">
            🔍 Block Explorer
          </Link>
          <Link href="/developers" className="text-gray-400 hover:text-[#FFD700] transition-colors">
            💻 Developers
          </Link>
        </div>
      </section>

      {/* Chat Panel */}
      <SophiaChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
