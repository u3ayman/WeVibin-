import axios from 'axios';

const API_URL = 'http://localhost:3001/api/auth';

export interface User {
    id: string;
    username: string;
    friendCode: string;
}

export interface AuthResponse {
    success: boolean;
    token?: string;
    user?: User;
    error?: string;
}

export const authService = {
    async register(email: string, password: string, username: string): Promise<AuthResponse> {
        try {
            const response = await axios.post(`${API_URL}/register`, {
                email,
                password,
                username,
            });
            return response.data;
        } catch (error: any) {
            return error.response?.data || { success: false, error: 'Registration failed' };
        }
    },

    async login(email: string, password: string): Promise<AuthResponse> {
        try {
            const response = await axios.post(`${API_URL}/login`, {
                email,
                password,
            });
            return response.data;
        } catch (error: any) {
            return error.response?.data || { success: false, error: 'Login failed' };
        }
    },

    setToken(token: string) {
        localStorage.setItem('wv_token', token);
    },

    getToken(): string | null {
        return localStorage.getItem('wv_token');
    },

    logout() {
        localStorage.removeItem('wv_token');
    },
};
