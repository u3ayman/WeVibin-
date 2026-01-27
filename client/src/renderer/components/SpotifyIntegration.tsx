import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Music, Search, List, X } from 'lucide-react';
import {
  spotifyService,
  SpotifyTrack,
  SpotifyPlaylist,
} from '../services/spotify';

interface SpotifyIntegrationProps {
  onTrackSelected: (track: SpotifyTrack) => void;
  onClose: () => void;
}

export function SpotifyIntegration({
  onTrackSelected,
  onClose,
}: SpotifyIntegrationProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([]);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] =
    useState<SpotifyPlaylist | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<SpotifyTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [view, setView] = useState<'search' | 'playlists'>('search');

  useEffect(() => {
    checkAuth();

    // Listen for auth callback
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'spotify-auth-success') {
        checkAuth();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadPlaylists();
    }
  }, [isAuthenticated]);

  const checkAuth = () => {
    setIsAuthenticated(spotifyService.isAuthenticated());
  };

  const handleAuthenticate = () => {
    spotifyService.authenticate();
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    const results = await spotifyService.searchTracks(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const loadPlaylists = async () => {
    const userPlaylists = await spotifyService.getUserPlaylists();
    setPlaylists(userPlaylists);
  };

  const handlePlaylistClick = async (playlist: SpotifyPlaylist) => {
    setSelectedPlaylist(playlist);
    const tracks = await spotifyService.getPlaylistTracks(playlist.id);
    setPlaylistTracks(tracks);
  };

  const handleTrackSelect = (track: SpotifyTrack) => {
    onTrackSelected(track);
    onClose();
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isAuthenticated) {
    return (
      <div className="wv-overlay" style={{ zIndex: 2000 }} onClick={onClose}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={(e) => e.stopPropagation()}
          className="wv-modal"
          style={{
            width: 'min(520px, 100%)',
            border: '1px solid rgba(30, 215, 96, 0.22)',
          }}
        >
          <div style={{ padding: '22px', textAlign: 'center' }}>
            <div
              style={{
                width: '80px',
                height: '80px',
                margin: '0 auto 24px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1DB954, #1ed760)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Music size={40} color="#fff" />
            </div>

            <h2
              style={{
                fontSize: '28px',
                marginBottom: '16px',
                color: '#f5f5f7',
              }}
            >
              Connect to Spotify
            </h2>

            <p
              style={{
                color: '#a1a1aa',
                marginBottom: '32px',
                lineHeight: '1.6',
              }}
            >
              Link your Spotify account to play music from your library and
              playlists during your WeVibin&apos; party.
            </p>

            <button
              onClick={handleAuthenticate}
              className="wv-btn"
              style={{
                width: '100%',
                background: '#1DB954',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: '14px',
                fontWeight: 700,
                boxShadow: '0 10px 24px rgba(29, 185, 84, 0.25)',
                marginBottom: '12px',
              }}
            >
              Connect Spotify
            </button>

            <button
              onClick={onClose}
              className="wv-btn wv-btn--ghost"
              style={{ width: '100%' }}
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="wv-overlay" style={{ zIndex: 2000 }} onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="wv-modal"
        style={{
          width: 'min(980px, 100%)',
          height: 'min(80vh, 820px)',
          border: '1px solid rgba(30, 215, 96, 0.22)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #1DB954, #1ed760)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Music size={24} color="#fff" />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '24px',
                  color: '#f5f5f7',
                  marginBottom: '4px',
                }}
              >
                Spotify Music
              </h2>
              <p style={{ fontSize: '14px', color: '#a1a1aa' }}>
                Search tracks or browse your playlists
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.10)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#f5f5f7',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <button
            onClick={() => setView('search')}
            style={{
              padding: '8px 16px',
              background:
                view === 'search' ? 'rgba(29, 185, 84, 0.2)' : 'transparent',
              border:
                view === 'search'
                  ? '1px solid #1DB954'
                  : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: view === 'search' ? '#1DB954' : '#a1a1aa',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            <Search size={16} />
            Search
          </button>

          <button
            onClick={() => setView('playlists')}
            style={{
              padding: '8px 16px',
              background:
                view === 'playlists' ? 'rgba(29, 185, 84, 0.2)' : 'transparent',
              border:
                view === 'playlists'
                  ? '1px solid #1DB954'
                  : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: view === 'playlists' ? '#1DB954' : '#a1a1aa',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            <List size={16} />
            Playlists
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {view === 'search' && (
            <>
              {/* Search Bar */}
              <div
                style={{
                  marginBottom: '18px',
                  display: 'flex',
                  gap: '10px',
                  flexWrap: 'wrap',
                }}
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  placeholder="Search for tracks..."
                  className="wv-input"
                  style={{
                    flex: 1,
                    minWidth: '220px',
                    borderColor: 'rgba(29, 185, 84, 0.25)',
                  }}
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="wv-btn"
                  style={{
                    background: '#1DB954',
                    border: '1px solid rgba(255,255,255,0.10)',
                    color: '#fff',
                    fontWeight: 700,
                    opacity: isSearching ? 0.7 : 1,
                    flex: '0 0 auto',
                  }}
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>

              {/* Search Results */}
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                {searchResults.map((track) => (
                  <div
                    key={track.id}
                    onClick={() => handleTrackSelect(track)}
                    style={{
                      padding: '12px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        'rgba(29, 185, 84, 0.1)';
                      e.currentTarget.style.borderColor = '#1DB954';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        'rgba(255,255,255,0.05)';
                      e.currentTarget.style.borderColor =
                        'rgba(255,255,255,0.1)';
                    }}
                  >
                    <img
                      src={
                        track.album.images[2]?.url || track.album.images[0]?.url
                      }
                      alt={track.album.name}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '8px',
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#f5f5f7',
                          marginBottom: '4px',
                        }}
                      >
                        {track.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#a1a1aa' }}>
                        {track.artists.map((a) => a.name).join(', ')}
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#a1a1aa' }}>
                      {formatDuration(track.duration_ms)}
                    </div>
                  </div>
                ))}

                {searchResults.length === 0 && !isSearching && (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '48px',
                      color: '#a1a1aa',
                    }}
                  >
                    Search for your favorite tracks
                  </div>
                )}
              </div>
            </>
          )}

          {view === 'playlists' && (
            <>
              {!selectedPlaylist ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fill, minmax(160px, 1fr))',
                    gap: '16px',
                  }}
                >
                  {playlists.map((playlist) => (
                    <div
                      key={playlist.id}
                      onClick={() => handlePlaylistClick(playlist)}
                      style={{
                        cursor: 'pointer',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        background: 'rgba(255,255,255,0.05)',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          'rgba(29, 185, 84, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          'rgba(255,255,255,0.05)';
                      }}
                    >
                      <img
                        src={playlist.images[0]?.url}
                        alt={playlist.name}
                        style={{
                          width: '100%',
                          aspectRatio: '1',
                          objectFit: 'cover',
                        }}
                      />
                      <div style={{ padding: '12px' }}>
                        <div
                          style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#f5f5f7',
                            marginBottom: '4px',
                          }}
                        >
                          {playlist.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#a1a1aa' }}>
                          {playlist.tracks.total} tracks
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setSelectedPlaylist(null);
                      setPlaylistTracks([]);
                    }}
                    style={{
                      marginBottom: '16px',
                      padding: '8px 16px',
                      background: 'rgba(255,255,255,0.1)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#f5f5f7',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    ← Back to Playlists
                  </button>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    {playlistTracks.map((track) => (
                      <div
                        key={track.id}
                        onClick={() => handleTrackSelect(track)}
                        style={{
                          padding: '12px',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            'rgba(29, 185, 84, 0.1)';
                          e.currentTarget.style.borderColor = '#1DB954';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            'rgba(255,255,255,0.05)';
                          e.currentTarget.style.borderColor =
                            'rgba(255,255,255,0.1)';
                        }}
                      >
                        <img
                          src={
                            track.album.images[2]?.url ||
                            track.album.images[0]?.url
                          }
                          alt={track.album.name}
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '8px',
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#f5f5f7',
                              marginBottom: '4px',
                            }}
                          >
                            {track.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#a1a1aa' }}>
                            {track.artists.map((a) => a.name).join(', ')}
                          </div>
                        </div>
                        <div style={{ fontSize: '12px', color: '#a1a1aa' }}>
                          {formatDuration(track.duration_ms)}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
