import { useState, useEffect, useCallback } from 'react';
import { socketService } from '../services/socket';
import { RoomState, Track } from '../types';


export function useRoom() {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [speakingUsers, setSpeakingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {


    const handleConnect = () => {
      setIsConnected(true);
      setError(null);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleUserJoined = (data: { userId: string; userName: string }) => {
      setRoomState(prev => {
        if (!prev) return prev;
        const newUser = { id: data.userId, name: data.userName, socketId: data.userId };
        return {
          ...prev,
          users: [...prev.users, newUser],
        };
      });

      if (socketService.id !== data.userId) {
        // Voice service handles connection internally via socket events
      }
    };

    const handleUserLeft = (data: { userId: string; userName: string }) => {
      setRoomState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          users: prev.users.filter(u => u.id !== data.userId),
        };
      });


      setSpeakingUsers(prev => {
        const next = new Set(prev);
        next.delete(data.userId);
        return next;
      });
    };

    const handleHostChanged = (data: { newHost: { id: string; name: string } }) => {
      setRoomState(prev => {
        if (!prev) return prev;
        return { ...prev, host: data.newHost };
      });
      setIsHost(data.newHost.id === socketService.id);
    };

    const handleAudioSync = (audioState: RoomState['audioState']) => {
      setRoomState(prev => {
        if (!prev) return prev;
        return { ...prev, audioState };
      });
    };

    const handleAudioStateChanged = (data: { isPlaying: boolean; position: number; currentTrack?: Track; timestamp: number }) => {
      setRoomState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          audioState: {
            isPlaying: data.isPlaying,
            position: data.position,
            timestamp: data.timestamp,
            currentTrack: data.currentTrack,
          },
        };
      });
    };

    const handleQueueUpdated = (data: { queue: Track[] }) => {
      setRoomState(prev => {
        if (!prev) return prev;
        return { ...prev, queue: data.queue };
      });
    };

    const handlePTTStarted = (data: { userId: string }) => {
      setSpeakingUsers(prev => new Set(prev).add(data.userId));
    };

    const handlePTTEnded = (data: { userId: string }) => {
      setSpeakingUsers(prev => {
        const next = new Set(prev);
        next.delete(data.userId);
        return next;
      });
    };

    const handleKicked = () => {
      setRoomState(null);
      setIsHost(false);
      setError('You were kicked from the room');

    };



    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);
    socketService.on('user-joined', handleUserJoined);
    socketService.on('user-left', handleUserLeft);
    socketService.on('host-changed', handleHostChanged);
    socketService.on('audio-sync', handleAudioSync);
    socketService.on('audio-state-changed', handleAudioStateChanged);
    socketService.on('queue-updated', handleQueueUpdated);
    socketService.on('ptt-started', handlePTTStarted);
    socketService.on('ptt-ended', handlePTTEnded);
    socketService.on('kicked', handleKicked);


    return () => {
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
      socketService.off('user-joined', handleUserJoined);
      socketService.off('user-left', handleUserLeft);
      socketService.off('host-changed', handleHostChanged);
      socketService.off('audio-sync', handleAudioSync);
      socketService.off('audio-state-changed', handleAudioStateChanged);
      socketService.off('queue-updated', handleQueueUpdated);
      socketService.off('ptt-started', handlePTTStarted);
      socketService.off('ptt-ended', handlePTTEnded);
      socketService.off('kicked', handleKicked);

    };
  }, []);

  const createRoom = useCallback((userName: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      socketService.emit('create-room', { userName }, (response: any) => {
        if (response.success && response.room) {
          setRoomState(response.room);
          setIsHost(true);
          setError(null);
          resolve();
        } else {
          const errorMsg = response.error || 'Failed to create room';
          setError(errorMsg);
          reject(new Error(errorMsg));
        }
      });
    });
  }, []);

  const joinRoom = useCallback((code: string, userName: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      socketService.emit('join-room', { code, userName }, (response: any) => {
        if (response.success && response.room) {
          setRoomState(response.room);
          setIsHost(response.room.host.id === socketService.id);
          setError(null);

          response.room.users.forEach((user: any) => {
            // Voice service handles connections automatically
          });

          resolve();
        } else {
          const errorMsg = response.error || 'Failed to join room';
          setError(errorMsg);
          reject(new Error(errorMsg));
        }
      });
    });
  }, []);

  const leaveRoom = useCallback(() => {
    if (roomState) {
      socketService.emit('leave-room', { code: roomState.code });
      setRoomState(null);
      setIsHost(false);
      setSpeakingUsers(new Set());

    }
  }, [roomState]);

  const syncAudio = useCallback((position: number, isPlaying: boolean) => {
    if (roomState) {
      socketService.emit('sync-audio', {
        code: roomState.code,
        position,
        isPlaying,
      });
    }
  }, [roomState]);

  const updateAudioState = useCallback((isPlaying: boolean, position: number, currentTrack?: Track) => {
    if (roomState && isHost) {
      socketService.emit('audio-state-changed', {
        code: roomState.code,
        isPlaying,
        position,
        currentTrack,
      });
    }
  }, [roomState, isHost]);

  const addToQueue = useCallback((track: Track) => {
    if (roomState) {
      socketService.emit('add-to-queue', {
        code: roomState.code,
        track,
      });
    }
  }, [roomState]);

  const removeFromQueue = useCallback((trackId: string) => {
    if (roomState) {
      socketService.emit('remove-from-queue', {
        code: roomState.code,
        trackId,
      });
    }
  }, [roomState]);

  const nextTrack = useCallback(() => {
    if (roomState && isHost) {
      socketService.emit('next-track', {
        code: roomState.code,
      });
    }
  }, [roomState, isHost]);

  const kickUser = useCallback((userId: string) => {
    if (roomState && isHost) {
      socketService.emit('kick-user', {
        code: roomState.code,
        targetUserId: userId,
      });
    }
  }, [roomState, isHost]);

  return {
    roomState,
    isConnected,
    error,
    isHost,
    speakingUsers,
    createRoom,
    joinRoom,
    leaveRoom,
    syncAudio,
    updateAudioState,
    addToQueue,
    removeFromQueue,
    nextTrack,
    kickUser,
  };
}
