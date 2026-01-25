# WeVibin' Spotify Integration Setup

## Getting Your Spotify API Credentials

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create an App"
4. Fill in the details:
   - **App name**: WeVibin'
   - **App description**: Desktop music party app with synchronized playback
   - **Redirect URI**: `https://localhost:5176/callback`
5. After creating, copy your **Client ID**

## Setting Up the Environment

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and paste your Spotify Client ID:
   ```
   SPOTIFY_CLIENT_ID=your_actual_client_id_here
   ```

3. Update the client config at `client/src/renderer/config/spotify.ts`:
   - Replace `'YOUR_SPOTIFY_CLIENT_ID'` with your actual Client ID
   - Or set it via environment variable

## How to Use Spotify Integration

### In the App:

1. **Create or Join a Room** - Start a party as usual

2. **Connect Spotify** - In the room, click the Spotify button (next to "Select Audio File")

3. **Authenticate** - A popup will open asking you to log in to Spotify and authorize the app

4. **Search or Browse**:
   - **Search Tab**: Search for any track on Spotify
   - **Playlists Tab**: Browse your personal playlists

5. **Select a Track** - Click on any track to start playing it in sync with everyone

### Features:

- ✅ Real-time synchronized playback across all users
- ✅ Host controls (play/pause/seek)
- ✅ Automatic drift correction
- ✅ Audio ducking when someone speaks (Push-to-Talk)
- ✅ Works alongside local file playback
- ✅ Beautiful album artwork and track info
- ✅ Search millions of tracks
- ✅ Access your personal playlists

### Requirements:

- **Spotify Premium** account (required for Web Playback SDK)
- All users in the room need to be authenticated with Spotify
- Each user needs their own Spotify Premium account

### Limitations:

- Only the host can control playback (play/pause/seek)
- Only the host can select tracks
- Users without Spotify Premium won't be able to play Spotify tracks
- Rate limits apply to Spotify API calls

### Troubleshooting:

**"Player initialization failed"**
- Make sure you have Spotify Premium
- Check that your access token hasn't expired
- Try disconnecting and reconnecting Spotify

**"Track won't play"**
- Ensure all users have authenticated with Spotify
- Check internet connection
- Make sure the track is available in your region

**"Playback out of sync"**
- The app automatically corrects drift every 5 seconds
- If persistent, try pausing and resuming playback

## Development Notes

### Architecture:

- **Spotify Web Playback SDK** - Handles audio playback in the browser
- **Spotify Web API** - For searching tracks, getting playlists, etc.
- **OAuth 2.0 Implicit Grant** - For user authentication
- **Existing Sync Logic** - Reuses the same position/timestamp sync algorithm

### Key Files:

- `client/src/renderer/services/spotify.ts` - Spotify service with SDK integration
- `client/src/renderer/config/spotify.ts` - Configuration and auth URL
- `client/src/renderer/components/SpotifyIntegration.tsx` - UI for search/playlists
- `client/src/renderer/components/SpotifyCallback.tsx` - OAuth callback handler

### API Endpoints Used:

- `/v1/me/player/*` - Playback control
- `/v1/search` - Track search
- `/v1/me/playlists` - User's playlists
- `/v1/playlists/{id}/tracks` - Playlist tracks

## Security Notes

- Never commit your `.env` file to version control
- Client ID can be exposed in client-side code (it's designed for that)
- Client Secret is NOT used (implicit grant flow)
- Access tokens expire after 1 hour and are stored in localStorage
- Users must re-authenticate after token expiry
