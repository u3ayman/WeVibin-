import React, { useState } from 'react';
import { Music, Users, Radio, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface HomeProps {
  onCreateRoom: (userName: string) => Promise<void>;
  onJoinRoom: (code: string, userName: string) => Promise<void>;
  error: string | null;
}

export function Home({ onCreateRoom, onJoinRoom, error }: HomeProps) {
  const [userName, setUserName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<'create' | 'join' | null>(null);

  const handleCreateRoom = async () => {
    if (!userName.trim()) {
      setLocalError('Please enter your name');
      return;
    }

    setIsLoading(true);
    setLocalError(null);

    try {
      await onCreateRoom(userName.trim());
      setShowModal(null);
    } catch (err: any) {
      setLocalError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!userName.trim()) {
      setLocalError('Please enter your name');
      return;
    }

    if (!roomCode.trim() || roomCode.trim().length !== 6) {
      setLocalError('Please enter a valid 6-digit room code');
      return;
    }

    setIsLoading(true);
    setLocalError(null);

    try {
      await onJoinRoom(roomCode.trim(), userName.trim());
      setShowModal(null);
    } catch (err: any) {
      setLocalError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = error || localError;

  const features = [
    { icon: Music, title: 'Synchronized Playback', description: 'Listen to music together in perfect sync with your friends', color: 'from-[#a855f7] to-[#7c3aed]' },
    { icon: Radio, title: 'Push-to-Talk Voice', description: 'Crystal clear voice communication while vibing to your favorite tracks', color: 'from-[#22d3ee] to-[#a855f7]' },
    { icon: Users, title: 'Instant Parties', description: 'Start a jam session and your friends can join anytime', color: 'from-[#7c3aed] to-[#22d3ee]' },
    { icon: Zap, title: 'Real-time Sync', description: 'Experience music together with millisecond precision', color: 'from-[#22d3ee] to-[#7c3aed]' },
  ];

  return (
    <div style={{ height: '100vh', overflow: 'auto', background: '#0a0a0f', color: '#f5f5f7' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: '64px 0' }}>
          <motion.h1
            style={{ fontSize: '48px', marginBottom: '16px', background: 'linear-gradient(90deg, #a855f7 0%, #22d3ee 50%, #a855f7 100%)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
            animate={{ backgroundPosition: ['0%', '200%'] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          >
            WeVibin'
          </motion.h1>
          <p style={{ fontSize: '20px', color: '#a1a1aa', marginBottom: '32px' }}>Listen together. Vibe together. Connect together.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <button onClick={() => setShowModal('create')} style={{ padding: '16px 32px', background: '#a855f7', color: '#f5f5f7', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 0 30px rgba(168,85,247,0.5)', transition: 'all 0.2s' }}>
              Start Vibing
            </button>
            <button onClick={() => setShowModal('join')} style={{ padding: '16px 32px', background: '#16161f', color: '#f5f5f7', border: '1px solid rgba(168, 85, 247, 0.15)', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
              Join Party
            </button>
          </div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '64px' }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} style={{ background: '#16161f', border: '1px solid rgba(168, 85, 247, 0.15)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, #10b981, #22d3ee)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(16,185,129,0.4)' }}>
                <Users size={32} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: '32px', fontWeight: 'bold' }}>0</div>
                <div style={{ color: '#a1a1aa' }}>Friends Online</div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} style={{ background: '#16161f', border: '1px solid rgba(168, 85, 247, 0.15)', borderRadius: '16px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, #a855f7, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(168,85,247,0.4)' }}>
                <Radio size={32} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: '32px', fontWeight: 'bold' }}>0</div>
                <div style={{ color: '#a1a1aa' }}>Active Parties</div>
              </div>
            </div>
          </motion.div>
        </div>

        <div>
          <h2 style={{ textAlign: 'center', marginBottom: '32px', fontSize: '28px' }}>Why WeVibin'?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} style={{ background: '#16161f', border: '1px solid rgba(168, 85, 247, 0.15)', borderRadius: '16px', padding: '24px', transition: 'all 0.2s' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: `linear-gradient(135deg, ${feature.color.includes('a855f7') ? '#a855f7' : '#22d3ee'}, ${feature.color.includes('7c3aed') ? '#7c3aed' : '#a855f7'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <Icon size={28} color="#fff" />
                  </div>
                  <h3 style={{ marginBottom: '8px', fontSize: '18px', fontWeight: '600' }}>{feature.title}</h3>
                  <p style={{ color: '#a1a1aa', lineHeight: '1.5' }}>{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} style={{ marginTop: '64px', padding: '32px', background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(34,211,238,0.1))', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '16px', textAlign: 'center' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '24px' }}>Ready to start jamming?</h3>
          <p style={{ color: '#a1a1aa', marginBottom: '24px' }}>Connect with friends and experience music like never before</p>
          <button onClick={() => setShowModal('create')} style={{ padding: '12px 32px', background: 'linear-gradient(90deg, #a855f7, #22d3ee)', color: '#f5f5f7', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 0 30px rgba(168,85,247,0.4)', transition: 'all 0.2s' }}>
            Get Started
          </button>
        </motion.div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowModal(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} onClick={(e) => e.stopPropagation()} style={{ background: '#16161f', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '16px', padding: '40px', maxWidth: '400px', width: '100%' }}>
            <h2 style={{ marginBottom: '24px', textAlign: 'center' }}>{showModal === 'create' ? 'Create Party' : 'Join Party'}</h2>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#a1a1aa' }}>Your Name</label>
              <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Enter your name" disabled={isLoading} style={{ width: '100%', padding: '12px', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '8px', fontSize: '16px', color: '#f5f5f7', outline: 'none' }} />
            </div>

            {showModal === 'join' && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#a1a1aa' }}>Room Code</label>
                <input type="text" value={roomCode} onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Enter 6-digit code" disabled={isLoading} maxLength={6} style={{ width: '100%', padding: '12px', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '8px', fontSize: '16px', color: '#f5f5f7', outline: 'none', letterSpacing: '2px', textAlign: 'center', fontWeight: '600' }} />
              </div>
            )}

            <button onClick={showModal === 'create' ? handleCreateRoom : handleJoinRoom} disabled={isLoading} style={{ width: '100%', padding: '14px', background: '#a855f7', color: '#f5f5f7', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1, boxShadow: '0 0 20px rgba(168,85,247,0.4)' }}>
              {isLoading ? (showModal === 'create' ? 'Creating...' : 'Joining...') : (showModal === 'create' ? 'Create Room' : 'Join Room')}
            </button>

            {displayError && (
              <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', borderRadius: '8px', fontSize: '14px', textAlign: 'center' }}>
                {displayError}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
