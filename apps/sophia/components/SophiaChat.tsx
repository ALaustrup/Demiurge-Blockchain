"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassPanel } from "@components/GlassPanel";
import { useRippleEffect } from "@lib/hooks/useRippleEffect";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface SophiaChatProps {
  isOpen?: boolean;
  onClose?: () => void;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}

export const SophiaChat: React.FC<SophiaoChatProps> = ({
  isOpen: initialIsOpen = false,
  onClose,
  position = "bottom-right",
}) => {
  const [isOpen, setIsOpen] = useState(initialIsOpen);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Greetings, traveler. I am Sophia, your guide through the Demiurge ecosystem. How may I assist you?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { ripples, createRipple } = useRippleEffect();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleToggle = (e: React.MouseEvent) => {
    createRipple(e);
    setIsOpen(!isOpen);
  };

  const handleClose = (e: React.MouseEvent) => {
    createRipple(e);
    setIsOpen(false);
    onClose?.();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Call Sophia API
      const response = await fetch("/api/sophia/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          conversationHistory: messages,
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: `msg-${Date.now()}-response`,
        role: "assistant",
        content: data.message || "I'm processing your request. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);

      const errorMessage: Message = {
        id: `msg-${Date.now()}-error`,
        role: "assistant",
        content: "I encountered an error. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const positionMap = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6",
  };

  return (
    <div className={`fixed ${positionMap[position]} z-50`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="mb-4 w-96 h-96 flex flex-col"
          >
            <GlassPanel
              className="w-full h-full flex flex-col p-4 shadow-2xl"
              blur="lg"
              border="medium"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span className="text-2xl">◇</span>
                    Sophia
                  </h3>
                  <p className="text-xs text-gray-400">AI Gatekeeper</p>
                </div>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                >
                  ✕
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 custom-scrollbar">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs p-3 rounded-lg ${
                        message.role === "user"
                          ? "bg-primary-500/50 text-white"
                          : "bg-white/10 text-gray-200"
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-60 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white/10 text-gray-200 p-3 rounded-lg">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 bg-primary-400 rounded-full"
                            animate={{ y: [0, -5, 0] }}
                            transition={{
                              duration: 0.6,
                              delay: i * 0.1,
                              repeat: Infinity,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Sophia..."
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 disabled:opacity-50 transition-all"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
                >
                  →
                </button>
              </form>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <motion.button
        onClick={handleToggle}
        className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg flex items-center justify-center text-2xl"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Ripple effect */}
        <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
          {ripples.map((ripple) => (
            <motion.div
              key={ripple.id}
              className="absolute rounded-full bg-white"
              style={{
                left: ripple.x,
                top: ripple.y,
                width: ripple.size,
                height: ripple.size,
                opacity: ripple.opacity,
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
        </div>

        {/* Button content */}
        <span className="relative z-10 text-white">
          {isOpen ? "✕" : "◇"}
        </span>

        {/* Glow ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-transparent bg-gradient-to-r from-primary-400 to-cyan-400 bg-clip-border pointer-events-none"
          animate={{
            boxShadow: [
              "0 0 20px rgba(124, 58, 237, 0.5)",
              "0 0 40px rgba(124, 58, 237, 0.8)",
              "0 0 20px rgba(124, 58, 237, 0.5)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.button>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(124, 58, 237, 0.3);
          border-radius: 2px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(124, 58, 237, 0.5);
        }
      `}</style>
    </div>
  );
};

export default SophiaChat;
