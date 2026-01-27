'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════════════════
// HOLOGRAPHIC CARD - Reusable glass-panel component with hover effects
// ═══════════════════════════════════════════════════════════════════════════

interface HolographicCardProps {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'elevated' | 'compact';
  glow?: 'holographic' | 'cyan' | 'magenta' | 'none';
  animate?: boolean;
}

export function HolographicCard({
  children,
  className = '',
  href,
  onClick,
  variant = 'default',
  glow = 'holographic',
  animate = true,
}: HolographicCardProps) {
  const baseClasses = `
    relative overflow-hidden rounded-xl
    backdrop-blur-xl
    border border-white/10
    transition-all duration-300
    ${variant === 'elevated' ? 'p-6' : variant === 'compact' ? 'p-3' : 'p-4'}
  `;

  const glowClasses = {
    holographic: 'hover:border-holographic/40 hover:shadow-holo',
    cyan: 'hover:border-data-cyan/40 hover:shadow-data',
    magenta: 'hover:border-data-magenta/40',
    none: '',
  };

  const bgStyles = {
    background: 'rgba(40, 28, 85, 0.3)',
  };

  const content = (
    <motion.div
      className={`${baseClasses} ${glowClasses[glow]} ${className}`}
      style={bgStyles}
      initial={animate ? { opacity: 0, y: 20 } : false}
      animate={animate ? { opacity: 1, y: 0 } : false}
      whileHover={animate ? { scale: 1.02, y: -4 } : undefined}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onClick={onClick}
    >
      {/* Top highlight line */}
      <div 
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(205, 171, 195, 0.5) 50%, transparent 100%)',
        }}
      />
      
      {/* Content */}
      {children}

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-4 h-4 border-l border-t border-holographic/30" />
      <div className="absolute top-0 right-0 w-4 h-4 border-r border-t border-holographic/30" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-l border-b border-holographic/30" />
      <div className="absolute bottom-0 right-0 w-4 h-4 border-r border-b border-holographic/30" />
    </motion.div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

// ═══════════════════════════════════════════════════════════════════════════
// SYSTEM MODULE CARD - For dashboard system entries
// ═══════════════════════════════════════════════════════════════════════════

interface SystemModuleProps {
  icon: string;
  title: string;
  value?: string | number;
  subtitle?: string;
  href: string;
  status?: 'online' | 'offline' | 'syncing';
  delay?: number;
}

export function SystemModuleCard({
  icon,
  title,
  value,
  subtitle,
  href,
  status = 'online',
  delay = 0,
}: SystemModuleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
    >
      <Link href={href}>
        <div className="system-card group cursor-pointer h-full">
          {/* Status indicator */}
          <div className="absolute top-4 right-4">
            <div 
              className={`w-2 h-2 rounded-full ${
                status === 'online' ? 'bg-data-green' :
                status === 'syncing' ? 'bg-data-cyan animate-pulse' :
                'bg-red-500'
              }`}
              style={{
                boxShadow: status === 'online' 
                  ? '0 0 10px #00FF88' 
                  : status === 'syncing'
                    ? '0 0 10px #00D4FF'
                    : '0 0 10px #FF4444',
              }}
            />
          </div>
          
          {/* Icon */}
          <div className="system-card-icon text-5xl mb-4 group-hover:scale-110 transition-transform">
            {icon}
          </div>
          
          {/* Title */}
          <h3 className="system-card-title">{title}</h3>
          
          {/* Value */}
          {value !== undefined && (
            <div className="system-card-value">{value}</div>
          )}
          
          {/* Subtitle */}
          {subtitle && (
            <p className="text-sm text-lavender mt-1">{subtitle}</p>
          )}
          
          {/* Hover arrow */}
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-holographic">→</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA DISPLAY CARD - For real-time blockchain data
// ═══════════════════════════════════════════════════════════════════════════

interface DataDisplayProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  className?: string;
}

export function DataDisplay({ label, value, unit, trend, className = '' }: DataDisplayProps) {
  return (
    <div className={`flex flex-col ${className}`}>
      <span className="text-xs text-lavender uppercase tracking-wider mb-1">
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span className="data-ticker text-xl font-bold">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && <span className="text-xs text-lavender">{unit}</span>}
        {trend && (
          <span className={`text-xs ml-2 ${
            trend === 'up' ? 'text-data-green' : 
            trend === 'down' ? 'text-red-400' : 
            'text-lavender'
          }`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
        )}
      </div>
    </div>
  );
}

export default HolographicCard;
