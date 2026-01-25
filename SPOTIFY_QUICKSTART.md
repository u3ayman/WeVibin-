# Quick Start: Spotify Integration

## 1. Get Spotify Credentials (5 minutes)

1. Visit https://developer.spotify.com/dashboard
2. Click "Create an App"
3. Name it "WeVibin'" and add this redirect URI: `https://localhost:5176/callback`
4. Copy your **Client ID**

## 2. Configure the App

Open `client/src/renderer/config/spotify.ts` and replace:

```typescript
CLIENT_ID: 'YOUR_SPOTIFY_CLIENT_ID'
```

With your actual Client ID:

```typescript
CLIENT_ID: 'abc123def456...'  // Your actual Client ID
```

## 3. Use It!

1. **Start the app** (npm start or start-all.bat)
2. **Accept the HTTPS certificate warning** in your browser (click "Advanced" → "Proceed to localhost")
3. **Create/Join a room**
4. **Click the "Spotify" button** in the music player
5. **Authenticate** when prompted
6. **Search or browse** your playlists
7. **Select a track** and enjoy!

**Note**: The HTTPS certificate warning is normal for development. Click through it to continue.

## Requirements

✅ Spotify Premium account (required)  
✅ Internet connection  
✅ Modern browser/Electron app  

## Troubleshooting

**Certificate warning in browser?**
- This is normal for self-signed HTTPS certificates
- Click "Advanced" → "Proceed to localhost (unsafe)"
- It's safe for local development

**Can't authenticate?**
- Check your Client ID is correct
- Make sure redirect URI matches exactly: `https://localhost:5176/callback`
- Ensure you accepted the HTTPS certificate warning

**Playback not working?**
- Confirm you have Spotify Premium
- Check browser console for errors
- Try refreshing and reconnecting

**Out of sync?**
- The app auto-corrects every 5 seconds
- Try pause/resume if issues persist

For detailed documentation, see [SPOTIFY_SETUP.md](SPOTIFY_SETUP.md)
