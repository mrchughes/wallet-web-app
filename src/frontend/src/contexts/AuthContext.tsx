import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as authService from '../services/authService';

interface User {
    webid: string;
    token: string;
    expiresAt: number;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    login: (username: string, password: string) => Promise<boolean>;
    logout: () => void;
    refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing session on app load
        checkExistingSession();
    }, []);

    useEffect(() => {
        // Set up token refresh timer
        if (user && user.expiresAt) {
            const timeUntilExpiry = user.expiresAt - Date.now();
            const refreshTime = Math.max(timeUntilExpiry - 300000, 60000); // 5 minutes before expiry, min 1 minute

            const timer = setTimeout(() => {
                refreshToken();
            }, refreshTime);

            return () => clearTimeout(timer);
        }
    }, [user]);

    const checkExistingSession = async () => {
        try {
            const session = await authService.checkSession();
            if (session.success && session.webid) {
                setUser({
                    webid: session.webid,
                    token: session.token || '',
                    expiresAt: session.expiresAt || Date.now() + 3600000
                });
            }
        } catch (error) {
            console.error('Session check failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (username: string, password: string): Promise<boolean> => {
        try {
            setLoading(true);
            const result = await authService.login(username, password);

            if (result.success && result.webid && result.token) {
                const expiresAt = Date.now() + (result.expiresIn || 3600) * 1000;
                setUser({
                    webid: result.webid,
                    token: result.token,
                    expiresAt
                });
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login failed:', error);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setUser(null);
        }
    };

    const refreshToken = async (): Promise<boolean> => {
        try {
            const result = await authService.refreshToken();
            if (result.success && result.token) {
                setUser(prev => prev ? {
                    ...prev,
                    token: result.token!,
                    expiresAt: Date.now() + (result.expiresIn || 3600) * 1000
                } : null);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Token refresh failed:', error);
            logout();
            return false;
        }
    };

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        refreshToken
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
