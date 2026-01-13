'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { blockchainClient } from '@/lib/blockchain';

interface BlockchainContextType {
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  getBalance: (address: string) => Promise<string>;
  transfer: (fromPair: any, toAddress: string, amount: string) => Promise<string>;
  getUserAssets: (address: string) => Promise<any[]>;
}

const BlockchainContext = createContext<BlockchainContextType | null>(null);

export function BlockchainProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Auto-connect on mount
    connect();
    
    return () => {
      disconnect();
    };
  }, []);

  const connect = async () => {
    try {
      await blockchainClient.connect();
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to connect to blockchain:', error);
      setIsConnected(false);
    }
  };

  const disconnect = async () => {
    try {
      await blockchainClient.disconnect();
      setIsConnected(false);
    } catch (error) {
      console.error('Failed to disconnect from blockchain:', error);
    }
  };

  const getBalance = async (address: string): Promise<string> => {
    if (!isConnected) {
      await connect();
    }
    return blockchainClient.getCGTBalance(address);
  };

  const transfer = async (fromPair: any, toAddress: string, amount: string): Promise<string> => {
    if (!isConnected) {
      await connect();
    }
    return blockchainClient.transferCGT(fromPair, toAddress, amount);
  };

  const getUserAssets = async (address: string): Promise<any[]> => {
    if (!isConnected) {
      await connect();
    }
    return blockchainClient.getUserAssets(address);
  };

  return (
    <BlockchainContext.Provider
      value={{
        isConnected,
        connect,
        disconnect,
        getBalance,
        transfer,
        getUserAssets,
      }}
    >
      {children}
    </BlockchainContext.Provider>
  );
}

export function useBlockchain() {
  const context = useContext(BlockchainContext);
  if (!context) {
    throw new Error('useBlockchain must be used within BlockchainProvider');
  }
  return context;
}
