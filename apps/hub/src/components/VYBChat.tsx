'use client';

import { useState, useEffect, useRef } from 'react';
import { qorAuth } from '@demiurge/qor-sdk';

interface ChatMessage {
  id: string;
  qorId: string;
  message: string;
  timestamp: Date;
  avatar?: string;
}

export function VYBChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Get current user's QOR ID
    const loadUser = async () => {
      try {
        const profile = await qorAuth.getProfile();
        setCurrentUser(profile.qor_id || 'Anonymous');
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
        message: 'Welcome to VYB - The On-Chain Social Platform',
        timestamp: new Date(),
      },
      {
        id: '2',
        qorId: 'player#1234',
        message: 'Hey everyone! Just minted my first DRC-369 asset!',
        timestamp: new Date(Date.now() - 300000),
      },
      {
        id: '3',
        qorId: 'creator#5678',
        message: 'Nice! What game are you playing?',
        timestamp: new Date(Date.now() - 180000),
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

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed bottom-24 right-6 z-40 glass-panel liquid-border ${
            isMinimized ? 'h-16' : 'h-[500px]'
          } w-96 flex flex-col transition-all duration-300 shadow-2xl`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-neon-cyan/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center font-grunge text-lg">
                VYB
              </div>
              <div>
                <h3 className="font-grunge-alt text-neon-cyan">VYB Chat</h3>
                <p className="text-xs text-gray-400 font-body">
                  {messages.length} online
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

          {/* Messages */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
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
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
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
            </>
          )}
        </div>
      )}
    </>
  );
}
