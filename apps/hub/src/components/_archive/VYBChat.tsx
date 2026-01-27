'use client';

import { useState, useEffect, useRef } from 'react';
import { qorAuth } from '@demiurge/qor-sdk';
import { demiurgeRpc } from '@/lib/demiurge-rpc';

interface ChatMessage {
  id: string;
  qorId: string;
  message: string;
  timestamp: Date;
  avatar?: string;
  tip?: {
    amount: number;
    recipient: string;
  };
  messageType?: 'chat' | 'tip' | 'service' | 'nft';
}

interface UserProfile {
  qorId: string;
  role?: 'creator' | 'developer' | 'artist' | 'musician' | 'designer' | 'user';
  cgtBalance?: string;
  services?: ServiceListing[];
}

interface ServiceListing {
  id: string;
  title: string;
  description: string;
  price: number; // in CGT
  category: 'game-design' | 'web-design' | 'graphics' | 'music' | 'art' | 'other';
}

export function VYBChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'creators' | 'services'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [currentUserAddress, setCurrentUserAddress] = useState<string | null>(null);
  const [cgtBalance, setCgtBalance] = useState<string>('0');
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipRecipient, setTipRecipient] = useState<string | null>(null);
  const [tipAmount, setTipAmount] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock creators for the social network
  const [creators] = useState<UserProfile[]>([
    { qorId: 'artist#0042', role: 'artist', services: [
      { id: '1', title: 'Custom NFT Art', description: 'Hand-drawn digital art for your NFTs', price: 50, category: 'art' }
    ]},
    { qorId: 'musician#0088', role: 'musician', services: [
      { id: '2', title: 'Game Soundtrack', description: '8-bit or orchestral game music', price: 100, category: 'music' }
    ]},
    { qorId: 'dev#0101', role: 'developer', services: [
      { id: '3', title: 'Phaser Game Dev', description: 'Build your browser game', price: 200, category: 'game-design' }
    ]},
    { qorId: 'designer#0033', role: 'designer', services: [
      { id: '4', title: 'UI/UX Design', description: 'Modern web app interfaces', price: 75, category: 'web-design' }
    ]},
  ]);

  useEffect(() => {
    // Get current user's QOR ID and wallet
    const loadUser = async () => {
      try {
        const profile = await qorAuth.getProfile();
        setCurrentUser(profile.qor_id || 'Anonymous');
        // Generate wallet address from user ID (simplified for MVP)
        if (profile.id) {
          const walletAddress = `0x${profile.id.slice(0, 40).padEnd(40, '0')}`;
          setCurrentUserAddress(walletAddress);
          // Load CGT balance
          try {
            const balance = await demiurgeRpc.getBalance(walletAddress);
            setCgtBalance(balance);
          } catch {
            setCgtBalance('0');
          }
        }
      } catch (error) {
        setCurrentUser('Anonymous');
      }
    };
    loadUser();

    // Load initial messages (mock data for now)
    setMessages([
      {
        id: '1',
        qorId: 'system#0001',
        message: 'Welcome to VYB - The Creator Economy Platform',
        timestamp: new Date(),
        messageType: 'chat',
      },
      {
        id: '2',
        qorId: 'artist#0042',
        message: 'Just finished a new NFT collection! Check out my services 🎨',
        timestamp: new Date(Date.now() - 300000),
        messageType: 'chat',
      },
      {
        id: '3',
        qorId: 'player#1234',
        message: '',
        timestamp: new Date(Date.now() - 180000),
        messageType: 'tip',
        tip: { amount: 10, recipient: 'artist#0042' },
      },
      {
        id: '4',
        qorId: 'musician#0088',
        message: 'Thanks for the tip! Working on some new tracks for games 🎵',
        timestamp: new Date(Date.now() - 60000),
        messageType: 'chat',
      },
    ]);
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputMessage.trim() || !currentUser) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      qorId: currentUser,
      message: inputMessage.trim(),
      timestamp: new Date(),
      messageType: 'chat',
    };

    setMessages([...messages, newMessage]);
    setInputMessage('');

    // TODO: Send message to backend/blockchain
    // This would integrate with the VYB social platform backend
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTip = (recipientQorId: string) => {
    setTipRecipient(recipientQorId);
    setTipAmount('');
    setShowTipModal(true);
  };

  const sendTip = async () => {
    if (!tipRecipient || !tipAmount || !currentUser) return;

    const amount = parseFloat(tipAmount);
    if (isNaN(amount) || amount <= 0) return;

    // Add tip message to chat
    const tipMessage: ChatMessage = {
      id: Date.now().toString(),
      qorId: currentUser,
      message: '',
      timestamp: new Date(),
      messageType: 'tip',
      tip: { amount, recipient: tipRecipient },
    };

    setMessages([...messages, tipMessage]);
    setShowTipModal(false);
    setTipRecipient(null);
    setTipAmount('');

    // TODO: Execute actual CGT transfer via blockchain
    // await demiurgeRpc.transfer(currentUserAddress, recipientAddress, amount * 100, signature);
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'artist': return '🎨';
      case 'musician': return '🎵';
      case 'developer': return '💻';
      case 'designer': return '✨';
      case 'creator': return '🎬';
      default: return '👤';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'art': return 'from-pink-500 to-purple-500';
      case 'music': return 'from-green-500 to-teal-500';
      case 'game-design': return 'from-blue-500 to-cyan-500';
      case 'web-design': return 'from-orange-500 to-yellow-500';
      case 'graphics': return 'from-red-500 to-pink-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setIsMinimized(false);
        }}
        className={`fixed bottom-6 right-6 z-50 neon-button rounded-full w-16 h-16 flex items-center justify-center transition-all duration-300 ${
          isOpen ? 'rotate-180' : ''
        }`}
        aria-label="Toggle VYB Chat"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        {/* Notification Badge */}
        {messages.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-neon-pink rounded-full flex items-center justify-center text-xs font-bold text-white animate-pulse">
            {messages.length > 9 ? '9+' : messages.length}
          </span>
        )}
      </button>

      {/* Tip Modal */}
      {showTipModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-panel liquid-border p-6 rounded-xl w-80">
            <h3 className="font-grunge-alt text-neon-cyan text-xl mb-4">
              Send CGT Tip
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Tip <span className="text-neon-purple">{tipRecipient}</span>
            </p>
            <div className="mb-4">
              <label className="text-xs text-gray-500 mb-1 block">Amount (CGT)</label>
              <input
                type="number"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0.01"
                className="w-full bg-blockchain-light/50 border border-neon-cyan/30 rounded-lg px-4 py-2 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your balance: {(Number(cgtBalance) / 100).toFixed(2)} CGT
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowTipModal(false)}
                className="flex-1 glass-panel py-2 rounded-lg hover:border-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sendTip}
                disabled={!tipAmount || parseFloat(tipAmount) <= 0}
                className="flex-1 neon-button py-2 rounded-lg disabled:opacity-50"
              >
                Send Tip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed bottom-24 right-6 z-40 glass-panel liquid-border ${
            isMinimized ? 'h-16' : 'h-[550px]'
          } w-[420px] flex flex-col transition-all duration-300 shadow-2xl`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neon-cyan/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center font-grunge text-lg">
                VYB
              </div>
              <div>
                <h3 className="font-grunge-alt text-neon-cyan">VYB Social</h3>
                <p className="text-xs text-gray-400 font-body">
                  Creator Economy • {(Number(cgtBalance) / 100).toFixed(2)} CGT
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-gray-400 hover:text-neon-cyan transition-colors"
                aria-label={isMinimized ? 'Maximize' : 'Minimize'}
              >
                {isMinimized ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-red-400 transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabs */}
          {!isMinimized && (
            <div className="flex border-b border-neon-cyan/20">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-2 text-sm font-body transition-colors ${
                  activeTab === 'chat' 
                    ? 'text-neon-cyan border-b-2 border-neon-cyan' 
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                💬 Chat
              </button>
              <button
                onClick={() => setActiveTab('creators')}
                className={`flex-1 py-2 text-sm font-body transition-colors ${
                  activeTab === 'creators' 
                    ? 'text-neon-cyan border-b-2 border-neon-cyan' 
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                ⭐ Creators
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`flex-1 py-2 text-sm font-body transition-colors ${
                  activeTab === 'services' 
                    ? 'text-neon-cyan border-b-2 border-neon-cyan' 
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                🛠️ Services
              </button>
            </div>
          )}

          {/* Content Area */}
          {!isMinimized && (
            <>
              {/* Chat Tab */}
              {activeTab === 'chat' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id}>
                      {/* Tip Message */}
                      {msg.messageType === 'tip' && msg.tip && (
                        <div className="flex justify-center">
                          <div className="bg-green-900/30 border border-green-500/30 rounded-full px-4 py-2 text-sm">
                            <span className="text-green-400">💰</span>
                            <span className="text-gray-300 mx-2">
                              <span className="text-neon-cyan">{msg.qorId}</span> tipped{' '}
                              <span className="text-neon-purple">{msg.tip.recipient}</span>
                            </span>
                            <span className="text-green-400 font-bold">{msg.tip.amount} CGT</span>
                          </div>
                        </div>
                      )}
                      
                      {/* Regular Chat Message */}
                      {msg.messageType === 'chat' && (
                        <div
                          className={`flex gap-3 ${
                            msg.qorId === currentUser ? 'flex-row-reverse' : ''
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan/50 to-neon-purple/50 flex items-center justify-center text-xs font-grunge-alt flex-shrink-0">
                            {msg.qorId.charAt(0).toUpperCase()}
                          </div>
                          <div
                            className={`flex-1 ${
                              msg.qorId === currentUser ? 'items-end' : 'items-start'
                            } flex flex-col`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-grunge-alt text-neon-cyan">
                                {msg.qorId}
                              </span>
                              <span className="text-xs text-gray-500 font-body">
                                {msg.timestamp.toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {msg.qorId !== currentUser && msg.qorId !== 'system#0001' && (
                                <button
                                  onClick={() => handleTip(msg.qorId)}
                                  className="text-xs text-green-400 hover:text-green-300 transition-colors"
                                  title="Send CGT tip"
                                >
                                  💰 Tip
                                </button>
                              )}
                            </div>
                            <div
                              className={`glass-panel p-3 rounded-lg max-w-[80%] ${
                                msg.qorId === currentUser
                                  ? 'bg-neon-cyan/10 border-neon-cyan/30'
                                  : 'bg-blockchain-light/50 border-neon-purple/20'
                              }`}
                            >
                              <p className="text-sm font-body text-white leading-relaxed">
                                {msg.message}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}

              {/* Creators Tab */}
              {activeTab === 'creators' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <p className="text-xs text-gray-500 mb-2">Discover talented creators</p>
                  {creators.map((creator) => (
                    <div key={creator.qorId} className="glass-panel p-3 rounded-lg hover:border-neon-cyan/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-cyan/50 to-neon-purple/50 flex items-center justify-center text-lg">
                            {getRoleIcon(creator.role)}
                          </div>
                          <div>
                            <p className="font-grunge-alt text-neon-cyan text-sm">{creator.qorId}</p>
                            <p className="text-xs text-gray-400 capitalize">{creator.role}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleTip(creator.qorId)}
                          className="neon-button px-3 py-1 rounded text-xs"
                        >
                          💰 Tip
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Services Tab */}
              {activeTab === 'services' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <p className="text-xs text-gray-500 mb-2">Hire creators for your projects</p>
                  {creators.flatMap(c => c.services || []).map((service) => (
                    <div key={service.id} className="glass-panel p-4 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-grunge-alt text-white text-sm">{service.title}</h4>
                          <p className="text-xs text-gray-400">{service.description}</p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs bg-gradient-to-r ${getCategoryColor(service.category)} text-white`}>
                          {service.category.replace('-', ' ')}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-neon-cyan font-bold">{service.price} CGT</p>
                        <button className="neon-button px-4 py-1 rounded text-xs">
                          Hire
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Input - Only show for chat tab */}
              {activeTab === 'chat' && (
                <div className="p-4 border-t border-neon-cyan/30">
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type a message..."
                      className="flex-1 bg-blockchain-light/50 border border-neon-cyan/30 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/20 font-body"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!inputMessage.trim()}
                      className="neon-button rounded-lg px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
