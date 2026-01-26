'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useVYB } from '@/contexts/VYBContext';
import { useEffect, useState } from 'react';
import { ProfileCustomizer, MediaGallery } from '@/components/vyb';
import Link from 'next/link';

export default function MyProfilePage() {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();
  const { profile, updateProfile, gallery } = useVYB();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    role: 'user' as string,
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (profile) {
      setEditForm({
        displayName: profile.displayName,
        bio: profile.bio,
        role: profile.role,
      });
    }
  }, [profile]);

  const handleSave = async () => {
    await updateProfile({
      displayName: editForm.displayName,
      bio: editForm.bio,
      role: editForm.role as any,
    });
    setIsEditing(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan"></div>
      </main>
    );
  }

  if (!isAuthenticated || !profile) return null;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'artist': return '🎨';
      case 'musician': return '🎵';
      case 'developer': return '💻';
      case 'designer': return '✨';
      case 'gamer': return '🎮';
      case 'creator': return '🎬';
      case 'collector': return '💎';
      default: return '👤';
    }
  };

  return (
    <main className="min-h-screen">
      {/* Cover Image */}
      <div 
        className="h-48 md:h-64 relative"
        style={{
          background: `linear-gradient(135deg, ${profile.theme.primaryColor}, ${profile.theme.secondaryColor})`
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-blockchain-dark/80 to-transparent" />
        <div className="absolute top-4 right-4 flex gap-2">
          <ProfileCustomizer />
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="glass-panel p-3 rounded-lg hover:border-neon-cyan/50 transition-colors"
          >
            ✏️ Edit Profile
          </button>
        </div>
      </div>

      {/* Profile Header */}
      <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Avatar */}
          <div 
            className="w-32 h-32 rounded-full border-4 bg-gradient-to-br from-neon-cyan/50 to-neon-purple/50 flex items-center justify-center text-5xl"
            style={{ borderColor: profile.theme.backgroundColor }}
          >
            {profile.avatar ? (
              <img src={profile.avatar} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              getRoleIcon(profile.role)
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                  className="bg-blockchain-light/50 border border-neon-cyan/30 rounded-lg px-4 py-2 text-white text-xl font-grunge-alt w-full max-w-md"
                  placeholder="Display Name"
                />
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="bg-blockchain-light/50 border border-neon-cyan/30 rounded-lg px-4 py-2 text-white w-full max-w-lg resize-none"
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="bg-blockchain-light/50 border border-neon-cyan/30 rounded-lg px-4 py-2 text-white"
                >
                  <option value="user">User</option>
                  <option value="creator">Creator</option>
                  <option value="artist">Artist</option>
                  <option value="musician">Musician</option>
                  <option value="developer">Developer</option>
                  <option value="designer">Designer</option>
                  <option value="gamer">Gamer</option>
                  <option value="collector">Collector</option>
                </select>
                <div className="flex gap-2">
                  <button onClick={handleSave} className="neon-button px-4 py-2 rounded-lg">
                    Save
                  </button>
                  <button onClick={() => setIsEditing(false)} className="glass-panel px-4 py-2 rounded-lg">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-grunge text-white flex items-center gap-2">
                  {profile.displayName}
                  {profile.isVerified && <span className="text-blue-400">✓</span>}
                </h1>
                <p className="text-gray-500">@{profile.qorId}</p>
                <p className="text-gray-400 mt-2 max-w-lg">{profile.bio}</p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-sm" style={{ color: profile.theme.primaryColor }}>
                    {getRoleIcon(profile.role)} <span className="capitalize">{profile.role}</span>
                  </span>
                  <span className="text-gray-500 text-sm">
                    Joined {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-2xl font-grunge" style={{ color: profile.theme.primaryColor }}>
                {profile.stats.followers}
              </p>
              <p className="text-gray-500 text-sm">Followers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-grunge" style={{ color: profile.theme.secondaryColor }}>
                {profile.stats.following}
              </p>
              <p className="text-gray-500 text-sm">Following</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-grunge text-green-400">
                {profile.stats.cgtEarned}
              </p>
              <p className="text-gray-500 text-sm">CGT</p>
            </div>
          </div>
        </div>

        {/* Badges */}
        {profile.badges.length > 0 && (
          <div className="mt-6 glass-panel p-4 rounded-xl">
            <h3 className="font-grunge-alt text-lg text-neon-cyan mb-3">🏆 Badges</h3>
            <div className="flex flex-wrap gap-3">
              {profile.badges.map((badge) => (
                <div 
                  key={badge.id} 
                  className="flex items-center gap-2 bg-blockchain-light/50 px-3 py-2 rounded-lg"
                  title={badge.description}
                >
                  <span className="text-xl">{badge.icon}</span>
                  <div>
                    <p className="text-white text-sm">{badge.name}</p>
                    <p className="text-gray-500 text-xs capitalize">{badge.tier}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="glass-panel p-4 rounded-xl text-center">
            <p className="text-3xl font-grunge text-blue-400">{profile.stats.gamesPlayed}</p>
            <p className="text-gray-500 text-sm">Games Played</p>
          </div>
          <div className="glass-panel p-4 rounded-xl text-center">
            <p className="text-3xl font-grunge text-yellow-400">{profile.stats.achievementsUnlocked}</p>
            <p className="text-gray-500 text-sm">Achievements</p>
          </div>
          <div className="glass-panel p-4 rounded-xl text-center">
            <p className="text-3xl font-grunge text-purple-400">{profile.stats.nftsOwned}</p>
            <p className="text-gray-500 text-sm">NFTs Owned</p>
          </div>
          <div className="glass-panel p-4 rounded-xl text-center">
            <p className="text-3xl font-grunge text-pink-400">{profile.stats.nftsCreated}</p>
            <p className="text-gray-500 text-sm">NFTs Created</p>
          </div>
        </div>

        {/* Social Links */}
        {Object.values(profile.socialLinks).some(v => v) && (
          <div className="mt-6 flex gap-3">
            {profile.socialLinks.website && (
              <a href={profile.socialLinks.website} target="_blank" rel="noopener noreferrer" className="glass-panel p-3 rounded-lg hover:border-neon-cyan/50 transition-colors">
                🌐
              </a>
            )}
            {profile.socialLinks.twitter && (
              <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="glass-panel p-3 rounded-lg hover:border-blue-400/50 transition-colors">
                🐦
              </a>
            )}
            {profile.socialLinks.discord && (
              <a href={profile.socialLinks.discord} target="_blank" rel="noopener noreferrer" className="glass-panel p-3 rounded-lg hover:border-indigo-400/50 transition-colors">
                💬
              </a>
            )}
            {profile.socialLinks.github && (
              <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer" className="glass-panel p-3 rounded-lg hover:border-gray-400/50 transition-colors">
                💻
              </a>
            )}
          </div>
        )}

        {/* Media Gallery */}
        <div className="mt-8">
          <MediaGallery />
        </div>

        {/* Back to VYB */}
        <div className="mt-8 text-center">
          <Link href="/social" className="text-neon-cyan hover:text-neon-cyan/80 transition-colors">
            ← Back to VYB
          </Link>
        </div>
      </div>
    </main>
  );
}
