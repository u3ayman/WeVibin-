# Setting Up HTTPS for Spotify OAuth

Spotify requires HTTPS for OAuth redirect URIs. Here's how to set it up:

## ✅ Already Configured!

Your `vite.config.ts` is already set to use HTTPS with Vite's built-in self-signed certificate.

## How to Use

### 1. Set Redirect URI in Spotify Dashboard

Go to https://developer.spotify.com/dashboard and set:
```
https://localhost:5176/callback
```

### 2. Start the Dev Server

```bash
cd client
npm run dev
```

### 3. Accept the Security Warning

When you first visit `https://localhost:5176`, your browser will show a security warning because it's a self-signed certificate.

**To proceed:**

- **Chrome/Edge**: Click "Advanced" → "Proceed to localhost (unsafe)"
- **Firefox**: Click "Advanced" → "Accept the Risk and Continue"
- **Safari**: Click "Show Details" → "visit this website"

This is normal for development with self-signed certificates and is safe for localhost.

### 4. Update Main Process for HTTPS

The Electron main process needs to load the HTTPS URL:

Already configured in `src/main/index.ts`:
```typescript
mainWindow.loadURL('https://localhost:5176'); // Changed from http
```

## Troubleshooting

**"NET::ERR_CERT_AUTHORITY_INVALID"**
- This is expected with self-signed certificates
- Click "Advanced" and proceed

**"Unable to connect"**
- Make sure Vite dev server is running: `npm run dev`
- Check the port is 5176
- Try `https://localhost:5176` directly in browser

**Spotify OAuth not working**
- Ensure redirect URI in Spotify Dashboard matches exactly: `https://localhost:5176/callback`
- Check browser console for errors
- Make sure you clicked through the certificate warning

## Production

For production builds, you'll need a proper SSL certificate from a certificate authority (Let's Encrypt, etc.).
