import { useState } from 'react';
import { Send, Music, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: string;
  sender: 'me' | 'friend';
  text: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  friendName: string;
  messages: Message[];
  onSendMessage: (message: string) => void;
  onClose: () => void;
  isWaitingForJam?: boolean;
  onStartJam?: () => void;
  onCancelJam?: () => void;
}

export function ChatInterface({
  friendName,
  messages,
  onSendMessage,
  onClose,
  isWaitingForJam,
  onStartJam,
  onCancelJam,
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <span>{friendName[0]}</span>
          </div>
          <div>
            <h3>{friendName}</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-online shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
              <span className="text-sm text-muted-foreground">Online</span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Jam Waiting Banner */}
      <AnimatePresence>
        {isWaitingForJam && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gradient-to-r from-primary/20 to-secondary/20 border-b border-primary/30 overflow-hidden"
          >
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                  <Music className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span>Waiting for {friendName} to join the party...</span>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Party will start automatically when they come online
                  </div>
                </div>
              </div>
              <button
                onClick={onCancelJam}
                className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
              >
                Cancel Jam
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                message.sender === 'me'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-card border border-border rounded-bl-sm'
              }`}
            >
              <p>{message.text}</p>
              <div
                className={`text-xs mt-1 ${
                  message.sender === 'me' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                }`}
              >
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Message ${friendName}...`}
            className="flex-1 px-4 py-3 bg-input border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(168,85,247,0.4)]"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

        {!isWaitingForJam && onStartJam && (
          <button
            onClick={onStartJam}
            className="w-full mt-3 px-4 py-3 bg-secondary hover:bg-secondary/90 text-secondary-foreground rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.4)]"
          >
            <Music className="w-5 h-5" />
            <span>Start Party & Wait</span>
          </button>
        )}
      </div>
    </div>
  );
}
