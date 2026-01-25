'use client';

import { useState, useEffect } from 'react';
import { useMusic, MusicTrack, Playlist } from '@/contexts/MusicContext';
import { qorAuth } from '@demiurge/qor-sdk';

const API_BASE = process.env.NEXT_PUBLIC_QOR_AUTH_URL || 'https://demiurge.cloud/api/v1';

const GENRES = ['Electronic', 'Ambient', 'Synthwave', 'Lo-Fi', 'Chiptune', 'Orchestral', 'Rock', 'Other'];

export default function MusicPage() {
  const { play, currentTrack, isPlaying, likeTrack, uploadTrack } = useMusic();
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'browse' | 'playlists' | 'upload'>('browse');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  
  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    artist: '',
    file_url: '',
    genre: '',
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const isAuthenticated = qorAuth.isAuthenticated();

  useEffect(() => {
    fetchTracks();
    fetchPlaylists();
  }, [selectedGenre]);

  const fetchTracks = async () => {
    try {
      setLoading(true);
      const url = selectedGenre 
        ? `${API_BASE}/music/tracks?genre=${encodeURIComponent(selectedGenre)}`
        : `${API_BASE}/music/tracks`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTracks(data);
      }
    } catch (err) {
      console.error('Failed to fetch tracks:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaylists = async () => {
    try {
      const response = await fetch(`${API_BASE}/music/playlists`);
      if (response.ok) {
        const data = await response.json();
        setPlaylists(data);
      }
    } catch (err) {
      console.error('Failed to fetch playlists:', err);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.title || !uploadForm.file_url) {
      setUploadError('Title and File URL are required');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      
      await uploadTrack({
        title: uploadForm.title,
        artist: uploadForm.artist || undefined,
        file_url: uploadForm.file_url,
        genre: uploadForm.genre || undefined,
      });

      // Reset form and refresh
      setUploadForm({ title: '', artist: '', file_url: '', genre: '' });
      setActiveTab('browse');
      fetchTracks();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload track');
    } finally {
      setUploading(false);
    }
  };

  const handleLike = async (track: MusicTrack) => {
    if (!isAuthenticated) return;
    try {
      await likeTrack(track.id);
      // Optimistically update UI
      setTracks(prev => prev.map(t => 
        t.id === track.id ? { ...t, likes: t.likes + 1 } : t
      ));
    } catch (err) {
      console.error('Failed to like track:', err);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-demiurge-cyan via-demiurge-violet to-demiurge-gold bg-clip-text text-transparent flex items-center gap-4">
            <span className="text-4xl">🎧</span>
            Demiurge Radio
          </h1>
          <p className="text-xl text-gray-300">
            Community-powered music streaming. Upload, discover, and vibe together.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              activeTab === 'browse'
                ? 'bg-gradient-to-r from-demiurge-cyan to-demiurge-violet text-black'
                : 'glass-panel hover:chroma-glow'
            }`}
          >
            Browse
          </button>
          <button
            onClick={() => setActiveTab('playlists')}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              activeTab === 'playlists'
                ? 'bg-gradient-to-r from-demiurge-cyan to-demiurge-violet text-black'
                : 'glass-panel hover:chroma-glow'
            }`}
          >
            Playlists
          </button>
          {isAuthenticated && (
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-3 rounded-lg font-bold transition-all ${
                activeTab === 'upload'
                  ? 'bg-gradient-to-r from-demiurge-cyan to-demiurge-violet text-black'
                  : 'glass-panel hover:chroma-glow'
              }`}
            >
              Upload
            </button>
          )}
        </div>

        {/* Browse Tab */}
        {activeTab === 'browse' && (
          <>
            {/* Genre filter */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setSelectedGenre(null)}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  !selectedGenre
                    ? 'bg-demiurge-cyan text-black'
                    : 'glass-panel hover:chroma-glow'
                }`}
              >
                All Genres
              </button>
              {GENRES.map(genre => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(selectedGenre === genre ? null : genre)}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    selectedGenre === genre
                      ? 'bg-demiurge-cyan text-black'
                      : 'glass-panel hover:chroma-glow'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>

            {/* Tracks grid */}
            {loading ? (
              <div className="text-center py-20 text-gray-400">Loading tracks...</div>
            ) : tracks.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🎵</div>
                <div className="text-xl text-gray-400 mb-4">No tracks yet</div>
                {isAuthenticated && (
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="glass-panel px-6 py-3 rounded-lg hover:chroma-glow transition-all"
                  >
                    Upload the first track!
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tracks.map(track => (
                  <div
                    key={track.id}
                    className={`glass-panel p-4 rounded-lg transition-all hover:scale-102 ${
                      currentTrack?.id === track.id ? 'ring-2 ring-demiurge-cyan' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Play button / artwork */}
                      <button
                        onClick={() => play(track)}
                        className="w-14 h-14 rounded-lg bg-gradient-to-br from-demiurge-cyan/30 to-demiurge-violet/30 flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform"
                      >
                        {currentTrack?.id === track.id && isPlaying ? (
                          <div className="flex gap-1">
                            <div className="w-1 h-4 bg-demiurge-cyan animate-pulse" />
                            <div className="w-1 h-4 bg-demiurge-cyan animate-pulse delay-75" />
                            <div className="w-1 h-4 bg-demiurge-cyan animate-pulse delay-150" />
                          </div>
                        ) : (
                          <svg className="w-6 h-6 text-demiurge-cyan ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        )}
                      </button>

                      {/* Track info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-white truncate">{track.title}</div>
                        <div className="text-sm text-gray-400 truncate">
                          {track.artist || 'Unknown Artist'}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                          <span>▶ {track.plays}</span>
                          <span>❤ {track.likes}</span>
                          {track.genre && (
                            <span className="px-2 py-0.5 bg-gray-700 rounded">{track.genre}</span>
                          )}
                        </div>
                      </div>

                      {/* Like button */}
                      {isAuthenticated && (
                        <button
                          onClick={() => handleLike(track)}
                          className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          ❤
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Playlists Tab */}
        {activeTab === 'playlists' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map(playlist => (
              <div
                key={playlist.id}
                className="glass-panel p-6 rounded-lg hover:scale-105 transition-transform cursor-pointer"
              >
                <div className="w-full aspect-square rounded-lg bg-gradient-to-br from-demiurge-cyan/20 to-demiurge-violet/20 flex items-center justify-center text-6xl mb-4">
                  {playlist.is_global ? '📻' : '🎶'}
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{playlist.name}</h3>
                <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                  {playlist.description || 'No description'}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{playlist.track_count} tracks</span>
                  {playlist.is_global && (
                    <span className="text-demiurge-cyan">Global Playlist</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && isAuthenticated && (
          <div className="max-w-xl mx-auto">
            <div className="glass-panel p-8 rounded-lg">
              <h2 className="text-2xl font-bold mb-6 text-center">Upload a Track</h2>
              
              {uploadError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-400 text-sm">
                  {uploadError}
                </div>
              )}

              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Title *</label>
                  <input
                    type="text"
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-demiurge-cyan focus:outline-none"
                    placeholder="Track title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Artist</label>
                  <input
                    type="text"
                    value={uploadForm.artist}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, artist: e.target.value }))}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-demiurge-cyan focus:outline-none"
                    placeholder="Artist name"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Audio File URL *</label>
                  <input
                    type="url"
                    value={uploadForm.file_url}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, file_url: e.target.value }))}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-demiurge-cyan focus:outline-none"
                    placeholder="https://example.com/track.mp3"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload your audio to IPFS or a file hosting service, then paste the URL here.
                  </p>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Genre</label>
                  <select
                    value={uploadForm.genre}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, genre: e.target.value }))}
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:border-demiurge-cyan focus:outline-none"
                  >
                    <option value="">Select genre</option>
                    {GENRES.map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full py-3 bg-gradient-to-r from-demiurge-cyan to-demiurge-violet text-black font-bold rounded-lg hover:opacity-80 transition-all disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload Track'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Add padding at bottom for music player */}
      <div className="h-32" />
    </main>
  );
}
