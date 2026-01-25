import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { UserPlus, LogIn, Music } from 'lucide-react';

interface RegisterProps {
    onSwitchToLogin: () => void;
}

export function Register({ onSwitchToLogin }: RegisterProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register } = useAuth();
    const toast = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password || !username) {
            toast.error('Please fill in all fields');
            return;
        }

        if (password.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await register(email, password, username);
            if (!result.success) {
                toast.error(result.error || 'Registration failed');
            } else {
                toast.success('Welcome to WeVibin!');
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
                <h1>Join WeVibin'</h1>
                <p>Start listening with friends.</p>
            </div>

            <form onSubmit={handleSubmit} className="wv-auth-form">
                <div className="wv-input-group">
                    <label htmlFor="reg-username">Username</label>
                    <input
                        id="reg-username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="CoolDJ"
                        autoComplete="username"
                        required
                        minLength={3}
                    />
                </div>

                <div className="wv-input-group">
                    <label htmlFor="reg-email">Email</label>
                    <input
                        id="reg-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        autoComplete="email"
                        required
                    />
                </div>

                <div className="wv-input-group">
                    <label htmlFor="reg-password">Password</label>
                    <input
                        id="reg-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        required
                        minLength={8}
                    />
                </div>

                <button
                    type="submit"
                    className="wv-btn wv-btn--primary wv-auth-btn"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Creating account...' : (
                        <>
                            <UserPlus size={18} />
                            Register
                        </>
                    )}
                </button>
            </form>

            <div className="wv-auth-footer">
                <span>Already have an account?</span>
                <button
                    onClick={onSwitchToLogin}
                    className="wv-link-btn"
                    type="button"
                >
                    <LogIn size={16} />
                    Sign in here
                </button>
            </div>
        </div>
    );
}
