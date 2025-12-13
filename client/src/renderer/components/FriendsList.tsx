import React, { useState } from 'react';
import { Friend } from '../types';

interface FriendsListProps {
  friends: Friend[];
  myFriendCode: string;
  onAddFriend: (friendCode: string) => Promise<{ success: boolean; error?: string }>;
  onOpenChat: (friend: Friend) => void;
}

export function FriendsList({ friends, myFriendCode, onAddFriend, onOpenChat }: FriendsListProps) {
  const [showMyCode, setShowMyCode] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFriendCode, setNewFriendCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const copyMyCode = () => {
    navigator.clipboard.writeText(myFriendCode);
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
      }}>
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
            color: '#374151',
          }}>
            Friends
          </h2>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setShowMyCode(!showMyCode)}
              style={{
                padding: '10px 16px',
                background: showMyCode ? '#667eea' : 'white',
                color: showMyCode ? 'white' : '#667eea',
                border: '2px solid #667eea',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              🔗 My Code
            </button>

            <button
              onClick={() => setShowAddModal(!showAddModal)}
              style={{
                padding: '10px 16px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
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
            background: '#f3f4f6',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '24px',
          }}>
            <h3 style={{
              fontSize: '16px',
              marginBottom: '12px',
              color: '#374151',
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
                background: 'white',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#667eea',
                textAlign: 'center',
                letterSpacing: '2px',
              }}>
                {myFriendCode}
              </div>
              <button
                onClick={copyMyCode}
                style={{
                  padding: '12px 24px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
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
            background: '#f3f4f6',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '24px',
          }}>
            <h3 style={{
              fontSize: '16px',
              marginBottom: '12px',
              color: '#374151',
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
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                marginBottom: '12px',
                fontFamily: 'monospace',
                letterSpacing: '1px',
              }}
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleAddFriend}
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#667eea',
                  color: 'white',
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
                  background: 'white',
                  color: '#6b7280',
                  border: '2px solid #e5e7eb',
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
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
            <p style={{ fontSize: '18px', marginBottom: '8px' }}>No friends yet</p>
            <p style={{ fontSize: '14px' }}>Click ➕ to add a friend</p>
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
                  background: '#f9fafb',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '20px',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
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
                      }} />
                      <h4 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#374151',
                      }}>
                        {friend.name}
                      </h4>
                    </div>
                    <p style={{
                      fontSize: '13px',
                      color: '#6b7280',
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
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '14px',
                  }}
                >
                  💬 Chat
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
