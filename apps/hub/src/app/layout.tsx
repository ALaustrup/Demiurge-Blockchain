import type { Metadata } from 'next'
import { Orbitron, Rajdhani, Space_Grotesk } from 'next/font/google'
import { PersistentHUD } from '@demiurge/ui-shared'
import { BlockchainProvider } from '@/contexts/BlockchainContext'
import { WalletDropdownWrapper } from '@/components/WalletDropdownWrapper'
import { QorIdHeaderWrapper } from '@/components/QorIdHeaderWrapper'
import { BlockchainStatusBanner } from '@/components/BlockchainStatusBanner'
import { VYBChat } from '@/components/VYBChat'
import './globals.css'

// Grunge/Block font for titles and logos
const orbitron = Orbitron({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-orbitron',
  display: 'swap',
})

// Alternative grunge font for variety
const rajdhani = Rajdhani({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-rajdhani',
  display: 'swap',
})

// Elegant body font
const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Demiurge.Cloud - The Metaverse Operating System',
  description: 'The central hub for the Demiurge ecosystem - games, social, and blockchain',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${orbitron.variable} ${rajdhani.variable} ${spaceGrotesk.variable}`}>
      <body className={`${spaceGrotesk.className} font-body`}>
        <BlockchainProvider>
          {/* Animated background with liquid neon glow */}
          <div className="fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#050510]"></div>
            <div className="liquid-glow"></div>
            <div className="neon-grid"></div>
          </div>
          
          <PersistentHUD 
            walletComponent={<WalletDropdownWrapper />}
            qorIdComponent={<QorIdHeaderWrapper />}
          />
          <div className="relative z-10">
            {children}
          </div>
          <BlockchainStatusBanner />
          <VYBChat />
        </BlockchainProvider>
      </body>
    </html>
  )
}
