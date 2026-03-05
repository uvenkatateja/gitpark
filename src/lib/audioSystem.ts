/**
 * Audio System
 * Centralized audio management with event-driven architecture
 * NO HARDCODED VALUES - All audio is configurable
 */

// Simple EventEmitter for browser
class SimpleEventEmitter {
  private events: Map<string, Function[]> = new Map();

  on(event: string, handler: Function) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(handler);
  }

  off(event: string, handler: Function) {
    const handlers = this.events.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  emit(event: string, ...args: any[]) {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(...args));
    }
  }

  removeAllListeners() {
    this.events.clear();
  }
}

// Audio Categories
export type AudioCategory = 
  | 'ambience'
  | 'sfx'
  | 'music'
  | 'ui'
  | 'engine'
  | 'celebration';

// Audio Track Configuration
export interface AudioTrack {
  id: string;
  category: AudioCategory;
  src: string;
  volume: number;
  loop: boolean;
  fadeIn?: number;
  fadeOut?: number;
  playbackRate?: number;
}

// Audio State
export interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
}

// Audio Settings
export interface AudioSettings {
  masterVolume: number;
  categoryVolumes: Record<AudioCategory, number>;
  mutedCategories: Set<AudioCategory>;
  globalMute: boolean;
}

// Audio Events
export type AudioEvent = 
  | 'play'
  | 'pause'
  | 'stop'
  | 'volumeChange'
  | 'trackEnd'
  | 'trackChange'
  | 'error';

class AudioManager extends SimpleEventEmitter {
  private tracks: Map<string, HTMLAudioElement> = new Map();
  private trackConfigs: Map<string, AudioTrack> = new Map();
  private settings: AudioSettings = {
    masterVolume: 0.7,
    categoryVolumes: {
      ambience: 0.3,
      sfx: 0.6,
      music: 0.5,
      ui: 0.7,
      engine: 0.5,
      celebration: 0.6,
    },
    mutedCategories: new Set(),
    globalMute: false,
  };
  private fadeIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    super();
    this.loadSettings();
  }

  // Load settings from localStorage
  private loadSettings() {
    try {
      const saved = localStorage.getItem('audioSettings');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.settings = {
          ...this.settings,
          ...parsed,
          mutedCategories: new Set(parsed.mutedCategories || []),
        };
      }
    } catch (error) {
      console.warn('Failed to load audio settings:', error);
    }
  }

  // Save settings to localStorage
  private saveSettings() {
    try {
      localStorage.setItem('audioSettings', JSON.stringify({
        ...this.settings,
        mutedCategories: Array.from(this.settings.mutedCategories),
      }));
    } catch (error) {
      console.warn('Failed to save audio settings:', error);
    }
  }

  // Register audio track
  registerTrack(config: AudioTrack): void {
    this.trackConfigs.set(config.id, config);
  }

  // Register multiple tracks
  registerTracks(configs: AudioTrack[]): void {
    configs.forEach(config => this.registerTrack(config));
  }

  // Get or create audio element
  private getAudio(trackId: string): HTMLAudioElement | null {
    const config = this.trackConfigs.get(trackId);
    if (!config) {
      console.warn(`Track not registered: ${trackId}`);
      return null;
    }

    if (!this.tracks.has(trackId)) {
      const audio = new Audio(config.src);
      audio.loop = config.loop;
      audio.playbackRate = config.playbackRate || 1.0;
      
      // Event listeners
      audio.addEventListener('ended', () => {
        this.emit('trackEnd', trackId);
      });
      
      audio.addEventListener('error', (e) => {
        console.error(`Audio error for ${trackId}:`, e);
        this.emit('error', { trackId, error: e });
      });

      this.tracks.set(trackId, audio);
    }

    return this.tracks.get(trackId)!;
  }

  // Calculate effective volume
  private getEffectiveVolume(trackId: string): number {
    const config = this.trackConfigs.get(trackId);
    if (!config) return 0;

    if (this.settings.globalMute) return 0;
    if (this.settings.mutedCategories.has(config.category)) return 0;

    return (
      this.settings.masterVolume *
      this.settings.categoryVolumes[config.category] *
      config.volume
    );
  }

  // Play track
  async play(trackId: string, options?: { fadeIn?: number }): Promise<void> {
    const audio = this.getAudio(trackId);
    if (!audio) return;

    const config = this.trackConfigs.get(trackId)!;
    const targetVolume = this.getEffectiveVolume(trackId);

    // Stop any existing fade
    this.stopFade(trackId);

    // Fade in if specified
    if (options?.fadeIn || config.fadeIn) {
      const duration = options?.fadeIn || config.fadeIn || 0;
      audio.volume = 0;
      await audio.play();
      this.fadeVolume(trackId, targetVolume, duration);
    } else {
      audio.volume = targetVolume;
      await audio.play();
    }

    this.emit('play', trackId);
  }

  // Pause track
  pause(trackId: string, options?: { fadeOut?: number }): void {
    const audio = this.getAudio(trackId);
    if (!audio) return;

    const config = this.trackConfigs.get(trackId)!;

    // Fade out if specified
    if (options?.fadeOut || config.fadeOut) {
      const duration = options?.fadeOut || config.fadeOut || 0;
      this.fadeVolume(trackId, 0, duration, () => {
        audio.pause();
        this.emit('pause', trackId);
      });
    } else {
      audio.pause();
      this.emit('pause', trackId);
    }
  }

  // Stop track
  stop(trackId: string, options?: { fadeOut?: number }): void {
    const audio = this.getAudio(trackId);
    if (!audio) return;

    const config = this.trackConfigs.get(trackId)!;

    // Fade out if specified
    if (options?.fadeOut || config.fadeOut) {
      const duration = options?.fadeOut || config.fadeOut || 0;
      this.fadeVolume(trackId, 0, duration, () => {
        audio.pause();
        audio.currentTime = 0;
        this.emit('stop', trackId);
      });
    } else {
      audio.pause();
      audio.currentTime = 0;
      this.emit('stop', trackId);
    }
  }

  // Fade volume
  private fadeVolume(
    trackId: string,
    targetVolume: number,
    duration: number,
    onComplete?: () => void
  ): void {
    const audio = this.getAudio(trackId);
    if (!audio) return;

    this.stopFade(trackId);

    const startVolume = audio.volume;
    const volumeDiff = targetVolume - startVolume;
    const steps = Math.ceil(duration / 50); // 50ms per step
    const volumeStep = volumeDiff / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      
      if (currentStep >= steps) {
        audio.volume = targetVolume;
        clearInterval(interval);
        this.fadeIntervals.delete(trackId);
        onComplete?.();
      } else {
        audio.volume = startVolume + (volumeStep * currentStep);
      }
    }, 50);

    this.fadeIntervals.set(trackId, interval);
  }

  // Stop fade
  private stopFade(trackId: string): void {
    const interval = this.fadeIntervals.get(trackId);
    if (interval) {
      clearInterval(interval);
      this.fadeIntervals.delete(trackId);
    }
  }

  // Set master volume
  setMasterVolume(volume: number): void {
    this.settings.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateAllVolumes();
    this.saveSettings();
    this.emit('volumeChange', { type: 'master', volume });
  }

  // Set category volume
  setCategoryVolume(category: AudioCategory, volume: number): void {
    this.settings.categoryVolumes[category] = Math.max(0, Math.min(1, volume));
    this.updateAllVolumes();
    this.saveSettings();
    this.emit('volumeChange', { type: 'category', category, volume });
  }

  // Toggle category mute
  toggleCategoryMute(category: AudioCategory): void {
    if (this.settings.mutedCategories.has(category)) {
      this.settings.mutedCategories.delete(category);
    } else {
      this.settings.mutedCategories.add(category);
    }
    this.updateAllVolumes();
    this.saveSettings();
    this.emit('volumeChange', { type: 'categoryMute', category });
  }

  // Toggle global mute
  toggleGlobalMute(): void {
    this.settings.globalMute = !this.settings.globalMute;
    this.updateAllVolumes();
    this.saveSettings();
    this.emit('volumeChange', { type: 'globalMute', muted: this.settings.globalMute });
  }

  // Update all playing tracks' volumes
  private updateAllVolumes(): void {
    this.tracks.forEach((audio, trackId) => {
      if (!audio.paused) {
        audio.volume = this.getEffectiveVolume(trackId);
      }
    });
  }

  // Get track state
  getTrackState(trackId: string): AudioState | null {
    const audio = this.getAudio(trackId);
    if (!audio) return null;

    return {
      isPlaying: !audio.paused,
      currentTime: audio.currentTime,
      duration: audio.duration,
      volume: audio.volume,
      isMuted: this.settings.globalMute || 
               this.settings.mutedCategories.has(this.trackConfigs.get(trackId)!.category),
    };
  }

  // Get settings
  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  // Is category muted
  isCategoryMuted(category: AudioCategory): boolean {
    return this.settings.globalMute || this.settings.mutedCategories.has(category);
  }

  // Cleanup
  dispose(): void {
    this.fadeIntervals.forEach(interval => clearInterval(interval));
    this.tracks.forEach(audio => {
      audio.pause();
      audio.src = '';
    });
    this.tracks.clear();
    this.trackConfigs.clear();
    this.removeAllListeners();
  }
}

// Singleton instance
export const audioManager = new AudioManager();

// Audio track registry - dynamically populated
export const AUDIO_TRACKS: Record<string, AudioTrack> = {
  // Ambience
  parking_lot_day: {
    id: 'parking_lot_day',
    category: 'ambience',
    src: '/audio/ambience/parking-lot-day.mp3',
    volume: 1.0,
    loop: true,
    fadeIn: 2000,
    fadeOut: 2000,
  },
  parking_lot_night: {
    id: 'parking_lot_night',
    category: 'ambience',
    src: '/audio/ambience/parking-lot-night.mp3',
    volume: 0.8,
    loop: true,
    fadeIn: 2000,
    fadeOut: 2000,
  },
  city_traffic: {
    id: 'city_traffic',
    category: 'ambience',
    src: '/audio/ambience/city-traffic.mp3',
    volume: 0.6,
    loop: true,
    fadeIn: 1500,
    fadeOut: 1500,
  },
  
  // Engine Sounds
  engine_idle: {
    id: 'engine_idle',
    category: 'engine',
    src: '/audio/engine/idle.mp3',
    volume: 0.7,
    loop: true,
  },
  engine_rev: {
    id: 'engine_rev',
    category: 'engine',
    src: '/audio/engine/rev.mp3',
    volume: 0.8,
    loop: false,
  },
  engine_start: {
    id: 'engine_start',
    category: 'engine',
    src: '/audio/engine/start.mp3',
    volume: 0.9,
    loop: false,
  },
  car_horn: {
    id: 'car_horn',
    category: 'engine',
    src: '/audio/engine/horn.mp3',
    volume: 0.7,
    loop: false,
  },
  
  // UI Sounds
  ui_click: {
    id: 'ui_click',
    category: 'ui',
    src: '/audio/ui/click.mp3',
    volume: 0.5,
    loop: false,
  },
  ui_hover: {
    id: 'ui_hover',
    category: 'ui',
    src: '/audio/ui/hover.mp3',
    volume: 0.3,
    loop: false,
  },
  ui_open: {
    id: 'ui_open',
    category: 'ui',
    src: '/audio/ui/open.mp3',
    volume: 0.6,
    loop: false,
  },
  ui_close: {
    id: 'ui_close',
    category: 'ui',
    src: '/audio/ui/close.mp3',
    volume: 0.6,
    loop: false,
  },
  
  // Music
  music_chill: {
    id: 'music_chill',
    category: 'music',
    src: '/audio/music/chill-vibes.mp3',
    volume: 1.0,
    loop: true,
    fadeIn: 3000,
    fadeOut: 3000,
  },
  music_upbeat: {
    id: 'music_upbeat',
    category: 'music',
    src: '/audio/music/upbeat-coding.mp3',
    volume: 1.0,
    loop: true,
    fadeIn: 3000,
    fadeOut: 3000,
  },
  music_focus: {
    id: 'music_focus',
    category: 'music',
    src: '/audio/music/deep-focus.mp3',
    volume: 1.0,
    loop: true,
    fadeIn: 3000,
    fadeOut: 3000,
  },
};

// Register all tracks
audioManager.registerTracks(Object.values(AUDIO_TRACKS));

// Convenience functions
export const playAudio = (trackId: string, options?: { fadeIn?: number }) => 
  audioManager.play(trackId, options);

export const pauseAudio = (trackId: string, options?: { fadeOut?: number }) => 
  audioManager.pause(trackId, options);

export const stopAudio = (trackId: string, options?: { fadeOut?: number }) => 
  audioManager.stop(trackId, options);
