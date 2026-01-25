import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, User } from '../services/auth';
import { socketService } from '../services/socket';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (email: string, password: string, username: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(authService.getToken());
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const storedToken = authService.getToken();
            if (storedToken) {
                // In a real app, we might want a 'validate-token' endpoint
                // For now, we'll try to connect the socket with the token
                socketService.connect(storedToken);

                // Wait for user data (server emits 'init-data' once authenticated)
                socketService.on('init-data', (data: any) => {
                    setUser(data.user);
                    setIsLoading(false);
                });

                // Set a timeout in case init-data never comes
                setTimeout(() => {
                    if (isLoading) setIsLoading(false);
                }, 3000);
            } else {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = async (email: string, password: string) => {
        const result = await authService.login(email, password);
        if (result.success && result.token && result.user) {
            authService.setToken(result.token);
            setToken(result.token);
            setUser(result.user);
            socketService.connect(result.token);
            return { success: true };
        }
        return { success: false, error: result.error };
    };

    const register = async (email: string, password: string, username: string) => {
        const result = await authService.register(email, password, username);
        if (result.success && result.token && result.user) {
            authService.setToken(result.token);
            setToken(result.token);
            setUser(result.user);
            socketService.connect(result.token);
            return { success: true };
        }
        return { success: false, error: result.error };
    };

    const logout = () => {
        authService.logout();
        setToken(null);
        setUser(null);
        socketService.disconnect();
    };

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated: !!token && !!user, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
