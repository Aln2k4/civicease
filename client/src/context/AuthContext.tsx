import { createContext, useState, useEffect, useContext, type ReactNode } from 'react';
import authService from '../services/authService';

interface User {
    _id: string;
    name: string;
    email: string; // Keep for legacy, though might be unused for pure officers
    username?: string; // Added username
    role: string;
    villageOfficeId?: string; // Added context
    villageContext?: {
        villageName: string;
        district: string;
        taluk: string;
    };
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (identifier: string, password: string) => Promise<void>; // Updated signature
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = async (identifier: string, password: string) => {
        setIsLoading(true);
        try {
            const data = await authService.login({ identifier, password });
            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));
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
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
