'use client';

import { useState } from 'react';
import Link from 'next/link';

/**
 * Development Page
 * The ancient texts reveal the secrets of creation...
 */

interface DocSection {
  title: string;
  description: string;
  links: { name: string; href: string; external?: boolean }[];
}

const docSections: DocSection[] = [
  {
    title: 'Blockchain Framework',
    description: 'The foundation upon which all creation rests. Eyes gaze upon the code, watching as a warden does his prisoners...',
    links: [
      { name: 'Architecture Overview', href: '/docs/ULTIMATE_BLOCKCHAIN_DESIGN.md' },
      { name: 'Module Specifications', href: '/docs/MODULE_SPECS.md' },
      { name: 'Consensus Algorithm', href: '/docs/CONSENSUS_ALGORITHM_DESIGN.md' },
      { name: 'RPC API Reference', href: '/docs/RPC_IMPLEMENTATION_NOTES.md' },
    ],
  },
  {
    title: 'Frontend Integration',
    description: 'Where the digital realm meets the ethereal. The code serves the will, the will serves the flame...',
    links: [
      { name: 'Integration Guide', href: '/docs/FRONTEND_INTEGRATION_PLAN.md' },
      { name: 'Component Map', href: '/docs/COMPONENT_MAP.md' },
      { name: 'Game Integration', href: '/docs/GAME_INTEGRATION_GUIDE.md' },
    ],
  },
  {
    title: 'On-Chain Information',
    description: 'The ledger speaks, revealing the truth of all transactions. From the Monad, all emanates...',
    links: [
      { name: 'RPC Endpoint', href: 'https://rpc.demiurge.cloud', external: true },
      { name: 'Chain ID', href: '#', external: false },
      { name: 'Network Status', href: '/analytics' },
      { name: 'Module Addresses', href: '#', external: false },
    ],
  },
  {
    title: 'QOR Identity System',
    description: 'Identity flows through the network like ancient rivers. Each soul marked, each path recorded...',
    links: [
      { name: 'QOR ID Specification', href: '/docs/identity/QOR_ID_SPEC.md' },
      { name: 'Wallet Integration', href: '/docs/QOR_ID_WALLET_INTEGRATION.md' },
      { name: 'Session Keys', href: '/docs/SESSION_KEYS_QOR_ID_INTEGRATION.md' },
    ],
  },
  {
    title: 'Deployment & Testing',
    description: 'The final ritual before release. The flame burns eternal, the code serves the will...',
    links: [
      { name: 'Testnet Deployment', href: '/docs/TESTNET_DEPLOYMENT.md' },
      { name: 'User Testing Guide', href: '/docs/USER_TESTING_GUIDE.md' },
      { name: 'Migration Guide', href: '/docs/MIGRATION_GUIDE.md' },
    ],
  },
];

export default function DevelopmentPage() {
  const [selectedSection, setSelectedSection] = useState<number | null>(null);

  return (
    <main className="min-h-screen p-8 pt-24 page-enter">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 ancient-text">
          <h1 className="text-6xl font-grunge grunge-text">
            DEVELOPMENT
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto italic">
            Eyes gaze upon you, watching as a warden does his prisoners. The ancient texts reveal the secrets of creation, 
            the code serves the will, and the will serves the flame that burns eternal.
          </p>
        </div>

        {/* Documentation Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {docSections.map((section, index) => (
            <div
              key={index}
              className="glass-panel p-6 rounded-lg hover-glow cascade-item"
              onMouseEnter={() => setSelectedSection(index)}
              onMouseLeave={() => setSelectedSection(null)}
            >
              <h2 className="text-2xl font-bold text-neon-cyan mb-3">{section.title}</h2>
              <p className="text-gray-400 mb-4 text-sm italic">{section.description}</p>
              <div className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <div key={linkIndex} className="cascade-menu-item">
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block glass-panel px-4 py-2 rounded hover:chroma-glow transition-all text-sm"
                      >
                        {link.name} →
                      </a>
                    ) : link.href.startsWith('/') ? (
                      <Link
                        href={link.href}
                        className="block glass-panel px-4 py-2 rounded hover:chroma-glow transition-all text-sm"
                      >
                        {link.name}
                      </Link>
                    ) : (
                      <div className="block glass-panel px-4 py-2 rounded text-sm text-gray-500">
                        {link.name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Start */}
        <div className="glass-panel p-8 rounded-lg hover-glow">
          <h2 className="text-3xl font-bold text-neon-green mb-4">Quick Start</h2>
          <div className="space-y-4 text-gray-300">
            <div>
              <h3 className="text-xl font-bold text-neon-cyan mb-2">Connect to Testnet</h3>
              <code className="block glass-panel p-4 rounded font-mono text-sm">
                RPC URL: https://rpc.demiurge.cloud
              </code>
            </div>
            <div>
              <h3 className="text-xl font-bold text-neon-magenta mb-2">Get Started</h3>
              <p className="text-gray-400">
                The path begins with a single step. Connect your application to the RPC endpoint, 
                authenticate with QOR ID, and begin your journey into the Demiurge ecosystem.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
