import React, { useEffect } from 'react';
import { spotifyService } from '../services/spotify';

export function SpotifyCallback() {
  useEffect(() => {
    // Get hash from URL
    const hash = window.location.hash;

    if (hash) {
      const success = spotifyService.handleCallback(hash);

      if (success) {
        // Notify opener window
        if (window.opener) {
          window.opener.postMessage({ type: 'spotify-auth-success' }, '*');
        }

        // Close this popup window
        setTimeout(() => {
          window.close();
        }, 1000);
      }
    }
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0a0a0f',
        color: '#f5f5f7',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 24px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1DB954, #1ed760)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="#fff">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
          </svg>
        </div>
        <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>
          Connecting to Spotify...
        </h2>
        <p style={{ color: '#a1a1aa' }}>This window will close automatically</p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
