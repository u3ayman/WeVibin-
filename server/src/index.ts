import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { RoomManager } from './rooms';
import { FriendManager } from './friends';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const roomManager = new RoomManager();
const friendManager = new FriendManager();

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Room events
  socket.on('create-room', (data: { userName: string }, callback) => {
    try {
      const room = roomManager.createRoom(socket.id, data.userName);
      socket.join(room.code);
      callback({ success: true, room: serializeRoom(room) });
      console.log(`Room created: ${room.code} by ${data.userName}`);
    } catch (error) {
      callback({ success: false, error: 'Failed to create room' });
    }
  });

  socket.on('join-room', (data: { code: string; userName: string }, callback) => {
    try {
      const room = roomManager.getRoom(data.code);
      if (!room) {
        callback({ success: false, error: 'Room not found' });
        return;
      }

      roomManager.addUserToRoom(data.code, socket.id, data.userName);
      socket.join(data.code);

      // Update friend status
      const session = friendManager.getSessionBySocketId(socket.id);
      if (session) {
        friendManager.updateUserStatus(session.userId, 'in-party', data.code);
        notifyFriendsOfStatusUpdate(session.userId);
      }

      // Notify existing users
      socket.to(data.code).emit('user-joined', {
        userId: socket.id,
        userName: data.userName,
      });

      callback({ success: true, room: serializeRoom(room) });
      console.log(`${data.userName} joined room ${data.code}`);
    } catch (error) {
      callback({ success: false, error: 'Failed to join room' });
    }
  });

  socket.on('leave-room', (data: { code: string }) => {
    try {
      const room = roomManager.getRoom(data.code);
      if (!room) return;

      const user = room.users.get(socket.id);
      const wasHost = room.host.id === socket.id;
      
      const roomDeleted = roomManager.removeUserFromRoom(data.code, socket.id);
      socket.leave(data.code);

      // Update friend status
      const session = friendManager.getSessionBySocketId(socket.id);
      if (session) {
        friendManager.updateUserStatus(session.userId, 'online');
        notifyFriendsOfStatusUpdate(session.userId);
      }

      if (!roomDeleted) {
        // Notify remaining users
        socket.to(data.code).emit('user-left', {
          userId: socket.id,
          userName: user?.name,
        });

        // Notify if host changed
        if (wasHost) {
          const updatedRoom = roomManager.getRoom(data.code);
          if (updatedRoom) {
            io.to(data.code).emit('host-changed', {
              newHost: updatedRoom.host,
            });
          }
        }
      }

      console.log(`${user?.name} left room ${data.code}`);
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  });

  socket.on('sync-audio', (data: { code: string; position: number; isPlaying: boolean }) => {
    try {
      if (roomManager.updateAudioState(data.code, {
        position: data.position,
        isPlaying: data.isPlaying,
      })) {
        const room = roomManager.getRoom(data.code);
        if (room) {
          socket.to(data.code).emit('audio-sync', room.audioState);
        }
      }
    } catch (error) {
      console.error('Error syncing audio:', error);
    }
  });

  socket.on('audio-state-changed', (data: { code: string; isPlaying: boolean; position: number; fileName?: string }) => {
    try {
      if (roomManager.updateAudioState(data.code, {
        isPlaying: data.isPlaying,
        position: data.position,
        fileName: data.fileName,
      })) {
        socket.to(data.code).emit('audio-state-changed', {
          isPlaying: data.isPlaying,
          position: data.position,
          fileName: data.fileName,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.error('Error updating audio state:', error);
    }
  });

  socket.on('kick-user', (data: { code: string; targetUserId: string }) => {
    try {
      const room = roomManager.getRoom(data.code);
      if (!room || room.host.id !== socket.id) return;

      const targetUser = room.users.get(data.targetUserId);
      if (roomManager.kickUser(data.code, socket.id, data.targetUserId)) {
        io.to(data.targetUserId).emit('kicked', { roomCode: data.code });
        socket.to(data.code).emit('user-left', {
          userId: data.targetUserId,
          userName: targetUser?.name,
        });
      }
    } catch (error) {
      console.error('Error kicking user:', error);
    }
  });

  // PTT events
  socket.on('ptt-start', (data: { roomCode: string }) => {
    socket.to(data.roomCode).emit('ptt-started', { userId: socket.id });
  });

  socket.on('ptt-end', (data: { roomCode: string }) => {
    socket.to(data.roomCode).emit('ptt-ended', { userId: socket.id });
  });

  // WebRTC signaling
  socket.on('offer', (data: { to: string; offer: any }) => {
    io.to(data.to).emit('offer', {
      from: socket.id,
      offer: data.offer,
    });
  });

  socket.on('answer', (data: { to: string; answer: any }) => {
    io.to(data.to).emit('answer', {
      from: socket.id,
      answer: data.answer,
    });
  });

  socket.on('ice-candidate', (data: { to: string; candidate: any }) => {
    io.to(data.to).emit('ice-candidate', {
      from: socket.id,
      candidate: data.candidate,
    });
  });

  // Friend system events
  socket.on('create-friend-session', (data: { userName: string }, callback) => {
    try {
      const result = friendManager.createSession(socket.id, data.userName);
      callback({ success: true, ...result });
      console.log(`Friend session created for ${data.userName}: ${result.friendCode}`);
    } catch (error) {
      callback({ success: false, error: 'Failed to create session' });
    }
  });

  socket.on('add-friend', (data: { friendCode: string }, callback) => {
    try {
      const session = friendManager.getSessionBySocketId(socket.id);
      if (!session) {
        callback({ success: false, error: 'Session not found' });
        return;
      }

      const result = friendManager.addFriend(session.userId, data.friendCode);
      if (result.success) {
        // Notify the friend that they were added
        const friendSession = friendManager.getSessionByFriendCode(data.friendCode);
        if (friendSession) {
          const userAsFriend = {
            id: session.userId,
            name: session.userName,
            friendCode: session.friendCode,
            status: session.status,
            currentRoomCode: session.currentRoomCode,
            addedAt: Date.now(),
          };
          io.to(friendSession.socketId).emit('friend-added', { friend: userAsFriend });
          
          // Also send the new friend info back to the user
          const newFriend = {
            id: friendSession.userId,
            name: friendSession.userName,
            friendCode: friendSession.friendCode,
            status: friendSession.status,
            currentRoomCode: friendSession.currentRoomCode,
            addedAt: Date.now(),
          };
          callback({ success: true, friend: newFriend });
        }
      } else {
        callback(result);
      }
    } catch (error) {
      callback({ success: false, error: 'Failed to add friend' });
    }
  });

  socket.on('send-message', (data: { toUserId: string; message: string; type?: 'text' | 'party-invite'; partyCode?: string }, callback) => {
    try {
      const session = friendManager.getSessionBySocketId(socket.id);
      if (!session) {
        callback({ success: false, error: 'Session not found' });
        return;
      }

      const chatMessage = friendManager.saveMessage(
        session.userId,
        data.toUserId,
        data.message,
        data.type || 'text',
        data.partyCode
      );

      // Send to recipient
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

  socket.on('get-chat-history', (data: { friendId: string }, callback) => {
    try {
      const session = friendManager.getSessionBySocketId(socket.id);
      if (!session) {
        callback({ success: false, error: 'Session not found' });
        return;
      }

      const messages = friendManager.getChatHistory(session.userId, data.friendId);
      callback({ success: true, messages });
    } catch (error) {
      callback({ success: false, error: 'Failed to get chat history' });
    }
  });

  socket.on('update-status', (data: { status: 'online' | 'offline' | 'in-party'; roomCode?: string }) => {
    try {
      const session = friendManager.getSessionBySocketId(socket.id);
      if (!session) return;

      friendManager.updateUserStatus(session.userId, data.status, data.roomCode);
      notifyFriendsOfStatusUpdate(session.userId);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    
    // Handle friend status
    const userId = friendManager.disconnectUser(socket.id);
    if (userId) {
      notifyFriendsOfStatusUpdate(userId);
    }

    // Handle room cleanup - check all rooms
    // This is a simple implementation; in production you'd track which room the socket is in
  });

  // Helper functions
  function serializeRoom(room: any) {
    return {
      code: room.code,
      host: room.host,
      users: Array.from(room.users.values()),
      audioState: room.audioState,
    };
  }

  function notifyFriendsOfStatusUpdate(userId: string) {
    const session = friendManager.getSessionByUserId(userId);
    if (!session) return;

    session.friends.forEach(friendId => {
      const friendSession = friendManager.getSessionByUserId(friendId);
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
  console.log(`🎵 WeVibin' server running on ${HOST}:${PORT}`);
  console.log(`📡 Server: MYSQL-SERVER`);
  console.log(`🌐 Public IP: 41.38.46.220`);
  console.log(`🔗 Clients connect to: ws://41.38.46.220:${PORT}`);
});
