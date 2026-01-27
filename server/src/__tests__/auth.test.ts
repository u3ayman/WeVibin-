import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
} from '../utils/auth';

describe('Auth Utilities', () => {
  it('should hash and compare passwords correctly', async () => {
    const password = 'securePassword123';
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);

    const isValid = await comparePassword(password, hash);
    expect(isValid).toBe(true);

    const isInvalid = await comparePassword('wrongPassword', hash);
    expect(isInvalid).toBe(false);
  });

  it('should generate and verify JWT tokens', () => {
    const userId = 'user-123';
    const username = 'testuser';

    const token = generateToken(userId, username);
    expect(typeof token).toBe('string');

    const decoded = verifyToken(token);
    expect(decoded).toBeDefined();
    expect(decoded.userId).toBe(userId);
    expect(decoded.username).toBe(username);
  });

  it('should return null for invalid tokens', () => {
    const decoded = verifyToken('invalid-token');
    expect(decoded).toBeNull();
  });
});
