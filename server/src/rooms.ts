import { Room, Track } from './types';
import prisma from './lib/prisma';

export class RoomManager {
  private rooms: Map<string, Room> = new Map();

  async generateRoomCode(): Promise<string> {
    let code: string;
    let exists = true;
    while (exists) {
      code = Math.floor(100000 + Math.random() * 900000).toString();
      const dbRoom = await prisma.room.findUnique({ where: { code } });
      if (!dbRoom && !this.rooms.has(code)) {
        exists = false;
        return code;
      }
    }
    return '';
  }

  async createRoom(hostId: string, hostName: string): Promise<Room> {
    const code = await this.generateRoomCode();

    await prisma.room.create({
      data: {
        code,
        hostId,
        status: 'active',
        lastActive: new Date(),
        queue: []
      }
    });

    const room: Room = {
      code,
      host: { id: hostId, name: hostName },
      users: new Map([[hostId, { id: hostId, name: hostName, socketId: hostId }]]),
      queue: [],
      audioState: {
        isPlaying: false,
        position: 0,
        timestamp: Date.now(),
      },
    };
    this.rooms.set(code, room);
    return room;
  }

  async getRoom(code: string): Promise<Room | undefined> {
    if (this.rooms.has(code)) return this.rooms.get(code);

    const dbRoom = await prisma.room.findUnique({
      where: { code, status: 'active' },
      include: { host: true }
    });

    if (dbRoom) {
      const audioState = (dbRoom.lastAudioState as any) || {
        isPlaying: false,
        position: 0,
        timestamp: Date.now(),
      };

      const room: Room = {
        code,
        host: { id: dbRoom.hostId, name: dbRoom.host.username },
        users: new Map(),
        queue: (dbRoom.queue as any) || [],
        audioState
      };
      this.rooms.set(code, room);
      return room;
    }

    return undefined;
  }

  async addUserToRoom(roomCode: string, userId: string, userName: string): Promise<boolean> {
    const room = await this.getRoom(roomCode);
    if (!room) return false;

    room.users.set(userId, { id: userId, name: userName, socketId: userId });

    await prisma.room.update({
      where: { code: roomCode },
      data: { lastActive: new Date() }
    });

    return true;
  }

  async removeUserFromRoom(roomCode: string, userId: string): Promise<boolean> {
    const room = this.rooms.get(roomCode);
    if (!room) return false;

    room.users.delete(userId);

    if (room.users.size === 0) {
      this.rooms.delete(roomCode);
      return true;
    }

    if (room.host.id === userId && room.users.size > 0) {
      const newHost = Array.from(room.users.values())[0];
      room.host = { id: newHost.id, name: newHost.name };

      await prisma.room.update({
        where: { code: roomCode },
        data: { hostId: newHost.id }
      });
    }

    return false;
  }

  async updateAudioState(roomCode: string, state: Partial<Room['audioState']>): Promise<boolean> {
    const room = this.rooms.get(roomCode);
    if (!room) return false;

    room.audioState = {
      ...room.audioState,
      ...state,
      timestamp: Date.now(),
    };

    if (Math.random() > 0.8) {
      await prisma.room.update({
        where: { code: roomCode },
        data: {
          lastAudioState: room.audioState as any,
          lastActive: new Date()
        }
      });
    }

    return true;
  }

  async addToQueue(roomCode: string, track: Track): Promise<boolean> {
    const room = await this.getRoom(roomCode);
    if (!room) return false;

    room.queue.push(track);

    await prisma.room.update({
      where: { code: roomCode },
      data: {
        queue: room.queue as any,
        lastActive: new Date()
      }
    });

    return true;
  }

  async removeFromQueue(roomCode: string, trackId: string, userId: string): Promise<boolean> {
    const room = await this.getRoom(roomCode);
    if (!room) return false;

    // Only host or the person who added it can remove
    const track = room.queue.find(t => t.id === trackId);
    if (!track) return false;

    if (room.host.id !== userId && track.addedBy.id !== userId) {
      return false;
    }

    room.queue = room.queue.filter(t => t.id !== trackId);

    await prisma.room.update({
      where: { code: roomCode },
      data: {
        queue: room.queue as any,
        lastActive: new Date()
      }
    });

    return true;
  }

  async nextTrack(roomCode: string, hostId: string): Promise<Track | null> {
    const room = await this.getRoom(roomCode);
    if (!room || room.host.id !== hostId) return null;

    if (room.queue.length === 0) {
      room.audioState.currentTrack = undefined;
      room.audioState.isPlaying = false;
      room.audioState.position = 0;
    } else {
      const nextTrack = room.queue.shift();
      room.audioState.currentTrack = nextTrack;
      room.audioState.isPlaying = true;
      room.audioState.position = 0;
    }

    room.audioState.timestamp = Date.now();

    await prisma.room.update({
      where: { code: roomCode },
      data: {
        queue: room.queue as any,
        lastAudioState: room.audioState as any,
        lastActive: new Date()
      }
    });

    return room.audioState.currentTrack || null;
  }

  async kickUser(roomCode: string, hostId: string, targetUserId: string): Promise<boolean> {
    const room = this.rooms.get(roomCode);
    if (!room || room.host.id !== hostId) return false;

    return this.removeUserFromRoom(roomCode, targetUserId);
  }

  async transferHost(roomCode: string, currentHostId: string, newHostId: string): Promise<boolean> {
    const room = this.rooms.get(roomCode);
    if (!room || room.host.id !== currentHostId) return false;

    const newHost = room.users.get(newHostId);
    if (!newHost) return false;

    room.host = { id: newHost.id, name: newHost.name };

    await prisma.room.update({
      where: { code: roomCode },
      data: { hostId: newHost.id }
    });

    return true;
  }

  getRoomUsers(roomCode: string): Array<{ id: string; name: string; socketId: string }> {
    const room = this.rooms.get(roomCode);
    if (!room) return [];
    return Array.from(room.users.values());
  }

  async runCleanup(): Promise<void> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const result = await prisma.room.updateMany({
      where: {
        status: 'active',
        lastActive: { lt: oneDayAgo }
      },
      data: { status: 'closed' }
    });

    if (result.count > 0) {
      console.log(`[Cleanup] Closed ${result.count} inactive rooms`);
    }

    for (const [code, room] of this.rooms.entries()) {
      if (room.users.size === 0) {
        this.rooms.delete(code);
      }
    }
  }
}
