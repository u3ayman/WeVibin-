import { Music, Users, Play } from 'lucide-react';
import { motion } from 'motion/react';

interface Party {
  id: string;
  hostName: string;
  currentTrack: string;
  artist: string;
  participantCount: number;
  isJoinable: boolean;
}

interface ActivePartiesProps {
  parties: Party[];
  onJoinParty: (partyId: string) => void;
  currentPartyId?: string;
}

export function ActiveParties({ parties, onJoinParty, currentPartyId }: ActivePartiesProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-border">
        <h1>Active Parties</h1>
        <p className="text-muted-foreground mt-1">
          {parties.length} {parties.length === 1 ? 'party' : 'parties'} vibing right now
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {parties.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <Music className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="mb-2">No active parties</h3>
            <p className="text-muted-foreground">Start a jam with your friends to get vibing!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {parties.map((party) => (
              <motion.div
                key={party.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`bg-card rounded-xl p-6 border transition-all ${
                  party.id === currentPartyId
                    ? 'border-primary shadow-[0_0_30px_rgba(168,85,247,0.3)]'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-pulse">
                    <Music className="w-8 h-8" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="truncate mb-1">{party.hostName}'s Party</h3>
                    {party.id === currentPartyId && (
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-primary/20 text-primary rounded-full text-xs mb-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span>You're here</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-start gap-2 mb-1">
                      <Play className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{party.currentTrack}</div>
                        <div className="text-sm text-muted-foreground truncate">{party.artist}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{party.participantCount} vibing</span>
                    </div>

                    {party.id !== currentPartyId && party.isJoinable && (
                      <button
                        onClick={() => onJoinParty(party.id)}
                        className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                      >
                        Join Party
                      </button>
                    )}

                    {party.id === currentPartyId && (
                      <div className="text-sm text-muted-foreground">Current party</div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
