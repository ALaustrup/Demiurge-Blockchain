// Demiurge Wallet Extension - State Management
import { create } from 'zustand';
import type { Account, WalletState } from '../shared/types';
import type { Message, MessageResponse, WalletStateResponse } from '../shared/messages';

interface PopupState {
  // Wallet state
  isLoading: boolean;
  isLocked: boolean;
  isInitialized: boolean;
  accounts: Account[];
  activeAccount: string | null;
  network: string;
  balance: string | null;
  formattedBalance: string | null;
  pendingRequestCount: number;
  
  // UI state
  view: 'loading' | 'create' | 'unlock' | 'main' | 'send' | 'approve' | 'settings';
  error: string | null;
  success: string | null;
  
  // Actions
  initialize: () => Promise<void>;
  createWallet: (password: string, mnemonic?: string) => Promise<string>;
  importWallet: (password: string, mnemonic: string) => Promise<void>;
  unlock: (password: string) => Promise<void>;
  lock: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  switchNetwork: (network: string) => Promise<void>;
  sendTransaction: (to: string, amount: string) => Promise<string>;
  setView: (view: PopupState['view']) => void;
  clearMessages: () => void;
}

// Send message to background script
async function sendMessage<T = any>(message: Partial<Message>): Promise<MessageResponse<T>> {
  return chrome.runtime.sendMessage(message);
}

export const useStore = create<PopupState>((set, get) => ({
  // Initial state
  isLoading: true,
  isLocked: true,
  isInitialized: false,
  accounts: [],
  activeAccount: null,
  network: 'mainnet',
  balance: null,
  formattedBalance: null,
  pendingRequestCount: 0,
  view: 'loading',
  error: null,
  success: null,

  // Initialize from background state
  initialize: async () => {
    try {
      const response = await sendMessage<WalletStateResponse>({ type: 'WALLET_GET_STATE' });
      
      if (response.success && response.data) {
        const { isLocked, isInitialized, accounts, activeAccount, network, pendingRequestCount } = response.data;
        
        let view: PopupState['view'] = 'main';
        if (!isInitialized) {
          view = 'create';
        } else if (isLocked) {
          view = 'unlock';
        } else if (pendingRequestCount > 0) {
          view = 'approve';
        }

        set({
          isLoading: false,
          isLocked,
          isInitialized,
          accounts,
          activeAccount,
          network,
          pendingRequestCount,
          view,
        });

        // Fetch balance if unlocked
        if (!isLocked && activeAccount) {
          get().refreshBalance();
        }
      }
    } catch (error) {
      set({ isLoading: false, error: 'Failed to initialize wallet' });
    }
  },

  // Create new wallet
  createWallet: async (password: string, mnemonic?: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await sendMessage<{ mnemonic: string; address: string }>({
        type: 'WALLET_CREATE',
        payload: { password, mnemonic },
      });

      if (response.success && response.data) {
        set({
          isLoading: false,
          isLocked: false,
          isInitialized: true,
          activeAccount: response.data.address,
          view: 'main',
          success: 'Wallet created successfully!',
        });
        
        get().refreshBalance();
        return response.data.mnemonic;
      } else {
        throw new Error(response.error || 'Failed to create wallet');
      }
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
      throw error;
    }
  },

  // Import wallet from mnemonic
  importWallet: async (password: string, mnemonic: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await sendMessage<{ address: string }>({
        type: 'WALLET_IMPORT',
        payload: { password, mnemonic },
      });

      if (response.success && response.data) {
        set({
          isLoading: false,
          isLocked: false,
          isInitialized: true,
          activeAccount: response.data.address,
          view: 'main',
          success: 'Wallet imported successfully!',
        });
        
        get().refreshBalance();
      } else {
        throw new Error(response.error || 'Failed to import wallet');
      }
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
      throw error;
    }
  },

  // Unlock wallet
  unlock: async (password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await sendMessage<WalletStateResponse>({
        type: 'WALLET_UNLOCK',
        payload: { password },
      });

      if (response.success && response.data) {
        set({
          isLoading: false,
          isLocked: false,
          accounts: response.data.accounts,
          activeAccount: response.data.activeAccount,
          view: 'main',
        });
        
        get().refreshBalance();
      } else {
        throw new Error(response.error || 'Invalid password');
      }
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
    }
  },

  // Lock wallet
  lock: async () => {
    await sendMessage({ type: 'WALLET_LOCK' });
    set({ isLocked: true, view: 'unlock', balance: null, formattedBalance: null });
  },

  // Refresh balance
  refreshBalance: async () => {
    const { activeAccount } = get();
    if (!activeAccount) return;

    try {
      const response = await sendMessage<{ balance: string; formatted: string }>({
        type: 'GET_BALANCE',
        payload: { address: activeAccount },
      });

      if (response.success && response.data) {
        set({
          balance: response.data.balance,
          formattedBalance: response.data.formatted,
        });
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  },

  // Switch network
  switchNetwork: async (network: string) => {
    try {
      const response = await sendMessage({ 
        type: 'NETWORK_SWITCH', 
        payload: { network } 
      });

      if (response.success) {
        set({ network });
        get().refreshBalance();
      }
    } catch (error) {
      set({ error: 'Failed to switch network' });
    }
  },

  // Send transaction
  sendTransaction: async (to: string, amount: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await sendMessage<{ hash: string }>({
        type: 'SEND_TRANSACTION',
        payload: {
          transaction: { to, value: amount },
        },
      });

      if (response.success && response.data) {
        set({
          isLoading: false,
          view: 'main',
          success: `Transaction sent! Hash: ${response.data.hash.slice(0, 16)}...`,
        });
        
        get().refreshBalance();
        return response.data.hash;
      } else {
        throw new Error(response.error || 'Transaction failed');
      }
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
      throw error;
    }
  },

  // Set view
  setView: (view) => set({ view }),

  // Clear messages
  clearMessages: () => set({ error: null, success: null }),
}));
