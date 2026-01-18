'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { blockchainClient } from '@/lib/blockchain';

interface BlockchainContextType {
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  getBalance: (address: string) => Promise<string>;
  transfer: (fromPair: any, toAddress: string, amount: string) => Promise<string>;
  transferWithWasm: (
    keypairJson: string,
    fromAddress: string,
    toAddress: string,
    amount: string,
    signMessage: (keypairJson: string, message: Uint8Array) => Promise<string>
  ) => Promise<string>;
  getUserAssets: (address: string) => Promise<any[]>;
  getTransactions: (address: string) => Promise<any[]>;
  getApi: () => any | null;
}

const BlockchainContext = createContext<BlockchainContextType | null>(null);

export function BlockchainProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(async () => {
    try {
      await blockchainClient.connect();
      // Check actual connection status after connect attempt
      const connected = blockchainClient.isConnected();
      setIsConnected(connected);
    } catch (error: any) {
      // Suppress WebSocket connection errors - they're expected if the node isn't running
      if (!error.message?.includes('disconnected') && !error.message?.includes('1006')) {
        console.warn('Blockchain connection warning:', error.message);
      }
      setIsConnected(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await blockchainClient.disconnect();
      setIsConnected(false);
    } catch (error) {
      console.error('Failed to disconnect from blockchain:', error);
    }
  }, []);

  useEffect(() => {
    // Auto-connect on mount
    connect();
    
    // Poll connection status periodically
    const statusInterval = setInterval(() => {
      const connected = blockchainClient.isConnected();
      setIsConnected(connected);
    }, 5000); // Check every 5 seconds
    
    return () => {
      clearInterval(statusInterval);
      disconnect();
    };
  }, [connect, disconnect]);

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

  const transferWithWasm = async (
    keypairJson: string,
    fromAddress: string,
    toAddress: string,
    amount: string,
    signMessage: (keypairJson: string, message: Uint8Array) => Promise<string>
  ): Promise<string> => {
    if (!isConnected) {
      await connect();
    }
    return blockchainClient.transferCGTWithWasm(keypairJson, fromAddress, toAddress, amount, signMessage);
  };

  const getUserAssets = async (address: string): Promise<any[]> => {
    if (!isConnected) {
      await connect();
    }
    return blockchainClient.getUserAssets(address);
  };

  const getTransactions = async (address: string): Promise<any[]> => {
    if (!isConnected) {
      await connect();
    }
    return blockchainClient.getTransactions(address);
  };

  const getApi = () => {
    return blockchainClient.getApi();
  };

  return (
    <BlockchainContext.Provider
      value={{
        isConnected,
        connect,
        disconnect,
        getBalance,
        transfer,
        transferWithWasm,
        getUserAssets,
        getTransactions,
        getApi,
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
