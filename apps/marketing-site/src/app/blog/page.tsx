'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, ArrowRight, Newspaper } from 'lucide-react'
import { format } from 'date-fns'

// Mock blog posts - in production, this would fetch from a database or API
// that monitors blockchain additions
const mockPosts = [
  {
    id: 1,
    title: 'New Pallet: Fractional Assets Released',
    excerpt: 'The Fractional Assets pallet is now live, enabling NFT fractionalization on the chain.',
    date: new Date('2026-01-15'),
    category: 'Blockchain Updates',
    featured: true,
  },
  {
    id: 2,
    title: 'CGT Staking Rewards Increased',
    excerpt: 'Validator rewards have been increased by 15% for the next era.',
    date: new Date('2026-01-14'),
    category: 'Tokenomics',
    featured: false,
  },
  {
    id: 3,
    title: 'New Game Development SDK Released',
    excerpt: 'Version 2.0 of the Game Development SDK includes improved blockchain integration.',
    date: new Date('2026-01-13'),
    category: 'Developer Tools',
    featured: false,
  },
  {
    id: 4,
    title: 'QOR ID Authentication Improvements',
    excerpt: 'Enhanced security and faster authentication flows for QOR ID.',
    date: new Date('2026-01-12'),
    category: 'Identity',
    featured: false,
  },
]

export default function BlogPage() {
  const [posts, setPosts] = useState(mockPosts)

  // In production, this would fetch from an API that monitors blockchain changes
  useEffect(() => {
    // Fetch latest blockchain updates
    // This would call an API that monitors git commits, pallet additions, etc.
    const fetchUpdates = async () => {
      try {
        // Example: const response = await fetch('/api/chain-news')
        // const data = await response.json()
        // setPosts(data.posts)
      } catch (error) {
        console.error('Failed to fetch chain news:', error)
      }
    }

    fetchUpdates()
    const interval = setInterval(fetchUpdates, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  const featuredPost = posts.find((p) => p.featured) || posts[0]
  const regularPosts = posts.filter((p) => p.id !== featuredPost.id)

  return (
    <div className="min-h-screen py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 mb-4">
            <Newspaper className="w-8 h-8 text-neon-cyan" />
            <h1 className="text-5xl md:text-6xl font-orbitron font-bold neon-text">
              Chain News
            </h1>
          </div>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Stay updated with the latest blockchain updates, features, and announcements
          </p>
        </div>

        {/* Featured Post */}
        {featuredPost && (
          <Link
            href={`/blog/${featuredPost.id}`}
            className="glass-panel p-8 mb-12 hover:scale-[1.02] transition-all duration-300 block"
          >
            <div className="flex items-center space-x-2 mb-4">
              <span className="px-3 py-1 bg-neon-cyan text-blockchain-dark text-xs font-bold rounded-full uppercase">
                Featured
              </span>
              <span className="px-3 py-1 bg-neon-magenta/20 text-neon-magenta text-xs font-medium rounded">
                {featuredPost.category}
              </span>
            </div>
            <h2 className="text-4xl font-orbitron font-bold text-white mb-4">{featuredPost.title}</h2>
            <p className="text-gray-400 text-lg mb-4">{featuredPost.excerpt}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{format(featuredPost.date, 'MMMM d, yyyy')}</span>
              </div>
              <span className="flex items-center space-x-1 text-neon-cyan">
                <span>Read more</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>
        )}

        {/* Regular Posts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {regularPosts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.id}`}
              className="glass-panel p-6 hover:scale-105 transition-all duration-300 block"
            >
              <span className="px-2 py-1 bg-neon-magenta/20 text-neon-magenta text-xs font-medium rounded mb-3 inline-block">
                {post.category}
              </span>
              <h3 className="text-xl font-orbitron font-bold text-white mb-2">{post.title}</h3>
              <p className="text-gray-400 text-sm mb-4">{post.excerpt}</p>
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                <span>{format(post.date, 'MMM d, yyyy')}</span>
              </div>
            </Link>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="glass-panel p-12 text-center">
            <Newspaper className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-2xl font-orbitron font-bold text-gray-400 mb-2">No news yet</h3>
            <p className="text-gray-500">Check back soon for the latest blockchain updates</p>
          </div>
        )}
      </div>
    </div>
  )
}
