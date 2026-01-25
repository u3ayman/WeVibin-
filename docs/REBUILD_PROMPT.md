# WeVibin' - Complete Rebuild Prompt

## Project Overview
Build a desktop application called **WeVibin'** that combines:
1. **Synchronized music playback** (like AmpMe) - multiple users listen to the same music in perfect sync
2. **Push-to-talk voice communication** (like Zello) - users can talk while music plays with automatic audio ducking
3. **Friend system with real-time chat** - add friends via unique codes and message them with party invitations

## Design Integration
**Import all UI designs from the provided Figma folder.** Follow the exact:
- Color schemes and gradients
- Component layouts and spacing
- Typography and icon styles
- Button states and interactions
- Navigation patterns
- Status indicators and badges

## Technical Stack

### Backend (Server)
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Real-time**: Socket.IO for WebSocket communication
- **Port**: 3001
- **State Management**: In-memory Maps (no database)

### Frontend (Client)
- **Desktop Framework**: Electron 28.1.3
- **UI Library**: React 18.2.0 with TypeScript 5.3.3
- **Build Tool**: Vite for renderer, TypeScript compiler for main/preload
- **Styling**: Inline React styles (apply Figma designs here)

### Communication
- **Signaling**: Socket.IO over WebSocket
- **Audio Transport**: WebRTC peer-to-peer connections
- **Codec**: Opus for voice compression
- **STUN Servers**: Google STUN servers (stun:stun.l.google.com:19302)

## Core Features to Implement

### 1. Music Synchronization System

#### Server-Side (RoomManager class)
Create `server/src/rooms.ts` with:
```typescript
class RoomManager {
  - generateRoomCode(): 6-digit numeric code
  - createRoom(hostId, hostName): returns Room object
  - addUserToRoom(roomCode, userId, userName)
  - removeUserFromRoom(roomCode, userId)
  - updateAudioState(roomCode, state: {isPlaying, position, timestamp})
  - kickUser(roomCode, hostId, targetUserId)
  - transferHost(roomCode, currentHostId, newHostId)
}
```

**Room State Structure**:
```typescript
interface Room {
  code: string;
  host: { id: string; name: string };
  users: Map<userId, { id, name, socketId }>;
  audioState: {
    isPlaying: boolean;
    position: number; // seconds
    timestamp: number; // server time
    fileName?: string;
  };
}
```

#### Client-Side Sync Logic
- **Every 5 seconds**: Client sends current position to server
- **Server broadcasts**: Updated position + timestamp to all clients
- **Drift correction**: If local time differs from server by >100ms:
  - If behind: set `playbackRate = 1.02` (speed up 2%)
  - If ahead: set `playbackRate = 0.98` (slow down 2%)
  - Return to `playbackRate = 1.0` when within 100ms

#### Audio Player Requirements
- Use HTML5 `<audio>` element (hidden)
- File selection via Electron IPC: `window.electron.selectAudioFile()`
- Controls: Play, Pause, Seek (host only)
- Display: Current time, duration, progress bar

### 2. Push-to-Talk Voice System

#### WebRTC Setup
**Client initiates P2P connections**:
```typescript
// For each peer in room:
1. Create RTCPeerConnection with STUN configuration
2. Add local audio track (from microphone)
3. Exchange SDP offer/answer via Socket.IO signaling
4. Exchange ICE candidates via Socket.IO
5. Play received audio stream through speakers
```

**Socket Events for Signaling**:
- `offer`: { to: userId, offer: RTCSessionDescriptionInit }
- `answer`: { to: userId, answer: RTCSessionDescriptionInit }
- `ice-candidate`: { to: userId, candidate: RTCIceCandidateInit }

#### PTT Interaction
- **Activation**: Hold spacebar OR click/hold PTT button
- **Visual Feedback**: 
  - Button changes color when active
  - User's name glows in participant list
- **Server Events**:
  - `ptt-start`: Broadcast to room that user is speaking
  - `ptt-end`: Broadcast that user stopped speaking

#### Audio Ducking
When ANY user speaks:
```typescript
// Smoothly reduce music volume
musicElement.volume = 0.4; // 60% reduction
transition: 200ms

// When no one is speaking
musicElement.volume = 1.0;
transition: 200ms
```

#### Microphone Management
- Request permissions on app start
- Mute/unmute toggle button
- Only transmit when PTT active AND not muted

### 3. Friend System

#### Server-Side (FriendManager class)
Create `server/src/friends.ts` with:
```typescript
class FriendManager {
  - generateFriendCode(): "F-" + 8 alphanumeric chars (uppercase)
  - createSession(socketId, userName): returns { friendCode, friends[] }
  - addFriend(userId, friendCode): bidirectional relationship
  - updateUserStatus(userId, status: 'online'|'offline'|'in-party', roomCode?)
  - saveMessage(fromId, toId, message, type, partyCode?)
  - getChatHistory(userId, friendId): returns last 100 messages
  - getFriendsByUser(userId): returns Friend[]
}
```

**Data Structures**:
```typescript
interface FriendSession {
  userId: string;
  userName: string;
  friendCode: string;
  socketId: string;
  friends: Set<userId>;
  status: 'online' | 'offline' | 'in-party';
  currentRoomCode?: string;
}

interface Friend {
  id: string;
  name: string;
  friendCode: string;
  status: 'online' | 'offline' | 'in-party';
  currentRoomCode?: string;
  addedAt: number;
}

interface ChatMessage {
  id: string; // UUID
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  message: string;
  timestamp: number;
  type: 'text' | 'party-invite';
  partyCode?: string;
}
```

#### Socket Events
**Client → Server**:
- `create-friend-session`: { userName } → { success, friendCode, friends }
- `add-friend`: { userName, friendCode } → { success, friends, error? }
- `send-message`: { toUserId, message, type, partyCode? } → { success, message }
- `get-chat-history`: { friendId } → { success, messages }
- `update-status`: { status, roomCode? }

**Server → Client**:
- `friend-added`: { friend: Friend }
- `friend-status-update`: { friendId, status, roomCode? }
- `message-received`: ChatMessage
- `message-sent`: ChatMessage (confirmation)

#### Auto Status Updates
- **On join-room**: Set status to 'in-party', notify all friends
- **On leave-room**: Set status to 'online', notify all friends
- **On disconnect**: Set status to 'offline', notify all friends

### 4. User Interface Components

#### Main App Navigation (App.tsx)
```typescript
type View = 'home' | 'room' | 'friends' | 'chat';

Navigation Bar (hidden when in room):
- 🏠 Home button
- 👥 Friends button

State Management:
- currentView: View
- selectedFriend: Friend | null
- userName: string
```

#### Home View (Home.tsx)
**Design per Figma**: Login/lobby screen
- Username input field
- "Create Room" button → generates code, shows to user
- "Join Room" section:
  - 6-digit code input
  - "Join Room" button
- Error display area

#### Room View (Room.tsx)
**Design per Figma**: Full-screen party interface
- **Header**:
  - Room code (large, copyable)
  - Leave button
- **Music Player Section**:
  - Album art placeholder / visualization
  - Song filename
  - Playback controls (play/pause/seek) - host only
  - Current time / duration
  - Progress bar
- **Participants List**:
  - Scrollable list of users
  - Host has crown icon
  - Speaking users have glow effect
  - Host can kick users (X button)
- **Voice Controls**:
  - Large PTT button (hold to talk)
  - Mute/unmute microphone button
  - "You're speaking" indicator
- **Select Audio File** button (host only)

#### Friends List (FriendsList.tsx)
**Design per Figma**: Friends management screen
- **Header**:
  - "Friends" title
  - 🔗 button: Show/hide my friend code
  - ➕ button: Toggle add friend modal
- **My Friend Code Section** (collapsible):
  - Display code in monospace font
  - "Copy" button
- **Add Friend Modal**:
  - Input field: "Enter friend code (F-XXXXXXXX)"
  - "Add" and "Cancel" buttons
  - Error message area
- **Friends Grid**:
  - Friend cards with:
    - Status dot (🟢 online, 🔵 in-party, ⚪ offline)
    - Friend name
    - Status text ("Online", "In Party: 123456", "Offline")
    - 💬 button to open chat
  - Empty state: "No friends yet. Click ➕ to add a friend"

#### Chat Window (ChatWindow.tsx)
**Design per Figma**: Messaging interface
- **Header**:
  - Friend name and status
  - 🎵 Invite button (visible when you're in party)
  - "Join Party" button (visible when friend is in-party)
  - ✕ Close button
- **Messages Area**:
  - Scrollable message list
  - Sent messages: right-aligned, blue background
  - Received messages: left-aligned, gray background
  - Timestamps (small, faded)
  - Party invite messages: special styling with "Join [CODE]" button
  - Auto-scroll to latest message
- **Input Section**:
  - Text input field
  - "Send" button
  - Enter key to send

### 5. React Hooks

#### useRoom Hook
```typescript
export function useRoom() {
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [speakingUsers, setSpeakingUsers] = useState<Set<string>>(new Set());

  // Socket listeners
  useEffect(() => {
    socketService.on('connect', handleConnect);
    socketService.on('room-created', handleRoomCreated);
    socketService.on('room-joined', handleRoomJoined);
    socketService.on('user-joined', handleUserJoined);
    socketService.on('user-left', handleUserLeft);
    socketService.on('audio-sync', handleAudioSync);
    socketService.on('audio-state-changed', handleAudioStateChanged);
    socketService.on('ptt-started', handlePTTStarted);
    socketService.on('ptt-ended', handlePTTEnded);
    // ... cleanup
  }, []);

  return {
    roomState,
    isConnected,
    error,
    isHost,
    speakingUsers,
    createRoom: (userName: string) => Promise<void>,
    joinRoom: (code: string, userName: string) => Promise<void>,
    leaveRoom: () => void,
    syncAudio: (position: number, isPlaying: boolean) => void,
    updateAudioState: (state) => void,
    kickUser: (userId: string) => void,
  };
}
```

#### usePTT Hook
```typescript
export function usePTT(roomCode: string | null) {
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Spacebar listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isTransmitting && !isMuted) {
        e.preventDefault();
        startTransmitting();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isTransmitting) {
        e.preventDefault();
        stopTransmitting();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { /* cleanup */ };
  }, [isTransmitting, isMuted]);

  const startTransmitting = () => {
    if (!roomCode || isMuted) return;
    setIsTransmitting(true);
    socketService.emit('ptt-start', { roomCode });
  };

  const stopTransmitting = () => {
    setIsTransmitting(false);
    socketService.emit('ptt-end', { roomCode });
  };

  return { isTransmitting, isMuted, toggleMute: () => setIsMuted(!isMuted) };
}
```

#### useFriends Hook
```typescript
export function useFriends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [myFriendCode, setMyFriendCode] = useState<string>('');
  const [myUserName, setMyUserName] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<Map<string, ChatMessage[]>>(new Map());
  const [isSessionCreated, setIsSessionCreated] = useState(false);

  const createSession = useCallback((userName: string) => {
    socketService.emit('create-friend-session', { userName }, (response) => {
      if (response.success) {
        setMyFriendCode(response.friendCode);
        setFriends(response.friends || []);
        setMyUserName(userName);
        setIsSessionCreated(true);
      }
    });
  }, []);

  // Socket listeners for friend events
  useEffect(() => {
    socketService.on('friend-added', handleFriendAdded);
    socketService.on('friend-status-update', handleFriendStatusUpdate);
    socketService.on('message-received', handleMessageReceived);
    socketService.on('message-sent', handleMessageSent);
    return () => { /* cleanup */ };
  }, []);

  return {
    friends,
    myFriendCode,
    createSession,
    addFriend: (friendCode: string) => Promise<{success, error?}>,
    sendMessage: (toUserId, message, type?, partyCode?) => void,
    getChatHistory: (friendId: string) => void,
    getMessagesWithFriend: (friendId: string) => ChatMessage[],
    updateStatus: (status, roomCode?) => void,
    isSessionCreated,
  };
}
```

### 6. Services

#### Socket Service (socketService.ts)
```typescript
import io from 'socket.io-client';

const socket = io('http://localhost:3001', {
  transports: ['websocket'],
  reconnection: true,
});

export const socketService = {
  on: (event: string, callback: Function) => socket.on(event, callback),
  off: (event: string, callback: Function) => socket.off(event, callback),
  emit: (event: string, data?: any, ack?: Function) => socket.emit(event, data, ack),
  disconnect: () => socket.disconnect(),
};
```

#### WebRTC Service (webrtc.ts)
```typescript
const peerConnections = new Map<string, RTCPeerConnection>();

const configuration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export async function createPeerConnection(
  peerId: string,
  onTrack: (stream: MediaStream) => void
): Promise<RTCPeerConnection> {
  const pc = new RTCPeerConnection(configuration);
  
  // Add local audio track
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  stream.getTracks().forEach(track => pc.addTrack(track, stream));
  
  // Handle incoming tracks
  pc.ontrack = (event) => onTrack(event.streams[0]);
  
  // Handle ICE candidates
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socketService.emit('ice-candidate', {
        to: peerId,
        candidate: event.candidate,
      });
    }
  };
  
  peerConnections.set(peerId, pc);
  return pc;
}

export async function createOffer(peerId: string): Promise<RTCSessionDescriptionInit> {
  const pc = peerConnections.get(peerId);
  if (!pc) throw new Error('Peer connection not found');
  
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  return offer;
}

export async function handleAnswer(peerId: string, answer: RTCSessionDescriptionInit) {
  const pc = peerConnections.get(peerId);
  if (!pc) return;
  await pc.setRemoteDescription(new RTCSessionDescription(answer));
}

export async function handleOffer(
  peerId: string,
  offer: RTCSessionDescriptionInit
): Promise<RTCSessionDescriptionInit> {
  const pc = peerConnections.get(peerId);
  if (!pc) throw new Error('Peer connection not found');
  
  await pc.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  return answer;
}

export function handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit) {
  const pc = peerConnections.get(peerId);
  if (!pc) return;
  pc.addIceCandidate(new RTCIceCandidate(candidate));
}

export function closePeerConnection(peerId: string) {
  const pc = peerConnections.get(peerId);
  if (pc) {
    pc.close();
    peerConnections.delete(peerId);
  }
}
```

### 7. Electron Setup

#### Main Process (main/index.ts)
```typescript
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
}

app.whenReady().then(createWindow);

// File picker for audio files
ipcMain.handle('select-audio-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'ogg', 'flac'] }],
  });
  return result.filePaths[0];
});
```

#### Preload Script (preload/index.ts)
```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  selectAudioFile: () => ipcRenderer.invoke('select-audio-file'),
});
```

### 8. TypeScript Configuration

#### Server tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "types": ["node"]
  },
  "include": ["src/**/*"]
}
```

#### Client - Main/Preload tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "../../dist/main",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node"]
  }
}
```

#### Client - Renderer tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "esnext",
    "lib": ["ES2020", "DOM"],
    "jsx": "react-jsx",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

### 9. Package.json Scripts

#### Server package.json
```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.6.1",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.17",
    "@types/node": "^20.0.0",
    "@types/uuid": "^9.0.0",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.3.3"
  }
}
```

#### Client package.json
```json
{
  "main": "dist/main/index.js",
  "scripts": {
    "dev": "concurrently \"npm:watch:*\"",
    "watch:main": "tsc -p src/main/tsconfig.json --watch",
    "watch:preload": "tsc -p src/preload/tsconfig.json --watch",
    "watch:renderer": "vite",
    "build": "npm run build:main && npm run build:preload && npm run build:renderer",
    "build:main": "tsc -p src/main/tsconfig.json",
    "build:preload": "tsc -p src/preload/tsconfig.json",
    "build:renderer": "vite build",
    "electron": "electron .",
    "start": "npm run build && npm run electron",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "socket.io-client": "^4.6.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "concurrently": "^8.2.0",
    "electron": "^28.1.3",
    "typescript": "^5.3.3",
    "vite": "^5.0.11"
  }
}
```

### 10. Vite Configuration (client/vite.config.ts)
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: 'src/renderer',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
  },
  base: './',
});
```

## Project Structure
```
WeVibin'/
├── server/
│   ├── src/
│   │   ├── index.ts          # Main Socket.IO server
│   │   ├── rooms.ts          # RoomManager class
│   │   ├── friends.ts        # FriendManager class
│   │   └── types.ts          # Shared interfaces
│   ├── package.json
│   └── tsconfig.json
│
└── client/
    ├── src/
    │   ├── main/
    │   │   ├── index.ts      # Electron main process
    │   │   └── tsconfig.json # CommonJS config
    │   ├── preload/
    │   │   ├── index.ts      # IPC bridge
    │   │   └── tsconfig.json # CommonJS config
    │   └── renderer/
    │       ├── index.html
    │       ├── main.tsx      # React entry
    │       ├── App.tsx       # Main app with navigation
    │       ├── components/
    │       │   ├── Home.tsx
    │       │   ├── Room.tsx
    │       │   ├── FriendsList.tsx
    │       │   └── ChatWindow.tsx
    │       ├── hooks/
    │       │   ├── useRoom.ts
    │       │   ├── usePTT.ts
    │       │   └── useFriends.ts
    │       ├── services/
    │       │   ├── socket.ts
    │       │   └── webrtc.ts
    │       └── tsconfig.json # ESM config
    ├── package.json
    └── vite.config.ts
```

## Implementation Order

### Phase 1: Foundation
1. Initialize server with Express + Socket.IO
2. Create RoomManager with room creation/joining
3. Setup Electron app with React
4. Create Home component with create/join UI
5. Test basic room creation and joining

### Phase 2: Music Sync
1. Implement audio state broadcasting
2. Add audio player to Room component
3. Implement sync algorithm with drift correction
4. Add host controls (play/pause/seek)
5. Test synchronization with multiple clients

### Phase 3: Voice Communication
1. Setup WebRTC peer connections
2. Implement WebRTC signaling via Socket.IO
3. Create PTT button and spacebar listener
4. Implement audio ducking logic
5. Add speaker indicators
6. Test voice quality and ducking

### Phase 4: Friend System
1. Create FriendManager on server
2. Implement friend code generation
3. Create FriendsList component
4. Add friend addition flow
5. Test bidirectional friend relationships

### Phase 5: Chat System
1. Implement message storage on server
2. Create ChatWindow component
3. Add real-time message delivery
4. Implement chat history loading
5. Test message persistence

### Phase 6: Integration
1. Connect friend status to room join/leave
2. Add party invitation buttons in chat
3. Implement join-from-chat flow
4. Add navigation between all views
5. Polish UI with Figma designs

### Phase 7: Polish
1. Apply all Figma designs
2. Add error handling and validation
3. Add loading states
4. Test all edge cases
5. Performance optimization

## Testing Checklist
- [ ] Create room generates unique code
- [ ] Multiple users can join same room
- [ ] Music syncs within 100ms across clients
- [ ] Playback rate adjusts for drift correction
- [ ] Host controls work (play/pause/seek)
- [ ] PTT activates on spacebar press
- [ ] Voice streams over WebRTC
- [ ] Music volume ducks during speech
- [ ] Speaker indicators show who's talking
- [ ] Friend codes are unique and shareable
- [ ] Friend addition works bidirectionally
- [ ] Friend status updates in real-time
- [ ] Chat messages deliver instantly
- [ ] Chat history persists (100 messages)
- [ ] Party invitations send via chat
- [ ] Join party from chat works
- [ ] Navigation between views is smooth
- [ ] All Figma designs are applied
- [ ] TypeScript compiles with 0 errors

## Key Implementation Details

### Audio Sync Algorithm
```typescript
// Client-side sync check (every 5 seconds)
const syncAudio = () => {
  const serverPosition = roomState.audioState.position;
  const serverTimestamp = roomState.audioState.timestamp;
  const timeSinceUpdate = (Date.now() - serverTimestamp) / 1000;
  const expectedPosition = serverPosition + timeSinceUpdate;
  const currentPosition = audioElement.currentTime;
  const drift = Math.abs(expectedPosition - currentPosition);

  if (drift > 0.1) { // 100ms threshold
    if (currentPosition < expectedPosition) {
      audioElement.playbackRate = 1.02; // Catch up
    } else {
      audioElement.playbackRate = 0.98; // Slow down
    }
  } else {
    audioElement.playbackRate = 1.0; // In sync
  }
};
```

### WebRTC Connection Flow
```typescript
// User A joins room
1. Server broadcasts 'user-joined' to all existing users
2. Each existing user creates RTCPeerConnection for User A
3. Each existing user creates and sends SDP offer to User A
4. User A receives offers, creates connections, sends answers
5. ICE candidates exchanged automatically
6. Audio streams flow bidirectionally
```

### Friend Status Propagation
```typescript
// When user joins room
socket.on('join-room', async (data, callback) => {
  roomManager.addUserToRoom(data.code, socket.id, data.userName);
  
  // Update friend status
  const session = friendManager.getSessionBySocketId(socket.id);
  if (session) {
    friendManager.updateUserStatus(session.userId, 'in-party', data.code);
    
    // Notify all friends
    session.friends.forEach(friendId => {
      const friendSession = friendManager.getSessionByUserId(friendId);
      if (friendSession) {
        io.to(friendSession.socketId).emit('friend-status-update', {
          friendId: session.userId,
          status: 'in-party',
          roomCode: data.code,
        });
      }
    });
  }
  
  callback({ success: true, room: roomManager.getRoom(data.code) });
});
```

## Success Criteria
✅ Users can create and join parties with unique codes
✅ Music playback is synchronized within 100ms
✅ Voice communication works with clear audio
✅ Music automatically ducks when someone speaks
✅ Friends can be added via unique codes
✅ Real-time chat works between friends
✅ Party invitations can be sent and accepted via chat
✅ All UI matches Figma designs exactly
✅ TypeScript compilation has 0 errors
✅ App is stable and performant

## Final Notes
- **Follow the Figma designs precisely** for all UI components
- **Test with multiple Electron instances** to simulate real users
- **Use Chrome DevTools** in Electron for debugging
- **Monitor network tab** for Socket.IO and WebRTC connections
- **Check audio permissions** are granted on first launch
- **Validate all user inputs** (room codes, friend codes, messages)
- **Handle edge cases** (user disconnects, host leaves, room full, etc.)

Build this system step-by-step following the implementation phases. Test each phase thoroughly before moving to the next. The goal is a polished, production-ready desktop app that users love!
