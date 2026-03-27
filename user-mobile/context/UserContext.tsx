import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserData {
    id: string;
    name: string;
    email: string;
    phone?: string;
    profileImage?: string;
    age?: number;
    gender?: string;
    role: string;
}

interface UserContextType {
    userData: UserData | null;
    setUserData: (data: UserData | null) => void;
    refreshUser: () => Promise<void>;
    loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshUser = async () => {
        try {
            const userJson = await AsyncStorage.getItem('user');
            if (userJson) {
                setUserData(JSON.parse(userJson));
            } else {
                setUserData(null);
            }
        } catch (error) {
            console.error('Error refreshing user data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    return (
        <UserContext.Provider value={{ userData, setUserData, refreshUser, loading }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
