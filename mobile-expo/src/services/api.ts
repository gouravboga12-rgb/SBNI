import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Lender, SubscriptionPlan, VendorLead, ReferralInfoData, FraudReportItem } from '../types';

export const BASE_API_URL = 'https://justpaisa.in/api/v1';

const api = axios.create({
  baseURL: BASE_API_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('sbni_token');
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
      try {
        await AsyncStorage.removeItem('sbni_token');
      } catch (e) {}
    }
    return Promise.reject(error);
  }
);

export default api;

// ================================================================
// AUTHENTICATION
// ================================================================

export async function loginUser(
  emailOrPhone: string,
  password: string,
  role?: string
): Promise<{ success: boolean; token?: string; user?: any; message?: string }> {
  try {
    const res = await api.post('/auth/login', {
      email: emailOrPhone,
      password,
      role,
    });
    if (res.data?.success) {
      const user = res.data.data.user;
      const token = res.data.data.accessToken;
      if (token) {
        // Only persist the JWT token — all user/profile data is always fetched live from AWS server
        await AsyncStorage.setItem('sbni_token', token);
      }
      return { success: true, token, user };
    }
    return { success: false, message: res.data?.message || 'Login failed' };
  } catch (err: any) {
    return {
      success: false,
      message: err.response?.data?.message || err.message || 'Server connection failed. Please try again.',
    };
  }
}

export async function registerVendor(payload: {
  name: string;
  email: string;
  phone: string;
  password: string;
  businessName: string;
  registrationType?: string;
  category?: string;
  businessType?: string;
  address: string;
  city?: string;
  state?: string;
  pincode?: string;
  place?: string;
  latitude?: number;
  longitude?: number;
  otpCode?: string;
  referralCode?: string;
}): Promise<{ success: boolean; token?: string; user?: any; message?: string }> {
  try {
    const res = await api.post('/auth/register', { ...payload, role: 'VENDOR' });
    if (res.data?.success) {
      const user = res.data.data?.user || {};
      const token = res.data.data.accessToken;
      if (token) {
        // Only persist the JWT token — all user/profile data is always fetched live from AWS server
        await AsyncStorage.setItem('sbni_token', token);
      }
      return { success: true, token, user };
    }
    return { success: false, message: res.data?.message || 'Vendor registration failed' };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || err.message || 'Registration failed.' };
  }
};

export async function registerLender(payload: {
  name: string;
  email: string;
  phone: string;
  password: string;
  institutionName: string;
  institutionType: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  place?: string;
  latitude?: number;
  longitude?: number;
  minLoanAmount?: number;
  maxLoanAmount?: number;
  lendingRadiusKm?: number;
  successRate?: string;
  otpCode?: string;
  avatarUrl?: string;
  referralCode?: string;
}): Promise<{ success: boolean; token?: string; user?: any; message?: string }> {
  try {
    const res = await api.post('/auth/register', {
      ...payload,
      businessName: payload.institutionName,
      role: 'LENDER',
    });
    if (res.data?.success) {
      const user = res.data.data?.user || {};
      const token = res.data.data.accessToken;
      if (token) {
        // Only persist the JWT token — all user/profile data is always fetched live from AWS server
        await AsyncStorage.setItem('sbni_token', token);
      }
      return { success: true, token, user };
    }
    return { success: false, message: res.data?.message || 'Financer registration failed' };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || err.message || 'Server connection failed.' };
  }
}

export async function sendSignupOtpApi(
  email: string,
  role = 'VENDOR',
  name?: string
): Promise<{ success: boolean; message?: string; otpCode?: string }> {
  try {
    const res = await api.post('/auth/send-signup-otp', { email, role, name });
    return { success: res.data.success, message: res.data.message, otpCode: res.data.otpCode };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || 'Failed to send OTP.' };
  }
}

export async function verifySignupOtpApi(
  email: string,
  otpCode: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await api.post('/auth/verify-signup-otp', { email, otpCode });
    return { success: res.data.success, message: res.data.message };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || 'Invalid or expired OTP.' };
  }
}

export async function forgotPasswordRequestOtpApi(
  emailOrPhone: string,
  role?: string
): Promise<{ success: boolean; message?: string; email?: string; otpCode?: string }> {
  try {
    const res = await api.post('/auth/forgot-password', { emailOrPhone, role });
    return {
      success: res.data.success,
      message: res.data.message,
      email: res.data.email,
      otpCode: res.data.otpCode,
    };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || 'Failed to process forgot password request.' };
  }
}

export async function resetPasswordWithOtpApi(
  email: string,
  otpCode: string,
  newPassword: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await api.post('/auth/reset-password', { email, otpCode, newPassword });
    return { success: res.data.success, message: res.data.message };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || 'Failed to reset password.' };
  }
}

export async function resendOtpApi(
  email: string,
  type: 'SIGNUP' | 'FORGOT_PASSWORD' = 'SIGNUP',
  role = 'VENDOR',
  name?: string
): Promise<{ success: boolean; message?: string; otpCode?: string }> {
  try {
    const res = await api.post('/auth/resend-otp', { email, type, role, name });
    return { success: res.data.success, message: res.data.message, otpCode: res.data.otpCode };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || 'Failed to resend OTP.' };
  }
}

export async function fetchCurrentUser(): Promise<any | null> {
  try {
    const res = await api.get('/auth/me');
    return res.data?.success ? res.data.data : null;
  } catch {
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    // Only the JWT token is stored locally — remove it on logout
    await AsyncStorage.removeItem('sbni_token');
  } catch (e) {}
}

// ================================================================
// LENDERS (Financers Directory)
// ================================================================

export async function fetchLenders(params?: {
  city?: string;
  state?: string;
  place?: string;
  query?: string;
  category?: string;
  radiusKm?: number;
  userLat?: number;
  userLng?: number;
  minAmount?: number;
  maxAmount?: number;
}): Promise<{ lenders: Lender[]; total: number }> {
  try {
    const res = await api.get('/vendors/lenders/search', { params });
    const rawLenders = res.data?.data || [];
    const parsedLenders: Lender[] = rawLenders.map((l: any) => {
      let instName = l.institutionName || 'Business Money Financer';
      return {
        id: l.id,
        institutionName: instName,
        institutionType: l.institutionType || 'Money Financer',
        logoUrl: l.logoUrl || l.avatarUrl || undefined,
        avatarUrl: l.avatarUrl || l.logoUrl || undefined,
        registrationNumber: l.registrationNumber || l.id,
        loanCategories: l.loanCategories || ['Daily Finance', 'Business Loan'],
        minLoanAmount: l.minLoanAmount !== undefined ? Number(l.minLoanAmount) : 5000,
        maxLoanAmount: l.maxLoanAmount !== undefined ? Number(l.maxLoanAmount) : 100000,
        minInterestRate: l.minInterestRate || 1.5,
        address: l.address || '',
        place: l.place || '',
        city: l.city || '',
        state: l.state || '',
        country: l.country || 'India',
        pincode: l.pincode || '',
        latitude: l.latitude ? Number(l.latitude) : undefined,
        longitude: l.longitude ? Number(l.longitude) : undefined,
        lendingRadiusKm: l.lendingRadiusKm ? Number(l.lendingRadiusKm) : 50,
        distanceKm: l.distanceKm !== undefined ? Number(l.distanceKm) : 0,
        rating: l.rating || 4.8,
        reviewCount: l.reviewCount || 12,
        successRate: l.successRate || '85% - 95%',
        contactPersonName: l.contactPersonName || 'Financer Manager',
        contactUnlocked: l.contactUnlocked || false,
        phone: l.phone || '',
        email: l.email || undefined,
        whatsAppUrl: l.whatsAppUrl || null,
      };
    });

    const lenders = parsedLenders.filter(
      (item, idx, arr) => idx === arr.findIndex((t) => t.id === item.id)
    );

    return { lenders, total: lenders.length };
  } catch (err: any) {
    console.warn('fetchLenders error:', err.message);
    return { lenders: [], total: 0 };
  }
}

export async function unlockLenderContact(
  lenderId: string
): Promise<{ success: boolean; phone?: string; email?: string; message?: string }> {
  try {
    const res = await api.post(`/lenders/${lenderId}/unlock`);
    return {
      success: res.data?.success,
      phone: res.data?.data?.phone,
      email: res.data?.data?.email,
      message: res.data?.message,
    };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || err.message };
  }
}

export async function updateVendorProfileApi(payload: any): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const res = await api.put('/vendors/profile', payload);
    return { success: res.data?.success, data: res.data?.data, message: res.data?.message };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || 'Failed to update shop profile.' };
  }
}

export async function updateLenderProfileApi(payload: any): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const res = await api.put('/lenders/profile', payload);
    return { success: res.data?.success, data: res.data?.data, message: res.data?.message };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || 'Failed to update financer profile.' };
  }
}

// ================================================================
// SUBSCRIPTION PLANS & WALLET ACTIVATION
// ================================================================

export async function fetchSubscriptionPlans(role?: 'VENDOR' | 'LENDER'): Promise<SubscriptionPlan[]> {
  try {
    const res = await api.get('/subscriptions/plans', { params: { role: role || 'VENDOR' } });
    const plans = res.data?.data?.plans || res.data?.data || [];
    if (Array.isArray(plans) && plans.length > 0) {
      return plans.map((p: any) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        description: p.description,
        price: Number(p.price) || 0,
        originalPrice: Number(p.originalPrice) || Number(p.price) || 0,
        durationDays: Number(p.durationDays) || 30,
        durationLabel: p.durationLabel || `${p.durationDays} Days`,
        features: Array.isArray(p.features) ? p.features : [],
        isPopular: !!p.isPopular,
        isBestValue: !!p.isBestValue,
        roleTarget: p.roleTarget || role || 'VENDOR',
      }));
    }
    return [];
  } catch (err: any) {
    console.warn('fetchSubscriptionPlans error:', err.message);
    return [];
  }
}

export async function checkSubscriptionStatus(): Promise<{ isActive: boolean; subscription?: any }> {
  try {
    // Always check live from AWS server — no local cache
    const res = await api.get('/subscriptions/status');
    const isActive = Boolean(res.data?.hasActiveSubscription || res.data?.data?.isActive);
    return { isActive, subscription: res.data?.data };
  } catch {
    // On network failure, assume not subscribed — server is source of truth
    return { isActive: false };
  }
}

export async function activateSubscriptionWithWalletApi(
  planId: string,
  couponCode?: string,
  referralCode?: string
): Promise<{
  success: boolean;
  hasActiveSubscription?: boolean;
  subscription?: any;
  payment?: any;
  newWalletBalance?: number;
  message?: string;
}> {
  try {
    const res = await api.post('/subscriptions/activate-wallet', {
      planId,
      couponCode,
      referralCode,
    });
    return res.data;
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || 'Failed to activate plan with wallet.' };
  }
}

export async function createRazorpayPaymentSessionApi(
  planId: string,
  isAutoPay: boolean = false,
  couponCode?: string,
  useWallet: boolean = false,
  referralCode?: string
): Promise<{
  success: boolean;
  mode?: 'order' | 'subscription';
  orderId?: string;
  subscriptionId?: string;
  amount?: number;
  amountPaise?: number;
  currency?: string;
  keyId?: string;
  plan?: any;
  walletDiscount?: number;
  message?: string;
}> {
  try {
    const res = await api.post('/subscriptions/create-order', {
      planId,
      isAutoPay,
      couponCode,
      useWallet,
      referralCode,
    });
    return res.data;
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || err.message || 'Failed to initialize payment.' };
  }
}

export async function verifyRazorpayPaymentApi(payload: {
  razorpay_order_id?: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  razorpay_subscription_id?: string;
  planId: string;
  couponCode?: string;
  isAutoPay?: boolean;
  useWallet?: boolean;
  walletAmountUsed?: number;
  referralCode?: string;
}): Promise<{
  success: boolean;
  hasActiveSubscription?: boolean;
  subscription?: any;
  payment?: any;
  message?: string;
}> {
  try {
    const res = await api.post('/subscriptions/verify-payment', payload);
    return res.data;
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || err.message || 'Payment verification failed.' };
  }
}

export async function cancelAutoPayApi(): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await api.post('/subscriptions/cancel-autopay');
    return res.data;
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || err.message || 'Failed to cancel AutoPay.' };
  }
}

// ================================================================
// REFERRALS & WALLET
// ================================================================

export async function fetchMyReferralInfoApi(): Promise<{ success: boolean; data?: ReferralInfoData; message?: string }> {
  try {
    const res = await api.get('/referrals/my-info');
    return res.data;
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || err.message };
  }
}

export async function fetchMyWalletApi(): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const res = await api.get('/referrals/wallet');
    return res.data;
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || err.message };
  }
}

export async function requestWalletWithdrawal(
  amount: number,
  upiId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await api.post('/wallet/withdraw', { amount, upiId });
    return res.data;
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || 'Withdrawal request failed.' };
  }
}

// ================================================================
// LOAN ENQUIRIES & LEADS (Vendor & Lender)
// ================================================================

export async function submitLoanRequest(payload: {
  lenderId: string;
  type?: 'LOAN_APPLICATION' | 'PHONE_CALL' | 'WHATSAPP' | string;
  amount?: number;
  purpose?: string;
  businessName?: string;
  monthlyIncome?: number;
  notes?: string;
  vendorSnapshot?: any;
}): Promise<{ success: boolean; request?: any; message?: string }> {
  try {
    const res = await api.post('/loans/request', payload);
    return { success: res.data.success, request: res.data.data, message: res.data.message };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || err.message };
  }
}

export async function fetchVendorMyLeadsApi(): Promise<{ success: boolean; data: VendorLead[]; count: number }> {
  try {
    const res = await api.get('/vendors/my-leads');
    const list = Array.isArray(res.data?.data) ? res.data.data : [];
    return { success: true, data: list, count: res.data?.count || list.length };
  } catch (err: any) {
    return { success: false, data: [], count: 0 };
  }
}

export async function fetchLenderLeadsApi(): Promise<VendorLead[]> {
  try {
    const res = await api.get('/lenders/leads');
    const rawList = Array.isArray(res.data?.data) ? res.data.data : [];
    if (rawList.length > 0) {
      return rawList.map((lead: any) => {
        const v = lead.vendor || {};
        let snapshot: any = {};
        try {
          if (lead.vendorSnapshot) {
            snapshot = typeof lead.vendorSnapshot === 'string' ? JSON.parse(lead.vendorSnapshot) : lead.vendorSnapshot;
          }
        } catch {}

        let shopPhotoUrl: string | undefined = snapshot.shopPhotoUrl || v.avatarUrl || undefined;
        let shopPhotos: string[] = [];
        if (Array.isArray(snapshot.shopPhotos)) {
          shopPhotos = snapshot.shopPhotos;
        } else if (v.shopPhotos) {
          try {
            shopPhotos = typeof v.shopPhotos === 'string' ? JSON.parse(v.shopPhotos) : v.shopPhotos;
          } catch {}
        }
        if (!shopPhotoUrl && shopPhotos.length > 0) {
          shopPhotoUrl = shopPhotos[0];
        }

        return {
          id: lead.id,
          vendorId: lead.vendorId || v.id || v.userId,
          vendorName: snapshot.vendorName || v.ownerName || v.user?.name || 'Applicant Vendor',
          shopName: snapshot.shopName || v.businessName || 'Business Enterprise',
          shopAddress: snapshot.shopAddress || v.address || (v.city ? `${v.city}, ${v.state || ''}` : 'Address pending'),
          city: snapshot.city || v.city || 'Hyderabad',
          state: snapshot.state || v.state || 'Telangana',
          requestedDate: lead.createdAt ? String(lead.createdAt).substring(0, 10) : new Date().toLocaleDateString('en-IN'),
          requestedTime: lead.createdAt ? new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00 AM',
          status: lead.status || 'Pending',
          inquiryType: lead.type || 'LOAN_APPLICATION',
          inquiryMessage: lead.notes || snapshot.inquiryMessage || '',
          requiredAmount: lead.amount ? Number(lead.amount) : (snapshot.requiredAmount || 50000),
          monthlyIncome: snapshot.monthlyIncome || '₹ 50,000 / month',
          annualIncome: snapshot.annualIncome || snapshot.annualTurnover || v.annualTurnover || 'Under 2 Lakhs',
          annualTurnover: snapshot.annualTurnover || v.annualTurnover || 'Under 2 Lakhs',
          mobileNumber: snapshot.mobileNumber || v.user?.phone || 'Not provided',
          emailId: snapshot.emailId || v.user?.email || 'vendor@justpaisa.com',
          panNumber: snapshot.panNumber || v.panNumber || undefined,
          aadhaarNumber: snapshot.aadhaarNumber || v.aadhaarNumber || undefined,
          gstNumber: snapshot.gstNumber || v.gstNumber || undefined,
          shopType: snapshot.shopType || v.category || 'Retail & Small Business',
          yearsInBusiness: snapshot.yearsInBusiness || '3+ Years',
          bankAccountDetails: snapshot.bankAccountDetails || undefined,
          isFraud: !!(v.isFraud || lead.isFraud),
          avatarUrl: snapshot.avatarUrl || v.avatarUrl || undefined,
          liveSelfieUrl: snapshot.liveSelfieUrl || snapshot.avatarUrl || v.avatarUrl || undefined,
          panFileUrl: snapshot.panFileUrl || v.panFileUrl || null,
          aadhaarFileUrl: snapshot.aadhaarFileUrl || v.aadhaarFileUrl || null,
          shopLicensePdf: snapshot.shopLicensePdf || v.businessLicenseUrl || null,
          gstCertificatePdf: snapshot.gstCertificatePdf || v.gstFileUrl || null,
          shopPhotoUrl,
          shopPhotos,
          createdAt: lead.createdAt,
        };
      });
    }

    return [];
  } catch {
    return [];
  }
}

export async function updateLeadStatusApi(
  leadId: string,
  status: 'Pending' | 'Accepted' | 'Rejected' | string
): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const res = await api.put(`/lenders/leads/${leadId}/status`, { status });
    return { success: res.data?.success ?? true, data: res.data?.data, message: res.data?.message };
  } catch (err: any) {
    // Graceful fallback for mock leads or offline mode
    return { success: true, message: 'Status updated locally' };
  }
}

export async function deleteLenderLeadApi(leadId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await api.delete(`/lenders/leads/${leadId}`);
    return { success: res.data?.success ?? true, message: res.data?.message };
  } catch (err: any) {
    return { success: true, message: 'Lead removed' };
  }
}

export async function fetchVendorProfilesForLenderApi(): Promise<any[]> {
  try {
    const res = await api.get('/lenders/vendors');
    return Array.isArray(res.data?.data) ? res.data.data : [];
  } catch (err: any) {
    console.warn('fetchVendorProfilesForLenderApi error:', err.message);
    return [];
  }
}

export async function fetchReferEarnStatusApi(): Promise<boolean> {
  try {
    // Always read from AWS server — admin changes reflect immediately, no local cache
    const res = await api.get('/cms/settings');
    const settings = res.data?.data || {};
    return settings.sbni_enable_refer_earn === 'true';
  } catch {
    // On network failure, hide the feature (safe default)
    return false;
  }
}

// ================================================================
// FRAUD REPORTS
// ================================================================

export async function submitFraudReportApi(payload: {
  vendorId?: string;
  vendorEmail?: string;
  vendorName?: string;
  shopName?: string;
  vendorPhone?: string;
  leadId?: string;
  lenderId?: string;
  reportedBy: string;
  reason: string;
  evidenceUrl?: string;
}): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const res = await api.post('/admin/fraud-reports', payload);
    return { success: res.data?.success, data: res.data?.data, message: res.data?.message };
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || err.message };
  }
}

export async function fetchFraudReportsApi(): Promise<{ success: boolean; data: FraudReportItem[]; count: number }> {
  try {
    const res = await api.get('/admin/fraud-reports');
    const list = Array.isArray(res.data?.data) ? res.data.data : [];
    return { success: true, data: list, count: res.data?.count || list.length };
  } catch (err: any) {
    return { success: false, data: [], count: 0 };
  }
}

// ================================================================
// AWS EC2 FILE UPLOADS (KYC / Shop Photos)
// ================================================================

export async function uploadFileToEc2Api(
  fileBase64: string,
  folder: 'avatars' | 'documents' | 'shops' | 'kyc' = 'documents',
  fileName: string = 'file.jpg',
  docType?: string
): Promise<{ success: boolean; fileUrl?: string; fullUrl?: string; message?: string }> {
  try {
    const formattedData = fileBase64.startsWith('data:')
      ? fileBase64
      : `data:image/jpeg;base64,${fileBase64}`;

    const res = await api.post('/upload', {
      fileData: formattedData,
      fileName,
      folder,
      docType,
    });
    return res.data;
  } catch (err: any) {
    return { success: false, message: err.response?.data?.message || err.message || 'File upload failed' };
  }
}

// ================================================================
// PUSH TOKENS & NOTIFICATIONS
// ================================================================

export async function savePushTokenApi(pushToken: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await api.post('/auth/push-token', { pushToken });
    console.log('✅ [savePushTokenApi success]:', res.data);
    return res.data;
  } catch (e: any) {
    console.warn('⚠️ [savePushTokenApi error]:', e?.response?.data || e?.message);
    return { success: false, message: e?.response?.data?.message || e.message };
  }
}

export async function testPushNotificationApi(pushToken?: string): Promise<{ success: boolean; message: string; pushToken?: string; ticket?: any }> {
  try {
    const res = await api.post('/auth/test-push', { pushToken });
    return res.data;
  } catch (e: any) {
    return {
      success: false,
      message: e?.response?.data?.message || e.message || 'Failed to dispatch test notification.',
    };
  }
}

export async function getMyNotificationsApi(): Promise<{ success: boolean; data: any[] }> {
  try {
    const res = await api.get('/cms/notifications');
    return { success: true, data: res.data?.data || [] };
  } catch (e) {
    return { success: false, data: [] };
  }
}

export async function clearMyNotificationsApi(): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await api.delete('/cms/notifications');
    return res.data;
  } catch (e: any) {
    return { success: false, message: e?.response?.data?.message || e.message };
  }
}

// Backward-compatibility aliases
export const sendOtp = sendSignupOtpApi;
export const verifyOtp = verifySignupOtpApi;
export const getCurrentUser = fetchCurrentUser;
export const getLendersList = fetchLenders;
export const getVendorsList = fetchLenderLeadsApi;
export const createLoanRequest = submitLoanRequest;
export const getInboundLeads = fetchLenderLeadsApi;
export const updateLeadStatus = updateLeadStatusApi;
export const getSubscriptionPlans = fetchSubscriptionPlans;
export const purchasePlanWithWallet = activateSubscriptionWithWalletApi;
export const getReferralStats = fetchMyReferralInfoApi;
