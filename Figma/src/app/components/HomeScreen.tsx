import { Music, Users, Radio, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
  onlineFriendsCount: number;
  activePartiesCount: number;
}

export function HomeScreen({ onNavigate, onlineFriendsCount, activePartiesCount }: HomeScreenProps) {
  const features = [
    {
      icon: Music,
      title: 'Synchronized Playback',
      description: 'Listen to music together in perfect sync with your friends',
      color: 'from-primary to-accent',
    },
    {
      icon: Radio,
      title: 'Push-to-Talk Voice',
      description: 'Crystal clear voice communication while vibing to your favorite tracks',
      color: 'from-secondary to-primary',
    },
    {
      icon: Users,
      title: 'Instant Parties',
      description: 'Start a jam session and your friends can join anytime',
      color: 'from-accent to-secondary',
    },
    {
      icon: Zap,
      title: 'Real-time Sync',
      description: 'Experience music together with millisecond precision',
      color: 'from-secondary to-accent',
    },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto p-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <motion.h1
            className="text-5xl mb-4 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent"
            animate={{ backgroundPosition: ['0%', '200%'] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            style={{ backgroundSize: '200% auto' }}
          >
            WeVibin'
          </motion.h1>
          <p className="text-xl text-muted-foreground mb-8">
            Listen together. Vibe together. Connect together.
          </p>
          
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('friends')}
              className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all shadow-[0_0_30px_rgba(168,85,247,0.5)] hover:scale-105"
            >
              Start Vibing
            </button>
            <button
              onClick={() => onNavigate('friends')}
              className="px-8 py-4 bg-card border border-border hover:border-primary/50 rounded-xl transition-all hover:scale-105"
            >
              Invite Friends
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-6 mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-online to-secondary flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <div className="text-3xl">{onlineFriendsCount}</div>
                <div className="text-muted-foreground">Friends Online</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-2xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                <Radio className="w-8 h-8" />
              </div>
              <div>
                <div className="text-3xl">{activePartiesCount}</div>
                <div className="text-muted-foreground">Active Parties</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Features */}
        <div>
          <h2 className="text-center mb-8">Why WeVibin'?</h2>
          <div className="grid grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-all group"
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-16 p-8 bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 rounded-2xl text-center"
        >
          <h3 className="mb-4">Ready to start jamming?</h3>
          <p className="text-muted-foreground mb-6">
            Connect with friends and experience music like never before
          </p>
          <button
            onClick={() => onNavigate('friends')}
            className="px-8 py-3 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-xl transition-all hover:scale-105 shadow-[0_0_30px_rgba(168,85,247,0.4)]"
          >
            Get Started
          </button>
        </motion.div>
      </div>
    </div>
  );
}
