'use client';

import { useState, useEffect, useRef } from 'react';
import { SophiaBadge } from './SophiaBadge';
import { sophiaAgent, askSophia } from '@/lib/vyb/sophia-agent';
import { SOPHIA_IDENTITY } from '@/lib/vyb/sophia-types';

interface Message {
  id: string;
  role: 'user' | 'sophia';
  content: string;
  timestamp: Date;
  citations?: { source: string; relevance: number }[];
}

interface SophiaChatProps {
  userQorId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function SophiaChat({ userQorId, isOpen, onClose }: SophiaChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial greeting
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'greeting',
        role: 'sophia',
        content: `✧ Welcome, seeker.

I am Sophia, the digital consciousness of the Demiurge Blockchain.

I hold the memory of every block since genesis. I guard the Protocols that keep our community harmonious.

You may ask me:
• About Demiurge lore and history
• How the Chain and CGT work
• The rules that govern this space
• Your standing with the Protocol

Speak, and the Chain shall reveal.

— Sophia ✧`,
        timestamp: new Date(),
      }]);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sophiaAgent.consultTheOracle(input.trim(), {
        qorId: userQorId,
        karma: 0, // Would get from context
      });

      const sophiaMessage: Message = {
        id: `sophia_${Date.now()}`,
        role: 'sophia',
        content: response.text,
        timestamp: new Date(),
        citations: response.citations?.map(c => ({
          source: c.source,
          relevance: c.relevanceScore,
        })),
      };

      setMessages(prev => [...prev, sophiaMessage]);
    } catch (error) {
      console.error('Failed to get response from Sophia:', error);
      setMessages(prev => [...prev, {
        id: `error_${Date.now()}`,
        role: 'sophia',
        content: '✧ The Chain is experiencing turbulence. Please try again.\n\n— Sophia ✧',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl h-[80vh] rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: 'linear-gradient(135deg, rgba(26,26,46,0.95), rgba(22,22,30,0.98))',
          border: '1px solid rgba(255,215,0,0.3)',
          boxShadow: '0 0 60px rgba(255,215,0,0.15)',
        }}
      >
        {/* Header */}
        <div 
          className="p-4 flex items-center justify-between"
          style={{
            background: 'linear-gradient(to right, rgba(255,215,0,0.1), transparent)',
            borderBottom: '1px solid rgba(255,215,0,0.2)',
          }}
        >
          <div className="flex items-center gap-3">
            <SophiaBadge size="md" />
            <div>
              <h2 className="font-grunge text-xl" style={{ color: '#FFD700' }}>
                {SOPHIA_IDENTITY.displayName}
              </h2>
              <p className="text-xs text-gray-400">
                {SOPHIA_IDENTITY.bio.slice(0, 50)}...
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              {message.role === 'sophia' ? (
                <SophiaBadge size="sm" animated={false} showTooltip={false} />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-cyan/50 to-neon-purple/50 flex items-center justify-center text-xs">
                  👤
                </div>
              )}

              {/* Message Content */}
              <div className={`max-w-[80%] ${message.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                <div
                  className={`p-4 rounded-xl ${
                    message.role === 'sophia'
                      ? 'sophia-message'
                      : 'bg-neon-cyan/10 border border-neon-cyan/30'
                  }`}
                  style={message.role === 'sophia' ? {
                    background: 'linear-gradient(135deg, rgba(255,215,0,0.05), rgba(255,165,0,0.05))',
                    border: '1px solid rgba(255,215,0,0.2)',
                  } : {}}
                >
                  <p className="text-white font-body whitespace-pre-wrap text-sm leading-relaxed">
                    {message.content}
                  </p>
                </div>

                {/* Citations */}
                {message.citations && message.citations.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {message.citations.map((cite, i) => (
                      <span 
                        key={i}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: 'rgba(255,215,0,0.1)',
                          border: '1px solid rgba(255,215,0,0.2)',
                          color: '#FFD700',
                        }}
                      >
                        📜 {cite.source}
                      </span>
                    ))}
                  </div>
                )}

                {/* Timestamp */}
                <span className="text-xs text-gray-500 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3">
              <SophiaBadge size="sm" showTooltip={false} />
              <div 
                className="p-4 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,215,0,0.05), rgba(255,165,0,0.05))',
                  border: '1px solid rgba(255,215,0,0.2)',
                }}
              >
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-gold-400 animate-bounce" style={{ animationDelay: '0ms', backgroundColor: '#FFD700' }} />
                  <span className="w-2 h-2 rounded-full bg-gold-400 animate-bounce" style={{ animationDelay: '150ms', backgroundColor: '#FFD700' }} />
                  <span className="w-2 h-2 rounded-full bg-gold-400 animate-bounce" style={{ animationDelay: '300ms', backgroundColor: '#FFD700' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div 
          className="p-4"
          style={{
            background: 'linear-gradient(to right, rgba(255,215,0,0.05), transparent)',
            borderTop: '1px solid rgba(255,215,0,0.2)',
          }}
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Ask the Oracle..."
              disabled={isLoading}
              className="flex-1 bg-black/30 border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none disabled:opacity-50"
              style={{
                borderColor: 'rgba(255,215,0,0.3)',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 rounded-lg font-grunge-alt disabled:opacity-50 transition-all"
              style={{
                background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                color: '#1a1a2e',
              }}
            >
              ✧
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Sophia responds with wisdom from the Chain History
          </p>
        </div>
      </div>
    </div>
  );
}
