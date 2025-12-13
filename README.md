# WeVibin' - Desktop Music Party App

A desktop application that combines synchronized music playback, push-to-talk voice communication, and a friend system with real-time chat.

## Features

- **Synchronized Music Playback**: Listen to music together with automatic drift correction
- **Push-to-Talk Voice**: Talk with friends while music auto-ducks
- **Friend System**: Add friends via unique codes and message them
- **Party Invitations**: Invite friends to join your party via chat
- **WebRTC Voice**: Peer-to-peer voice communication

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Installation

### Server Setup

```bash
cd server
npm install
```

### Client Setup

```bash
cd client
npm install
```

## Running the Application

### 1. Start the Server

```bash
cd server
npm run dev
```

The server will run on `http://localhost:3001`

### 2. Start the Client (Development)

In a new terminal:

```bash
cd client
npm run dev
```

Then in another terminal:

```bash
cd client
npm run electron
```

## Building for Production

### Build Server

```bash
cd server
npm run build
npm start
```

### Build Client

```bash
cd client
npm run build
npm start
```

## Project Structure

```
WeVibin'/
├── server/
│   ├── src/
│   │   ├── index.ts          # Main Socket.IO server
│   │   ├── rooms.ts          # Room management
│   │   ├── friends.ts        # Friend system
│   │   └── types.ts          # TypeScript interfaces
│   ├── package.json
│   └── tsconfig.json
│
└── client/
    ├── src/
    │   ├── main/             # Electron main process
    │   ├── preload/          # IPC bridge
    │   └── renderer/         # React app
    │       ├── components/   # UI components
    │       ├── hooks/        # React hooks
    │       └── services/     # Socket.IO & WebRTC
    ├── package.json
    └── vite.config.ts
```

## How to Use

### Creating a Room

1. Enter your name
2. Click "Create Room"
3. Share the 6-digit room code with friends

### Joining a Room

1. Enter your name
2. Enter the 6-digit room code
3. Click "Join Room"

### Using Voice Chat

- **Push-to-Talk**: Hold Spacebar or click and hold the PTT button
- **Mute/Unmute**: Click the microphone button
- Music automatically ducks to 40% volume when someone speaks

### Playing Music

1. Host clicks "Select Audio File"
2. Choose an audio file (MP3, WAV, OGG, FLAC)
3. Use play/pause/seek controls (host only)
4. Music syncs automatically across all users

### Friend System

1. Click "Friends" in navigation
2. Click "My Code" to view and copy your friend code
3. Click "Add Friend" and enter a friend's code
4. Click "Chat" on a friend to open chat window
5. Send party invitations directly from chat

## Technical Details

### Sync Algorithm

- Client sends position every 5 seconds
- Server broadcasts with timestamp
- Drift >100ms triggers playback rate adjustment
- Catches up/slows down by 2% until synced

### WebRTC Setup

- STUN server: `stun:stun.l.google.com:19302`
- Signaling via Socket.IO
- Automatic peer connection management
- Opus codec for voice compression

### Audio Ducking

- Music volume: 100% (normal)
- Music volume: 40% (when anyone speaks)
- Smooth 200ms transition

## Troubleshooting

### Microphone Not Working

- Check browser/app permissions
- Ensure microphone is not being used by another app
- Try refreshing the app

### Room Not Found

- Verify the 6-digit code is correct
- Ensure the host hasn't left the room
- Check server is running

### Audio Out of Sync

- Automatic correction occurs every 5 seconds
- If persistent, try refreshing the app
- Check network connection

### Friend Code Not Working

- Verify code format: F-XXXXXXXX (8 characters)
- Ensure the friend has created a session
- Check server connection

## Development

### Server Development

```bash
cd server
npm run dev  # Auto-restarts on file changes
```

### Client Development

```bash
cd client
npm run dev      # Starts Vite dev server + compilers
npm run electron # In separate terminal
```

### Type Checking

```bash
# Server
cd server
npm run type-check

# Client
cd client
npm run type-check
```

## License

MIT

## Credits

Built with:
- Electron
- React
- Socket.IO
- WebRTC
- TypeScript
- Vite
