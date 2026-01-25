import { FriendSession, Friend, ChatMessage } from './types';
import prisma from './lib/prisma';

export class FriendManager {
  private sessions: Map<string, FriendSession> = new Map();
  private socketToUser: Map<string, string> = new Map();
  private readonly MAX_SESSIONS = 5000;

  async registerSocket(socketId: string, userId: string, userName: string, friendCode: string): Promise<Friend[]> {
    // Basic session limit protection
    if (this.sessions.size >= this.MAX_SESSIONS) {
      const offlineUserId = Array.from(this.sessions.keys()).find(id => this.sessions.get(id)?.status === 'offline');
      if (offlineUserId) {
        const oldSession = this.sessions.get(offlineUserId);
        if (oldSession) {
          this.socketToUser.delete(oldSession.socketId);
          this.sessions.delete(offlineUserId);
        }
      }
    }

    const session: FriendSession = {
      userId,
      userName,
      friendCode,
      socketId,
      friends: new Set(), // We'll populate this from DB if needed for live tracking
      status: 'online',
    };

    this.sessions.set(userId, session);
    this.socketToUser.set(socketId, userId);

    return this.getFriendsByUser(userId);
  }

  getSessionBySocketId(socketId: string): FriendSession | undefined {
    const userId = this.socketToUser.get(socketId);
    return userId ? this.sessions.get(userId) : undefined;
  }

  getSessionByUserId(userId: string): FriendSession | undefined {
    return this.sessions.get(userId);
  }

  async addFriend(userId: string, friendCode: string): Promise<{ success: boolean; error?: string; friend?: Friend }> {
    try {
      const friendUser = await prisma.user.findUnique({ where: { friendCode } });

      if (!friendUser) {
        return { success: false, error: 'Friend code not found' };
      }

      if (friendUser.id === userId) {
        return { success: false, error: 'Cannot add yourself as a friend' };
      }

      // Check for existing friendship
      const existing = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userId, friendId: friendUser.id },
            { userId: friendUser.id, friendId: userId }
          ]
        }
      });

      if (existing) {
        return { success: false, error: 'Already friends' };
      }

      // Create bidirectional friendship (one record is enough if we query correctly, 
      // but let's stick to our schema which had [userId, friendId] unique)
      await prisma.friendship.create({
        data: {
          userId,
          friendId: friendUser.id,
          status: 'ACCEPTED'
        }
      });

      const friendSession = this.sessions.get(friendUser.id);

      return {
        success: true,
        friend: {
          id: friendUser.id,
          name: friendUser.username,
          friendCode: friendUser.friendCode,
          status: friendSession?.status || 'offline',
          currentRoomCode: friendSession?.currentRoomCode,
          addedAt: Date.now()
        }
      };
    } catch (error) {
      console.error('Add friend DB error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  updateUserStatus(userId: string, status: FriendSession['status'], roomCode?: string): void {
    const session = this.sessions.get(userId);
    if (!session) return;

    session.status = status;
    session.currentRoomCode = roomCode;
  }

  updateSocketId(userId: string, socketId: string): void {
    const session = this.sessions.get(userId);
    if (!session) return;

    this.socketToUser.delete(session.socketId);
    session.socketId = socketId;
    this.socketToUser.set(socketId, userId);
  }

  async saveMessage(fromId: string, toId: string, message: string, type: 'text' | 'party-invite' = 'text', partyCode?: string): Promise<ChatMessage> {
    const fromSession = this.sessions.get(fromId);
    const userName = fromSession?.userName || 'Unknown';

    const dbMessage = await prisma.chatMessage.create({
      data: {
        fromUserId: fromId,
        fromUserName: userName,
        toUserId: toId,
        message,
        type,
        partyCode
      }
    });

    return {
      id: dbMessage.id,
      fromUserId: dbMessage.fromUserId,
      fromUserName: dbMessage.fromUserName,
      toUserId: dbMessage.toUserId,
      message: dbMessage.message,
      timestamp: dbMessage.timestamp.getTime(),
      type: dbMessage.type as 'text' | 'party-invite',
      partyCode: dbMessage.partyCode || undefined
    };
  }

  async getChatHistory(userId: string, friendId: string): Promise<ChatMessage[]> {
    const messages = await prisma.chatMessage.findMany({
      where: {
        OR: [
          { fromUserId: userId, toUserId: friendId },
          { fromUserId: friendId, toUserId: userId }
        ]
      },
      orderBy: { timestamp: 'desc' },
      take: 100
    });

    return messages.reverse().map(msg => ({
      id: msg.id,
      fromUserId: msg.fromUserId,
      fromUserName: msg.fromUserName,
      toUserId: msg.toUserId,
      message: msg.message,
      timestamp: msg.timestamp.getTime(),
      type: msg.type as 'text' | 'party-invite',
      partyCode: msg.partyCode || undefined
    }));
  }

  async getFriendsByUser(userId: string): Promise<Friend[]> {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ userId }, { friendId: userId }]
      },
      include: {
        user: true,
        friend: true
      }
    });

    return friendships.map(fs => {
      const friendUser = fs.userId === userId ? fs.friend : fs.user;
      const session = this.sessions.get(friendUser.id);

      return {
        id: friendUser.id,
        name: friendUser.username,
        friendCode: friendUser.friendCode,
        status: session?.status || 'offline',
        currentRoomCode: session?.currentRoomCode,
        addedAt: fs.createdAt.getTime()
      };
    });
  }

  disconnectUser(socketId: string): string | undefined {
    const userId = this.socketToUser.get(socketId);
    if (!userId) return undefined;

    const session = this.sessions.get(userId);
    if (session) {
      session.status = 'offline';
    }

    return userId;
  }
}
