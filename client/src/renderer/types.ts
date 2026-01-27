export interface User {
  id: string;
  name: string;
  socketId: string;
}

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

export interface AudioState {
  isPlaying: boolean;
  position: number; // ms
  timestamp: number;
  currentTrack?: Track;
}

export interface RoomState {
  code: string;
  host: { id: string; name: string };
  users: User[];
  queue: Track[];
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

export interface QueueItem {
  id: string;
  fileName: string;
  filePath: string;
  blobUrl?: string;
  duration?: number;
}

declare global {
  interface Window {
    electron: {
      selectAudioFile: () => Promise<string | undefined>;
      selectAudioFolder: () => Promise<string[]>;
      readAudioFile: (filePath: string) => Promise<{
        success: boolean;
        buffer?: number[];
        fileName?: string;
        mimeType?: string;
        error?: string;
      }>;
      writeClipboard: (
        text: string,
      ) => Promise<{ success: boolean; error?: string }>;
    };
  }
}
