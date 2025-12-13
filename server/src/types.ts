export interface Room {
  code: string;
  host: { id: string; name: string };
  users: Map<string, { id: string; name: string; socketId: string }>;
  audioState: {
    isPlaying: boolean;
    position: number; // seconds
    timestamp: number; // server time
    fileName?: string;
  };
}

export interface FriendSession {
  userId: string;
  userName: string;
  friendCode: string;
  socketId: string;
  friends: Set<string>;
  status: 'online' | 'offline' | 'in-party';
  currentRoomCode?: string;
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
  id: string; // UUID
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  message: string;
  timestamp: number;
  type: 'text' | 'party-invite';
  partyCode?: string;
}
