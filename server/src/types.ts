export interface Track {
  id: string;
  name: string;
  artists: string;
  albumArt?: string;
  duration: number; // ms
  source: 'local' | 'spotify';
  uri?: string;
  fileName?: string;
  addedBy: { id: string; name: string };
}

export interface Room {
  code: string;
  host: { id: string; name: string };
  users: Map<string, { id: string; name: string; socketId: string }>;
  queue: Track[];
  audioState: {
    isPlaying: boolean;
    position: number; // ms
    timestamp: number; // server time
    currentTrack?: Track;
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

export interface WebRTCSignal {
  to: string;
  from?: string;
  offer?: any; // Ideally RTCSessionDescriptionInit, but any for signaling JSON
  answer?: any;
  candidate?: any;
}
