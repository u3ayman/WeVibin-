import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Music, Users, Radio, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface HomeProps {
  onCreateRoom: (userName: string) => Promise<void>;
  onJoinRoom: (code: string, userName: string) => Promise<void>;
  error: string | null;
  defaultName?: string;
}

export function Home({ onCreateRoom, onJoinRoom, error, defaultName }: HomeProps) {
  const [userName, setUserName] = useState(defaultName || '');
  const [roomCode, setRoomCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<'create' | 'join' | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const roomCodeInputRef = useRef<HTMLInputElement>(null);

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

  const primaryCtaText = useMemo(() => {
    if (showModal === 'create') return isLoading ? 'Creating…' : 'Create Party';
    if (showModal === 'join') return isLoading ? 'Joining…' : 'Join Party';
    return 'Get Started';
  }, [isLoading, showModal]);

  useEffect(() => {
    if (!showModal) return;
    // Focus first field in modal for faster flow (desktop + mobile).
    const id = window.setTimeout(() => {
      if (showModal === 'join') {
        roomCodeInputRef.current?.focus();
      } else {
        nameInputRef.current?.focus();
      }
    }, 50);
    return () => window.clearTimeout(id);
  }, [showModal]);

  useEffect(() => {
    if (!showModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowModal(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showModal]);

  const features = [
    { icon: Music, title: 'Synchronized Playback', description: 'Listen to music together in perfect sync with your friends', color: 'from-[#a855f7] to-[#7c3aed]' },
    { icon: Radio, title: 'Push-to-Talk Voice', description: 'Crystal clear voice communication while vibing to your favorite tracks', color: 'from-[#22d3ee] to-[#a855f7]' },
    { icon: Users, title: 'Instant Parties', description: 'Start a jam session and your friends can join anytime', color: 'from-[#7c3aed] to-[#22d3ee]' },
    { icon: Zap, title: 'Real-time Sync', description: 'Experience music together with millisecond precision', color: 'from-[#22d3ee] to-[#7c3aed]' },
  ];

  return (
    <div className="wv-page">
      <div className="wv-container">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: '44px 0 26px' }}>
          <motion.h1
            style={{ fontSize: '48px', marginBottom: '12px', background: 'linear-gradient(90deg, #a855f7 0%, #22d3ee 50%, #a855f7 100%)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
            animate={{ backgroundPosition: ['0%', '200%'] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          >
            WeVibin'
          </motion.h1>
          <p style={{ fontSize: '18px', color: 'rgba(245,245,247,0.65)', marginBottom: '22px' }}>
            Listen together. Vibe together. Connect together.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="wv-btn wv-btn--primary"
              onClick={() => setShowModal('create')}
            >
              Start Vibing
            </button>
            <button
              type="button"
              className="wv-btn wv-btn--ghost"
              onClick={() => setShowModal('join')}
            >
              Join Party
            </button>
          </div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="wv-card" style={{ padding: '18px' }}>
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

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="wv-card" style={{ padding: '18px' }}>
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
          <h2 style={{ textAlign: 'center', marginBottom: '18px', fontSize: '22px' }}>Why WeVibin'?</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="wv-card" style={{ padding: '18px', transition: 'all 0.2s' }}>
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

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} style={{ marginTop: '28px', padding: '22px', background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(34,211,238,0.08))', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '16px', textAlign: 'center' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '24px' }}>Ready to start jamming?</h3>
          <p style={{ color: '#a1a1aa', marginBottom: '24px' }}>Connect with friends and experience music like never before</p>
          <button type="button" className="wv-btn wv-btn--primary" onClick={() => setShowModal('create')}>
            Get Started
          </button>
        </motion.div>
      </div>

      {showModal && (
        <div className="wv-overlay" onClick={() => setShowModal(null)}>
          <motion.div
            className="wv-modal"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            style={{ width: 'min(520px, 100%)' }}
          >
            <div style={{ padding: '18px 18px 14px' }}>
              <h2 style={{ marginBottom: '6px', textAlign: 'center' }}>
                {showModal === 'create' ? 'Create Party' : 'Join Party'}
              </h2>
              <p className="wv-muted" style={{ textAlign: 'center', fontSize: '14px' }}>
                {showModal === 'create'
                  ? 'Pick a name and start a room instantly.'
                  : 'Enter your name and a 6-digit room code.'}
              </p>
            </div>

            <div className="wv-divider" />

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (showModal === 'create') {
                  void handleCreateRoom();
                } else {
                  void handleJoinRoom();
                }
              }}
              style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 650, color: 'rgba(245,245,247,0.72)' }}>
                  Your Name
                </label>
                <input
                  ref={nameInputRef}
                  className="wv-input"
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  disabled={isLoading}
                  autoComplete="nickname"
                />
              </div>

              {showModal === 'join' && (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 650, color: 'rgba(245,245,247,0.72)' }}>
                    Room Code
                  </label>
                  <input
                    ref={roomCodeInputRef}
                    className="wv-input"
                    type="text"
                    inputMode="numeric"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    disabled={isLoading}
                    maxLength={6}
                    style={{ letterSpacing: '2px', textAlign: 'center', fontWeight: 700 }}
                  />
                </div>
              )}

              <button
                type="submit"
                className="wv-btn wv-btn--primary"
                disabled={isLoading}
                style={{ width: '100%', opacity: isLoading ? 0.8 : 1 }}
              >
                {primaryCtaText}
              </button>

              <button
                type="button"
                className="wv-btn wv-btn--ghost"
                onClick={() => setShowModal(null)}
                disabled={isLoading}
                style={{ width: '100%' }}
              >
                Cancel
              </button>

              {displayError && (
                <div
                  role="alert"
                  aria-live="polite"
                  style={{
                    padding: '12px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    color: '#ef4444',
                    borderRadius: '12px',
                    fontSize: '14px',
                    textAlign: 'center',
                  }}
                >
                  {displayError}
                </div>
              )}
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
