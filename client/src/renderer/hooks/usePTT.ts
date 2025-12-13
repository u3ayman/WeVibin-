import { useState, useEffect, useCallback } from 'react';
import { socketService } from '../services/socket';
import { setMicrophoneEnabled } from '../services/webrtc';

export function usePTT(roomCode: string | null) {
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const startTransmitting = useCallback(() => {
    if (!roomCode || isMuted || isTransmitting) return;
    setIsTransmitting(true);
    socketService.emit('ptt-start', { roomCode });
  }, [roomCode, isMuted, isTransmitting]);

  const stopTransmitting = useCallback(() => {
    if (!isTransmitting) return;
    setIsTransmitting(false);
    if (roomCode) {
      socketService.emit('ptt-end', { roomCode });
    }
  }, [roomCode, isTransmitting]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isTransmitting && !isMuted && roomCode) {
        e.preventDefault();
        startTransmitting();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isTransmitting) {
        e.preventDefault();
        stopTransmitting();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isTransmitting, isMuted, roomCode, startTransmitting, stopTransmitting]);

  const toggleMute = useCallback(() => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    setMicrophoneEnabled(!newMutedState);
    if (newMutedState && isTransmitting) {
      stopTransmitting();
    }
  }, [isMuted, isTransmitting, stopTransmitting]);

  return {
    isTransmitting,
    isMuted,
    toggleMute,
    startTransmitting,
    stopTransmitting,
  };
}
