'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useVYB } from '@/contexts/VYBContext';
import { useEffect, useState } from 'react';
import { 
  ProfileCustomizer, 
  MediaGallery, 
  ProfileWall, 
  TopFriends, 
  MoodStatus, 
  AboutMe 
} from '@/components/vyb';
import Link from 'next/link';

type ProfileTabType = 'wall' | 'about' | 'photos' | 'friends' | 'nfts' | 'games';

export default function MyProfilePage() {
  const { user } = useAuth();
  const { profile, updateProfile, gallery } = useVYB();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTabType>('wall');
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    role: 'user' as string,
  });

  // NOTE: No redirect needed - AuthGate ensures users are authenticated before reaching this page

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

  if (!profile) {
    return (
      <main className="min-h-screen p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-cyan"></div>
      </main>
    );
  }

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

  const profileTabs: { id: ProfileTabType; label: string; icon: string }[] = [
    { id: 'wall', label: 'Wall', icon: '📝' },
    { id: 'about', label: 'About', icon: '📖' },
    { id: 'photos', label: 'Photos', icon: '📸' },
    { id: 'friends', label: 'Friends', icon: '👥' },
    { id: 'nfts', label: 'NFTs', icon: '💎' },
    { id: 'games', label: 'Games', icon: '🎮' },
  ];

  return (
    <main className="min-h-screen">
      {/* Cover Image */}
      <div 
        className="h-48 md:h-72 relative"
        style={{
          background: `linear-gradient(135deg, ${profile.theme.primaryColor}, ${profile.theme.secondaryColor})`
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-blockchain-dark/90 to-transparent" />
        
        {/* Back Button */}
        <Link 
          href="/social" 
          className="absolute top-4 left-4 glass-panel px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
        >
          ← Back to VYB
        </Link>

        {/* Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <ProfileCustomizer />
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="glass-panel px-4 py-2 rounded-lg hover:border-neon-cyan/50 transition-colors text-sm"
          >
            ✏️ Edit Profile
          </button>
        </div>
      </div>

      {/* Profile Header */}
      <div className="max-w-6xl mx-auto px-4 -mt-20 relative z-10">
        <div className="glass-panel rounded-xl p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div 
                className="w-32 h-32 md:w-40 md:h-40 rounded-xl border-4 bg-gradient-to-br from-neon-cyan/50 to-neon-purple/50 flex items-center justify-center text-5xl md:text-6xl shadow-lg"
                style={{ borderColor: profile.theme.primaryColor }}
              >
                {profile.avatar ? (
                  <img src={profile.avatar} alt="" className="w-full h-full rounded-lg object-cover" />
                ) : (
                  getRoleIcon(profile.role)
                )}
              </div>
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
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-3xl md:text-4xl font-grunge text-white flex items-center gap-2">
                        {profile.displayName}
                        {profile.isVerified && <span className="text-blue-400 text-lg">✓</span>}
                      </h1>
                      <p className="text-gray-500">@{profile.qorId}</p>
                    </div>
                    
                    {/* Stats Row */}
                    <div className="hidden md:flex items-center gap-6">
                      <Link href="/social/friends" className="text-center hover:opacity-80 transition-opacity">
                        <p className="text-2xl font-grunge" style={{ color: profile.theme.primaryColor }}>
                          142
                        </p>
                        <p className="text-gray-500 text-sm">Friends</p>
                      </Link>
                      <div className="text-center">
                        <p className="text-2xl font-grunge" style={{ color: profile.theme.secondaryColor }}>
                          {profile.stats.followers}
                        </p>
                        <p className="text-gray-500 text-sm">Followers</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-grunge text-green-400">
                          {profile.stats.cgtEarned}
                        </p>
                        <p className="text-gray-500 text-sm">CGT</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-grunge text-yellow-400">
                          847
                        </p>
                        <p className="text-gray-500 text-sm">Views</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-3 flex-wrap">
                    <span className="text-sm flex items-center gap-1" style={{ color: profile.theme.primaryColor }}>
                      {getRoleIcon(profile.role)} <span className="capitalize">{profile.role}</span>
                    </span>
                    <span className="text-gray-600">•</span>
                    <span className="text-gray-500 text-sm">
                      📍 Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                    {/* Social Links */}
                    {profile.socialLinks.twitter && (
                      <a href={profile.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-400 transition-colors">
                        🐦
                      </a>
                    )}
                    {profile.socialLinks.discord && (
                      <a href={profile.socialLinks.discord} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-indigo-400 transition-colors">
                        💬
                      </a>
                    )}
                    {profile.socialLinks.github && (
                      <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">
                        💻
                      </a>
                    )}
                  </div>

                  {/* Mobile Stats */}
                  <div className="flex md:hidden items-center gap-4 mt-4">
                    <div className="text-center">
                      <p className="text-lg font-grunge" style={{ color: profile.theme.primaryColor }}>142</p>
                      <p className="text-gray-500 text-xs">Friends</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-grunge" style={{ color: profile.theme.secondaryColor }}>{profile.stats.followers}</p>
                      <p className="text-gray-500 text-xs">Followers</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-grunge text-green-400">{profile.stats.cgtEarned}</p>
                      <p className="text-gray-500 text-xs">CGT</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mood Status */}
          <div className="mt-6 border-t border-gray-800 pt-6">
            <MoodStatus isOwnProfile={true} />
          </div>

          {/* Profile Tabs */}
          <div className="mt-6 flex gap-2 overflow-x-auto border-t border-gray-800 pt-4">
            {profileTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-lg font-body transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-neon-cyan/20 border border-neon-cyan text-neon-cyan'
                    : 'text-gray-500 hover:text-gray-300 border border-transparent'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'wall' && (
              <ProfileWall 
                profileId={profile.qorId} 
                profileName={profile.displayName}
                isOwnProfile={true}
              />
            )}

            {activeTab === 'about' && <AboutMe isOwnProfile={true} />}

            {activeTab === 'photos' && <MediaGallery />}

            {activeTab === 'friends' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-grunge-alt text-2xl text-white">👥 Friends (142)</h2>
                  <Link href="/social/friends" className="text-neon-cyan hover:underline text-sm">
                    See all →
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { name: 'CryptoArtist', role: 'artist', icon: '🎨', online: true },
                    { name: 'BlockDev', role: 'developer', icon: '💻', online: true },
                    { name: 'SynthMaster', role: 'musician', icon: '🎵', online: false },
                    { name: 'PixelKing', role: 'gamer', icon: '🎮', online: true },
                    { name: 'NFTQueen', role: 'collector', icon: '💎', online: false },
                    { name: 'CosmicWolf', role: 'creator', icon: '🎬', online: true },
                  ].map((friend, i) => (
                    <Link
                      key={i}
                      href={`/social/profile/${friend.name.toLowerCase()}`}
                      className="glass-panel p-4 rounded-xl text-center hover:border-neon-cyan/30 transition-colors group"
                    >
                      <div className="relative inline-block">
                        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-neon-cyan/50 to-neon-purple/50 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                          {friend.icon}
                        </div>
                        {friend.online && (
                          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-blockchain-dark" />
                        )}
                      </div>
                      <p className="text-white mt-2 group-hover:text-neon-cyan transition-colors">{friend.name}</p>
                      <p className="text-gray-500 text-xs capitalize">{friend.role}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'nfts' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-grunge-alt text-2xl text-white">💎 NFT Collection ({profile.stats.nftsOwned})</h2>
                  <Link href="/marketplace" className="text-neon-cyan hover:underline text-sm">
                    View marketplace →
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[1,2,3,4,5,6].map((i) => (
                    <div
                      key={i}
                      className="glass-panel rounded-xl overflow-hidden group cursor-pointer hover:border-neon-purple/50 transition-colors"
                    >
                      <div className="aspect-square bg-gradient-to-br from-neon-purple/30 to-neon-cyan/30 flex items-center justify-center text-4xl">
                        💎
                      </div>
                      <div className="p-3">
                        <p className="text-white text-sm group-hover:text-neon-purple transition-colors">Genesis NFT #{i}</p>
                        <p className="text-gray-500 text-xs">Floor: 12 CGT</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'games' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-grunge-alt text-2xl text-white">🎮 Games ({profile.stats.gamesPlayed})</h2>
                  <Link href="/games" className="text-neon-cyan hover:underline text-sm">
                    Browse games →
                  </Link>
                </div>
                <div className="grid gap-4">
                  {[
                    { name: 'Cosmic Drift', icon: '🌌', hours: 142, achievements: 24, rank: 'Diamond' },
                    { name: 'Neon Racer', icon: '🏎️', hours: 56, achievements: 12, rank: 'Gold' },
                    { name: 'Block Legends', icon: '⚔️', hours: 89, achievements: 18, rank: 'Platinum' },
                  ].map((game, i) => (
                    <div
                      key={i}
                      className="glass-panel p-4 rounded-xl flex items-center gap-4 hover:border-neon-cyan/30 transition-colors"
                    >
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-neon-cyan/30 to-neon-purple/30 flex items-center justify-center text-3xl">
                        {game.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-grunge-alt">{game.name}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm">
                          <span className="text-gray-500">⏱️ {game.hours}h played</span>
                          <span className="text-yellow-400">🏆 {game.achievements} achievements</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-3 py-1 rounded-full bg-neon-cyan/10 text-neon-cyan text-sm border border-neon-cyan/30">
                          {game.rank}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Top Friends */}
            <TopFriends isOwnProfile={true} />

            {/* Badges */}
            {profile.badges.length > 0 && (
              <div className="glass-panel p-4 rounded-xl">
                <h3 className="font-grunge-alt text-lg text-neon-cyan mb-4">🏆 Badges</h3>
                <div className="grid grid-cols-2 gap-2">
                  {profile.badges.map((badge) => (
                    <div 
                      key={badge.id} 
                      className="flex items-center gap-2 bg-blockchain-light/50 px-3 py-2 rounded-lg"
                      title={badge.description}
                    >
                      <span className="text-xl">{badge.icon}</span>
                      <div>
                        <p className="text-white text-xs">{badge.name}</p>
                        <p className="text-gray-500 text-[10px] capitalize">{badge.tier}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="glass-panel p-4 rounded-xl">
              <h3 className="font-grunge-alt text-lg text-neon-purple mb-4">📊 Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">🎮 Games Played</span>
                  <span className="text-white font-grunge">{profile.stats.gamesPlayed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">🏆 Achievements</span>
                  <span className="text-yellow-400 font-grunge">{profile.stats.achievementsUnlocked}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">💎 NFTs Owned</span>
                  <span className="text-purple-400 font-grunge">{profile.stats.nftsOwned}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">🎨 NFTs Created</span>
                  <span className="text-pink-400 font-grunge">{profile.stats.nftsCreated}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">📝 Posts</span>
                  <span className="text-blue-400 font-grunge">{profile.stats.posts}</span>
                </div>
              </div>
            </div>

            {/* Groups */}
            <div className="glass-panel p-4 rounded-xl">
              <h3 className="font-grunge-alt text-lg text-green-400 mb-4">🏛️ Groups</h3>
              <div className="space-y-2">
                {[
                  { name: 'Cosmic Drift Players', icon: '🌌' },
                  { name: 'NFT Artists', icon: '🎨' },
                  { name: 'Demiurge Devs', icon: '💻' },
                ].map((group, i) => (
                  <Link
                    key={i}
                    href={`/social/groups/${i+1}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-blockchain-light/50 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                      {group.icon}
                    </div>
                    <span className="text-white text-sm group-hover:text-green-400 transition-colors">
                      {group.name}
                    </span>
                  </Link>
                ))}
              </div>
              <Link 
                href="/social/groups"
                className="block text-center text-green-400 text-sm mt-4 hover:underline"
              >
                View all groups →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
