import React, { useState, useRef, useEffect } from 'react';
import { RoomState } from '../types';

interface RoomProps {
  roomState: RoomState;
  isHost: boolean;
  speakingUsers: Set<string>;
  isTransmitting: boolean;
  isMuted: boolean;
  onLeave: () => void;
  onKickUser: (userId: string) => void;
  onAudioStateChanged: (isPlaying: boolean, position: number, fileName?: string) => void;
  onSyncAudio: (position: number, isPlaying: boolean) => void;
  onToggleMute: () => void;
  onStartTransmitting: () => void;
  onStopTransmitting: () => void;
  mySocketId?: string;
}

export function Room({
  roomState,
  isHost,
  speakingUsers,
  isTransmitting,
  isMuted,
  onLeave,
  onKickUser,
  onAudioStateChanged,
  onSyncAudio,
  onToggleMute,
  onStartTransmitting,
  onStopTransmitting,
  mySocketId,
}: RoomProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Sync audio every 5 seconds
  useEffect(() => {
    if (isHost && audioRef.current) {
      syncIntervalRef.current = setInterval(() => {
        if (audioRef.current && !isSeeking) {
          onSyncAudio(audioRef.current.currentTime, !audioRef.current.paused);
        }
      }, 5000);

      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
      };
    }
  }, [isHost, isSeeking, onSyncAudio]);

  // Handle audio state changes from server (for non-hosts)
  useEffect(() => {
    if (!isHost && audioRef.current && roomState.audioState) {
      const audio = audioRef.current;
      const { isPlaying, position, timestamp } = roomState.audioState;

      // Calculate expected position with drift correction
      const timeSinceUpdate = (Date.now() - timestamp) / 1000;
      const expectedPosition = position + timeSinceUpdate;
      const currentPosition = audio.currentTime;
      const drift = Math.abs(expectedPosition - currentPosition);

      if (drift > 0.1) {
        if (currentPosition < expectedPosition) {
          audio.playbackRate = 1.02; // Speed up
        } else {
          audio.playbackRate = 0.98; // Slow down
        }
      } else {
        audio.playbackRate = 1.0; // In sync
      }

      if (isPlaying && audio.paused) {
        audio.play();
      } else if (!isPlaying && !audio.paused) {
        audio.pause();
      }
    }
  }, [isHost, roomState.audioState]);

  // Audio ducking when someone speaks
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = speakingUsers.size > 0 ? 0.4 : 1.0;
    }
  }, [speakingUsers.size]);

  const handleSelectFile = async () => {
    if (!isHost) return;

    const filePath = await window.electron.selectAudioFile();
    if (filePath && audioRef.current) {
      audioRef.current.src = `file://${filePath}`;
      audioRef.current.load();
      const fileName = filePath.split(/[\\/]/).pop() || 'Unknown';
      onAudioStateChanged(false, 0, fileName);
    }
  };

  const handlePlayPause = () => {
    if (!isHost || !audioRef.current) return;

    if (audioRef.current.paused) {
      audioRef.current.play();
      onAudioStateChanged(true, audioRef.current.currentTime, roomState.audioState.fileName);
    } else {
      audioRef.current.pause();
      onAudioStateChanged(false, audioRef.current.currentTime, roomState.audioState.fileName);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isHost || !audioRef.current) return;

    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    onAudioStateChanged(!audioRef.current.paused, newTime, roomState.audioState.fileName);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && !isSeeking) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomState.code);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}>
          <div>
            <h2 style={{ color: 'white', fontSize: '24px', marginBottom: '8px' }}>
              Room Code: <span onClick={copyRoomCode} style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                {roomState.code}
              </span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
              Click to copy
            </p>
          </div>
          <button
            onClick={onLeave}
            style={{
              padding: '12px 24px',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            Leave Room
          </button>
        </div>

        {/* Music Player */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '24px',
        }}>
          <audio
            ref={audioRef}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            style={{ display: 'none' }}
          />

          <div style={{
            width: '200px',
            height: '200px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            margin: '0 auto 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '64px',
          }}>
            🎵
          </div>

          <h3 style={{
            textAlign: 'center',
            fontSize: '20px',
            marginBottom: '16px',
            color: '#374151',
          }}>
            {roomState.audioState.fileName || 'No file selected'}
          </h3>

          <div style={{ marginBottom: '16px' }}>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              onMouseDown={() => setIsSeeking(true)}
              onMouseUp={() => setIsSeeking(false)}
              disabled={!isHost}
              style={{
                width: '100%',
                height: '6px',
                cursor: isHost ? 'pointer' : 'not-allowed',
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '14px',
              color: '#6b7280',
              marginTop: '8px',
            }}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            marginBottom: '16px',
          }}>
            {isHost && (
              <button
                onClick={handlePlayPause}
                style={{
                  padding: '12px 32px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                }}
              >
                {roomState.audioState.isPlaying ? '⏸️ Pause' : '▶️ Play'}
              </button>
            )}
          </div>

          {isHost && (
            <button
              onClick={handleSelectFile}
              style={{
                width: '100%',
                padding: '12px',
                background: 'white',
                color: '#667eea',
                border: '2px solid #667eea',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              📁 Select Audio File
            </button>
          )}
        </div>

        {/* Voice Controls */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <button
            onMouseDown={onStartTransmitting}
            onMouseUp={onStopTransmitting}
            onMouseLeave={onStopTransmitting}
            style={{
              padding: '20px 40px',
              background: isTransmitting
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '18px',
              fontWeight: '600',
              transition: 'all 0.2s',
            }}
          >
            {isTransmitting ? '🎤 Speaking...' : '🎤 Hold to Talk (Space)'}
          </button>

          <button
            onClick={onToggleMute}
            style={{
              padding: '20px',
              background: isMuted ? '#ef4444' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '18px',
            }}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* Participants Sidebar */}
      <div style={{
        width: '300px',
        background: 'white',
        padding: '20px',
        overflowY: 'auto',
      }}>
        <h3 style={{
          fontSize: '20px',
          marginBottom: '16px',
          color: '#374151',
        }}>
          Participants ({roomState.users.length})
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {roomState.users.map(user => (
            <div
              key={user.id}
              style={{
                padding: '12px',
                background: speakingUsers.has(user.id) ? '#dbeafe' : '#f3f4f6',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: speakingUsers.has(user.id) ? '2px solid #3b82f6' : '2px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              <div>
                <div style={{
                  fontWeight: '600',
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  {user.id === roomState.host.id && '👑 '}
                  {user.name}
                  {user.id === mySocketId && ' (You)'}
                </div>
                {speakingUsers.has(user.id) && (
                  <div style={{ fontSize: '12px', color: '#3b82f6', marginTop: '4px' }}>
                    🎤 Speaking
                  </div>
                )}
              </div>

              {isHost && user.id !== roomState.host.id && (
                <button
                  onClick={() => onKickUser(user.id)}
                  style={{
                    padding: '6px 12px',
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                  }}
                >
                  Kick
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
