import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { z as zod } from 'zod';
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import prisma from './lib/prisma';
import { hashPassword, comparePassword, generateToken } from './utils/auth';
import { socketAuthMiddleware } from './middleware/authMiddleware';
import { RoomManager } from './rooms';
import { FriendManager } from './friends';
import { WebRTCSignal, Track } from './types';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

// Initialize Sentry
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      nodeProfilingIntegration(),
    ],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
  });
  logger.info('Sentry initialization successful');
}

// Validate critical environment variables
const requiredEnv = ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET'];
const missingEnv = requiredEnv.filter(key => !process.env[key] || process.env[key]?.includes('your_'));
if (missingEnv.length > 0) {
  logger.warn({ missingEnv }, 'Missing or placeholder environment variables');
}

const app = express();

// Add a welcome page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>WeVibin' Server</title>
      <style>
        body { font-family: Arial; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .container { text-align: center; background: rgba(0,0,0,0.3); padding: 40px; border-radius: 20px; }
        h1 { font-size: 3em; margin: 0; }
        .status { color: #4ade80; font-size: 1.2em; margin: 20px 0; }
        .info { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin: 20px 0; }
        code { background: rgba(0,0,0,0.5); padding: 5px 10px; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎵 WeVibin' Server</h1>
        <div class="status">✅ Server is Running!</div>
        <div class="info">
          <p><strong>Server:</strong> MYSQL-SERVER</p>
          <p><strong>Status:</strong> Online and accepting connections</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Sentry request handler must be the first middleware on the app
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.ALLOWED_ORIGINS?.split(',') || []
    : ['https://localhost:5176', 'http://localhost:5176', 'https://localhost:5173', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Structured Request Logging Middleware
app.use((req, res, next) => {
  logger.info({ method: req.method, url: req.url }, 'Incoming request');
  next();
});

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use(limiter);

// --- Auth REST Routes ---
const registerSchema = zod.object({
  email: zod.string().email(),
  password: zod.string().min(8),
  username: zod.string().min(3).max(20),
});

const loginSchema = zod.object({
  email: zod.string().email(),
  password: zod.string(),
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const validated = registerSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ success: false, error: 'Invalid input', details: validated.error.format() });
    }

    const { email, password, username } = validated.data;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });

    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    const hashedPassword = await hashPassword(password);

    // Generate unique friend code
    let friendCode = '';
    let codeExists = true;
    while (codeExists) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let randomPart = '';
      for (let i = 0; i < 8; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      friendCode = `F-${randomPart}`;
      const existingCode = await prisma.user.findUnique({ where: { friendCode } });
      if (!existingCode) codeExists = false;
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        username,
        friendCode
      }
    });

    const token = generateToken(user.id, user.username);
    res.status(201).json({ success: true, token, user: { id: user.id, username: user.username, friendCode: user.friendCode } });
  } catch (error) {
    logger.error({ error }, 'Registration error');
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const validated = loginSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ success: false, error: 'Invalid input' });
    }

    const { email, password } = validated.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const token = generateToken(user.id, user.username);
    res.json({ success: true, token, user: { id: user.id, username: user.username, friendCode: user.friendCode } });
  } catch (error) {
    logger.error({ error }, 'Login error');
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? process.env.ALLOWED_ORIGINS?.split(',') || []
      : ['https://localhost:5176', 'http://localhost:5176', 'https://localhost:5173', 'http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Middleware for Socket.IO Auth
io.use(socketAuthMiddleware);

const roomManager = new RoomManager();
const friendManager = new FriendManager();

// --- Background Cleanup Job ---
setInterval(async () => {
  try {
    console.log('[Maintenance] Starting cleanup job...');
    await roomManager.runCleanup();

    // Prune very old messages (> 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const pruneResult = await prisma.chatMessage.deleteMany({
      where: { timestamp: { lt: thirtyDaysAgo } }
    });
    if (pruneResult.count > 0) {
      console.log(`[Maintenance] Pruned ${pruneResult.count} old messages`);
    }
  } catch (error) {
    console.error('[Maintenance] Cleanup error:', error);
  }
}, 10 * 60 * 1000); // Every 10 minutes

io.on('connection', async (socket) => {
  const user = (socket as any).user;
  console.log(`Client authenticated: ${user.username} (${socket.id})`);

  // Fetch full user details from DB to get friendCode
  const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
  if (!dbUser) {
    console.error(`User ${user.userId} not found in DB`);
    socket.disconnect();
    return;
  }

  // Register live session
  const friends = await friendManager.registerSocket(socket.id, dbUser.id, dbUser.username, dbUser.friendCode);

  // Initial data for client
  socket.emit('init-data', {
    user: {
      id: dbUser.id,
      username: dbUser.username,
      friendCode: dbUser.friendCode
    },
    friends
  });

  notifyFriendsOfStatusUpdate(dbUser.id);

  // Room events
  socket.on('create-room', async (data: { userName: string }, callback) => {
    try {
      const room = await roomManager.createRoom(dbUser.id, dbUser.username);
      socket.join(room.code);
      callback({ success: true, room: serializeRoom(room) });
      console.log(`Room created: ${room.code} by ${dbUser.username}`);

      friendManager.updateUserStatus(dbUser.id, 'in-party', room.code);
      notifyFriendsOfStatusUpdate(dbUser.id);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Failed to create room:`, error);
      callback({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create room'
      });
    }
  });

  socket.on('join-room', async (data: { code: string; userName: string }, callback) => {
    try {
      const room = roomManager.getRoom(data.code);
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      await roomManager.addUserToRoom(data.code, dbUser.id, dbUser.username);
      socket.join(data.code);

      // Update friend status
      friendManager.updateUserStatus(dbUser.id, 'in-party', data.code);
      notifyFriendsOfStatusUpdate(dbUser.id);

      // Notify existing users
      socket.to(data.code).emit('user-joined', {
        userId: dbUser.id,
        userName: dbUser.username,
      });

      callback({ success: true, room: serializeRoom(room) });
      console.log(`${dbUser.username} joined room ${data.code}`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Failed to join room:`, error);
      callback({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to join room'
      });
    }
  });

  socket.on('leave-room', async (data: { code: string }) => {
    try {
      const room = await roomManager.getRoom(data.code);
      if (!room) return;

      const wasHost = room.host.id === dbUser.id;

      const roomDeleted = await roomManager.removeUserFromRoom(data.code, dbUser.id);
      socket.leave(data.code);

      // Update friend status
      friendManager.updateUserStatus(dbUser.id, 'online');
      notifyFriendsOfStatusUpdate(dbUser.id);

      if (!roomDeleted) {
        // Notify remaining users
        socket.to(data.code).emit('user-left', {
          userId: dbUser.id,
          userName: dbUser.username,
        });

        // Notify if host changed
        if (wasHost) {
          const updatedRoom = await roomManager.getRoom(data.code);
          if (updatedRoom) {
            io.to(data.code).emit('host-changed', {
              newHost: updatedRoom.host,
            });
          }
        }
      }

      console.log(`${dbUser.username} left room ${data.code}`);
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  });

  socket.on('sync-audio', async (data: { code: string; position: number; isPlaying: boolean }) => {
    try {
      if (await roomManager.updateAudioState(data.code, {
        position: data.position,
        isPlaying: data.isPlaying,
      })) {
        const room = await roomManager.getRoom(data.code);
        if (room) {
          socket.to(data.code).emit('audio-sync', room.audioState);
        }
      }
    } catch (error) {
      console.error('Error syncing audio:', error);
    }
  });

  socket.on('audio-state-changed', async (data: { code: string; isPlaying: boolean; position: number; currentTrack?: Track }) => {
    try {
      if (await roomManager.updateAudioState(data.code, {
        isPlaying: data.isPlaying,
        position: data.position,
        currentTrack: data.currentTrack,
      })) {
        socket.to(data.code).emit('audio-state-changed', {
          isPlaying: data.isPlaying,
          position: data.position,
          currentTrack: data.currentTrack,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.error('Error updating audio state:', error);
    }
  });

  // Queue events
  socket.on('add-to-queue', async (data: { code: string; track: Track }) => {
    try {
      if (await roomManager.addToQueue(data.code, data.track)) {
        io.to(data.code).emit('queue-updated', {
          queue: (await roomManager.getRoom(data.code))?.queue || []
        });
      }
    } catch (error) {
      console.error('Error adding to queue:', error);
    }
  });

  socket.on('remove-from-queue', async (data: { code: string; trackId: string }) => {
    try {
      if (await roomManager.removeFromQueue(data.code, data.trackId, dbUser.id)) {
        io.to(data.code).emit('queue-updated', {
          queue: (await roomManager.getRoom(data.code))?.queue || []
        });
      }
    } catch (error) {
      console.error('Error removing from queue:', error);
    }
  });

  socket.on('next-track', async (data: { code: string }) => {
    try {
      const nextTrack = await roomManager.nextTrack(data.code, dbUser.id);
      if (nextTrack !== null || true) { // Always update to reflect empty queue if needed
        const room = await roomManager.getRoom(data.code);
        if (room) {
          io.to(data.code).emit('audio-state-changed', {
            ...room.audioState,
            timestamp: Date.now()
          });
          io.to(data.code).emit('queue-updated', {
            queue: room.queue
          });
        }
      }
    } catch (error) {
      console.error('Error skipping to next track:', error);
    }
  });

  socket.on('kick-user', async (data: { code: string; targetUserId: string }) => {
    try {
      const room = await roomManager.getRoom(data.code);
      if (!room || room.host.id !== dbUser.id) return;

      if (await roomManager.kickUser(data.code, dbUser.id, data.targetUserId)) {
        // Unfortunately we don't know the target's socket easily here without searching sessions
        // but for now we emit to the room and the target should handle it if they match
        io.to(data.code).emit('user-kicked', {
          userId: data.targetUserId,
        });
      }
    } catch (error) {
      console.error('Error kicking user:', error);
    }
  });

  // PTT events
  socket.on('ptt-start', (data: { roomCode: string }) => {
    socket.to(data.roomCode).emit('ptt-started', { userId: dbUser.id });
  });

  socket.on('ptt-end', (data: { roomCode: string }) => {
    socket.to(data.roomCode).emit('ptt-ended', { userId: dbUser.id });
  });

  // Voice Relay (WebSocket based)
  socket.on('voice-data', (data: { audio: any }) => {
    // Current user room
    const session = friendManager.getSessionByUserId(dbUser.id);
    if (session && session.currentRoomCode) {
      // Relay to everyone in the room except sender
      socket.to(session.currentRoomCode).emit('voice-data', {
        userId: dbUser.id,
        audio: data.audio
      });
    }
  });

  // Friend system events
  socket.on('add-friend', async (data: { friendCode: string }, callback) => {
    try {
      const result = await friendManager.addFriend(dbUser.id, data.friendCode);
      if (result.success && result.friend) {
        // Notify the friend if they are online
        const friendSession = friendManager.getSessionByUserId(result.friend.id);
        if (friendSession) {
          const userAsFriend = {
            id: dbUser.id,
            name: dbUser.username,
            friendCode: dbUser.friendCode,
            status: friendManager.getSessionByUserId(dbUser.id)?.status || 'online',
            currentRoomCode: friendManager.getSessionByUserId(dbUser.id)?.currentRoomCode,
            addedAt: Date.now(),
          };
          io.to(friendSession.socketId).emit('friend-added', { friend: userAsFriend });
        }
        callback({ success: true, friend: result.friend });
      } else {
        callback(result);
      }
    } catch (error) {
      callback({ success: false, error: 'Failed to add friend' });
    }
  });

  socket.on('send-message', async (data: { toUserId: string; message: string; type?: 'text' | 'party-invite'; partyCode?: string }, callback) => {
    try {
      const chatMessage = await friendManager.saveMessage(
        dbUser.id,
        data.toUserId,
        data.message,
        data.type || 'text',
        data.partyCode
      );

      // Send to recipient if online
      const recipientSession = friendManager.getSessionByUserId(data.toUserId);
      if (recipientSession) {
        io.to(recipientSession.socketId).emit('message-received', chatMessage);
      }

      // Confirm to sender
      callback({ success: true, message: chatMessage });
    } catch (error) {
      callback({ success: false, error: 'Failed to send message' });
    }
  });

  socket.on('get-chat-history', async (data: { friendId: string }, callback) => {
    try {
      const messages = await friendManager.getChatHistory(dbUser.id, data.friendId);
      callback({ success: true, messages });
    } catch (error) {
      callback({ success: false, error: 'Failed to get chat history' });
    }
  });

  socket.on('update-status', (data: { status: 'online' | 'offline' | 'in-party'; roomCode?: string }) => {
    try {
      friendManager.updateUserStatus(dbUser.id, data.status, data.roomCode);
      notifyFriendsOfStatusUpdate(dbUser.id);
    } catch (error) {
      logger.error({ error }, 'Error updating status');
    }
  });

  socket.on('disconnect', () => {
    logger.info({ socketId: socket.id, username: dbUser.username }, 'Client disconnected');

    const userId = friendManager.disconnectUser(socket.id);
    if (userId) {
      notifyFriendsOfStatusUpdate(userId);
    }
  });

  function serializeRoom(room: any) {
    return {
      code: room.code,
      host: room.host,
      users: Array.from(room.users.values()),
      audioState: room.audioState,
      queue: room.queue
    };
  }

  async function notifyFriendsOfStatusUpdate(userId: string) {
    const session = friendManager.getSessionByUserId(userId);
    if (!session) return;

    const friends = await friendManager.getFriendsByUser(userId);

    friends.forEach(f => {
      const friendSession = friendManager.getSessionByUserId(f.id);
      if (friendSession && friendSession.status !== 'offline') {
        io.to(friendSession.socketId).emit('friend-status-update', {
          friendId: userId,
          status: session.status,
          roomCode: session.currentRoomCode,
        });
      }
    });
  }
});

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';

httpServer.listen(PORT, HOST, () => {
  logger.info({ port: PORT, host: HOST }, "🎵 WeVibin' server running");
});
