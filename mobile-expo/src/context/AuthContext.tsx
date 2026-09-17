import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Role, VendorProfile, LenderProfile } from '../types';
import { fetchCurrentUser, logoutUser, checkSubscriptionStatus } from '../services/api';
import { initSocket, disconnectSocket } from '../services/socketService';
import { registerForPushNotificationsAsync } from '../services/notificationService';

interface AuthContextType {
  user: User | null;
  role: Role;
  token: string | null;
  isLoading: boolean;
  isSubscribed: boolean;
  vendorProfile: VendorProfile | null;
  lenderProfile: LenderProfile | null;
  login: (token: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (newRole: Role) => void;
  refreshUserData: () => Promise<void>;
  updateVendorProfileState: (profile: Partial<VendorProfile>) => void;
  updateLenderProfileState: (profile: Partial<LenderProfile>) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>('VENDOR');
  const [token, setToken] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [lenderProfile, setLenderProfile] = useState<LenderProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  /**
   * On app boot:
   * 1. Read ONLY the JWT token from AsyncStorage (that is the only thing stored locally).
   * 2. Use that token to call GET /auth/me on the AWS server for live, fresh user data.
   * 3. Call GET /subscriptions/status for live subscription state.
   * All profile and settings data always comes from the server — never from a local cache.
   */
  const loadStoredAuth = async () => {
    try {
      const storedToken =
        (await AsyncStorage.getItem('sbni_token')) ||
        (await AsyncStorage.getItem('justpaisa_token'));

      if (storedToken) {
        setToken(storedToken);

        // Fetch live user data from AWS server
        const serverUser = await fetchCurrentUser();
        if (serverUser) {
          const activeRole = serverUser.role === 'LENDER' ? 'LENDER' : 'VENDOR';
          setUser(serverUser);
          setRole(activeRole);
          if (serverUser.vendorProfile) setVendorProfile(serverUser.vendorProfile);
          if (serverUser.lenderProfile) setLenderProfile(serverUser.lenderProfile);

          // Fetch live subscription status from AWS server
          const subStatus = await checkSubscriptionStatus();
          setIsSubscribed(subStatus.isActive);

          // Initialize socket and push notifications
          initSocket(serverUser.id, activeRole);
          registerForPushNotificationsAsync();
        } else {
          // Token is stale / server rejected it — clear it
          await AsyncStorage.removeItem('sbni_token');
          await AsyncStorage.removeItem('justpaisa_token');
        }
      }
    } catch (e) {
      console.error('Error loading auth:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (newToken: string, userData: User) => {
    setToken(newToken);
    setUser(userData);
    const activeRole = userData.role === 'LENDER' ? 'LENDER' : 'VENDOR';
    setRole(activeRole);
    if (userData.vendorProfile) setVendorProfile(userData.vendorProfile);
    if (userData.lenderProfile) setLenderProfile(userData.lenderProfile);

    // Store ONLY the JWT token — all other data is always fetched from AWS server
    await AsyncStorage.setItem('sbni_token', newToken);

    // Check live subscription status from server
    const subStatus = await checkSubscriptionStatus();
    setIsSubscribed(subStatus.isActive);

    initSocket(userData.id, activeRole);
    registerForPushNotificationsAsync();
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    setVendorProfile(null);
    setLenderProfile(null);
    setIsSubscribed(false);
    // logoutUser() removes only the JWT token from AsyncStorage
    await logoutUser();
    disconnectSocket();
  };

  const switchRole = (newRole: Role) => {
    setRole(newRole);
    if (user) {
      const updated = { ...user, role: newRole };
      setUser(updated);
      // No AsyncStorage write — role change is in-memory only; server is source of truth
      initSocket(user.id, newRole);
    }
  };

  const refreshUserData = async () => {
    try {
      // Always fetch fresh data from AWS server
      const data = await fetchCurrentUser();
      if (data) {
        setUser(data);
        if (data.vendorProfile) setVendorProfile(data.vendorProfile);
        if (data.lenderProfile) setLenderProfile(data.lenderProfile);
        // No AsyncStorage write — data lives on the server
      }
      const subStatus = await checkSubscriptionStatus();
      setIsSubscribed(subStatus.isActive);
    } catch (e) {}
  };

  const updateVendorProfileState = (partial: Partial<VendorProfile>) => {
    setVendorProfile((prev) => (prev ? { ...prev, ...partial } : (partial as any)));
  };

  const updateLenderProfileState = (partial: Partial<LenderProfile>) => {
    setLenderProfile((prev) => (prev ? { ...prev, ...partial } : (partial as any)));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isLoading,
        isSubscribed,
        vendorProfile,
        lenderProfile,
        login,
        logout,
        switchRole,
        refreshUserData,
        updateVendorProfileState,
        updateLenderProfileState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
