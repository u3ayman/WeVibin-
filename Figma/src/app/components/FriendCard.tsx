import { MessageSquare, Music, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';

export interface Friend {
  id: string;
  name: string;
  avatar: string;
  status: 'online' | 'offline' | 'in-party';
  partyInfo?: {
    currentTrack: string;
    artist: string;
  };
}

interface FriendCardProps {
  friend: Friend;
  onStartJam: (friendId: string) => void;
  onMessage: (friendId: string) => void;
  onJoinParty: (friendId: string) => void;
}

export function FriendCard({ friend, onStartJam, onMessage, onJoinParty }: FriendCardProps) {
  const statusConfig = {
    online: {
      color: 'bg-online',
      glow: 'shadow-[0_0_8px_rgba(16,185,129,0.6)]',
      label: 'Online',
    },
    offline: {
      color: 'bg-gray-500',
      glow: '',
      label: 'Offline',
    },
    'in-party': {
      color: 'bg-in-party',
      glow: 'shadow-[0_0_8px_rgba(168,85,247,0.8)]',
      label: 'In Party',
    },
  };

  const status = statusConfig[friend.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl p-4 border border-border hover:border-primary/50 transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center overflow-hidden">
            <span>{friend.name[0]}</span>
          </div>
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card ${status.color} ${status.glow}`} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="truncate">{friend.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-sm ${friend.status === 'online' ? 'text-online' : friend.status === 'in-party' ? 'text-in-party' : 'text-muted-foreground'}`}>
              {status.label}
            </span>
          </div>
          
          {friend.status === 'in-party' && friend.partyInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-1">
                <Music className="w-3 h-3" />
                <span className="truncate">{friend.partyInfo.currentTrack}</span>
              </div>
              <div className="text-xs truncate">{friend.partyInfo.artist}</div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => onMessage(friend.id)}
          className="flex-1 px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-all flex items-center justify-center gap-2 group-hover:scale-105"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-sm">Message</span>
        </button>
        
        {friend.status === 'in-party' ? (
          <button
            onClick={() => onJoinParty(friend.id)}
            className="flex-1 px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.4)] group-hover:scale-105"
          >
            <Music className="w-4 h-4" />
            <span className="text-sm">Join Party</span>
          </button>
        ) : (
          <button
            onClick={() => onStartJam(friend.id)}
            disabled={friend.status === 'offline'}
            className="flex-1 px-3 py-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(34,211,238,0.4)] group-hover:scale-105"
          >
            <UserPlus className="w-4 h-4" />
            <span className="text-sm">Start Jam</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}
