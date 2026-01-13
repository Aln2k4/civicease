import { createContext, useState, useEffect, type ReactNode } from 'react';
import authService from '../services/authService';

interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (userData: any) => Promise<void>;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // In a real app, verify token or decode it. For simplicity, we assume logged in if token exists.
            // You might want to fetch user details from /api/auth/me if implemented.
            // Here we just set a partial state or rely on protected routes to re-auth.
            // For now, let's keep it null until explicit login or decoding.
        }
    }, []);

    const login = async (userData: any) => {
        setIsLoading(true);
        try {
            const data = await authService.login(userData);
            setUser(data);
        } catch (error) {
            console.error(error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
