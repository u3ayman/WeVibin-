export interface User {
  id: string;
  name: string;
  socketId: string;
}

export interface AudioState {
  isPlaying: boolean;
  position: number;
  timestamp: number;
  fileName?: string;
}

export interface RoomState {
  code: string;
  host: { id: string; name: string };
  users: User[];
  audioState: AudioState;
}

export interface Friend {
  id: string;
  name: string;
  friendCode: string;
  status: 'online' | 'offline' | 'in-party';
  currentRoomCode?: string;
  addedAt: number;
}

export interface ChatMessage {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  message: string;
  timestamp: number;
  type: 'text' | 'party-invite';
  partyCode?: string;
}

declare global {
  interface Window {
    electron: {
      selectAudioFile: () => Promise<string | undefined>;
    };
  }
}
