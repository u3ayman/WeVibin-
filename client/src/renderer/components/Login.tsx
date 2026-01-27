import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { LogIn, UserPlus, Music } from 'lucide-react';

interface LoginProps {
  onSwitchToRegister: () => void;
}

export function Login({ onSwitchToRegister }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(email, password);
      if (!result.success) {
        toast.error(result.error || 'Login failed');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="wv-auth-card">
      <div className="wv-auth-logo">
        <Music size={48} className="wv-pulse" />
        <h1>WeVibin&apos;</h1>
        <p>Vibe together, wherever you are.</p>
      </div>

      <form onSubmit={handleSubmit} className="wv-auth-form">
        <div className="wv-input-group">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            autoComplete="email"
            required
          />
        </div>

        <div className="wv-input-group">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
        </div>

        <button
          type="submit"
          className="wv-btn wv-btn--primary wv-auth-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            'Signing in...'
          ) : (
            <>
              <LogIn size={18} />
              Sign In
            </>
          )}
        </button>
      </form>

      <div className="wv-auth-footer">
        <span>Don&apos;t have an account?</span>
        <button
          onClick={onSwitchToRegister}
          className="wv-link-btn"
          type="button"
        >
          <UserPlus size={16} />
          Create one now
        </button>
      </div>
    </div>
  );
}
