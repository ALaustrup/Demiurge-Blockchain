import type { Metadata } from 'next'
import { Orbitron, Rajdhani, Space_Grotesk } from 'next/font/google'
import { BlockchainProvider } from '@/contexts/BlockchainContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { MusicProvider } from '@/contexts/MusicContext'
import { VYBProvider } from '@/contexts/VYBContext'
import { VoiceProvider } from '@/contexts/VoiceContext'
import { StarfieldBackground, HeaderBar } from '@/components/Launcher'
import { MusicPlayer } from '@/components/music/MusicPlayer'
import './globals.css'

// ═══════════════════════════════════════════════════════════════════════════
// DEMIURGE OS - Root Layout
// Deep Space Cyber-Noir aesthetic with persistent 3D background
// ═══════════════════════════════════════════════════════════════════════════

// Primary display font
const orbitron = Orbitron({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-orbitron',
  display: 'swap',
})

// Secondary display font
const rajdhani = Rajdhani({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-rajdhani',
  display: 'swap',
})

// Body font
const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Demiurge - The Metaverse Operating System',
  description: 'The central hub for the Demiurge ecosystem - games, social, music, and blockchain',
  keywords: ['blockchain', 'metaverse', 'games', 'music', 'social', 'NFT', 'crypto'],
  authors: [{ name: 'Demiurge Team' }],
  openGraph: {
    title: 'Demiurge - The Metaverse Operating System',
    description: 'Experience the future of digital interaction',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html 
      lang="en" 
      className={`${orbitron.variable} ${rajdhani.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <body className={`${spaceGrotesk.className} font-body`}>
        <AuthProvider>
          <BlockchainProvider>
            <VYBProvider>
              <VoiceProvider>
                <MusicProvider>
                  {/* Persistent 3D Starfield Background */}
                  <StarfieldBackground />
                  
                  {/* Header Navigation */}
                  <HeaderBar />
                  
                  {/* Main Content */}
                  <main className="relative z-10 min-h-screen">
                    {children}
                  </main>
                  
                  {/* Global Music Player */}
                  <MusicPlayer />
                </MusicProvider>
              </VoiceProvider>
            </VYBProvider>
          </BlockchainProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
