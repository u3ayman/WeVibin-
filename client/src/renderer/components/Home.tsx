import React, { useState } from 'react';

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

  const handleCreateRoom = async () => {
    if (!userName.trim()) {
      setLocalError('Please enter your name');
      return;
    }

    setIsLoading(true);
    setLocalError(null);

    try {
      await onCreateRoom(userName.trim());
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
    } catch (err: any) {
      setLocalError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = error || localError;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '32px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          WeVibin'
        </h1>

        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
          }}>
            Your Name
          </label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Enter your name"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '16px',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
        </div>

        <button
          onClick={handleCreateRoom}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            marginBottom: '24px',
            opacity: isLoading ? 0.7 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          {isLoading ? 'Creating...' : 'Create Room'}
        </button>

        <div style={{
          borderTop: '1px solid #e5e7eb',
          paddingTop: '24px',
          marginTop: '8px',
        }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
          }}>
            Room Code
          </label>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter 6-digit code"
            disabled={isLoading}
            maxLength={6}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '16px',
              outline: 'none',
              marginBottom: '12px',
              letterSpacing: '2px',
              textAlign: 'center',
              fontWeight: '600',
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />

          <button
            onClick={handleJoinRoom}
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'white',
              color: '#667eea',
              border: '2px solid #667eea',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {isLoading ? 'Joining...' : 'Join Room'}
          </button>
        </div>

        {displayError && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: '#fee2e2',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            color: '#dc2626',
            fontSize: '14px',
            textAlign: 'center',
          }}>
            {displayError}
          </div>
        )}
      </div>
    </div>
  );
}
