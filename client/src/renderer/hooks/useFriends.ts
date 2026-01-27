import { useState, useEffect, useCallback } from 'react';
import { socketService } from '../services/socket';
import { Friend, ChatMessage } from '../types';

export function useFriends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [myFriendCode, setMyFriendCode] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<Map<string, ChatMessage[]>>(
    new Map(),
  );

  const addFriend = useCallback(
    (friendCode: string): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        socketService.emit('add-friend', { friendCode }, (response: any) => {
          if (response.success && response.friend) {
            setFriends((prev) => {
              if (prev.some((f) => f.id === response.friend.id)) return prev;
              return [...prev, response.friend];
            });
          }
          resolve(response);
        });
      });
    },
    [],
  );

  const sendMessage = useCallback(
    (
      toUserId: string,
      message: string,
      type: 'text' | 'party-invite' = 'text',
      partyCode?: string,
    ): Promise<void> => {
      return new Promise((resolve, reject) => {
        socketService.emit(
          'send-message',
          { toUserId, message, type, partyCode },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (response: any) => {
            if (response.success) {
              setChatMessages((prev) => {
                const messages = prev.get(toUserId) || [];
                const newMessages = new Map(prev);
                newMessages.set(toUserId, [...messages, response.message]);
                return newMessages;
              });
              resolve();
            } else {
              reject(new Error(response.error || 'Failed to send message'));
            }
          },
        );
      });
    },
    [],
  );

  const getChatHistory = useCallback((friendId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socketService.emit('get-chat-history', { friendId }, (response: any) => {
        if (response.success) {
          setChatMessages((prev) => {
            const newMessages = new Map(prev);
            newMessages.set(friendId, response.messages);
            return newMessages;
          });
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to get chat history'));
        }
      });
    });
  }, []);

  const getMessagesWithFriend = useCallback(
    (friendId: string): ChatMessage[] => {
      return chatMessages.get(friendId) || [];
    },
    [chatMessages],
  );

  const updateStatus = useCallback(
    (status: 'online' | 'offline' | 'in-party', roomCode?: string) => {
      socketService.emit('update-status', { status, roomCode });
    },
    [],
  );

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleInitData = (data: { user: any; friends: Friend[] }) => {
      setMyFriendCode(data.user.friendCode);
      setFriends(data.friends || []);
    };

    const handleFriendAdded = (data: { friend: Friend }) => {
      setFriends((prev) => {
        if (prev.some((f) => f.id === data.friend.id)) return prev;
        return [...prev, data.friend];
      });
    };

    const handleFriendStatusUpdate = (data: {
      friendId: string;
      status: Friend['status'];
      roomCode?: string;
    }) => {
      setFriends((prev) =>
        prev.map((friend) =>
          friend.id === data.friendId
            ? { ...friend, status: data.status, currentRoomCode: data.roomCode }
            : friend,
        ),
      );
    };

    const handleMessageReceived = (message: ChatMessage) => {
      setChatMessages((prev) => {
        const friendId = message.fromUserId;
        const messages = prev.get(friendId) || [];
        const newMessages = new Map(prev);
        newMessages.set(friendId, [...messages, message]);
        return newMessages;
      });
    };

    socketService.on('init-data', handleInitData);
    socketService.on('friend-added', handleFriendAdded);
    socketService.on('friend-status-update', handleFriendStatusUpdate);
    socketService.on('message-received', handleMessageReceived);

    return () => {
      socketService.off('init-data', handleInitData);
      socketService.off('friend-added', handleFriendAdded);
      socketService.off('friend-status-update', handleFriendStatusUpdate);
      socketService.off('message-received', handleMessageReceived);
    };
  }, []);

  return {
    friends,
    myFriendCode,
    addFriend,
    sendMessage,
    getChatHistory,
    getMessagesWithFriend,
    updateStatus,
  };
}
