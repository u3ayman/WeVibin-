import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { HomeScreen } from './components/HomeScreen';
import { FriendsDashboard } from './components/FriendsDashboard';
import { ActiveParties } from './components/ActiveParties';
import { ChatInterface } from './components/ChatInterface';
import { PartyRoom } from './components/PartyRoom';
import { Settings } from './components/Settings';
import { Toast, ToastData } from './components/Toast';
import { Friend } from './components/FriendCard';

type Screen = 'home' | 'friends' | 'parties' | 'settings';
type View = 'dashboard' | 'chat' | 'party';

interface Message {
  id: string;
  sender: 'me' | 'friend';
  text: string;
  timestamp: Date;
}

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('home');
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [isWaitingForJam, setIsWaitingForJam] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [isInParty, setIsInParty] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Mock data
  const [friends] = useState<Friend[]>([
    {
      id: '1',
      name: 'Alex Chen',
      avatar: 'AC',
      status: 'in-party',
      partyInfo: {
        currentTrack: 'Midnight City',
        artist: 'M83',
      },
    },
    {
      id: '2',
      name: 'Jordan Taylor',
      avatar: 'JT',
      status: 'online',
    },
    {
      id: '3',
      name: 'Sam Rivera',
      avatar: 'SR',
      status: 'online',
    },
    {
      id: '4',
      name: 'Casey Morgan',
      avatar: 'CM',
      status: 'offline',
    },
    {
      id: '5',
      name: 'Riley Park',
      avatar: 'RP',
      status: 'in-party',
      partyInfo: {
        currentTrack: 'Blinding Lights',
        artist: 'The Weeknd',
      },
    },
    {
      id: '6',
      name: 'Morgan Lee',
      avatar: 'ML',
      status: 'offline',
    },
  ]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'friend',
      text: 'Hey! What are you listening to?',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
    },
    {
      id: '2',
      sender: 'me',
      text: 'Just found this amazing playlist! Want to jam together?',
      timestamp: new Date(Date.now() - 1000 * 60 * 3),
    },
  ]);

  const [participants] = useState([
    { id: '1', name: 'You', isHost: true, isSpeaking: false },
    { id: '2', name: 'Alex Chen', isHost: false, isSpeaking: isSpeaking },
  ]);

  const [currentTrack] = useState({
    title: 'Midnight City',
    artist: 'M83',
    album: 'Hurry Up, We\'re Dreaming',
    duration: 244,
    currentTime: currentTime,
  });

  // Simulate track progress
  useEffect(() => {
    if (isInParty && isPlaying) {
      const interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= 244) return 0;
          return prev + 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isInParty, isPlaying]);

  const showToast = (type: ToastData['type'], message: string, duration?: number) => {
    setToast({
      id: Date.now().toString(),
      type,
      message,
      duration,
    });
  };

  const handleStartJam = (friendId: string) => {
    const friend = friends.find((f) => f.id === friendId);
    if (!friend) return;

    setSelectedFriendId(friendId);
    setCurrentView('chat');
    setIsWaitingForJam(true);
    showToast('jam-joined', `Waiting for ${friend.name} to join...`, 3000);

    // Simulate friend joining after 5 seconds
    setTimeout(() => {
      setIsWaitingForJam(false);
      setIsInParty(true);
      setCurrentView('party');
      showToast('jam-joined', `${friend.name} joined your party!`);
      showToast('sync', 'You are now in sync', 3000);
    }, 5000);
  };

  const handleMessage = (friendId: string) => {
    setSelectedFriendId(friendId);
    setCurrentView('chat');
  };

  const handleJoinParty = (friendId: string) => {
    const friend = friends.find((f) => f.id === friendId);
    if (!friend) return;

    setSelectedFriendId(friendId);
    setIsInParty(true);
    setCurrentView('party');
    showToast('jam-joined', `You joined ${friend.name}'s party!`);
    
    setTimeout(() => {
      showToast('sync', 'You are now in sync', 3000);
    }, 1000);
  };

  const handleSendMessage = (message: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: 'me',
      text: message,
      timestamp: new Date(),
    };
    setMessages([...messages, newMessage]);
  };

  const handleCloseChat = () => {
    if (isInParty) {
      setCurrentView('party');
    } else {
      setCurrentView('dashboard');
      setSelectedFriendId(null);
      setIsWaitingForJam(false);
    }
  };

  const handleStartJamFromChat = () => {
    setIsWaitingForJam(true);
    const friend = friends.find((f) => f.id === selectedFriendId);
    if (friend) {
      showToast('jam-joined', `Waiting for ${friend.name} to join...`, 3000);
    }
  };

  const handleCancelJam = () => {
    setIsWaitingForJam(false);
    showToast('jam-joined', 'Jam cancelled', 2000);
  };

  const handlePTTPress = () => {
    setIsSpeaking(true);
    showToast('ptt', 'Push-to-talk active', 1000);
  };

  const handlePTTRelease = () => {
    setIsSpeaking(false);
  };

  const selectedFriend = friends.find((f) => f.id === selectedFriendId);
  const onlineFriendsCount = friends.filter(f => f.status === 'online' || f.status === 'in-party').length;

  // Mock parties data
  const parties = [
    {
      id: 'party-1',
      hostName: 'Alex Chen',
      currentTrack: 'Midnight City',
      artist: 'M83',
      participantCount: 2,
      isJoinable: true,
    },
    {
      id: 'party-2',
      hostName: 'Riley Park',
      currentTrack: 'Blinding Lights',
      artist: 'The Weeknd',
      participantCount: 3,
      isJoinable: true,
    },
  ];

  return (
    <div className="h-screen w-screen overflow-hidden flex dark">
      <Sidebar
        activeScreen={activeScreen}
        onNavigate={(screen) => {
          setActiveScreen(screen as Screen);
          if (screen === 'friends' && !isInParty) {
            setCurrentView('dashboard');
          } else if (screen === 'home') {
            setCurrentView('dashboard');
          }
        }}
        activePartyCount={isInParty ? 1 : 0}
      />

      <main className="flex-1 overflow-hidden">
        {activeScreen === 'home' && currentView === 'dashboard' && (
          <HomeScreen
            onNavigate={(screen) => setActiveScreen(screen as Screen)}
            onlineFriendsCount={onlineFriendsCount}
            activePartiesCount={isInParty ? 1 : 0}
          />
        )}

        {activeScreen === 'friends' && currentView === 'dashboard' && (
          <FriendsDashboard
            friends={friends}
            onStartJam={handleStartJam}
            onMessage={handleMessage}
            onJoinParty={handleJoinParty}
          />
        )}

        {activeScreen === 'parties' && currentView === 'dashboard' && (
          <ActiveParties
            parties={parties}
            onJoinParty={handleJoinParty}
            currentPartyId={isInParty ? 'party-1' : undefined}
          />
        )}

        {activeScreen === 'settings' && (
          <Settings />
        )}

        {currentView === 'chat' && selectedFriend && (
          <ChatInterface
            friendName={selectedFriend.name}
            messages={messages}
            onSendMessage={handleSendMessage}
            onClose={handleCloseChat}
            isWaitingForJam={isWaitingForJam}
            onStartJam={handleStartJamFromChat}
            onCancelJam={handleCancelJam}
          />
        )}

        {currentView === 'party' && (
          <PartyRoom
            partyCode="VIBE-2024"
            participants={participants}
            currentTrack={{ ...currentTrack, currentTime }}
            isPlaying={isPlaying}
            isHost={true}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onSkipForward={() => {
              setCurrentTime(0);
              showToast('sync', 'Skipped to next track', 2000);
            }}
            onSkipBack={() => {
              setCurrentTime(0);
              showToast('sync', 'Back to previous track', 2000);
            }}
            onPTTPress={handlePTTPress}
            onPTTRelease={handlePTTRelease}
          />
        )}
      </main>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}