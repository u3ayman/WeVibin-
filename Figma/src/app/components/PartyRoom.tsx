import { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Mic, Volume2, Users, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  isSpeaking: boolean;
}

interface Track {
  title: string;
  artist: string;
  album: string;
  duration: number;
  currentTime: number;
}

interface PartyRoomProps {
  partyCode: string;
  participants: Participant[];
  currentTrack: Track;
  isPlaying: boolean;
  isHost: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSkipForward: () => void;
  onSkipBack: () => void;
  onPTTPress: () => void;
  onPTTRelease: () => void;
}

export function PartyRoom({
  partyCode,
  participants,
  currentTrack,
  isPlaying,
  isHost,
  onPlay,
  onPause,
  onSkipForward,
  onSkipBack,
  onPTTPress,
  onPTTRelease,
}: PartyRoomProps) {
  const [isPTTHeld, setIsPTTHeld] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(partyCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePTTMouseDown = () => {
    setIsPTTHeld(true);
    onPTTPress();
  };

  const handlePTTMouseUp = () => {
    setIsPTTHeld(false);
    onPTTRelease();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isPTTHeld) {
        e.preventDefault();
        handlePTTMouseDown();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isPTTHeld) {
        e.preventDefault();
        handlePTTMouseUp();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPTTHeld]);

  const progress = (currentTrack.currentTime / currentTrack.duration) * 100;

  return (
    <div className="flex h-full">
      {/* Left Sidebar - Queue & Party Info */}
      <div className="w-80 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3>Party Code</h3>
              <div className="text-muted-foreground text-sm mt-1">Share with friends</div>
            </div>
          </div>
          <button
            onClick={handleCopyCode}
            className="w-full px-4 py-3 bg-muted hover:bg-muted/80 rounded-lg transition-all flex items-center justify-between group"
          >
            <span className="font-mono">{partyCode}</span>
            {copied ? (
              <Check className="w-4 h-4 text-primary" />
            ) : (
              <Copy className="w-4 h-4 group-hover:text-primary transition-colors" />
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <h4 className="mb-4">Queue</h4>
          <div className="space-y-2">
            <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
              <div className="truncate">{currentTrack.title}</div>
              <div className="text-sm text-muted-foreground truncate">{currentTrack.artist}</div>
              <div className="text-xs text-primary mt-1">Now Playing</div>
            </div>
            
            {/* Mock upcoming tracks */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 bg-muted/50 rounded-lg opacity-60">
                <div className="truncate">Upcoming Track {i}</div>
                <div className="text-sm text-muted-foreground truncate">Artist Name</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Center Panel - Main Player */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="max-w-2xl w-full">
            {/* Album Art */}
            <motion.div
              animate={{ scale: isPlaying ? [1, 1.02, 1] : 1 }}
              transition={{ duration: 2, repeat: isPlaying ? Infinity : 0 }}
              className="aspect-square w-full max-w-md mx-auto mb-8 rounded-2xl bg-gradient-to-br from-primary via-accent to-secondary shadow-[0_0_60px_rgba(168,85,247,0.5)] flex items-center justify-center"
            >
              <div className="text-6xl">🎵</div>
            </motion.div>

            {/* Track Info */}
            <div className="text-center mb-8">
              <h2 className="mb-2">{currentTrack.title}</h2>
              <div className="text-muted-foreground">{currentTrack.artist}</div>
              <div className="text-sm text-muted-foreground mt-1">{currentTrack.album}</div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-primary to-secondary"
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>{formatTime(currentTrack.currentTime)}</span>
                <span>{formatTime(currentTrack.duration)}</span>
              </div>
            </div>

            {/* Playback Controls */}
            {isHost && (
              <div className="flex items-center justify-center gap-4 mb-8">
                <button
                  onClick={onSkipBack}
                  className="p-3 hover:bg-muted rounded-full transition-colors"
                >
                  <SkipBack className="w-6 h-6" />
                </button>
                
                <button
                  onClick={isPlaying ? onPause : onPlay}
                  className="p-5 bg-primary hover:bg-primary/90 rounded-full transition-all shadow-[0_0_20px_rgba(168,85,247,0.5)]"
                >
                  {isPlaying ? (
                    <Pause className="w-8 h-8 text-primary-foreground" />
                  ) : (
                    <Play className="w-8 h-8 text-primary-foreground" />
                  )}
                </button>
                
                <button
                  onClick={onSkipForward}
                  className="p-3 hover:bg-muted rounded-full transition-colors"
                >
                  <SkipForward className="w-6 h-6" />
                </button>
              </div>
            )}

            {/* PTT Button */}
            <div className="flex flex-col items-center">
              <motion.button
                onMouseDown={handlePTTMouseDown}
                onMouseUp={handlePTTMouseUp}
                onMouseLeave={handlePTTMouseUp}
                animate={{
                  scale: isPTTHeld ? 1.1 : 1,
                  boxShadow: isPTTHeld
                    ? '0 0 40px rgba(34, 211, 238, 0.8), 0 0 80px rgba(34, 211, 238, 0.4)'
                    : '0 0 20px rgba(34, 211, 238, 0.4)',
                }}
                className="w-32 h-32 rounded-full bg-gradient-to-br from-secondary to-primary flex flex-col items-center justify-center cursor-pointer select-none"
              >
                <Mic className="w-10 h-10 text-primary-foreground mb-2" />
                <span className="text-sm text-primary-foreground">Hold to Talk</span>
              </motion.button>
              <div className="text-xs text-muted-foreground mt-3">or press Space</div>
            </div>
          </div>
        </div>

        {/* Sync Status */}
        <div className="px-6 py-4 border-t border-border">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-secondary"
            />
            <span>You are in sync</span>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Participants */}
      <div className="w-80 bg-card border-l border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5" />
            <h3>Participants</h3>
            <span className="text-muted-foreground">({participants.length})</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {participants.map((participant) => (
            <motion.div
              key={participant.id}
              animate={{
                scale: participant.isSpeaking ? 1.05 : 1,
                boxShadow: participant.isSpeaking
                  ? '0 0 20px rgba(34, 211, 238, 0.6)'
                  : '0 0 0px rgba(0, 0, 0, 0)',
              }}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <span>{participant.name[0]}</span>
                </div>
                <AnimatePresence>
                  {participant.isSpeaking && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-secondary border-2 border-card flex items-center justify-center"
                    >
                      <Volume2 className="w-3 h-3" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate">{participant.name}</span>
                  {participant.isHost && (
                    <span className="px-2 py-0.5 bg-primary text-primary-foreground rounded text-xs">
                      Host
                    </span>
                  )}
                </div>
                {participant.isSpeaking && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-secondary"
                  >
                    Speaking...
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
