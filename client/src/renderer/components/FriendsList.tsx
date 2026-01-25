import React, { useState } from 'react';
import { Friend } from '../types';
import { useToast } from './Toast';

interface FriendsListProps {
  friends: Friend[];
  myFriendCode: string;
  onAddFriend: (friendCode: string) => Promise<{ success: boolean; error?: string }>;
  onOpenChat: (friend: Friend) => void;
  toast: ReturnType<typeof useToast>;
}

export function FriendsList({ friends, myFriendCode, onAddFriend, onOpenChat, toast }: FriendsListProps) {
  const [showMyCode, setShowMyCode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFriendCode, setNewFriendCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const copyMyCode = async () => {
    try {
      // Try Electron API first (more reliable)
      if (window.electron?.writeClipboard) {
        await window.electron.writeClipboard(myFriendCode);
      } else {
        // Fallback to web API
        await navigator.clipboard.writeText(myFriendCode);
      }
      toast.success('Friend code copied!');
    } catch (error) {
      console.error('Failed to copy friend code:', error);
      toast.error('Failed to copy code');
    }
  };

  const handleAddFriend = async () => {
    if (!newFriendCode.trim()) {
      setError('Please enter a friend code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await onAddFriend(newFriendCode.trim());
      if (result.success) {
        setNewFriendCode('');
        setShowAddModal(false);
      } else {
        setError(result.error || 'Failed to add friend');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: Friend['status']) => {
    switch (status) {
      case 'online': return '#10b981';
      case 'in-party': return '#3b82f6';
      case 'offline': return '#9ca3af';
    }
  };

  const getStatusText = (friend: Friend) => {
    switch (friend.status) {
      case 'online': return 'Online';
      case 'in-party': return `In Party: ${friend.currentRoomCode}`;
      case 'offline': return 'Offline';
    }
  };

  return (
    <div className="wv-page">
      <div className="wv-container">
        <div className="wv-card wv-card--padded">
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: 'inherit',
          }}>
            Friends
          </h2>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowMyCode(!showMyCode)}
              style={{
                padding: '10px 16px',
                background: showMyCode ? 'rgba(168, 85, 247, 0.18)' : 'rgba(255,255,255,0.06)',
                color: 'rgba(245,245,247,0.95)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              My Code
            </button>

            <button
              onClick={() => setShowAddModal(!showAddModal)}
              style={{
                padding: '10px 16px',
                background: 'linear-gradient(90deg, #a855f7, #22d3ee)',
                color: '#0a0a0f',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              ➕ Add Friend
            </button>
          </div>
        </div>

        {/* My Friend Code Section */}
        {showMyCode && (
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '24px',
            border: '1px solid rgba(255,255,255,0.10)',
          }}>
            <h3 style={{
              fontSize: '16px',
              marginBottom: '12px',
              color: 'rgba(245,245,247,0.9)',
              fontWeight: '600',
            }}>
              Your Friend Code
            </h3>
            <div style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
            }}>
              <div style={{
                flex: 1,
                padding: '12px',
                background: 'rgba(18,18,26,0.9)',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#22d3ee',
                textAlign: 'center',
                letterSpacing: '2px',
                border: '1px solid rgba(255,255,255,0.10)',
              }}>
                {myFriendCode}
              </div>
              <button
                onClick={copyMyCode}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(168, 85, 247, 0.18)',
                  color: 'rgba(245,245,247,0.95)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                Copy
              </button>
            </div>
          </div>
        )}

        {/* Add Friend Modal */}
        {showAddModal && (
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '24px',
            border: '1px solid rgba(255,255,255,0.10)',
          }}>
            <h3 style={{
              fontSize: '16px',
              marginBottom: '12px',
              color: 'rgba(245,245,247,0.9)',
              fontWeight: '600',
            }}>
              Add Friend
            </h3>

            <input
              type="text"
              value={newFriendCode}
              onChange={(e) => setNewFriendCode(e.target.value.toUpperCase())}
              placeholder="Enter friend code (F-XXXXXXXX)"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                fontSize: '16px',
                marginBottom: '12px',
                fontFamily: 'monospace',
                letterSpacing: '1px',
                background: 'rgba(18,18,26,0.9)',
                color: 'rgba(245,245,247,0.95)',
              }}
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleAddFriend}
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'linear-gradient(90deg, #a855f7, #22d3ee)',
                  color: '#0a0a0f',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  opacity: isLoading ? 0.7 : 1,
                }}
              >
                {isLoading ? 'Adding...' : 'Add'}
              </button>

              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewFriendCode('');
                  setError(null);
                }}
                disabled={isLoading}
                style={{
                  padding: '12px 24px',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(245,245,247,0.85)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '8px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                }}
              >
                Cancel
              </button>
            </div>

            {error && (
              <div style={{
                marginTop: '12px',
                padding: '12px',
                background: '#fee2e2',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '14px',
              }}>
                {error}
              </div>
            )}
          </div>
        )}

        {/* Friends Grid */}
        {friends.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#6b7280',
          }}>
            <p style={{ fontSize: '18px', marginBottom: '8px' }}>No friends yet</p>
            <p style={{ fontSize: '14px' }}>Click Add Friend to get started</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '16px',
          }}>
            {friends.map(friend => (
              <div
                key={friend.id}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: '12px',
                  padding: '20px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.45)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.10)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                }}>
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px',
                    }}>
                      <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: getStatusColor(friend.status),
                        boxShadow: friend.status === 'online' ? '0 0 14px rgba(16,185,129,0.35)' : undefined,
                      }} />
                      <h4 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: 'rgba(245,245,247,0.95)',
                      }}>
                        {friend.name}
                      </h4>
                    </div>
                    <p style={{
                      fontSize: '13px',
                      color: 'rgba(245,245,247,0.65)',
                    }}>
                      {getStatusText(friend)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => onOpenChat(friend)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(245,245,247,0.95)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                  }}
                >
                  Chat
                </button>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
