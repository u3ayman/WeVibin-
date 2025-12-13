import { v4 as uuidv4 } from 'uuid';
import { FriendSession, Friend, ChatMessage } from './types';

export class FriendManager {
  private sessions: Map<string, FriendSession> = new Map();
  private socketToUser: Map<string, string> = new Map();
  private friendCodeToUser: Map<string, string> = new Map();
  private chatMessages: ChatMessage[] = [];

  generateFriendCode(): string {
    let code: string;
    do {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let randomPart = '';
      for (let i = 0; i < 8; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      code = `F-${randomPart}`;
    } while (this.friendCodeToUser.has(code));
    return code;
  }

  createSession(socketId: string, userName: string): { friendCode: string; friends: Friend[] } {
    const userId = uuidv4();
    const friendCode = this.generateFriendCode();
    
    const session: FriendSession = {
      userId,
      userName,
      friendCode,
      socketId,
      friends: new Set(),
      status: 'online',
    };
    
    this.sessions.set(userId, session);
    this.socketToUser.set(socketId, userId);
    this.friendCodeToUser.set(friendCode, userId);
    
    return { friendCode, friends: this.getFriendsByUser(userId) };
  }

  getSessionBySocketId(socketId: string): FriendSession | undefined {
    const userId = this.socketToUser.get(socketId);
    return userId ? this.sessions.get(userId) : undefined;
  }

  getSessionByUserId(userId: string): FriendSession | undefined {
    return this.sessions.get(userId);
  }

  getSessionByFriendCode(friendCode: string): FriendSession | undefined {
    const userId = this.friendCodeToUser.get(friendCode);
    return userId ? this.sessions.get(userId) : undefined;
  }

  addFriend(userId: string, friendCode: string): { success: boolean; error?: string; friends?: Friend[] } {
    const userSession = this.sessions.get(userId);
    const friendSession = this.getSessionByFriendCode(friendCode);
    
    if (!userSession) {
      return { success: false, error: 'User session not found' };
    }
    
    if (!friendSession) {
      return { success: false, error: 'Friend code not found' };
    }
    
    if (userSession.friendCode === friendCode) {
      return { success: false, error: 'Cannot add yourself as a friend' };
    }
    
    if (userSession.friends.has(friendSession.userId)) {
      return { success: false, error: 'Already friends' };
    }
    
    // Add bidirectional friendship
    userSession.friends.add(friendSession.userId);
    friendSession.friends.add(userId);
    
    return { success: true, friends: this.getFriendsByUser(userId) };
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
    
    // Remove old socket mapping
    this.socketToUser.delete(session.socketId);
    
    // Update to new socket
    session.socketId = socketId;
    this.socketToUser.set(socketId, userId);
  }

  saveMessage(fromId: string, toId: string, message: string, type: 'text' | 'party-invite' = 'text', partyCode?: string): ChatMessage {
    const fromSession = this.sessions.get(fromId);
    if (!fromSession) throw new Error('Sender not found');
    
    const chatMessage: ChatMessage = {
      id: uuidv4(),
      fromUserId: fromId,
      fromUserName: fromSession.userName,
      toUserId: toId,
      message,
      timestamp: Date.now(),
      type,
      partyCode,
    };
    
    this.chatMessages.push(chatMessage);
    return chatMessage;
  }

  getChatHistory(userId: string, friendId: string): ChatMessage[] {
    return this.chatMessages
      .filter(msg => 
        (msg.fromUserId === userId && msg.toUserId === friendId) ||
        (msg.fromUserId === friendId && msg.toUserId === userId)
      )
      .slice(-100); // Last 100 messages
  }

  getFriendsByUser(userId: string): Friend[] {
    const session = this.sessions.get(userId);
    if (!session) return [];
    
    const friends: Friend[] = [];
    session.friends.forEach(friendId => {
      const friendSession = this.sessions.get(friendId);
      if (friendSession) {
        friends.push({
          id: friendSession.userId,
          name: friendSession.userName,
          friendCode: friendSession.friendCode,
          status: friendSession.status,
          currentRoomCode: friendSession.currentRoomCode,
          addedAt: Date.now(), // In production, store this properly
        });
      }
    });
    
    return friends;
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
