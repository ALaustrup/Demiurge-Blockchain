import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { PersistentHUD } from '@demiurge/ui-shared'
import { BlockchainProvider } from '@/contexts/BlockchainContext'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

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
    <html lang="en">
      <body className={inter.className}>
        <BlockchainProvider>
          <PersistentHUD />
          <div className="pt-20">
            {children}
          </div>
        </BlockchainProvider>
      </body>
    </html>
  )
}
