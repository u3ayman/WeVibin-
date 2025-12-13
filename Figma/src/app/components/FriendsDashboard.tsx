import { useState } from 'react';
import { UserPlus, Search, Link as LinkIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { FriendCard, Friend } from './FriendCard';

interface FriendsDashboardProps {
  friends: Friend[];
  onStartJam: (friendId: string) => void;
  onMessage: (friendId: string) => void;
  onJoinParty: (friendId: string) => void;
}

export function FriendsDashboard({ friends, onStartJam, onMessage, onJoinParty }: FriendsDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteLink] = useState('https://wevibin.app/invite/abc123xyz');
  const [copied, setCopied] = useState(false);

  const filteredFriends = friends.filter((friend) =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onlineFriends = filteredFriends.filter((f) => f.status === 'online' || f.status === 'in-party');
  const offlineFriends = filteredFriends.filter((f) => f.status === 'offline');

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1>Friends</h1>
            <p className="text-muted-foreground mt-1">
              {onlineFriends.length} online • {offlineFriends.length} offline
            </p>
          </div>
          <button
            onClick={() => setShowInviteDialog(true)}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Friend</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search friends..."
            className="w-full pl-10 pr-4 py-3 bg-input border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Friends List */}
      <div className="flex-1 overflow-y-auto p-6">
        {onlineFriends.length > 0 && (
          <div className="mb-8">
            <h3 className="mb-4 text-muted-foreground">Online — {onlineFriends.length}</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {onlineFriends.map((friend) => (
                <FriendCard
                  key={friend.id}
                  friend={friend}
                  onStartJam={onStartJam}
                  onMessage={onMessage}
                  onJoinParty={onJoinParty}
                />
              ))}
            </div>
          </div>
        )}

        {offlineFriends.length > 0 && (
          <div>
            <h3 className="mb-4 text-muted-foreground">Offline — {offlineFriends.length}</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {offlineFriends.map((friend) => (
                <FriendCard
                  key={friend.id}
                  friend={friend}
                  onStartJam={onStartJam}
                  onMessage={onMessage}
                  onJoinParty={onJoinParty}
                />
              ))}
            </div>
          </div>
        )}

        {filteredFriends.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="mb-2">No friends found</h3>
            <p className="text-muted-foreground">Try a different search or invite new friends</p>
          </div>
        )}
      </div>

      {/* Invite Dialog */}
      {showInviteDialog && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowInviteDialog(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-[0_0_60px_rgba(168,85,247,0.3)]"
          >
            <h2 className="mb-4">Invite a Friend</h2>
            <p className="text-muted-foreground mb-6">
              Share this invite link with your friends to add them to WeVibin'
            </p>
            
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-4 py-3 bg-muted rounded-lg font-mono text-sm"
              />
              <button
                onClick={handleCopyInvite}
                className="px-4 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)]"
              >
                {copied ? 'Copied!' : <LinkIcon className="w-5 h-5" />}
              </button>
            </div>

            <button
              onClick={() => setShowInviteDialog(false)}
              className="w-full px-4 py-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
