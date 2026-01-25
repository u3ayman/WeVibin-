import { SPOTIFY_AUTH_URL } from '../config/spotify';

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  duration_ms: number;
  uri: string;
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  images: { url: string }[];
  tracks: { total: number };
}

class SpotifyService {
  private accessToken: string | null = null;
  private player: any = null;
  private deviceId: string | null = null;
  private onPlayerStateChange: ((state: any) => void) | null = null;

  constructor() {
    this.loadToken();
  }

  private loadToken() {
    const token = localStorage.getItem('spotify_access_token');
    const expiry = localStorage.getItem('spotify_token_expiry');
    
    if (token && expiry) {
      const now = Date.now();
      if (now < parseInt(expiry)) {
        this.accessToken = token;
        console.log('[Spotify] Token loaded from storage');
      } else {
        console.log('[Spotify] Token expired');
        this.clearToken();
      }
    }
  }

  private saveToken(token: string, expiresIn: number) {
    this.accessToken = token;
    const expiry = Date.now() + expiresIn * 1000;
    localStorage.setItem('spotify_access_token', token);
    localStorage.setItem('spotify_token_expiry', expiry.toString());
    console.log('[Spotify] Token saved');
  }

  private clearToken() {
    this.accessToken = null;
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_token_expiry');
  }

  // Authentication
  authenticate() {
    console.log('[Spotify] Opening authentication window');
    window.open(SPOTIFY_AUTH_URL, '_blank', 'width=500,height=700');
  }

  handleCallback(hash: string) {
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    const expiresIn = params.get('expires_in');

    if (accessToken && expiresIn) {
      this.saveToken(accessToken, parseInt(expiresIn));
      return true;
    }
    return false;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  logout() {
    this.clearToken();
    if (this.player) {
      this.player.disconnect();
      this.player = null;
    }
    this.deviceId = null;
  }

  // Initialize Spotify Web Playback SDK
  async initializePlayer(onReady: () => void, onStateChange: (state: any) => void): Promise<boolean> {
    if (!this.accessToken) {
      console.error('[Spotify] No access token');
      return false;
    }

    this.onPlayerStateChange = onStateChange;

    return new Promise((resolve) => {
      if (window.Spotify) {
        this.setupPlayer(onReady, onStateChange);
        resolve(true);
      } else {
        window.onSpotifyWebPlaybackSDKReady = () => {
          this.setupPlayer(onReady, onStateChange);
          resolve(true);
        };

        // Load SDK if not already loaded
        if (!document.querySelector('script[src*="spotify-player"]')) {
          const script = document.createElement('script');
          script.src = 'https://sdk.scdn.co/spotify-player.js';
          document.body.appendChild(script);
        }
      }
    });
  }

  private setupPlayer(onReady: () => void, onStateChange: (state: any) => void) {
    this.player = new window.Spotify.Player({
      name: 'WeVibin\' Player',
      getOAuthToken: (cb: (token: string) => void) => {
        cb(this.accessToken!);
      },
      volume: 1.0,
    });

    // Ready
    this.player.addListener('ready', ({ device_id }: { device_id: string }) => {
      console.log('[Spotify] Ready with Device ID', device_id);
      this.deviceId = device_id;
      onReady();
    });

    // Not Ready
    this.player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
      console.log('[Spotify] Device ID has gone offline', device_id);
    });

    // Player state changed
    this.player.addListener('player_state_changed', (state: any) => {
      if (!state) return;
      console.log('[Spotify] State changed:', state);
      onStateChange(state);
    });

    // Errors
    this.player.addListener('initialization_error', ({ message }: { message: string }) => {
      console.error('[Spotify] Initialization error:', message);
    });

    this.player.addListener('authentication_error', ({ message }: { message: string }) => {
      console.error('[Spotify] Authentication error:', message);
      this.clearToken();
    });

    this.player.addListener('account_error', ({ message }: { message: string }) => {
      console.error('[Spotify] Account error:', message);
    });

    this.player.connect();
  }

  // Playback control
  async play(uri?: string) {
    if (!this.deviceId || !this.accessToken) return;

    const endpoint = `https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`;
    const body = uri ? { uris: [uri] } : undefined;

    try {
      await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      console.log('[Spotify] Playing:', uri || 'current track');
    } catch (error) {
      console.error('[Spotify] Play error:', error);
    }
  }

  async pause() {
    if (!this.accessToken) return;

    try {
      await fetch('https://api.spotify.com/v1/me/player/pause', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });
      console.log('[Spotify] Paused');
    } catch (error) {
      console.error('[Spotify] Pause error:', error);
    }
  }

  async seek(positionMs: number) {
    if (!this.accessToken) return;

    try {
      await fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${positionMs}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });
      console.log('[Spotify] Seeked to:', positionMs);
    } catch (error) {
      console.error('[Spotify] Seek error:', error);
    }
  }

  async setVolume(volumePercent: number) {
    if (!this.accessToken) return;

    try {
      await fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${volumePercent}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });
    } catch (error) {
      console.error('[Spotify] Volume error:', error);
    }
  }

  // Search
  async searchTracks(query: string, limit: number = 20): Promise<SpotifyTrack[]> {
    if (!this.accessToken) return [];

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      const data = await response.json();
      return data.tracks?.items || [];
    } catch (error) {
      console.error('[Spotify] Search error:', error);
      return [];
    }
  }

  // Get user's playlists
  async getUserPlaylists(): Promise<SpotifyPlaylist[]> {
    if (!this.accessToken) return [];

    try {
      const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('[Spotify] Playlists error:', error);
      return [];
    }
  }

  // Get playlist tracks
  async getPlaylistTracks(playlistId: string): Promise<SpotifyTrack[]> {
    if (!this.accessToken) return [];

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      const data = await response.json();
      return data.items?.map((item: any) => item.track) || [];
    } catch (error) {
      console.error('[Spotify] Playlist tracks error:', error);
      return [];
    }
  }

  // Get current playback state
  async getCurrentState() {
    if (!this.player) return null;
    return await this.player.getCurrentState();
  }

  getDeviceId(): string | null {
    return this.deviceId;
  }
}

// Extend Window interface for Spotify SDK
declare global {
  interface Window {
    Spotify: any;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

export const spotifyService = new SpotifyService();
export type { SpotifyTrack, SpotifyPlaylist };
