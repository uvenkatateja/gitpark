/**
 * Music Player Component
 * Optional music player with playlist
 */

import { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Music, Shuffle, Repeat } from 'lucide-react';
import { useAudio } from '@/lib/useAudio';
import { audioManager, AUDIO_TRACKS } from '@/lib/audioSystem';

// Music tracks from registry
const MUSIC_TRACKS = Object.values(AUDIO_TRACKS).filter(track => track.category === 'music');

interface MusicPlayerProps {
  autoPlay?: boolean;
}

export default function MusicPlayer({ autoPlay = false }: MusicPlayerProps) {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const { play, pause, stop } = useAudio();

  const currentTrack = MUSIC_TRACKS[currentTrackIndex];

  useEffect(() => {
    if (autoPlay && currentTrack) {
      handlePlay();
    }

    // Listen for track end
    const handleTrackEnd = (trackId: string) => {
      if (trackId === currentTrack?.id) {
        if (repeat) {
          handlePlay();
        } else {
          handleNext();
        }
      }
    };

    audioManager.on('trackEnd', handleTrackEnd);
    return () => {
      audioManager.off('trackEnd', handleTrackEnd);
    };
  }, [currentTrackIndex, repeat, autoPlay]);

  const handlePlay = () => {
    if (currentTrack) {
      play(currentTrack.id, { fadeIn: 1000 });
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (currentTrack) {
      pause(currentTrack.id, { fadeOut: 500 });
      setIsPlaying(false);
    }
  };

  const handleNext = () => {
    if (currentTrack) {
      stop(currentTrack.id, { fadeOut: 300 });
    }

    let nextIndex;
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * MUSIC_TRACKS.length);
    } else {
      nextIndex = (currentTrackIndex + 1) % MUSIC_TRACKS.length;
    }

    setCurrentTrackIndex(nextIndex);
    setIsPlaying(true);
  };

  const handlePrevious = () => {
    if (currentTrack) {
      stop(currentTrack.id, { fadeOut: 300 });
    }

    let prevIndex;
    if (shuffle) {
      prevIndex = Math.floor(Math.random() * MUSIC_TRACKS.length);
    } else {
      prevIndex = currentTrackIndex === 0 ? MUSIC_TRACKS.length - 1 : currentTrackIndex - 1;
    }

    setCurrentTrackIndex(prevIndex);
    setIsPlaying(true);
  };

  const handleTrackSelect = (index: number) => {
    if (currentTrack) {
      stop(currentTrack.id, { fadeOut: 300 });
    }
    setCurrentTrackIndex(index);
    setIsPlaying(true);
  };

  if (MUSIC_TRACKS.length === 0) {
    return (
      <div className="bg-card/40 backdrop-blur-2xl border border-white/10 rounded-xl p-4 text-center">
        <Music className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">No music tracks available</p>
      </div>
    );
  }

  return (
    <div className="bg-card/40 backdrop-blur-2xl border border-white/10 rounded-xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 bg-white/5">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-primary" />
          <span className="font-pixel text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
            Music Player
          </span>
        </div>
      </div>

      {/* Current Track */}
      <div className="px-4 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Music className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {currentTrack?.id.replace('music_', '').replace(/_/g, ' ').toUpperCase()}
            </h3>
            <p className="text-xs text-muted-foreground">
              Track {currentTrackIndex + 1} of {MUSIC_TRACKS.length}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 py-4 border-b border-white/5">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setShuffle(!shuffle)}
            className={`p-2 rounded-lg transition-colors ${
              shuffle ? 'bg-primary/20 text-primary' : 'hover:bg-white/10 text-muted-foreground'
            }`}
            title="Shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={handlePrevious}
            className="p-2 rounded-lg hover:bg-white/10 text-foreground transition-colors"
            title="Previous"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={isPlaying ? handlePause : handlePlay}
            className="p-3 rounded-full bg-primary hover:bg-primary/80 text-white transition-all hover:scale-105"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" />
            )}
          </button>

          <button
            onClick={handleNext}
            className="p-2 rounded-lg hover:bg-white/10 text-foreground transition-colors"
            title="Next"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          <button
            onClick={() => setRepeat(!repeat)}
            className={`p-2 rounded-lg transition-colors ${
              repeat ? 'bg-primary/20 text-primary' : 'hover:bg-white/10 text-muted-foreground'
            }`}
            title="Repeat"
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Playlist */}
      <div className="px-4 py-3 max-h-48 overflow-y-auto custom-scrollbar">
        <div className="space-y-1">
          {MUSIC_TRACKS.map((track, index) => (
            <button
              key={track.id}
              onClick={() => handleTrackSelect(index)}
              className={`w-full px-3 py-2 rounded-lg text-left transition-colors ${
                index === currentTrackIndex
                  ? 'bg-primary/20 text-primary'
                  : 'hover:bg-white/5 text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground w-6">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-xs truncate">
                  {track.id.replace('music_', '').replace(/_/g, ' ').toUpperCase()}
                </span>
                {index === currentTrackIndex && isPlaying && (
                  <div className="ml-auto flex gap-0.5">
                    <div className="w-0.5 h-3 bg-primary animate-pulse" />
                    <div className="w-0.5 h-3 bg-primary animate-pulse delay-75" />
                    <div className="w-0.5 h-3 bg-primary animate-pulse delay-150" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
