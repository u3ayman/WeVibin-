// Spotify API Configuration
export const SPOTIFY_CONFIG = {
  CLIENT_ID: '9b64bc936f434160b7e3a97ade878737',
  REDIRECT_URI: 'https://localhost:5176/callback',
  SCOPES: [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-read-playback-state',
    'user-modify-playback-state',
    'playlist-read-private',
    'playlist-read-collaborative',
    'user-library-read',
  ].join(' '),
};

export const SPOTIFY_AUTH_URL = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CONFIG.CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(SPOTIFY_CONFIG.REDIRECT_URI)}&scope=${encodeURIComponent(SPOTIFY_CONFIG.SCOPES)}`;
