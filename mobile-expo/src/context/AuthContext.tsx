import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '../types';
import { getCurrentUser } from '../services/api';
import { initSocket, disconnectSocket } from '../services/socketService';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  token: string | null;
  isLoading: boolean;
  login: (token: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (newRole: UserRole) => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('VENDOR');
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('justpaisa_token');
      const storedUser = await AsyncStorage.getItem('justpaisa_user');
      if (storedToken && storedUser) {
        const parsed = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsed);
        setRole(parsed.role || 'VENDOR');
        initSocket(parsed.id, parsed.role);
      }
    } catch (e) {
      console.error('Error loading stored auth:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (newToken: string, userData: User) => {
    setToken(newToken);
    setUser(userData);
    setRole(userData.role || 'VENDOR');
    await AsyncStorage.setItem('justpaisa_token', newToken);
    await AsyncStorage.setItem('justpaisa_user', JSON.stringify(userData));
    initSocket(userData.id, userData.role);
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    await AsyncStorage.removeItem('justpaisa_token');
    await AsyncStorage.removeItem('justpaisa_user');
    disconnectSocket();
  };

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    if (user) {
      const updated = { ...user, role: newRole };
      setUser(updated);
      AsyncStorage.setItem('justpaisa_user', JSON.stringify(updated));
      initSocket(user.id, newRole);
    }
  };

  const refreshUserData = async () => {
    try {
      const res = await getCurrentUser();
      if (res?.data) {
        setUser(res.data);
        await AsyncStorage.setItem('justpaisa_user', JSON.stringify(res.data));
      }
    } catch (e) {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isLoading,
        login,
        logout,
        switchRole,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
