import React, { useState, useRef, useEffect } from 'react';
import { RoomState, Track } from '../types';
import { SpotifyIntegration } from './SpotifyIntegration';
import { spotifyService, SpotifyTrack } from '../services/spotify';
import { useToast } from './Toast';

import { Queue } from './Queue';
import { Disc } from 'lucide-react';

interface RoomProps {
  roomState: RoomState;
  isHost: boolean;
  speakingUsers: Set<string>;
  isTransmitting: boolean;
  isMuted: boolean;
  onLeave: () => void;
  onKickUser: (userId: string) => void;
  onAudioStateChanged: (
    isPlaying: boolean,
    position: number,
    currentTrack?: Track,
  ) => void;
  onSyncAudio: (position: number, isPlaying: boolean) => void;
  onAddToQueue: (track: Track) => void;
  onRemoveFromQueue: (trackId: string) => void;
  onNextTrack: () => void;
  onToggleMute: () => void;
  onStartTransmitting: () => void;
  onStopTransmitting: () => void;
  mySocketId: string;
  toast: ReturnType<typeof useToast>;
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
  onAddToQueue,
  onRemoveFromQueue,
  onNextTrack,
  onToggleMute,
  onStartTransmitting,
  onStopTransmitting,
  mySocketId,
  toast,
}: RoomProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showSpotifyModal, setShowSpotifyModal] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isSpotifyReady, setIsSpotifyReady] = useState(false);
  const [pttKeyLabel, setPttKeyLabel] = useState('Space');
  const [volume] = useState(1.0);

  // Load PTT key label from settings
  useEffect(() => {
    const settings = localStorage.getItem('wevibin-settings');
    if (settings) {
      try {
        const parsed = JSON.parse(settings);
        setPttKeyLabel(parsed.pushToTalkKey || 'Space');
      } catch {
        setPttKeyLabel('Space');
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync audio every 5 seconds
  useEffect(() => {
    if (isHost && audioRef.current) {
      syncIntervalRef.current = setInterval(() => {
        if (audioRef.current && !isSeeking) {
          onSyncAudio(
            audioRef.current.currentTime * 1000,
            !audioRef.current.paused,
          );
        }
      }, 5000);

      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
      };
    }
  }, [isHost, isSeeking, onSyncAudio]);

  // Initialize Spotify if authenticated
  useEffect(() => {
    if (spotifyService.isAuthenticated()) {
      spotifyService.initializePlayer(
        () => {
          setIsSpotifyReady(true);
        },
        (state) => {
          if (
            state &&
            roomState.audioState.currentTrack?.source === 'spotify'
          ) {
            const positionSec = state.position / 1000;
            setCurrentTime(positionSec);
            setDuration(state.duration / 1000);
          }
        },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle audio state changes from server (for non-hosts)
  useEffect(() => {
    if (!isHost && audioRef.current && roomState.audioState) {
      const audio = audioRef.current;
      const { isPlaying, position, timestamp, currentTrack } =
        roomState.audioState;

      if (currentTrack?.source !== 'local') return;

      const timeSinceUpdate = (Date.now() - timestamp) / 1000;
      const expectedPosition = position / 1000 + timeSinceUpdate;
      const currentPosition = audio.currentTime;
      const drift = Math.abs(expectedPosition - currentPosition);

      if (drift > 0.1) {
        if (currentPosition < expectedPosition) {
          audio.playbackRate = 1.02;
        } else {
          audio.playbackRate = 0.98;
        }
      } else {
        audio.playbackRate = 1.0;
      }

      if (isPlaying && audio.paused) {
        audio.play().catch((err) => console.error('Auto-play error:', err));
      } else if (!isPlaying && !audio.paused) {
        audio.pause();
      }
    }
  }, [isHost, roomState.audioState]);

  // Auto-play next song when current ends
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isHost) return;

    const handleEnded = () => {
      onNextTrack();
    };

    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, [isHost, onNextTrack]);

  // Audio ducking
  useEffect(() => {
    if (audioRef.current) {
      const baseVolume = volume;
      audioRef.current.volume =
        speakingUsers.size > 0 ? baseVolume * 0.4 : baseVolume;
    }
  }, [speakingUsers.size, volume]);

  // Web-mode file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectFile = async () => {
    if (!isHost) return;

    if (window.electron) {
      // Electron Mode
      const filePath = await window.electron.selectAudioFile();
      if (filePath) {
        const fileName = filePath.split(/[\\/]/).pop() || 'Unknown';
        const track: Track = {
          id: `local-${Date.now()}`,
          name: fileName,
          artists: 'Local File',
          source: 'local',
          fileName,
          duration: 0,
          addedBy: {
            id: mySocketId,
            name:
              roomState.users.find((u) => u.id === mySocketId)?.name || 'Guest',
          },
        };
        onAddToQueue(track);
      }
    } else {
      // Web Mode: Trigger hidden file input
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    const audio = new Audio(objectUrl);

    audio.onloadedmetadata = () => {
      const track: Track = {
        id: `local-${Date.now()}`,
        name: file.name,
        artists: 'Local File',
        source: 'local',
        fileName: file.name,
        // For web mode, we might handle the URL differently or pass the blob URL
        // But for now, let's treat it similar to local but needing special handling in Audio player if possible
        // Ideally, we'd need to pass the Blob URL to the audio player
        uri: objectUrl,
        duration: audio.duration * 1000,
        addedBy: {
          id: mySocketId,
          name: roomState.users.find((u) => u.id === mySocketId)?.name || 'Guest',
        },
      };

      onAddToQueue(track);
      // Clean up previous blob URLs if needed, or handle memory management
    };
  };

  const handlePlayPause = async () => {
    if (!isHost) return;

    if (roomState.audioState.currentTrack?.source === 'spotify') {
      if (roomState.audioState.isPlaying) {
        spotifyService.pause();
        onAudioStateChanged(
          false,
          currentTime * 1000,
          roomState.audioState.currentTrack,
        );
      } else {
        spotifyService.play();
        onAudioStateChanged(
          true,
          currentTime * 1000,
          roomState.audioState.currentTrack,
        );
      }
    } else if (audioRef.current) {
      try {
        if (audioRef.current.paused) {
          await audioRef.current.play();
          onAudioStateChanged(
            true,
            audioRef.current.currentTime * 1000,
            roomState.audioState.currentTrack,
          );
        } else {
          audioRef.current.pause();
          onAudioStateChanged(
            false,
            audioRef.current.currentTime * 1000,
            roomState.audioState.currentTrack,
          );
        }
      } catch (error) {
        console.error('Play/pause error:', error);
      }
    }
  };

  const handleSpotifyTrackSelected = async (track: SpotifyTrack) => {
    const newTrack: Track = {
      id: track.id,
      name: track.name,
      artists: track.artists.map((a) => a.name).join(', '),
      albumArt: track.album.images[1]?.url || track.album.images[0]?.url,
      duration: track.duration_ms,
      source: 'spotify',
      uri: track.uri,
      addedBy: {
        id: mySocketId,
        name: roomState.users.find((u) => u.id === mySocketId)?.name || 'Guest',
      },
    };

    if (isHost && !roomState.audioState.currentTrack) {
      await spotifyService.play(track.uri);
      onAudioStateChanged(true, 0, newTrack);
      setDuration(track.duration_ms / 1000);
    } else {
      onAddToQueue(newTrack);
      toast.success('Added to queue');
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);

    if (!isHost) return;

    if (roomState.audioState.currentTrack?.source === 'spotify') {
      spotifyService.seek(Math.floor(newTime * 1000));
      onAudioStateChanged(
        roomState.audioState.isPlaying,
        newTime * 1000,
        roomState.audioState.currentTrack,
      );
      return;
    }

    if (!audioRef.current) return;
    audioRef.current.currentTime = newTime;
    onAudioStateChanged(
      !audioRef.current.paused,
      newTime * 1000,
      roomState.audioState.currentTrack,
    );
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

  return (
    <>
      <style>{`
        @keyframes pulse-border {
          0%, 100% { box-shadow: 0 0 20px rgba(34, 211, 238, 0.4), 0 0 40px rgba(168, 85, 247, 0.3); }
          50% { box-shadow: 0 0 30px rgba(34, 211, 238, 0.6), 0 0 60px rgba(168, 85, 247, 0.5); }
        }
      `}</style>
      <div
        className="wv-room"
        style={{
          display: 'flex',
          height: '100vh',
          padding: '22px',
          gap: '18px',
          background: 'transparent',
        }}
      >
        {/* Participants Sidebar (Left) */}
        <div
          className="wv-card wv-roomSidebar"
          style={{
            width: '300px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <h3
            style={{
              fontSize: '20px',
              marginBottom: '16px',
              color: 'rgba(245,245,247,0.95)',
            }}
          >
            Participants ({roomState.users.length})
          </h3>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              overflowY: 'auto',
            }}
          >
            {roomState.users.map((user) => (
              <div
                key={user.id}
                style={{
                  padding: '12px',
                  background: speakingUsers.has(user.id)
                    ? 'rgba(34, 211, 238, 0.10)'
                    : 'rgba(255,255,255,0.04)',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: speakingUsers.has(user.id)
                    ? '2px solid #22d3ee'
                    : '1px solid rgba(255,255,255,0.08)',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: '600',
                      color: 'rgba(245,245,247,0.95)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {user.id === roomState.host.id && '👑 '}
                    {user.name}
                    {user.id === mySocketId && ' (You)'}
                  </div>
                </div>
                {isHost && user.id !== roomState.host.id && (
                  <button
                    onClick={() => onKickUser(user.id)}
                    className="wv-btn wv-btn--sm"
                    style={{
                      padding: '4px 8px',
                      background: 'rgba(239, 68, 68, 0.2)',
                      color: '#ef4444',
                    }}
                  >
                    Kick
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h2
              style={{
                color: 'rgba(245,245,247,0.95)',
                fontSize: '24px',
                margin: 0,
              }}
            >
              Room:{' '}
              <span
                onClick={() => {
                  navigator.clipboard.writeText(roomState.code);
                  toast.success('Code copied!');
                }}
                style={{ cursor: 'pointer', color: '#22d3ee' }}
              >
                {roomState.code}
              </span>
            </h2>
            <button
              onClick={onLeave}
              className="wv-btn wv-btn--ghost"
              style={{ padding: '8px 16px' }}
            >
              Leave Party
            </button>
          </div>

          {/* Music Player */}
          <div className="wv-card" style={{ padding: '24px' }}>
            <audio
              ref={audioRef}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              style={{ display: 'none' }}
            />

            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <div
                style={{
                  width: '160px',
                  height: '160px',
                  borderRadius: '16px',
                  flexShrink: 0,
                  background: roomState.audioState.currentTrack?.albumArt
                    ? `url(${roomState.audioState.currentTrack.albumArt}) center/cover`
                    : 'linear-gradient(135deg, #1f1f23 0%, #111 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {!roomState.audioState.currentTrack?.albumArt && (
                  <Disc size={64} color="rgba(255,255,255,0.1)" />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ marginBottom: '16px' }}>
                  <h3
                    style={{
                      fontSize: '24px',
                      marginBottom: '4px',
                      color: 'rgba(245,245,247,0.95)',
                      fontWeight: '700',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {roomState.audioState.currentTrack?.name ||
                      'Nothing Playing'}
                  </h3>
                  <p
                    style={{
                      fontSize: '16px',
                      color: 'rgba(245,245,247,0.65)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {roomState.audioState.currentTrack?.artists ||
                      'Queue is empty'}
                  </p>
                </div>

                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
                >
                  {isHost && (
                    <button
                      onClick={handlePlayPause}
                      className="wv-btn"
                      style={{
                        width: '48px',
                        height: '48px',
                        padding: 0,
                        borderRadius: '50%',
                        background: '#fff',
                        color: '#000',
                      }}
                    >
                      {roomState.audioState.isPlaying ? '⏸' : '▶'}
                    </button>
                  )}
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    onMouseDown={() => setIsSeeking(true)}
                    onMouseUp={() => setIsSeeking(false)}
                    disabled={!isHost}
                    style={{ flex: 1, accentColor: '#22d3ee' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={() => setShowSpotifyModal(true)}
                className="wv-btn"
                style={{
                  background: '#1DB954',
                  color: '#fff',
                  flex: 1,
                  borderRadius: '12px',
                }}
              >
                Spotify
              </button>
              <button
                onClick={handleSelectFile}
                className="wv-btn wv-btn--ghost"
                style={{ flex: 1, borderRadius: '12px' }}
              >
                Local File
              </button>
            </div>
          </div>

          {/* Voice Controls */}
          <div
            className="wv-card"
            style={{ padding: '16px', display: 'flex', gap: '12px' }}
          >
            <button
              onMouseDown={onStartTransmitting}
              onMouseUp={onStopTransmitting}
              onMouseLeave={onStopTransmitting}
              className="wv-btn"
              style={{
                flex: 1,
                height: '56px',
                background: isTransmitting
                  ? '#ef4444'
                  : 'linear-gradient(90deg, #22d3ee, #a855f7)',
                color: isTransmitting ? '#fff' : '#000',
                fontWeight: '700',
                borderRadius: '14px',
              }}
            >
              {isTransmitting
                ? '🎤 SPEAKING...'
                : `🎤 HOLD TO TALK (${pttKeyLabel})`}
            </button>
            <button
              onClick={onToggleMute}
              className="wv-btn"
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                background: isMuted
                  ? 'rgba(239, 68, 68, 0.1)'
                  : 'rgba(16, 185, 129, 0.1)',
                color: isMuted ? '#ef4444' : '#10b981',
              }}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
          </div>
        </div>

        {/* Queue Sidebar (Right) */}
        <div
          className="wv-card wv-roomSidebar"
          style={{ width: '350px', padding: '18px' }}
        >
          <Queue
            queue={roomState.queue}
            onRemove={onRemoveFromQueue}
            onSkip={onNextTrack}
            isHost={isHost}
            myUserId={mySocketId}
          />
        </div>

        {showSpotifyModal && (
          <SpotifyIntegration
            onTrackSelected={handleSpotifyTrackSelected}
            onClose={() => setShowSpotifyModal(false)}
          />
        )}

        {/* Hidden file input for Web Mode */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="audio/*"
          style={{ display: 'none' }}
        />
      </div>
    </>
  );
}
