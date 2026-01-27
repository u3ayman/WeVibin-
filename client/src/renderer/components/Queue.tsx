import React from 'react';
import { Track } from '../types';
import { Music, Disc, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface QueueProps {
  queue: Track[];
  onRemove: (trackId: string) => void;
  onSkip: () => void;
  isHost: boolean;
  myUserId: string;
}

export function Queue({
  queue,
  onRemove,
  onSkip,
  isHost,
  myUserId,
}: QueueProps) {
  return (
    <div className="wv-queue">
      <div className="wv-queue__header">
        <h3>Up Next ({queue.length})</h3>
        {isHost && queue.length > 0 && (
          <button className="wv-btn wv-btn--ghost wv-btn--sm" onClick={onSkip}>
            Skip to Next
          </button>
        )}
      </div>

      {queue.length === 0 ? (
        <div className="wv-queue__empty">
          <Music size={40} />
          <p>Queue is empty. Add some tracks!</p>
        </div>
      ) : (
        <div className="wv-queue__list">
          {queue.map((track, index) => (
            <motion.div
              key={`${track.id} -${index} `}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="wv-queue__item"
            >
              <div className="wv-queue__item-art">
                {track.albumArt ? (
                  <img src={track.albumArt} alt={track.name} />
                ) : (
                  <Disc size={20} />
                )}
              </div>
              <div className="wv-queue__item-info">
                <span className="wv-queue__item-name">{track.name}</span>
                <span className="wv-queue__item-artist">{track.artists}</span>
              </div>
              <div className="wv-queue__item-meta">
                <span className="wv-queue__item-source">
                  {track.source === 'spotify' ? 'Spotify' : 'Local'}
                </span>
                {(isHost || track.addedBy.id === myUserId) && (
                  <button
                    className="wv-queue__item-remove"
                    onClick={() => onRemove(track.id)}
                    title="Remove from queue"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <style>{`
  .wv - queue {
  display: flex;
  flex - direction: column;
  gap: 16px;
  height: 100 %;
}
        
        .wv - queue__header {
  display: flex;
  align - items: center;
  justify - content: space - between;
}

        .wv - queue__header h3 {
  margin: 0;
  font - size: 16px;
  font - weight: 600;
  color: var(--wv - text);
}

        .wv - queue__empty {
  display: flex;
  flex - direction: column;
  align - items: center;
  justify - content: center;
  padding: 40px 20px;
  background: rgba(255, 255, 255, 0.03);
  border - radius: var(--wv - radius);
  color: var(--wv - muted);
  gap: 12px;
  text - align: center;
}

        .wv - queue__list {
  display: flex;
  flex - direction: column;
  gap: 8px;
  overflow - y: auto;
  padding - right: 4px;
}

        .wv - queue__item {
  display: flex;
  align - items: center;
  gap: 12px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.04);
  border - radius: 12px;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

        .wv - queue__item:hover {
  background: rgba(255, 255, 255, 0.07);
  border - color: rgba(255, 255, 255, 0.05);
}

        .wv - queue__item - art {
  width: 40px;
  height: 40px;
  border - radius: 6px;
  overflow: hidden;
  background: #111;
  display: flex;
  align - items: center;
  justify - content: center;
  flex - shrink: 0;
}

        .wv - queue__item - art img {
  width: 100 %;
  height: 100 %;
  object - fit: cover;
}

        .wv - queue__item - info {
  display: flex;
  flex - direction: column;
  min - width: 0;
  flex: 1;
}

        .wv - queue__item - name {
  font - size: 14px;
  font - weight: 600;
  color: var(--wv - text);
  white - space: nowrap;
  overflow: hidden;
  text - overflow: ellipsis;
}

        .wv - queue__item - artist {
  font - size: 12px;
  color: var(--wv - muted);
  white - space: nowrap;
  overflow: hidden;
  text - overflow: ellipsis;
}

        .wv - queue__item - meta {
  display: flex;
  align - items: center;
  gap: 8px;
}

        .wv - queue__item - source {
  font - size: 10px;
  text - transform: uppercase;
  letter - spacing: 0.5px;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.1);
  border - radius: 4px;
  color: var(--wv - muted);
}

        .wv - queue__item - remove {
  background: none;
  border: none;
  color: var(--wv - muted);
  cursor: pointer;
  padding: 4px;
  border - radius: 4px;
  display: flex;
  align - items: center;
  justify - content: center;
  transition: all 0.2s;
}

        .wv - queue__item - remove:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

        .wv - btn--sm {
  height: 32px;
  padding: 0 12px;
  font - size: 12px;
  border - radius: 8px;
}
`}</style>
    </div>
  );
}
