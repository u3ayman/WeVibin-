import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import { Socket } from 'socket.io';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    username: string;
  };
}

export const expressAuthMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }

  req.user = decoded as { userId: string; username: string };
  next();
};

export const socketAuthMiddleware = (
  socket: Socket,
  next: (err?: Error) => void,
) => {
  const token = socket.handshake.auth.token || socket.handshake.headers.token;

  if (!token) {
    return next(new Error('Authentication error: Token missing'));
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return next(new Error('Authentication error: Invalid token'));
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (socket as any).user = decoded;
  next();
};
