'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useChainStore, selectBlockHeight, selectTps, selectValidators, selectConnectionStatus } from '@/store/chainStore';
import { HolographicCard, SystemModuleCard, DataDisplay } from './HolographicCard';
import { WalletConnector } from './WalletConnector';

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD GRID - Bento-grid layout for Demiurge OS Launcher
// ═══════════════════════════════════════════════════════════════════════════

export function DashboardGrid() {
  const connect = useChainStore((state) => state.connect);
  const connectionStatus = useChainStore(selectConnectionStatus);
  const blockHeight = useChainStore(selectBlockHeight);
  const tps = useChainStore(selectTps);
  const validators = useChainStore(selectValidators);

  // Connect to blockchain on mount
  useEffect(() => {
    connect();
    return () => {
      useChainStore.getState().disconnect();
    };
  }, [connect]);

  const systems = [
    {
      icon: '💰',
      title: 'Wallet',
      value: '0.00',
      subtitle: 'CGT Balance',
      href: '/wallet',
      status: 'online' as const,
    },
    {
      icon: '⚡',
      title: 'Staking',
      value: validators || 0,
      subtitle: 'Active Validators',
      href: '/staking',
      status: connectionStatus === 'connected' ? 'online' as const : 'syncing' as const,
    },
    {
      icon: '🎮',
      title: 'Games',
      value: '12',
      subtitle: 'Available Games',
      href: '/games',
      status: 'online' as const,
    },
    {
      icon: '🎵',
      title: 'Music',
      value: 'Now Playing',
      subtitle: 'Digital Stranger',
      href: '/music',
      status: 'online' as const,
    },
    {
      icon: '🌐',
      title: 'VYB Social',
      value: '8',
      subtitle: 'New Notifications',
      href: '/social',
      status: 'online' as const,
    },
    {
      icon: '🖼️',
      title: 'NFT Portal',
      value: '23',
      subtitle: 'Items Owned',
      href: '/nft-portal',
      status: 'online' as const,
    },
  ];

  const quickLinks = [
    { icon: '🔍', title: 'Explorer', href: '/explorer' },
    { icon: '⚒️', title: 'Forge', href: '/forge' },
    { icon: '🏪', title: 'Marketplace', href: '/marketplace' },
    { icon: '🌀', title: 'Portal', href: '/portal' },
    { icon: '💻', title: 'Dev Hub', href: '/development' },
    { icon: '🤖', title: 'Sophia AI', href: '/social' },
    { icon: '✨', title: 'Scatter3D', href: '/scatter3d' },
  ];

  return (
    <div className="min-h-screen pt-20 pb-10 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl md:text-6xl font-grunge text-holo-gradient mb-4">
            DEMIURGE
          </h1>
          <p className="text-lavender text-lg">
            The Metaverse Operating System
          </p>
        </motion.div>

        {/* Real-time Chain Data Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <HolographicCard className="mb-8" variant="compact" animate={false}>
            <div className="flex flex-wrap items-center justify-between gap-4 py-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-data-green' : 
                  connectionStatus === 'connecting' ? 'bg-data-cyan animate-pulse' :
                  'bg-red-500'
                }`} 
                style={{ boxShadow: connectionStatus === 'connected' ? '0 0 10px #00FF88' : undefined }}
                />
                <span className="text-sm text-lavender">
                  {connectionStatus === 'connected' ? 'MAINNET ONLINE' : 
                   connectionStatus === 'connecting' ? 'CONNECTING...' : 'OFFLINE'}
                </span>
              </div>
              
              <div className="flex items-center gap-8">
                <DataDisplay 
                  label="Block" 
                  value={blockHeight} 
                />
                <DataDisplay 
                  label="TPS" 
                  value={tps.toFixed(1)} 
                />
                <DataDisplay 
                  label="Validators" 
                  value={validators} 
                />
                <DataDisplay 
                  label="Finality" 
                  value="< 2s" 
                />
              </div>
            </div>
          </HolographicCard>
        </motion.div>

        {/* Main Bento Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {systems.map((system, index) => (
            <SystemModuleCard
              key={system.title}
              icon={system.icon}
              title={system.title}
              value={system.value}
              subtitle={system.subtitle}
              href={system.href}
              status={system.status}
              delay={0.1 + index * 0.05}
            />
          ))}
        </div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <HolographicCard variant="elevated" className="mb-8">
            <h3 className="font-grunge text-holographic text-lg mb-4">Quick Access</h3>
            <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
              {quickLinks.map((link) => (
                <a
                  key={link.title}
                  href={link.href}
                  className="flex flex-col items-center p-3 rounded-lg hover:bg-ultraviolet/50 transition-colors group"
                >
                  <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">
                    {link.icon}
                  </span>
                  <span className="text-xs text-lavender group-hover:text-holographic transition-colors">
                    {link.title}
                  </span>
                </a>
              ))}
            </div>
          </HolographicCard>
        </motion.div>

        {/* Connect Wallet CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <WalletConnector variant="full" />
          <p className="text-sm text-lavender mt-4">
            Ed25519 · WASM Signing · No Extensions Required
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default DashboardGrid;
