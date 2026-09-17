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
  activeSubscription: any | null;
  daysRemaining: number;
  formattedEndDate: string;
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
  const [activeSubscription, setActiveSubscription] = useState<any | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number>(0);
  const [formattedEndDate, setFormattedEndDate] = useState<string>('');
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [lenderProfile, setLenderProfile] = useState<LenderProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const calculateSubscriptionDetails = (sub: any) => {
    if (!sub || !sub.endDate) {
      setDaysRemaining(0);
      setFormattedEndDate('');
      return;
    }
    try {
      const end = new Date(sub.endDate);
      const remaining = Math.max(0, Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      setDaysRemaining(remaining);
      const formatted = end.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      setFormattedEndDate(formatted);
    } catch {
      setDaysRemaining(0);
      setFormattedEndDate('');
    }
  };

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
          setActiveSubscription(subStatus.subscription || null);
          calculateSubscriptionDetails(subStatus.subscription);

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
    setActiveSubscription(subStatus.subscription || null);
    calculateSubscriptionDetails(subStatus.subscription);

    initSocket(userData.id, activeRole);
    registerForPushNotificationsAsync();
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    setVendorProfile(null);
    setLenderProfile(null);
    setIsSubscribed(false);
    setActiveSubscription(null);
    setDaysRemaining(0);
    setFormattedEndDate('');
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
      setActiveSubscription(subStatus.subscription || null);
      calculateSubscriptionDetails(subStatus.subscription);
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
        activeSubscription,
        daysRemaining,
        formattedEndDate,
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
