/**
 * useAudio Hook
 * React hook for easy audio management
 */

import { useEffect, useState, useCallback } from 'react';
import { audioManager, type AudioCategory, type AudioState } from './audioSystem';

export function useAudio(trackId?: string) {
  const [state, setState] = useState<AudioState | null>(
    trackId ? audioManager.getTrackState(trackId) : null
  );

  useEffect(() => {
    if (!trackId) return;

    const updateState = () => {
      setState(audioManager.getTrackState(trackId));
    };

    // Update state on audio events
    audioManager.on('play', updateState);
    audioManager.on('pause', updateState);
    audioManager.on('stop', updateState);
    audioManager.on('volumeChange', updateState);

    // Initial state
    updateState();

    return () => {
      audioManager.off('play', updateState);
      audioManager.off('pause', updateState);
      audioManager.off('stop', updateState);
      audioManager.off('volumeChange', updateState);
    };
  }, [trackId]);

  const play = useCallback(
    (id?: string, options?: { fadeIn?: number }) => {
      const targetId = id || trackId;
      if (targetId) {
        audioManager.play(targetId, options);
      }
    },
    [trackId]
  );

  const pause = useCallback(
    (id?: string, options?: { fadeOut?: number }) => {
      const targetId = id || trackId;
      if (targetId) {
        audioManager.pause(targetId, options);
      }
    },
    [trackId]
  );

  const stop = useCallback(
    (id?: string, options?: { fadeOut?: number }) => {
      const targetId = id || trackId;
      if (targetId) {
        audioManager.stop(targetId, options);
      }
    },
    [trackId]
  );

  const setMasterVolume = useCallback((volume: number) => {
    audioManager.setMasterVolume(volume);
  }, []);

  const setCategoryVolume = useCallback((category: AudioCategory, volume: number) => {
    audioManager.setCategoryVolume(category, volume);
  }, []);

  const toggleCategoryMute = useCallback((category: AudioCategory) => {
    audioManager.toggleCategoryMute(category);
  }, []);

  const toggleGlobalMute = useCallback(() => {
    audioManager.toggleGlobalMute();
  }, []);

  return {
    state,
    play,
    pause,
    stop,
    setMasterVolume,
    setCategoryVolume,
    toggleCategoryMute,
    toggleGlobalMute,
    settings: audioManager.getSettings(),
    isCategoryMuted: (category: AudioCategory) => audioManager.isCategoryMuted(category),
  };
}
