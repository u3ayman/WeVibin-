import { useState, useEffect, useCallback } from 'react';
import { socketService } from '../services/socket';
import { voiceService } from '../services/voice';

export function usePTT(roomCode: string | null) {
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const isEditableTarget = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    return (
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      tag === 'SELECT' ||
      target.isContentEditable
    );
  };

  const startTransmitting = useCallback(() => {
    console.log(
      '%c🔴 PTT START PRESSED',
      'background: #ff0000; color: white; font-size: 18px; font-weight: bold; padding: 8px;',
    );
    console.log('   Room Code:', roomCode);
    console.log('   Is Muted:', isMuted);
    console.log('   Already Transmitting:', isTransmitting);

    if (!roomCode) {
      console.warn(
        '%c⚠️ BLOCKED: No room code',
        'background: #ffaa00; color: black; font-size: 14px; padding: 4px;',
      );
      return;
    }
    if (isMuted) {
      console.warn(
        '%c⚠️ BLOCKED: Microphone is muted',
        'background: #ffaa00; color: black; font-size: 14px; padding: 4px;',
      );
      return;
    }
    if (isTransmitting) {
      console.warn(
        '%c⚠️ BLOCKED: Already transmitting',
        'background: #ffaa00; color: black; font-size: 14px; padding: 4px;',
      );
      return;
    }

    console.log(
      '%c✅ PTT STARTING - Enabling microphone...',
      'background: #00ff00; color: black; font-size: 16px; padding: 4px;',
    );
    setIsTransmitting(true);
    voiceService.startPtt();
    socketService.emit('ptt-start', { roomCode });
    console.log(
      '%c📡 Socket event emitted: ptt-start',
      'background: #0088ff; color: white; font-size: 14px; padding: 4px;',
    );
  }, [roomCode, isMuted, isTransmitting]);

  const stopTransmitting = useCallback(() => {
    console.log(
      '%c⚫ PTT STOP PRESSED',
      'background: #666; color: white; font-size: 18px; font-weight: bold; padding: 8px;',
    );
    console.log('   Currently Transmitting:', isTransmitting);

    if (!isTransmitting) {
      console.warn(
        '%c⚠️ BLOCKED: Not currently transmitting',
        'background: #ffaa00; color: black; font-size: 14px; padding: 4px;',
      );
      return;
    }

    console.log(
      '%c✅ PTT STOPPING - Disabling microphone...',
      'background: #ff6600; color: white; font-size: 16px; padding: 4px;',
    );
    setIsTransmitting(false);
    voiceService.stopPtt();
    if (roomCode) {
      socketService.emit('ptt-end', { roomCode });
      console.log(
        '%c📡 Socket event emitted: ptt-end',
        'background: #0088ff; color: white; font-size: 14px; padding: 4px;',
      );
    }
  }, [roomCode, isTransmitting]);

  useEffect(() => {
    const getPTTKey = () => {
      const settings = localStorage.getItem('wevibin-settings');
      if (settings) {
        try {
          const parsed = JSON.parse(settings);
          return parsed.pushToTalkKey || 'Space';
        } catch {
          return 'Space';
        }
      }
      return 'Space';
    };

    const pttKey = getPTTKey();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
      if (
        e.code === pttKey &&
        !e.repeat &&
        !isTransmitting &&
        !isMuted &&
        roomCode
      ) {
        e.preventDefault();
        startTransmitting();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
      if (e.code === pttKey && isTransmitting) {
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

    // If muting and currently transmitting, stop transmission
    if (newMutedState && isTransmitting) {
      stopTransmitting();
    }
    // Note: We don't call setMicrophoneEnabled here because
    // the microphone should only be enabled during active PTT transmission
  }, [isMuted, isTransmitting, stopTransmitting]);

  return {
    isTransmitting,
    isMuted,
    toggleMute,
    startTransmitting,
    stopTransmitting,
  };
}
