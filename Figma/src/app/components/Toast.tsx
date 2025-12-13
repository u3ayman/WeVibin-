import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Music, Users, Mic } from 'lucide-react';

export interface ToastData {
  id: string;
  type: 'jam-joined' | 'sync' | 'ptt';
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastData | null;
  onClose: () => void;
}

export function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onClose();
      }, toast.duration || 3000);

      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  const getIcon = () => {
    switch (toast?.type) {
      case 'jam-joined':
        return <Users className="w-5 h-5" />;
      case 'sync':
        return <Music className="w-5 h-5" />;
      case 'ptt':
        return <Mic className="w-5 h-5" />;
      default:
        return <Music className="w-5 h-5" />;
    }
  };

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -20, x: '-50%' }}
          className="fixed top-6 left-1/2 z-50 min-w-[320px]"
        >
          <div className="bg-card border border-border rounded-xl p-4 shadow-[0_0_30px_rgba(168,85,247,0.3)] flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              {getIcon()}
            </div>
            <div className="flex-1">
              <p>{toast.message}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-muted rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
