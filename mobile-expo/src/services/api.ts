import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const BASE_API_URL = 'https://testcodtech.shop/api';

const api = axios.create({
  baseURL: BASE_API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('justpaisa_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {}
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('justpaisa_token');
      await AsyncStorage.removeItem('justpaisa_user');
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth APIs
export const sendOtp = async (phone: string, role: string) => {
  const res = await api.post('/auth/send-otp', { phone, role });
  return res.data;
};

export const verifyOtp = async (phone: string, otp: string, role: string) => {
  const res = await api.post('/auth/verify-otp', { phone, otp, role });
  return res.data;
};

export const getCurrentUser = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};

// Vendor / Lender APIs
export const getLendersList = async (params?: any) => {
  const res = await api.get('/lenders', { params });
  return res.data;
};

export const getVendorsList = async (params?: any) => {
  const res = await api.get('/vendors', { params });
  return res.data;
};

export const createLoanRequest = async (data: any) => {
  const res = await api.post('/loans/request', data);
  return res.data;
};

export const getInboundLeads = async () => {
  const res = await api.get('/leads/inbound');
  return res.data;
};

export const updateLeadStatus = async (leadId: string, status: string) => {
  const res = await api.patch(`/leads/${leadId}/status`, { status });
  return res.data;
};

// Subscription APIs
export const getSubscriptionPlans = async (role?: string) => {
  const res = await api.get('/subscriptions/plans', { params: { role } });
  return res.data;
};

export const purchasePlanWithWallet = async (planId: string) => {
  const res = await api.post('/subscriptions/purchase-wallet', { planId });
  return res.data;
};

// Referrals
export const getReferralStats = async () => {
  const res = await api.get('/referrals/stats');
  return res.data;
};

export const requestWalletWithdrawal = async (amount: number, upiId: string) => {
  const res = await api.post('/wallet/withdraw', { amount, upiId });
  return res.data;
};
