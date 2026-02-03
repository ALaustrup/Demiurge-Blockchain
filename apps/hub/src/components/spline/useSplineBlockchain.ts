/**
 * useSplineBlockchain
 * 
 * Hook for syncing Demiurge blockchain data to Spline scene variables.
 * Enables real-time visualization of on-chain data in 3D.
 * 
 * Supported Variables (create these in your Spline scene):
 * - blockHeight (Number): Current block height
 * - validators (Number): Active validator count  
 * - tps (Number): Transactions per second
 * - isConnected (Boolean): Chain connection status
 * - cgtBalance (Number): User's CGT balance (if authenticated)
 * - energy (Number): User's energy level
 * - nftCount (Number): User's NFT count
 * 
 * @see https://docs.spline.design/interaction-states-events-and-actions/variables
 * @see https://docs.spline.design/interaction-states-events-and-actions/real-time-api
 */

import { useEffect, useCallback, useRef } from 'react';
import type { SplineSceneRef } from './SplineScene';
import { useChainInfo } from '@/hooks/useChainData';
import { useBalance } from '@/hooks/useWalletData';
import { useAuth } from '@/contexts/AuthContext';

// ============================================================================
// Types
// ============================================================================

export interface BlockchainVariables {
  // Chain state
  blockHeight: number;
  validators: number;
  tps: number;
  isConnected: boolean;
  
  // User state (if authenticated)
  cgtBalance: number;
  energy: number;
  nftCount: number;
  
  // Dynamic computed
  networkLoad: number; // 0-100
  blockProgress: number; // 0-1 (time until next block)
}

interface UseSplineBlockchainOptions {
  /** Spline scene ref */
  splineRef: React.RefObject<SplineSceneRef>;
  /** Update interval in ms (default: 2000) */
  updateInterval?: number;
  /** Enable user-specific data (requires auth) */
  includeUserData?: boolean;
  /** Custom variable name mappings */
  variableNames?: Partial<Record<keyof BlockchainVariables, string>>;
  /** Callback when variables are updated */
  onUpdate?: (variables: BlockchainVariables) => void;
}

// ============================================================================
// Default Variable Names
// ============================================================================

const DEFAULT_VARIABLE_NAMES: Record<keyof BlockchainVariables, string> = {
  blockHeight: 'blockHeight',
  validators: 'validators',
  tps: 'tps',
  isConnected: 'isConnected',
  cgtBalance: 'cgtBalance',
  energy: 'energy',
  nftCount: 'nftCount',
  networkLoad: 'networkLoad',
  blockProgress: 'blockProgress',
};

// ============================================================================
// Hook Implementation
// ============================================================================

export function useSplineBlockchain({
  splineRef,
  updateInterval = 2000,
  includeUserData = true,
  variableNames = {},
  onUpdate,
}: UseSplineBlockchainOptions) {
  const lastUpdateRef = useRef<number>(0);
  const animationFrameRef = useRef<number>();

  // Merge variable names with defaults
  const varNames = { ...DEFAULT_VARIABLE_NAMES, ...variableNames };

  // Blockchain hooks
  const chainInfo = useChainInfo();
  const { user, isAuthenticated } = useAuth();
  const walletAddress = user?.on_chain?.address || user?.on_chain_address;
  const balance = useBalance(walletAddress);

  // Build current variables object
  const buildVariables = useCallback((): BlockchainVariables => {
    const cgtBalanceRaw = balance.data ? Number(balance.data) / 1e18 : 0;
    
    return {
      blockHeight: chainInfo.blockHeight || 0,
      validators: chainInfo.validators || 0,
      tps: 0, // TODO: Implement TPS tracking
      isConnected: chainInfo.isConnected,
      cgtBalance: parseFloat(cgtBalanceRaw.toFixed(2)),
      energy: 100, // TODO: Hook up to energy system
      nftCount: 0, // TODO: Hook up to NFT count
      networkLoad: 50, // TODO: Calculate from actual metrics
      blockProgress: 0, // Would need block time tracking
    };
  }, [chainInfo, balance.data]);

  // Update Spline variables
  const updateSplineVariables = useCallback((variables: BlockchainVariables) => {
    const spline = splineRef.current;
    if (!spline) return;

    // Update each variable
    Object.entries(variables).forEach(([key, value]) => {
      const varName = varNames[key as keyof BlockchainVariables];
      if (!varName) return;

      // Skip user data if not enabled
      if (!includeUserData && ['cgtBalance', 'energy', 'nftCount'].includes(key)) {
        return;
      }

      try {
        spline.setVariable(varName, value);
      } catch {
        // Variable doesn't exist in scene - this is fine
      }
    });

    onUpdate?.(variables);
  }, [splineRef, varNames, includeUserData, onUpdate]);

  // Animation loop for smooth updates
  useEffect(() => {
    let isActive = true;

    const tick = () => {
      if (!isActive) return;

      const now = Date.now();
      if (now - lastUpdateRef.current >= updateInterval) {
        const variables = buildVariables();
        updateSplineVariables(variables);
        lastUpdateRef.current = now;
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      isActive = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [buildVariables, updateSplineVariables, updateInterval]);

  // Return current state for external use
  return {
    variables: buildVariables(),
    isConnected: chainInfo.isConnected,
    isAuthenticated,
    updateNow: () => {
      const variables = buildVariables();
      updateSplineVariables(variables);
      return variables;
    },
  };
}

// ============================================================================
// Preset Configurations
// ============================================================================

/**
 * Preset variable names for common Spline scene templates
 */
export const SPLINE_PRESETS = {
  /** Standard Demiurge dashboard scene */
  dashboard: {
    blockHeight: 'block_height',
    validators: 'validator_count',
    tps: 'transactions_per_second',
    isConnected: 'chain_connected',
    cgtBalance: 'wallet_balance',
    energy: 'user_energy',
    nftCount: 'nft_owned',
    networkLoad: 'network_load',
    blockProgress: 'block_timer',
  },
  
  /** Minimal scene with just chain data */
  minimal: {
    blockHeight: 'blocks',
    validators: 'nodes',
    isConnected: 'online',
  },
  
  /** NFT-focused scene */
  nftGallery: {
    cgtBalance: 'balance',
    nftCount: 'total_nfts',
    energy: 'energy_level',
  },
} as const;

export default useSplineBlockchain;
