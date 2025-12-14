import React, { useState, useEffect } from 'react';
import { Home } from './components/Home';
import { Room } from './components/Room';
import { FriendsList } from './components/FriendsList';
import { ChatWindow } from './components/ChatWindow';
import { useRoom } from './hooks/useRoom';
import { usePTT } from './hooks/usePTT';
import { useFriends } from './hooks/useFriends';
import { Friend } from './types';
import { initializeWebRTC } from './services/webrtc';
import { socketService } from './services/socket';

type View = 'home' | 'room' | 'friends';

export function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [userName, setUserName] = useState('');

  const {
    roomState,
    isConnected,
    error: roomError,
    isHost,
    speakingUsers,
    createRoom,
    joinRoom,
    leaveRoom,
    syncAudio,
    updateAudioState,
    kickUser,
  } = useRoom();

  const {
    isTransmitting,
    isMuted,
    toggleMute,
    startTransmitting,
    stopTransmitting,
  } = usePTT(roomState?.code || null);

  const {
    friends,
    myFriendCode,
    myUserName,
    createSession,
    addFriend,
    sendMessage,
    getChatHistory,
    getMessagesWithFriend,
    updateStatus,
    isSessionCreated,
  } = useFriends();

  // Initialize WebRTC on mount
  useEffect(() => {
    initializeWebRTC();
  }, []);

  // Update friend status when joining/leaving rooms
  useEffect(() => {
    if (roomState && isSessionCreated) {
      updateStatus('in-party', roomState.code);
    } else if (!roomState && isSessionCreated) {
      updateStatus('online');
    }
  }, [roomState, isSessionCreated, updateStatus]);

  const handleCreateRoom = async (name: string) => {
    try {
      setUserName(name);
      
      // Create friend session if not already created
      if (!isSessionCreated) {
        await createSession(name);
      }

      await createRoom(name);
      // View will switch automatically when roomState updates
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  };

  const handleJoinRoom = async (code: string, name: string) => {
    try {
      setUserName(name);
      
      // Create friend session if not already created
      if (!isSessionCreated) {
        await createSession(name);
      }

      await joinRoom(code, name);
      // View will switch automatically when roomState updates
    } catch (error) {
      console.error('Failed to join room:', error);
    }
  };

  // Automatically switch to room view when roomState is set
  useEffect(() => {
    if (roomState && currentView === 'home') {
      setCurrentView('room');
    }
  }, [roomState, currentView]);

  const handleLeaveRoom = () => {
    leaveRoom();
    setCurrentView('home');
  };

  const handleOpenChat = async (friend: Friend) => {
    setSelectedFriend(friend);
    await getChatHistory(friend.id);
  };

  const handleCloseChat = () => {
    setSelectedFriend(null);
  };

  const handleSendMessage = async (message: string) => {
    if (selectedFriend) {
      await sendMessage(selectedFriend.id, message, 'text');
    }
  };

  const handleSendInvite = async (roomCode: string) => {
    if (selectedFriend) {
      await sendMessage(
        selectedFriend.id,
        `Join my party! Room code: ${roomCode}`,
        'party-invite',
        roomCode
      );
    }
  };

  const handleJoinParty = async (roomCode: string) => {
    if (roomState) {
      leaveRoom();
    }
    
    await joinRoom(roomCode, userName || myUserName);
    setCurrentView('room');
    handleCloseChat();
  };

  const handleNavigateToFriends = async () => {
    if (!isSessionCreated) {
      // Prompt for username if not set
      const name = prompt('Enter your name to access friends:');
      if (!name) return;
      
      setUserName(name);
      await createSession(name);
    }
    
    setCurrentView('friends');
  };

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Navigation Bar (hidden in room) */}
      {currentView !== 'room' && (
        <nav style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '16px 32px',
          display: 'flex',
          gap: '16px',
          zIndex: 100,
        }}>
          <button
            onClick={() => setCurrentView('home')}
            style={{
              padding: '10px 20px',
              background: currentView === 'home' ? '#667eea' : 'transparent',
              color: currentView === 'home' ? 'white' : '#374151',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '16px',
            }}
          >
            🏠 Home
          </button>
          <button
            onClick={handleNavigateToFriends}
            style={{
              padding: '10px 20px',
              background: currentView === 'friends' ? '#667eea' : 'transparent',
              color: currentView === 'friends' ? 'white' : '#374151',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '16px',
            }}
          >
            👥 Friends
          </button>
        </nav>
      )}

      {/* Main Content */}
      <div style={{ paddingTop: currentView !== 'room' ? '72px' : '0' }}>
        {currentView === 'home' && (
          <Home
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            error={roomError}
          />
        )}

        {currentView === 'room' && roomState && (
          <Room
            roomState={roomState}
            isHost={isHost}
            speakingUsers={speakingUsers}
            isTransmitting={isTransmitting}
            isMuted={isMuted}
            onLeave={handleLeaveRoom}
            onKickUser={kickUser}
            onAudioStateChanged={updateAudioState}
            onSyncAudio={syncAudio}
            onToggleMute={toggleMute}
            onStartTransmitting={startTransmitting}
            onStopTransmitting={stopTransmitting}
            mySocketId={socketService.id}
          />
        )}

        {currentView === 'friends' && (
          <FriendsList
            friends={friends}
            myFriendCode={myFriendCode}
            onAddFriend={addFriend}
            onOpenChat={handleOpenChat}
          />
        )}
      </div>

      {/* Chat Window Modal */}
      {selectedFriend && (
        <ChatWindow
          friend={selectedFriend}
          messages={getMessagesWithFriend(selectedFriend.id)}
          myUserId={socketService.id || ''}
          currentRoomCode={roomState?.code}
          onSendMessage={handleSendMessage}
          onSendInvite={handleSendInvite}
          onJoinParty={handleJoinParty}
          onClose={handleCloseChat}
        />
      )}
    </div>
  );
}
