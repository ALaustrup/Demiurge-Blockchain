'use client';

import { useState } from 'react';
import { useVYB } from '@/contexts/VYBContext';
import type { ProfileTheme } from '@/lib/vyb/types';

const COLOR_PRESETS = [
  { name: 'Neon Cyan', primary: '#00f5ff', secondary: '#bf00ff' },
  { name: 'Hot Pink', primary: '#ff00ff', secondary: '#00ffff' },
  { name: 'Sunset', primary: '#ff6b35', secondary: '#f7c59f' },
  { name: 'Matrix', primary: '#00ff41', secondary: '#008f11' },
  { name: 'Royal', primary: '#7b2cbf', secondary: '#c77dff' },
  { name: 'Ocean', primary: '#0096c7', secondary: '#90e0ef' },
  { name: 'Fire', primary: '#ff4500', secondary: '#ff8c00' },
  { name: 'Midnight', primary: '#1a1a2e', secondary: '#16213e' },
];

const FONT_STYLES = [
  { id: 'modern', name: 'Modern', description: 'Clean and contemporary' },
  { id: 'retro', name: 'Retro', description: 'Old school vibes' },
  { id: 'grunge', name: 'Grunge', description: 'Raw and edgy' },
  { id: 'minimal', name: 'Minimal', description: 'Simple and elegant' },
];

const LAYOUT_STYLES = [
  { id: 'classic', name: 'Classic', icon: '📋' },
  { id: 'grid', name: 'Grid', icon: '⊞' },
  { id: 'timeline', name: 'Timeline', icon: '📰' },
  { id: 'gallery', name: 'Gallery', icon: '🖼️' },
];

export function ProfileCustomizer() {
  const { profile, updateTheme } = useVYB();
  const [isOpen, setIsOpen] = useState(false);
  const [localTheme, setLocalTheme] = useState<ProfileTheme | null>(null);

  if (!profile) return null;

  const currentTheme = localTheme || profile.theme;

  const handleOpen = () => {
    setLocalTheme({ ...profile.theme });
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (localTheme) {
      await updateTheme(localTheme);
    }
    setIsOpen(false);
  };

  const handlePresetSelect = (preset: typeof COLOR_PRESETS[0]) => {
    setLocalTheme(prev => ({
      ...prev!,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
    }));
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={handleOpen}
        className="glass-panel p-3 rounded-lg hover:border-neon-cyan/50 transition-colors"
        title="Customize Profile"
      >
        🎨 Customize
      </button>

      {/* Customizer Modal */}
      {isOpen && localTheme && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="glass-panel liquid-border w-full max-w-2xl max-h-[90vh] rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-800">
              <h2 className="font-grunge text-2xl text-neon-cyan">🎨 Customize Your Profile</h2>
              <p className="text-gray-400 text-sm">Make it yours - MySpace style!</p>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
              {/* Preview */}
              <div 
                className="rounded-xl overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${localTheme.primaryColor}20, ${localTheme.secondaryColor}20)`,
                  border: `1px solid ${localTheme.primaryColor}40`,
                }}
              >
                <div 
                  className="h-16"
                  style={{
                    background: `linear-gradient(to right, ${localTheme.primaryColor}, ${localTheme.secondaryColor})`
                  }}
                />
                <div className="p-4 -mt-8 flex items-end gap-4">
                  <div 
                    className="w-16 h-16 rounded-full border-4 flex items-center justify-center text-2xl"
                    style={{ 
                      borderColor: localTheme.backgroundColor,
                      background: `linear-gradient(135deg, ${localTheme.primaryColor}80, ${localTheme.secondaryColor}80)`
                    }}
                  >
                    👤
                  </div>
                  <div className="pb-1">
                    <h3 
                      className="font-grunge-alt text-lg"
                      style={{ color: localTheme.primaryColor }}
                    >
                      {profile.displayName}
                    </h3>
                    <p className="text-gray-400 text-xs">@{profile.qorId}</p>
                  </div>
                </div>
              </div>

              {/* Color Presets */}
              <div>
                <h3 className="font-grunge-alt text-lg text-white mb-3">Color Theme</h3>
                <div className="grid grid-cols-4 gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => handlePresetSelect(preset)}
                      className={`p-3 rounded-lg border transition-all ${
                        localTheme.primaryColor === preset.primary 
                          ? 'border-white' 
                          : 'border-gray-700 hover:border-gray-500'
                      }`}
                      style={{
                        background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})`
                      }}
                    >
                      <span className="text-white text-xs font-body drop-shadow">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Colors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={localTheme.primaryColor}
                      onChange={(e) => setLocalTheme(prev => ({ ...prev!, primaryColor: e.target.value }))}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={localTheme.primaryColor}
                      onChange={(e) => setLocalTheme(prev => ({ ...prev!, primaryColor: e.target.value }))}
                      className="flex-1 bg-white/90 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Secondary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={localTheme.secondaryColor}
                      onChange={(e) => setLocalTheme(prev => ({ ...prev!, secondaryColor: e.target.value }))}
                      className="w-10 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={localTheme.secondaryColor}
                      onChange={(e) => setLocalTheme(prev => ({ ...prev!, secondaryColor: e.target.value }))}
                      className="flex-1 bg-white/90 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Font Style */}
              <div>
                <h3 className="font-grunge-alt text-lg text-white mb-3">Font Style</h3>
                <div className="grid grid-cols-2 gap-2">
                  {FONT_STYLES.map((font) => (
                    <button
                      key={font.id}
                      onClick={() => setLocalTheme(prev => ({ ...prev!, fontStyle: font.id as any }))}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        localTheme.fontStyle === font.id 
                          ? 'border-neon-cyan bg-neon-cyan/10' 
                          : 'border-gray-700 hover:border-gray-500'
                      }`}
                    >
                      <p className="text-white font-body">{font.name}</p>
                      <p className="text-gray-500 text-xs">{font.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Layout Style */}
              <div>
                <h3 className="font-grunge-alt text-lg text-white mb-3">Layout Style</h3>
                <div className="grid grid-cols-4 gap-2">
                  {LAYOUT_STYLES.map((layout) => (
                    <button
                      key={layout.id}
                      onClick={() => setLocalTheme(prev => ({ ...prev!, layoutStyle: layout.id as any }))}
                      className={`p-4 rounded-lg border text-center transition-all ${
                        localTheme.layoutStyle === layout.id 
                          ? 'border-neon-cyan bg-neon-cyan/10' 
                          : 'border-gray-700 hover:border-gray-500'
                      }`}
                    >
                      <p className="text-2xl mb-1">{layout.icon}</p>
                      <p className="text-white text-xs">{layout.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Profile Music */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-grunge-alt text-lg text-white">Profile Music</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localTheme.musicEnabled}
                      onChange={(e) => setLocalTheme(prev => ({ ...prev!, musicEnabled: e.target.checked }))}
                      className="w-4 h-4 accent-neon-cyan"
                    />
                    <span className="text-sm text-gray-400">Enable</span>
                  </label>
                </div>
                {localTheme.musicEnabled && (
                  <input
                    type="text"
                    value={localTheme.profileSong || ''}
                    onChange={(e) => setLocalTheme(prev => ({ ...prev!, profileSong: e.target.value }))}
                    placeholder="Paste music URL (YouTube, SoundCloud, etc.)"
                    className="w-full bg-white/90 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 text-sm"
                  />
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-800 flex gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 glass-panel py-2 rounded-lg hover:border-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 neon-button py-2 rounded-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
