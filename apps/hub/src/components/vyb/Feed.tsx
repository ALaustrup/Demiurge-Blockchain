'use client';

import { useState } from 'react';
import { useVYB } from '@/contexts/VYBContext';
import { FeedCard } from './FeedCard';

export function Feed() {
  const { feed, isLoadingFeed, refreshFeed, createPost } = useVYB();
  const [newPostText, setNewPostText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [feedType, setFeedType] = useState<'global' | 'following'>('global');

  const handleCreatePost = async () => {
    if (!newPostText.trim()) return;
    
    setIsPosting(true);
    try {
      await createPost({ text: newPostText.trim() });
      setNewPostText('');
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Post Composer */}
      <div className="glass-panel p-4 rounded-xl">
        <textarea
          value={newPostText}
          onChange={(e) => setNewPostText(e.target.value)}
          placeholder="What's on your mind? Share with the VYB community..."
          className="w-full bg-transparent border-none resize-none focus:outline-none text-white placeholder-gray-500 font-body min-h-[100px]"
          maxLength={500}
        />
        <div className="flex items-center justify-between pt-3 border-t border-gray-800">
          <div className="flex items-center gap-3">
            <button className="text-gray-500 hover:text-neon-cyan transition-colors" title="Add image">
              🖼️
            </button>
            <button className="text-gray-500 hover:text-neon-cyan transition-colors" title="Add video">
              🎥
            </button>
            <button className="text-gray-500 hover:text-neon-cyan transition-colors" title="Add GIF">
              📎
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">{newPostText.length}/500</span>
            <button
              onClick={handleCreatePost}
              disabled={!newPostText.trim() || isPosting}
              className="neon-button px-6 py-2 rounded-lg disabled:opacity-50"
            >
              {isPosting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </div>

      {/* Feed Type Selector */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setFeedType('global')}
          className={`font-grunge-alt text-lg transition-colors ${
            feedType === 'global' ? 'text-neon-cyan' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          🌐 Global
        </button>
        <button
          onClick={() => setFeedType('following')}
          className={`font-grunge-alt text-lg transition-colors ${
            feedType === 'following' ? 'text-neon-cyan' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          👥 Following
        </button>
        <div className="flex-1" />
        <button
          onClick={() => refreshFeed()}
          className="text-gray-500 hover:text-neon-cyan transition-colors"
          title="Refresh feed"
        >
          🔄
        </button>
      </div>

      {/* Feed Items */}
      {isLoadingFeed ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan mx-auto mb-4"></div>
          <p className="text-gray-400">Loading feed...</p>
        </div>
      ) : feed.length === 0 ? (
        <div className="text-center py-12 glass-panel rounded-xl">
          <p className="text-4xl mb-4">📭</p>
          <p className="text-gray-400">No posts yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {feed.map((item) => (
            <FeedCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
