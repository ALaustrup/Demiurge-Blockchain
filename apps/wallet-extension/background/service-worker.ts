// Demiurge Wallet Extension - Background Service Worker
// Handles all wallet operations and dApp communication

import { keyring } from './keyring';
import { rpcHandler } from './rpc-handler';
import type { 
  Message, 
  MessageResponse,
  WalletCreatePayload,
  WalletImportPayload,
  WalletUnlockPayload,
  SignMessagePayload,
  SendTransactionPayload,
  WalletStateResponse,
  SophiaQueryPayload,
} from '../shared/messages';
import { createResponse } from '../shared/messages';
import type { Account, EncryptedKeystore, PendingRequest, WalletState } from '../shared/types';

// Wallet state
let walletState: WalletState = {
  isLocked: true,
  isInitialized: false,
  accounts: [],
  activeAccount: null,
  network: 'mainnet',
  pendingRequests: [],
};

// Storage keys
const STORAGE_KEYS = {
  KEYSTORES: 'demiurge_keystores',
  ACCOUNTS: 'demiurge_accounts',
  SETTINGS: 'demiurge_settings',
  CONNECTED_SITES: 'demiurge_connected_sites',
};

// Initialize wallet state from storage
async function initializeState(): Promise<void> {
  const stored = await chrome.storage.local.get([
    STORAGE_KEYS.KEYSTORES,
    STORAGE_KEYS.ACCOUNTS,
    STORAGE_KEYS.SETTINGS,
  ]);

  const keystores = stored[STORAGE_KEYS.KEYSTORES] as EncryptedKeystore[] | undefined;
  const accounts = stored[STORAGE_KEYS.ACCOUNTS] as Account[] | undefined;
  const settings = stored[STORAGE_KEYS.SETTINGS] as { network?: string } | undefined;

  walletState.isInitialized = keystores && keystores.length > 0;
  walletState.accounts = accounts || [];
  walletState.network = settings?.network || 'mainnet';
  walletState.isLocked = true;

  if (settings?.network) {
    rpcHandler.setNetwork(settings.network);
  }
}

// Save accounts to storage
async function saveAccounts(): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEYS.ACCOUNTS]: walletState.accounts,
  });
}

// Save keystores to storage
async function saveKeystores(keystores: EncryptedKeystore[]): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEYS.KEYSTORES]: keystores,
  });
}

// Save settings to storage
async function saveSettings(): Promise<void> {
  await chrome.storage.local.set({
    [STORAGE_KEYS.SETTINGS]: {
      network: walletState.network,
    },
  });
}

// Get stored keystores
async function getKeystores(): Promise<EncryptedKeystore[]> {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.KEYSTORES);
  return stored[STORAGE_KEYS.KEYSTORES] || [];
}

// Message handler
async function handleMessage(
  message: Message,
  sender: chrome.runtime.MessageSender
): Promise<MessageResponse> {
  const { type, payload, requestId, origin } = message;

  try {
    switch (type) {
      // Wallet lifecycle
      case 'WALLET_GET_STATE':
        return createResponse(true, getWalletState());

      case 'WALLET_CREATE':
        return await handleWalletCreate(payload as WalletCreatePayload);

      case 'WALLET_IMPORT':
        return await handleWalletImport(payload as WalletImportPayload);

      case 'WALLET_UNLOCK':
        return await handleWalletUnlock(payload as WalletUnlockPayload);

      case 'WALLET_LOCK':
        return handleWalletLock();

      // Account management
      case 'ACCOUNT_CREATE':
        return await handleAccountCreate(payload as { name: string });

      case 'ACCOUNT_SELECT':
        return handleAccountSelect(payload as { address: string });

      case 'ACCOUNT_GET_ALL':
        return createResponse(true, walletState.accounts);

      // Network
      case 'NETWORK_SWITCH':
        return handleNetworkSwitch(payload as { network: string });

      case 'NETWORK_GET_CURRENT':
        return createResponse(true, { network: walletState.network });

      // Transactions & signing
      case 'GET_BALANCE':
        return await handleGetBalance(payload as { address?: string });

      case 'SIGN_MESSAGE':
        return await handleSignMessage(payload as SignMessagePayload, origin);

      case 'SIGN_TRANSACTION':
        return await handleSignTransaction(payload as SendTransactionPayload, origin);

      case 'SEND_TRANSACTION':
        return await handleSendTransaction(payload as SendTransactionPayload, origin);

      // dApp connection
      case 'DAPP_CONNECT':
        return await handleDAppConnect(origin || sender.origin || '');

      case 'DAPP_GET_ACCOUNTS':
        return handleDAppGetAccounts(origin || sender.origin || '');

      // Request handling
      case 'REQUEST_GET_PENDING':
      case 'GET_PENDING_REQUESTS':
        return createResponse(true, walletState.pendingRequests);

      case 'REQUEST_APPROVE':
      case 'APPROVE_REQUEST':
        return await handleRequestApprove(payload as { requestId: string });

      case 'REQUEST_REJECT':
      case 'REJECT_REQUEST':
        return handleRequestReject(payload as { requestId: string; reason?: string });

      // Sophia AI
      case 'SOPHIA_QUERY':
        return await handleSophiaQuery(payload as SophiaQueryPayload);

      default:
        return createResponse(false, undefined, `Unknown message type: ${type}`);
    }
  } catch (error) {
    console.error('Message handler error:', error);
    return createResponse(false, undefined, (error as Error).message);
  }
}

// Get wallet state for UI
function getWalletState(): WalletStateResponse {
  return {
    isLocked: walletState.isLocked,
    isInitialized: walletState.isInitialized,
    accounts: walletState.accounts,
    activeAccount: walletState.activeAccount,
    network: walletState.network,
    pendingRequestCount: walletState.pendingRequests.length,
  };
}

// Create new wallet
async function handleWalletCreate(payload: WalletCreatePayload): Promise<MessageResponse> {
  const { password, mnemonic: providedMnemonic } = payload;

  const mnemonic = providedMnemonic || keyring.generateMnemonic();
  
  if (!keyring.validateMnemonic(mnemonic)) {
    return createResponse(false, undefined, 'Invalid mnemonic phrase');
  }

  // Derive first keypair
  const keyPair = keyring.deriveKeyPair(mnemonic, 0);
  
  // Encrypt private key
  const keystore = await keyring.encryptPrivateKey(keyPair.privateKey, password);
  
  // Create account
  const account: Account = {
    address: keyPair.address,
    publicKey: keyPair.address,
    name: 'Account 1',
    createdAt: Date.now(),
  };

  // Save to storage
  await saveKeystores([keystore]);
  walletState.accounts = [account];
  walletState.activeAccount = account.address;
  walletState.isInitialized = true;
  await saveAccounts();

  // Unlock immediately
  await keyring.unlock([keystore], password);
  walletState.isLocked = false;

  return createResponse(true, { mnemonic, address: account.address });
}

// Import wallet from mnemonic
async function handleWalletImport(payload: WalletImportPayload): Promise<MessageResponse> {
  const { password, mnemonic } = payload;

  if (!keyring.validateMnemonic(mnemonic)) {
    return createResponse(false, undefined, 'Invalid mnemonic phrase');
  }

  // Derive keypair
  const keyPair = keyring.deriveKeyPair(mnemonic, 0);
  
  // Encrypt private key
  const keystore = await keyring.encryptPrivateKey(keyPair.privateKey, password);
  
  // Create account
  const account: Account = {
    address: keyPair.address,
    publicKey: keyPair.address,
    name: 'Imported Account',
    createdAt: Date.now(),
  };

  // Save to storage
  await saveKeystores([keystore]);
  walletState.accounts = [account];
  walletState.activeAccount = account.address;
  walletState.isInitialized = true;
  await saveAccounts();

  // Unlock immediately
  await keyring.unlock([keystore], password);
  walletState.isLocked = false;

  return createResponse(true, { address: account.address });
}

// Unlock wallet
async function handleWalletUnlock(payload: WalletUnlockPayload): Promise<MessageResponse> {
  const { password } = payload;
  
  const keystores = await getKeystores();
  if (keystores.length === 0) {
    return createResponse(false, undefined, 'Wallet not initialized');
  }

  try {
    await keyring.unlock(keystores, password);
    walletState.isLocked = false;
    
    if (walletState.accounts.length > 0 && !walletState.activeAccount) {
      walletState.activeAccount = walletState.accounts[0].address;
    }

    return createResponse(true, getWalletState());
  } catch (error) {
    return createResponse(false, undefined, 'Invalid password');
  }
}

// Lock wallet
function handleWalletLock(): MessageResponse {
  keyring.lock();
  walletState.isLocked = true;
  return createResponse(true);
}

// Create new account
async function handleAccountCreate(payload: { name: string }): Promise<MessageResponse> {
  if (walletState.isLocked) {
    return createResponse(false, undefined, 'Wallet is locked');
  }

  // For now, we don't support multiple accounts from the same mnemonic in this version
  // This would require storing the mnemonic (encrypted) or deriving from master key
  return createResponse(false, undefined, 'Multi-account not yet supported');
}

// Select active account
function handleAccountSelect(payload: { address: string }): MessageResponse {
  const account = walletState.accounts.find(a => a.address === payload.address);
  if (!account) {
    return createResponse(false, undefined, 'Account not found');
  }

  walletState.activeAccount = account.address;
  return createResponse(true, { address: account.address });
}

// Switch network
function handleNetworkSwitch(payload: { network: string }): MessageResponse {
  try {
    rpcHandler.setNetwork(payload.network);
    walletState.network = payload.network;
    saveSettings();
    return createResponse(true, { network: payload.network });
  } catch (error) {
    return createResponse(false, undefined, (error as Error).message);
  }
}

// Get balance
async function handleGetBalance(payload: { address?: string }): Promise<MessageResponse> {
  const address = payload.address || walletState.activeAccount;
  if (!address) {
    return createResponse(false, undefined, 'No account selected');
  }

  try {
    const balance = await rpcHandler.getBalance(address);
    return createResponse(true, balance);
  } catch (error) {
    return createResponse(false, undefined, (error as Error).message);
  }
}

// Sign message
async function handleSignMessage(payload: SignMessagePayload, origin?: string): Promise<MessageResponse> {
  if (walletState.isLocked) {
    return createResponse(false, undefined, 'Wallet is locked');
  }

  const address = payload.account || walletState.activeAccount;
  if (!address) {
    return createResponse(false, undefined, 'No account selected');
  }

  const messageBytes = new TextEncoder().encode(payload.message);
  const signature = await keyring.signMessage(address, messageBytes);

  return createResponse(true, {
    signature: Array.from(signature).map(b => b.toString(16).padStart(2, '0')).join(''),
  });
}

// Sign transaction (without sending)
async function handleSignTransaction(payload: SendTransactionPayload, origin?: string): Promise<MessageResponse> {
  if (walletState.isLocked) {
    return createResponse(false, undefined, 'Wallet is locked');
  }

  const { transaction } = payload;
  const from = payload.account || walletState.activeAccount;

  if (!from) {
    return createResponse(false, undefined, 'No account selected');
  }

  const messageBytes = new TextEncoder().encode(
    `${from}${transaction.to}${transaction.value}`
  );
  const signature = await keyring.signMessage(from, messageBytes);
  const signatureHex = Array.from(signature).map(b => b.toString(16).padStart(2, '0')).join('');

  const txData = JSON.stringify({ from, to: transaction.to, value: transaction.value, data: transaction.data });
  const txHex = Array.from(new TextEncoder().encode(txData))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return createResponse(true, {
    tx: txHex,
    signature: signatureHex,
  });
}

// Send transaction
async function handleSendTransaction(payload: SendTransactionPayload, origin?: string): Promise<MessageResponse> {
  if (walletState.isLocked) {
    return createResponse(false, undefined, 'Wallet is locked');
  }

  const { transaction } = payload;
  const from = payload.account || walletState.activeAccount;
  
  if (!from) {
    return createResponse(false, undefined, 'No account selected');
  }

  // Build message for signing
  const messageBytes = new TextEncoder().encode(
    `${from}${transaction.to}${transaction.value}`
  );

  // Sign the transaction
  const signature = await keyring.signMessage(from, messageBytes);
  const signatureHex = Array.from(signature).map(b => b.toString(16).padStart(2, '0')).join('');

  // Submit to network
  try {
    const result = await rpcHandler.submitTransaction(
      from,
      transaction.to,
      transaction.value,
      signatureHex
    );
    return createResponse(true, result);
  } catch (error) {
    return createResponse(false, undefined, (error as Error).message);
  }
}

// dApp connect
async function handleDAppConnect(origin: string): Promise<MessageResponse> {
  if (!origin) {
    return createResponse(false, undefined, 'No origin specified');
  }

  // For now, auto-approve if unlocked
  // In production, this should create a pending request
  if (walletState.isLocked) {
    return createResponse(false, undefined, 'Wallet is locked');
  }

  // Store connected site
  const stored = await chrome.storage.local.get(STORAGE_KEYS.CONNECTED_SITES);
  const connectedSites = stored[STORAGE_KEYS.CONNECTED_SITES] || [];
  
  if (!connectedSites.includes(origin)) {
    connectedSites.push(origin);
    await chrome.storage.local.set({
      [STORAGE_KEYS.CONNECTED_SITES]: connectedSites,
    });
  }

  return createResponse(true, {
    accounts: walletState.accounts.map(a => a.address),
  });
}

// Get accounts for dApp
function handleDAppGetAccounts(origin: string): MessageResponse {
  if (walletState.isLocked) {
    return createResponse(true, { accounts: [] });
  }

  // Return only public information
  return createResponse(true, {
    accounts: walletState.accounts.map(a => a.address),
  });
}

// Approve pending request
async function handleRequestApprove(payload: { requestId: string }): Promise<MessageResponse> {
  const index = walletState.pendingRequests.findIndex(r => r.id === payload.requestId);
  if (index === -1) {
    return createResponse(false, undefined, 'Request not found');
  }

  const request = walletState.pendingRequests[index];
  walletState.pendingRequests.splice(index, 1);

  // Process the request based on type
  // This would trigger the actual operation
  return createResponse(true, { approved: true });
}

// Reject pending request
function handleRequestReject(payload: { requestId: string; reason?: string }): MessageResponse {
  const index = walletState.pendingRequests.findIndex(r => r.id === payload.requestId);
  if (index === -1) {
    return createResponse(false, undefined, 'Request not found');
  }

  walletState.pendingRequests.splice(index, 1);
  return createResponse(true, { rejected: true, reason: payload.reason });
}

// Sophia AI query handler
async function handleSophiaQuery(payload: SophiaQueryPayload): Promise<MessageResponse> {
  try {
    // Determine the Sophia API endpoint based on network config
    const hubUrl = walletState.network === 'mainnet'
      ? 'https://hub.demiurge.cloud'
      : 'http://localhost:3000';

    const response = await fetch(`${hubUrl}/api/sophia/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: payload.message,
          },
        ],
        // Pass wallet context so Sophia knows the user's state
        systemPrompt: undefined, // Use default
        enableTools: true,
        walletContext: {
          activeAccount: walletState.activeAccount,
          network: walletState.network,
          isLocked: walletState.isLocked,
          ...(payload.context || {}),
        },
      }),
    });

    if (!response.ok) {
      return createResponse(false, undefined, `Sophia API returned ${response.status}`);
    }

    const data = await response.json();

    return createResponse(true, {
      text: data.text || 'Sophia did not return a response.',
      toolsUsed: data.toolsUsed || 0,
    });
  } catch (error) {
    return createResponse(false, undefined, `Failed to reach Sophia: ${(error as Error).message}`);
  }
}

// Listen for messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse);
  return true; // Keep channel open for async response
});

// Listen for external messages (from content scripts)
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  handleMessage({ ...message, origin: sender.origin }, sender).then(sendResponse);
  return true;
});

// Initialize on load
initializeState().then(() => {
  console.log('Demiurge Wallet: Background service worker initialized');
});

// Handle extension install/update
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Demiurge Wallet: Extension installed');
  } else if (details.reason === 'update') {
    console.log('Demiurge Wallet: Extension updated');
  }
});
