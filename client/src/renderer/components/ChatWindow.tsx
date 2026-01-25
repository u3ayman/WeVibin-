import React, { useState, useRef, useEffect } from 'react';
import { Friend, ChatMessage } from '../types';

interface ChatWindowProps {
  friend: Friend;
  messages: ChatMessage[];
  myUserId: string;
  currentRoomCode?: string;
  onSendMessage: (message: string) => void;
  onSendInvite: (roomCode: string) => void;
  onJoinParty: (roomCode: string) => void;
  onClose: () => void;
}

export function ChatWindow({
  friend,
  messages,
  myUserId,
  currentRoomCode,
  onSendMessage,
  onSendInvite,
  onJoinParty,
  onClose,
}: ChatWindowProps) {
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (messageText.trim()) {
      onSendMessage(messageText.trim());
      setMessageText('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
        date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
  };

  const getStatusColor = (status: Friend['status']) => {
    switch (status) {
      case 'online': return '#10b981';
      case 'in-party': return '#3b82f6';
      case 'offline': return '#9ca3af';
    }
  };

  return (
    <div className="wv-overlay">
      <div className="wv-modal" style={{ width: 'min(640px, 100%)', height: 'min(700px, 92vh)' }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.10)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
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
              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: 'rgba(245,245,247,0.95)',
              }}>
                {friend.name}
              </h3>
            </div>
            <p style={{
              fontSize: '14px',
              color: 'rgba(245,245,247,0.65)',
            }}>
              {friend.status === 'online' && 'Online'}
              {friend.status === 'offline' && 'Offline'}
              {friend.status === 'in-party' && `In Party: ${friend.currentRoomCode}`}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {currentRoomCode && (
              <button
                onClick={() => onSendInvite(currentRoomCode)}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(168,85,247,0.18)',
                  color: 'rgba(245,245,247,0.95)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  border: '1px solid rgba(255,255,255,0.10)',
                }}
              >
                🎵 Invite
              </button>
            )}

            {friend.status === 'in-party' && friend.currentRoomCode && (
              <button
                onClick={() => onJoinParty(friend.currentRoomCode!)}
                style={{
                  padding: '8px 16px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                }}
              >
                Join Party
              </button>
            )}

            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.06)',
                color: 'rgba(245,245,247,0.9)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '18px',
                border: '1px solid rgba(255,255,255,0.10)',
              }}
            >
              Close
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}>
          {messages.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#9ca3af',
              marginTop: '40px',
            }}>
              <p style={{ fontSize: '16px' }}>No messages yet</p>
              <p style={{ fontSize: '14px', marginTop: '8px' }}>Send a message to start chatting!</p>
            </div>
          ) : (
            messages.map(msg => {
              const isMe = msg.fromUserId === myUserId;
              const isInvite = msg.type === 'party-invite';

              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    justifyContent: isMe ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div style={{
                    maxWidth: '70%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start',
                  }}>
                    {!isMe && (
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        marginBottom: '4px',
                        marginLeft: '12px',
                      }}>
                        {msg.fromUserName}
                      </div>
                    )}

                    <div style={{
                      background: isInvite
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : isMe
                          ? '#667eea'
                          : '#f3f4f6',
                      color: (isInvite || isMe) ? 'white' : '#374151',
                      padding: '12px 16px',
                      borderRadius: '16px',
                      wordWrap: 'break-word',
                    }}>
                      {isInvite ? (
                        <div>
                          <p style={{ marginBottom: '8px' }}>{msg.message}</p>
                          <button
                            onClick={() => msg.partyCode && onJoinParty(msg.partyCode)}
                            style={{
                              padding: '8px 16px',
                              background: 'white',
                              color: '#667eea',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '14px',
                              width: '100%',
                            }}
                          >
                            Join {msg.partyCode}
                          </button>
                        </div>
                      ) : (
                        msg.message
                      )}
                    </div>

                    <div style={{
                      fontSize: '11px',
                      color: '#9ca3af',
                      marginTop: '4px',
                      marginLeft: isMe ? '0' : '12px',
                      marginRight: isMe ? '12px' : '0',
                    }}>
                      {formatTimestamp(msg.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Section */}
        <div style={{
          padding: '20px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          gap: '12px',
        }}>
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            style={{
              flex: 1,
              padding: '12px',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '16px',
              outline: 'none',
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />

          <button
            onClick={handleSend}
            disabled={!messageText.trim()}
            style={{
              padding: '12px 24px',
              background: messageText.trim() ? '#667eea' : '#e5e7eb',
              color: messageText.trim() ? 'white' : '#9ca3af',
              border: 'none',
              borderRadius: '8px',
              cursor: messageText.trim() ? 'pointer' : 'not-allowed',
              fontWeight: '600',
              fontSize: '16px',
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
