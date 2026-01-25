import React, { useState, useEffect } from 'react';
import { Home as HomeIcon, Users as UsersIcon, Settings as SettingsIcon, LogOut as LogOutIcon, Music } from 'lucide-react';
import { Home } from './components/Home';
import { Room } from './components/Room';
import { FriendsList } from './components/FriendsList';
import { ChatWindow } from './components/ChatWindow';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { SpotifyCallback } from './components/SpotifyCallback';
import { Toast, useToast } from './components/Toast';
import { useRoom } from './hooks/useRoom';
import { usePTT } from './hooks/usePTT';
import { useFriends } from './hooks/useFriends';
import { Friend } from './types';
import { voiceService } from './services/voice';
import { socketService } from './services/socket';
import { useAuth } from './context/AuthContext';

type View = 'home' | 'room' | 'friends' | 'settings' | 'login' | 'register';

export function App() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [isCompact, setIsCompact] = useState(() => window.innerWidth <= 720);
  const toast = useToast();

  const {
    roomState,
    error: roomError,
    isHost,
    speakingUsers,
    createRoom,
    joinRoom,
    leaveRoom,
    syncAudio,
    updateAudioState,
    addToQueue,
    removeFromQueue,
    nextTrack,
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
    addFriend,
    sendMessage,
    getChatHistory,
    getMessagesWithFriend,
    updateStatus,
  } = useFriends();

  // Initialize Voice Service on mount
  useEffect(() => {
    // Attempt Initial permission request/setup
    // But usually we wait for user setting or first interaction.
    // However, voiceService needs an audio context to be created.
    // It's safe to init the service listeners, but maybe not the context until interaction.
    // The constructor already set up listeners.
    // We can call initialize to check permissions if we want, or do it lazy.
    // Let's do it lazy when joining a room or opening settings.
    // But for now, let's keep it simple and just ensure listeners are active (constructor).
  }, []);

  // Responsive breakpoint
  useEffect(() => {
    const handleResize = () => setIsCompact(window.innerWidth <= 720);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update friend status when joining/leaving rooms
  useEffect(() => {
    if (roomState && isAuthenticated) {
      updateStatus('in-party', roomState.code);
    } else if (!roomState && isAuthenticated) {
      updateStatus('online');
    }
  }, [roomState, isAuthenticated, updateStatus]);

  // Automatically switch to room view when roomState is set
  useEffect(() => {
    if (roomState && (currentView === 'home' || currentView === 'friends')) {
      setCurrentView('room');
    }
  }, [roomState, currentView]);

  // Handle Spotify callback
  if (window.location.pathname === '/callback') {
    return <SpotifyCallback />;
  }

  if (isLoading) {
    return (
      <div className="wv-loading-screen">
        <Music size={64} className="wv-pulse" />
        <h2>Vibing...</h2>
      </div>
    );
  }

  if (!isAuthenticated && currentView !== 'register') {
    return (
      <div className="wv-auth-shell">
        <Login onSwitchToRegister={() => setCurrentView('register')} />
        <Toast toasts={toast.toasts} onDismiss={toast.dismissToast} />
      </div>
    );
  }

  if (!isAuthenticated && currentView === 'register') {
    return (
      <div className="wv-auth-shell">
        <Register onSwitchToLogin={() => setCurrentView('home')} />
        <Toast toasts={toast.toasts} onDismiss={toast.dismissToast} />
      </div>
    );
  }

  const handleCreateRoom = async (name: string) => {
    try {
      await createRoom(name);
      toast.success('Room created!');
    } catch (error) {
      console.error('Failed to create room:', error);
      toast.error('Failed to create room');
    }
  };

  const handleJoinRoom = async (code: string, name: string) => {
    try {
      await joinRoom(code, name);
      toast.success('Joined room!');
    } catch (error) {
      console.error('Failed to join room:', error);
      toast.error('Failed to join room');
    }
  };

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

    await joinRoom(roomCode, user?.username || 'Guest');
    setCurrentView('room');
    handleCloseChat();
  };

  return (
    <div className="wv-app">
      {/* Topbar (hidden in room) */}
      {currentView !== 'room' && (
        <header className="wv-topbar">
          <div className="wv-brand">
            <span className="wv-brand__dot" />
            <span className="wv-brand__name">WeVibin'</span>
          </div>

          {!isCompact && (
            <nav className="wv-nav" aria-label="Primary">
              <button
                className={`wv-navBtn ${currentView === 'home' ? 'wv-navBtn--active' : ''}`}
                onClick={() => setCurrentView('home')}
                type="button"
              >
                <HomeIcon size={18} />
                Home
              </button>
              <button
                className={`wv-navBtn ${currentView === 'friends' ? 'wv-navBtn--active' : ''}`}
                onClick={() => setCurrentView('friends')}
                type="button"
              >
                <UsersIcon size={18} />
                Friends
              </button>
              <button
                className={`wv-navBtn ${currentView === 'settings' ? 'wv-navBtn--active' : ''}`}
                onClick={() => setCurrentView('settings')}
                type="button"
              >
                <SettingsIcon size={18} />
                Settings
              </button>
              <button
                className="wv-navBtn wv-navBtn--logout"
                onClick={logout}
                type="button"
              >
                <LogOutIcon size={18} />
                Logout
              </button>
            </nav>
          )}
        </header>
      )}

      {/* Bottom nav for compact widths */}
      {currentView !== 'room' && isCompact && (
        <nav className="wv-bottomNav" aria-label="Bottom Navigation">
          <button
            className={`wv-navBtn ${currentView === 'home' ? 'wv-navBtn--active' : ''}`}
            onClick={() => setCurrentView('home')}
            type="button"
            aria-label="Home"
          >
            <HomeIcon size={18} />
          </button>
          <button
            className={`wv-navBtn ${currentView === 'friends' ? 'wv-navBtn--active' : ''}`}
            onClick={() => setCurrentView('friends')}
            type="button"
            aria-label="Friends"
          >
            <UsersIcon size={18} />
          </button>
          <button
            className={`wv-navBtn ${currentView === 'settings' ? 'wv-navBtn--active' : ''}`}
            onClick={() => setCurrentView('settings')}
            type="button"
            aria-label="Settings"
          >
            <SettingsIcon size={18} />
          </button>
          <button
            className="wv-navBtn"
            onClick={logout}
            type="button"
            aria-label="Logout"
          >
            <LogOutIcon size={18} />
          </button>
        </nav>
      )}

      {/* Main Content */}
      <div className={currentView !== 'room' ? 'wv-shell' : undefined}>
        {currentView === 'home' && (
          <Home
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            error={roomError}
            defaultName={user?.username}
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
            onAddToQueue={addToQueue}
            onRemoveFromQueue={removeFromQueue}
            onNextTrack={nextTrack}
            onToggleMute={toggleMute}
            onStartTransmitting={startTransmitting}
            onStopTransmitting={stopTransmitting}
            mySocketId={user?.id || socketService.id || 'anonymous'}
            toast={toast}
          />
        )}

        {currentView === 'friends' && (
          <FriendsList
            friends={friends}
            myFriendCode={myFriendCode}
            onAddFriend={addFriend}
            onOpenChat={handleOpenChat}
            toast={toast}
          />
        )}

        {currentView === 'settings' && (
          <Settings />
        )}
      </div>

      {/* Chat Window Modal */}
      {selectedFriend && (
        <ChatWindow
          friend={selectedFriend}
          messages={getMessagesWithFriend(selectedFriend.id)}
          myUserId={user?.id || ''}
          currentRoomCode={roomState?.code}
          onSendMessage={handleSendMessage}
          onSendInvite={handleSendInvite}
          onJoinParty={handleJoinParty}
          onClose={handleCloseChat}
        />
      )}

      {/* Toast Notifications */}
      <Toast toasts={toast.toasts} onDismiss={toast.dismissToast} />
    </div>
  );
}
