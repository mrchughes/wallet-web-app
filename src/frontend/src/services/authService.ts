import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || '/api';

interface LoginResponse {
    success: boolean;
    webid?: string;
    token?: string;
    expiresIn?: number;
    error?: string;
}

interface SessionResponse {
    success: boolean;
    webid?: string;
    token?: string;
    expiresAt?: number;
    error?: string;
}

interface RefreshResponse {
    success: boolean;
    token?: string;
    expiresIn?: number;
    error?: string;
}

// Configure axios defaults
axios.defaults.withCredentials = true;

export const login = async (username: string, password: string): Promise<LoginResponse> => {
    try {
        const response = await axios.post(`${API_BASE}/auth/login`, {
            username,
            password
        });

        return response.data;
    } catch (error: any) {
        console.error('Login error:', error);
        return {
            success: false,
            error: error.response?.data?.error || 'Login failed'
        };
    }
};

export const logout = async (): Promise<void> => {
    try {
        await axios.post(`${API_BASE}/auth/logout`);
    } catch (error) {
        console.error('Logout error:', error);
    }
};

export const checkSession = async (): Promise<SessionResponse> => {
    try {
        const response = await axios.get(`${API_BASE}/auth/session`);
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            error: error.response?.data?.error || 'Session check failed'
        };
    }
};

export const refreshToken = async (): Promise<RefreshResponse> => {
    try {
        const response = await axios.post(`${API_BASE}/auth/refresh`);
        return response.data;
    } catch (error: any) {
        return {
            success: false,
            error: error.response?.data?.error || 'Token refresh failed'
        };
    }
};
