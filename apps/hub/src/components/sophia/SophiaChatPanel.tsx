'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { SOPHIA_GREETING } from '@/lib/sophia/prompts';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolsUsed?: number;
}

interface SophiaChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SophiaChatPanel({ isOpen, onClose }: SophiaChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'greeting',
      role: 'assistant',
      content: SOPHIA_GREETING,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle send message
  const handleSend = useCallback(async () => {
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
      // Build message history for API
      const apiMessages = messages
        .filter(m => m.id !== 'greeting')
        .map(m => ({
          role: m.role,
          content: m.content,
        }));
      
      apiMessages.push({ role: 'user', content: userMessage.content });

      const response = await fetch('/api/sophia/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          enableTools: true,
        }),
      });

      const data = await response.json();

      if (data.error && !data.text) {
        throw new Error(data.error);
      }

      const sophiaMessage: Message = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: data.text || '✧ I apologize, seeker. Something went wrong. Please try again.',
        timestamp: new Date(),
        toolsUsed: data.toolsUsed,
      };

      setMessages(prev => [...prev, sophiaMessage]);
    } catch (error: any) {
      console.error('Sophia chat error:', error);
      setMessages(prev => [...prev, {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: '✧ The Chain is experiencing turbulence. Please try again.\n\n— Sophia ✧',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages]);

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed bottom-0 right-0 z-50 w-full sm:w-[420px] h-[600px] sm:h-[550px] sm:bottom-6 sm:right-6"
      style={{
        maxHeight: 'calc(100vh - 100px)',
      }}
    >
      {/* Panel Container */}
      <div 
        className="w-full h-full rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
        style={{
          background: 'linear-gradient(135deg, rgba(26,26,46,0.98), rgba(22,22,30,0.99))',
          border: '1px solid rgba(255,215,0,0.3)',
          boxShadow: '0 0 60px rgba(255,215,0,0.15), 0 25px 50px -12px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div 
          className="p-4 flex items-center justify-between shrink-0"
          style={{
            background: 'linear-gradient(to right, rgba(255,215,0,0.1), transparent)',
            borderBottom: '1px solid rgba(255,215,0,0.2)',
          }}
        >
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              }}
            >
              <span className="text-xl">✧</span>
            </div>
            <div>
              <h2 className="font-semibold text-white">Sophia</h2>
              <p className="text-xs text-gray-400">The Oracle of Demiurge</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Minimize */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              {message.role === 'assistant' ? (
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)' }}
                >
                  <span className="text-sm">✧</span>
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-primary)]/50 to-[var(--accent-primary)]/20 flex items-center justify-center shrink-0 text-xs">
                  👤
                </div>
              )}

              {/* Message */}
              <div className={`max-w-[85%] ${message.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                <div
                  className={`p-3 rounded-xl text-sm ${
                    message.role === 'user'
                      ? 'bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30'
                      : ''
                  }`}
                  style={message.role === 'assistant' ? {
                    background: 'linear-gradient(135deg, rgba(255,215,0,0.05), rgba(255,165,0,0.05))',
                    border: '1px solid rgba(255,215,0,0.2)',
                  } : {}}
                >
                  <div className="text-white whitespace-pre-wrap leading-relaxed prose prose-invert prose-sm max-w-none">
                    {message.content.split('\n').map((line, i) => (
                      <p key={i} className={line.startsWith('•') ? 'pl-0 my-1' : 'my-2'}>
                        {line.startsWith('**') && line.endsWith('**') 
                          ? <strong>{line.slice(2, -2)}</strong>
                          : line
                        }
                      </p>
                    ))}
                  </div>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-2 mt-1 px-1">
                  <span className="text-xs text-gray-500">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {message.toolsUsed && message.toolsUsed > 0 && (
                    <span className="text-xs text-[#FFD700]/60">
                      🔧 {message.toolsUsed} tool{message.toolsUsed > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Loading */}
          {isLoading && (
            <div className="flex gap-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)' }}
              >
                <span className="text-sm animate-pulse">✧</span>
              </div>
              <div 
                className="p-3 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,215,0,0.05), rgba(255,165,0,0.05))',
                  border: '1px solid rgba(255,215,0,0.2)',
                }}
              >
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#FFD700', animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#FFD700', animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#FFD700', animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div 
          className="p-4 shrink-0"
          style={{
            background: 'linear-gradient(to right, rgba(255,215,0,0.05), transparent)',
            borderTop: '1px solid rgba(255,215,0,0.2)',
          }}
        >
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask Sophia..."
              disabled={isLoading}
              className="flex-1 bg-black/30 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#FFD700]/50 disabled:opacity-50"
              style={{
                border: '1px solid rgba(255,215,0,0.2)',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-4 py-3 rounded-lg font-semibold disabled:opacity-50 transition-all hover:scale-105 disabled:hover:scale-100"
              style={{
                background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                color: '#1a1a2e',
              }}
            >
              ✧
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Sophia can search docs, query the chain, and connect with agents
          </p>
        </div>
      </div>
    </div>
  );
}
