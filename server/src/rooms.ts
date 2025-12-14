import { Room } from './types';


export class RoomManager {
  private rooms: Map<string, Room> = new Map();

  generateRoomCode(): string {
    let code: string;
    do {
      code = Math.floor(100000 + Math.random() * 900000).toString();
    } while (this.rooms.has(code));
    return code;
  }

  createRoom(hostId: string, hostName: string): Room {
    const code = this.generateRoomCode();
    const room: Room = {
      code,
      host: { id: hostId, name: hostName },
      users: new Map([[hostId, { id: hostId, name: hostName, socketId: hostId }]]),
      audioState: {
        isPlaying: false,
        position: 0,
        timestamp: Date.now(),
      },
    };
    this.rooms.set(code, room);
    return room;
  }

  getRoom(code: string): Room | undefined {
    return this.rooms.get(code);
  }

  addUserToRoom(roomCode: string, userId: string, userName: string): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;
    
    room.users.set(userId, { id: userId, name: userName, socketId: userId });
    return true;
  }

  removeUserFromRoom(roomCode: string, userId: string): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;
    
    room.users.delete(userId);
    
    // Delete room if empty
    if (room.users.size === 0) {
      this.rooms.delete(roomCode);
      return true;
    }
    
    // Transfer host if host left
    if (room.host.id === userId && room.users.size > 0) {
      const newHost = Array.from(room.users.values())[0];
      room.host = { id: newHost.id, name: newHost.name };
    }
    
    return false; // Room still exists
  }

  updateAudioState(roomCode: string, state: Partial<Room['audioState']>): boolean {
    const room = this.rooms.get(roomCode);
    if (!room) return false;
    
    room.audioState = {
      ...room.audioState,
      ...state,
      timestamp: Date.now(),
    };
    return true;
  }

  kickUser(roomCode: string, hostId: string, targetUserId: string): boolean {
    const room = this.rooms.get(roomCode);
    if (!room || room.host.id !== hostId) return false;
    
    return this.removeUserFromRoom(roomCode, targetUserId);
  }

  transferHost(roomCode: string, currentHostId: string, newHostId: string): boolean {
    const room = this.rooms.get(roomCode);
    if (!room || room.host.id !== currentHostId) return false;
    
    const newHost = room.users.get(newHostId);
    if (!newHost) return false;
    
    room.host = { id: newHost.id, name: newHost.name };
    return true;
  }

  getRoomUsers(roomCode: string): Array<{ id: string; name: string; socketId: string }> {
    const room = this.rooms.get(roomCode);
    if (!room) return [];
    return Array.from(room.users.values());
  }
}
