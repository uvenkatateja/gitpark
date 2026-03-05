/**
 * Audio Controls Component
 * UI for managing audio settings
 */

import { useState } from 'react';
import { Volume2, VolumeX, Music, Wind, Car, Zap, Settings } from 'lucide-react';
import { useAudio } from '@/lib/useAudio';
import type { AudioCategory } from '@/lib/audioSystem';

interface AudioControlsProps {
  compact?: boolean;
}

const CATEGORY_CONFIG: Record<AudioCategory, { icon: typeof Music; label: string; color: string }> = {
  ambience: { icon: Wind, label: 'Ambience', color: '#60A5FA' },
  music: { icon: Music, label: 'Music', color: '#A78BFA' },
  engine: { icon: Car, label: 'Engine', color: '#F59E0B' },
  sfx: { icon: Zap, label: 'Effects', color: '#10B981' },
  ui: { icon: Settings, label: 'UI', color: '#6B7280' },
  celebration: { icon: Zap, label: 'Celebration', color: '#EC4899' },
};

export default function AudioControls({ compact = false }: AudioControlsProps) {
  const [expanded, setExpanded] = useState(false);
  const {
    settings,
    setMasterVolume,
    setCategoryVolume,
    toggleCategoryMute,
    toggleGlobalMute,
    isCategoryMuted,
  } = useAudio();

  if (compact) {
    return (
      <button
        onClick={toggleGlobalMute}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all backdrop-blur-md"
        title={settings.globalMute ? 'Unmute Audio' : 'Mute Audio'}
      >
        {settings.globalMute ? (
          <VolumeX className="w-4 h-4 text-red-400" />
        ) : (
          <Volume2 className="w-4 h-4 text-primary" />
        )}
      </button>
    );
  }

  return (
    <div className="bg-card/40 backdrop-blur-2xl border border-white/10 rounded-xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 bg-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-primary" />
            <span className="font-pixel text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
              Audio Controls
            </span>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-primary hover:text-primary/80 transition-colors"
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {/* Master Volume */}
      <div className="px-4 py-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleGlobalMute}
              className="p-1 rounded hover:bg-white/10 transition-colors"
            >
              {settings.globalMute ? (
                <VolumeX className="w-5 h-5 text-red-400" />
              ) : (
                <Volume2 className="w-5 h-5 text-primary" />
              )}
            </button>
            <span className="text-sm font-semibold text-foreground">Master Volume</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {Math.round(settings.masterVolume * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={settings.masterVolume * 100}
          onChange={(e) => setMasterVolume(Number(e.target.value) / 100)}
          disabled={settings.globalMute}
          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>

      {/* Category Controls */}
      {expanded && (
        <div className="px-4 py-3 space-y-3">
          {(Object.keys(CATEGORY_CONFIG) as AudioCategory[]).map((category) => {
            const config = CATEGORY_CONFIG[category];
            const Icon = config.icon;
            const muted = isCategoryMuted(category);
            const volume = settings.categoryVolumes[category];

            return (
              <div key={category} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleCategoryMute(category)}
                      className="p-1 rounded hover:bg-white/10 transition-colors"
                    >
                      {muted ? (
                        <VolumeX className="w-4 h-4 text-red-400" />
                      ) : (
                        <Icon className="w-4 h-4" style={{ color: config.color }} />
                      )}
                    </button>
                    <span className="text-xs text-foreground">{config.label}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume * 100}
                  onChange={(e) => setCategoryVolume(category, Number(e.target.value) / 100)}
                  disabled={muted || settings.globalMute}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer slider-sm"
                  style={{
                    accentColor: config.color,
                  }}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Info */}
      <div className="px-4 py-2 bg-white/5 text-[9px] text-muted-foreground text-center">
        Settings saved automatically
      </div>
    </div>
  );
}
