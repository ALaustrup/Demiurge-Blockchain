'use client';

import Link from 'next/link';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  authorAvatar?: string;
  thumbnail?: string;
  category: string;
  readTime: number;
  publishedAt: string;
  slug: string;
}

// In production, these would come from the blog API or on-chain storage
const MOCK_POSTS: BlogPost[] = [
  {
    id: '1',
    title: 'Understanding CGT Tokenomics',
    excerpt: 'A deep dive into how CGT tokens power the Demiurge ecosystem and how you can earn them.',
    author: 'Demiurge Team',
    category: 'Tokenomics',
    readTime: 5,
    publishedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    slug: 'cgt-tokenomics',
  },
  {
    id: '2',
    title: 'Building Games with ScatterTXT',
    excerpt: 'Learn how to create immersive ASCII-rendered games using our on-chain game engine.',
    author: 'Astra Matrix',
    category: 'Development',
    readTime: 10,
    publishedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    slug: 'scattertxt-guide',
  },
  {
    id: '3',
    title: 'QOR ID: Your On-Chain Identity',
    excerpt: 'Everything you need to know about QOR ID and how it secures your digital identity.',
    author: 'Demiurge Team',
    category: 'Identity',
    readTime: 4,
    publishedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    slug: 'qor-id-guide',
  },
];

export function BlogPanel() {
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'tokenomics': return 'bg-neon-cyan/20 text-neon-cyan';
      case 'development': return 'bg-neon-magenta/20 text-neon-magenta';
      case 'identity': return 'bg-neon-green/20 text-neon-green';
      default: return 'bg-gray-700 text-gray-300';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="glass-panel rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Blog</h3>
        <Link 
          href="/blog" 
          className="text-xs text-neon-cyan hover:underline"
        >
          View All →
        </Link>
      </div>

      <div className="space-y-4">
        {MOCK_POSTS.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="block glass-panel p-4 rounded-lg hover:chroma-glow transition-all group"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(post.category)}`}>
                    {post.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    {post.readTime} min read
                  </span>
                </div>
                <h4 className="font-semibold text-white group-hover:text-neon-cyan transition-colors line-clamp-1">
                  {post.title}
                </h4>
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    By {post.author}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(post.publishedAt)}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
