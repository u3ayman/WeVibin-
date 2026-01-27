/* eslint-disable @typescript-eslint/no-explicit-any */
import io, { Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  connect(token?: string) {
    if (this.socket?.connected) return;

    // Production server IP
    // Prioritize VITE_SERVER_URL for Vercel/Web deployments
    const SERVER_URL =
      import.meta.env.VITE_SERVER_URL || 'http://41.38.46.220:3001';
    console.log('Socket connecting to:', SERVER_URL);

    this.socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
      auth: { token },
    });

    this.socket.on('connect', () => {
      console.log('Connected to server as', this.socket?.id);
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event: string, data?: any, callback?: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.emit(event, data, callback);
    }
  }

  get id(): string | undefined {
    return this.socket?.id;
  }

  get connected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
