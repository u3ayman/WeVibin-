import { useState, useEffect, useCallback } from 'react';
import { socketService } from '../services/socket';
import { RoomState } from '../types';
import * as webrtc from '../services/webrtc';

export function useRoom() {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [speakingUsers, setSpeakingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    socketService.connect();

    const handleConnect = () => {
      setIsConnected(true);
      setError(null);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleRoomCreated = (data: { success: boolean; room?: RoomState; error?: string }) => {
      if (data.success && data.room) {
        setRoomState(data.room);
        setIsHost(true);
        setError(null);
      } else {
        setError(data.error || 'Failed to create room');
      }
    };

    const handleRoomJoined = (data: { success: boolean; room?: RoomState; error?: string }) => {
      if (data.success && data.room) {
        setRoomState(data.room);
        setIsHost(data.room.host.id === socketService.id);
        setError(null);

        // Create peer connections for existing users
        data.room.users.forEach(user => {
          if (user.id !== socketService.id) {
            webrtc.createPeerConnection(user.id, true);
          }
        });
      } else {
        setError(data.error || 'Failed to join room');
      }
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

      // Create peer connection for new user (non-initiator will wait for offer)
      if (socketService.id !== data.userId) {
        webrtc.createPeerConnection(data.userId, true);
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

      webrtc.closePeerConnection(data.userId);
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

    const handleAudioStateChanged = (data: { isPlaying: boolean; position: number; fileName?: string; timestamp: number }) => {
      setRoomState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          audioState: {
            isPlaying: data.isPlaying,
            position: data.position,
            timestamp: data.timestamp,
            fileName: data.fileName,
          },
        };
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
      webrtc.closeAllConnections();
    };

    // WebRTC signaling
    const handleOffer = (data: { from: string; offer: RTCSessionDescriptionInit }) => {
      webrtc.handleOffer(data.from, data.offer);
    };

    const handleAnswer = (data: { from: string; answer: RTCSessionDescriptionInit }) => {
      webrtc.handleAnswer(data.from, data.answer);
    };

    const handleIceCandidate = (data: { from: string; candidate: RTCIceCandidateInit }) => {
      webrtc.handleIceCandidate(data.from, data.candidate);
    };

    socketService.on('connect', handleConnect);
    socketService.on('disconnect', handleDisconnect);
    socketService.on('user-joined', handleUserJoined);
    socketService.on('user-left', handleUserLeft);
    socketService.on('host-changed', handleHostChanged);
    socketService.on('audio-sync', handleAudioSync);
    socketService.on('audio-state-changed', handleAudioStateChanged);
    socketService.on('ptt-started', handlePTTStarted);
    socketService.on('ptt-ended', handlePTTEnded);
    socketService.on('kicked', handleKicked);
    socketService.on('offer', handleOffer);
    socketService.on('answer', handleAnswer);
    socketService.on('ice-candidate', handleIceCandidate);

    return () => {
      socketService.off('connect', handleConnect);
      socketService.off('disconnect', handleDisconnect);
      socketService.off('user-joined', handleUserJoined);
      socketService.off('user-left', handleUserLeft);
      socketService.off('host-changed', handleHostChanged);
      socketService.off('audio-sync', handleAudioSync);
      socketService.off('audio-state-changed', handleAudioStateChanged);
      socketService.off('ptt-started', handlePTTStarted);
      socketService.off('ptt-ended', handlePTTEnded);
      socketService.off('kicked', handleKicked);
      socketService.off('offer', handleOffer);
      socketService.off('answer', handleAnswer);
      socketService.off('ice-candidate', handleIceCandidate);
    };
  }, []);

  const createRoom = useCallback((userName: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      socketService.emit('create-room', { userName }, (response: any) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error));
        }
      });
    });
  }, []);

  const joinRoom = useCallback((code: string, userName: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      socketService.emit('join-room', { code, userName }, (response: any) => {
        if (response.success) {
          resolve();
        } else {
          reject(new Error(response.error));
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
      webrtc.closeAllConnections();
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

  const updateAudioState = useCallback((isPlaying: boolean, position: number, fileName?: string) => {
    if (roomState && isHost) {
      socketService.emit('audio-state-changed', {
        code: roomState.code,
        isPlaying,
        position,
        fileName,
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
    kickUser,
  };
}
