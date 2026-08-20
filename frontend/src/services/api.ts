// ============================================================
// SBNI Money App — AWS Backend API Service Layer
// All data is fetched from the live AWS EC2 backend.
// No mock data. No localStorage substitutes.
// ============================================================

import { Lender, SubscriptionPlan } from '../types';

// --------------- Config ---------------
const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://18.61.36.65/api/v1';

// --------------- Token Helpers ---------------
export function getToken(): string | null {
  return localStorage.getItem('sbni_token');
}

export function getAdminToken(): string | null {
  return localStorage.getItem('sbni_admin_token');
}

function authHeaders(token?: string | null): HeadersInit {
  const t = token ?? getToken();
  return {
    'Content-Type': 'application/json',
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
  };
}

// --------------- Generic Fetch Wrapper ---------------
async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = { success: false, message: `Server returned status ${res.status}` };
  }

  if (!res.ok) {
    throw new Error(data?.message || `API error: ${res.status}`);
  }
  return data;
}

// ================================================================
// AUTH
// ================================================================

export async function loginUser(
  email: string,
  password: string,
  role?: 'VENDOR' | 'LENDER' | 'SUPER_ADMIN' | string
): Promise<{ success: boolean; token?: string; user?: any; message?: string }> {
  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
    if (data.success) {
      const u = data.data.user;
      if (role && u.role !== role && u.role !== 'ADMIN') {
        return {
          success: false,
          message: `This account is registered as a ${
            u.role === 'VENDOR' ? 'Small Shop / Local Startup Business' : 'Business Money Financer (Lender)'
          }. Please log in through the correct portal.`,
        };
      }
      if (u?.vendorProfile) {
        const ownerName = u.vendorProfile.ownerName || u.vendorProfile.fullName;
        if (ownerName) {
          u.name = ownerName;
          u.fullName = ownerName;
        }
        localStorage.setItem('sbni_vendor_profile', JSON.stringify(u.vendorProfile));
      }
      localStorage.setItem('sbni_token', data.data.accessToken);
      localStorage.setItem('sbni_user', JSON.stringify(u));
      if (data.data.refreshToken) {
        localStorage.setItem('sbni_refresh_token', data.data.refreshToken);
      }
      return { success: true, token: data.data.accessToken, user: u };
    }
    return { success: false, message: data.message || 'Login failed' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Server connection failed. Please try again.' };
  }
}

export async function registerVendor(payload: {
  name: string;
  email: string;
  phone: string;
  password: string;
  businessName: string;
  address: string;
  otpCode?: string;
}): Promise<{ success: boolean; token?: string; user?: any; message?: string }> {
  try {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...payload, role: 'VENDOR' }),
    });
    if (data.success) {
      localStorage.setItem('sbni_token', data.data.accessToken);
      localStorage.setItem('sbni_user', JSON.stringify(data.data.user));
      return { success: true, token: data.data.accessToken, user: data.data.user };
    }
    return { success: false, message: data.message || 'Registration failed' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Server connection failed. Please try again.' };
  }
}

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
  minLoanAmount?: number;
  maxLoanAmount?: number;
  lendingRadiusKm?: number;
  otpCode?: string;
}): Promise<{ success: boolean; token?: string; user?: any; message?: string }> {
  try {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...payload, businessName: payload.institutionName, role: 'LENDER' }),
    });
    if (data.success) {
      const user = data.data?.user || {};
      // Persist institution name so profile page can show it correctly
      if (payload.institutionName) {
        const storedProfile = { institutionName: payload.institutionName, institutionType: 'Money Financer', minLoanAmount: payload.minLoanAmount, maxLoanAmount: payload.maxLoanAmount, lendingRadiusKm: payload.lendingRadiusKm };
        localStorage.setItem('sbni_lender_profile', JSON.stringify(storedProfile));
      }
      localStorage.setItem('sbni_token', data.data.accessToken);
      localStorage.setItem('sbni_user', JSON.stringify({ ...user, name: payload.name }));
      return { success: true, token: data.data.accessToken, user: { ...user, name: payload.name } };
    }
    return { success: false, message: data.message || 'Registration failed' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Server connection failed. Please try again.' };
  }
}

export async function sendSignupOtpApi(
  email: string,
  role = 'VENDOR',
  name?: string
): Promise<{ success: boolean; message?: string; otpCode?: string }> {
  try {
    const data = await apiFetch('/auth/send-signup-otp', {
      method: 'POST',
      body: JSON.stringify({ email, role, name }),
    });
    return { success: data.success, message: data.message, otpCode: data.otpCode };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to send OTP.' };
  }
}

export async function verifySignupOtpApi(
  email: string,
  otpCode: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const data = await apiFetch('/auth/verify-signup-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otpCode }),
    });
    return { success: data.success, message: data.message };
  } catch (err: any) {
    return { success: false, message: err.message || 'Invalid or expired OTP.' };
  }
}

export async function forgotPasswordRequestOtpApi(
  emailOrPhone: string,
  role?: 'VENDOR' | 'LENDER' | 'SUPER_ADMIN' | string
): Promise<{ success: boolean; message?: string; email?: string; otpCode?: string }> {
  try {
    const data = await apiFetch('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ emailOrPhone, role }),
    });
    return { success: data.success, message: data.message, email: data.email, otpCode: data.otpCode };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to process forgot password request.' };
  }
}

export async function resetPasswordWithOtpApi(
  email: string,
  otpCode: string,
  newPassword: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const data = await apiFetch('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otpCode, newPassword }),
    });
    return { success: data.success, message: data.message };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to reset password.' };
  }
}

export async function resendOtpApi(
  email: string,
  type: 'SIGNUP' | 'FORGOT_PASSWORD' = 'SIGNUP',
  role = 'VENDOR',
  name?: string
): Promise<{ success: boolean; message?: string; otpCode?: string }> {
  try {
    const data = await apiFetch('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email, type, role, name }),
    });
    return { success: data.success, message: data.message, otpCode: data.otpCode };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to resend OTP.' };
  }
}

export async function fetchCurrentUser(): Promise<any | null> {
  const token = getToken();
  if (!token) return null;
  try {
    const data = await apiFetch('/auth/me', {
      headers: authHeaders(token),
    });
    return data.success ? data.data : null;
  } catch {
    return null;
  }
}

export function logoutUser(): void {
  localStorage.removeItem('sbni_token');
  localStorage.removeItem('sbni_refresh_token');
  localStorage.removeItem('sbni_user');
}

// ================================================================
// LENDERS
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
    const queryParams = new URLSearchParams();
    if (params?.city) queryParams.append('city', params.city);
    if (params?.state) queryParams.append('state', params.state);
    if (params?.place) queryParams.append('place', params.place);
    if (params?.query) queryParams.append('query', params.query);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.radiusKm) queryParams.append('radiusKm', String(params.radiusKm));
    if (params?.userLat !== undefined) queryParams.append('userLat', String(params.userLat));
    if (params?.userLng !== undefined) queryParams.append('userLng', String(params.userLng));
    if (params?.minAmount) queryParams.append('minAmount', String(params.minAmount));
    if (params?.maxAmount) queryParams.append('maxAmount', String(params.maxAmount));

    const qs = queryParams.toString() ? `?${queryParams.toString()}` : '';

    // Try authenticated endpoint first (returns unlocked contacts if subscribed)
    const token = getToken();
    const endpoint = `/vendors/lenders/search${qs}`;

    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: token
        ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
        : { 'Content-Type': 'application/json' },
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data?.message || 'Failed to fetch lenders');

    const rawLenders = data.data || [];
    const parsedLenders: Lender[] = rawLenders.map((l: any) => ({
      id: l.id,
      institutionName: l.institutionName || 'Unknown',
      institutionType: l.institutionType || 'Financial Institution',
      logoUrl: undefined,
      registrationNumber: l.registrationNumber || l.id,
      loanCategories: l.loanCategories || ['Business Loan'],
      minLoanAmount: l.minLoanAmount || 10000,
      maxLoanAmount: l.maxLoanAmount || 500000,
      minInterestRate: l.minInterestRate || 9.0,
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
      rating: l.rating || 4.5,
      reviewCount: l.reviewCount || 0,
      contactPersonName: l.contactPersonName || 'Contact Person',
      contactUnlocked: l.contactUnlocked || false,
      phone: l.phone || '',
      email: l.email || undefined,
      whatsAppUrl: l.whatsAppUrl || null,
    }));

    // Keep all registered financer accounts deduplicated strictly by unique ID
    const lenders = parsedLenders.filter(
      (item, idx, arr) => idx === arr.findIndex((t) => t.id === item.id)
    );

    return { lenders, total: lenders.length };
  } catch (err: any) {
    console.error('fetchLenders error:', err.message);
    return { lenders: [], total: 0 };
  }
}

export async function updateLenderProfileApi(payload: {
  institutionName?: string;
  institutionType?: string;
  registrationNumber?: string;
  loanCategories?: string[];
  minLoanAmount?: number;
  maxLoanAmount?: number;
  minInterestRate?: number;
  address?: string;
  place?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  lendingRadiusKm?: number;
  contactPersonName?: string;
}): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const data = await apiFetch('/lenders/profile', {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    return { success: data.success, data: data.data, message: data.message };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to update lender profile.' };
  }
}

export async function updateVendorProfileApi(payload: {
  businessName?: string;
  ownerName?: string;
  gstNumber?: string;
  panNumber?: string;
  registrationType?: string;
  annualTurnover?: string;
  category?: string;
  address?: string;
  place?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
}): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const data = await apiFetch('/vendors/profile', {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    return { success: data.success, data: data.data, message: data.message };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to update vendor profile.' };
  }
}

export async function fetchVendorProfilesForLender(): Promise<any[]> {
  try {
    const data = await apiFetch('/lenders/vendors', {
      headers: authHeaders(),
    });
    return data.data || [];
  } catch (err: any) {
    console.error('fetchVendorProfilesForLender error:', err.message);
    return [];
  }
}

export async function unlockLenderContact(
  lenderId: string
): Promise<{ success: boolean; phone?: string; email?: string; message?: string }> {
  try {
    const data = await apiFetch(`/lenders/${lenderId}/unlock`, {
      method: 'POST',
      headers: authHeaders(),
    });
    return {
      success: data.success,
      phone: data.data?.phone,
      email: data.data?.email,
      message: data.message,
    };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

// ================================================================
// SUBSCRIPTION PLANS
// ================================================================

export async function fetchSubscriptionPlans(
  role?: 'VENDOR' | 'LENDER'
): Promise<SubscriptionPlan[]> {
  try {
    const qs = role ? `?role=${role}` : '';
    const data = await apiFetch(`/subscriptions/plans${qs}`);
    const plans = data.data?.plans || data.data || [];
    return plans.map((p: any) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      description: p.description,
      price: p.price,
      originalPrice: p.originalPrice || p.price,
      durationDays: p.durationDays,
      durationLabel: p.durationLabel || `${p.durationDays} Days`,
      features: p.features || [],
      isPopular: p.isPopular || false,
      isBestValue: p.isBestValue || false,
      roleTarget: p.roleTarget || role || 'VENDOR',
    }));
  } catch (err: any) {
    console.error('fetchSubscriptionPlans error:', err.message);
    return getDefaultPlans(role || 'VENDOR');
  }
}

function getDefaultPlans(role: 'VENDOR' | 'LENDER'): SubscriptionPlan[] {
  if (role === 'VENDOR') {
    return [
      { id: 'v-w', code: 'WEEKLY', name: 'Weekly Starter Plan', description: 'Start exploring financers', price: 199, originalPrice: 349, durationDays: 7, durationLabel: '7 Days', features: ['Unlock up to 5 Financer Contacts', 'Phone & WhatsApp Access', 'Email Support'], roleTarget: 'VENDOR' },
      { id: 'v-m', code: 'MONTHLY', name: 'Monthly Growth Plan', description: 'Most popular for business owners', price: 599, originalPrice: 999, durationDays: 30, durationLabel: '30 Days', features: ['Unlimited Financer Unlocks', 'Direct Email & Branch Access', 'Pan-India Discovery', 'Verified Trust Badge', 'Dedicated Support'], isPopular: true, roleTarget: 'VENDOR' },
      { id: 'v-q', code: 'QUARTERLY', name: 'Quarterly Business Plan', description: '3 Months uninterrupted discovery', price: 1399, originalPrice: 2499, durationDays: 90, durationLabel: '90 Days', features: ['Everything in Monthly', 'Priority Application Routing', 'Digital KYC Storage', 'Multi-Bank Comparison'], roleTarget: 'VENDOR' },
      { id: 'v-h', code: 'HALF_YEARLY', name: 'Half-Yearly Scale Plan', description: '6 Months for growing SMEs', price: 2499, originalPrice: 4499, durationDays: 180, durationLabel: '180 Days', features: ['6 Months Unlimited Access', 'Fast-Track KYC Approval', 'Dedicated Relationship Support', 'New Financer Notifications'], roleTarget: 'VENDOR' },
      { id: 'v-y', code: 'YEARLY', name: 'Yearly VIP Enterprise Plan', description: '1 Year complete access', price: 4499, originalPrice: 7999, durationDays: 365, durationLabel: '365 Days', features: ['365 Days Unlimited Access', 'Zero Middleman Fees', 'VIP Priority Status', '24/7 Dedicated Account Manager'], isBestValue: true, roleTarget: 'VENDOR' },
    ];
  }
  return [
    { id: 'l-m', code: 'MONTHLY', name: 'Lender Monthly Plan', description: 'Connect with verified vendors', price: 999, originalPrice: 1499, durationDays: 30, durationLabel: '30 Days', features: ['Unlimited Vendor Discovery', 'KYC-Verified Leads', 'Direct Application Access', 'Lead Management Dashboard'], isPopular: true, roleTarget: 'LENDER' },
    { id: 'l-q', code: 'QUARTERLY', name: 'Lender Quarterly Plan', description: '3 Months premium lender access', price: 2499, originalPrice: 3999, durationDays: 90, durationLabel: '90 Days', features: ['Everything in Monthly', 'Priority Lead Routing', 'Analytics Dashboard', 'Dedicated Account Manager'], roleTarget: 'LENDER' },
    { id: 'l-y', code: 'YEARLY', name: 'Lender Annual Plan', description: 'Best value for active lenders', price: 7999, originalPrice: 14999, durationDays: 365, durationLabel: '365 Days', features: ['365 Days Full Platform Access', 'Unlimited Premium Leads', 'Custom Loan Product Listing', 'Brand Visibility Boost'], isBestValue: true, roleTarget: 'LENDER' },
  ];
}

export async function purchaseSubscription(
  planId: string,
  paymentDetails?: { method?: string; transactionId?: string }
): Promise<{ success: boolean; subscription?: any; message?: string }> {
  try {
    const data = await apiFetch('/subscriptions/purchase', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ planId, ...paymentDetails }),
    });
    return { success: data.success, subscription: data.data, message: data.message };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function checkSubscriptionStatus(): Promise<{
  isActive: boolean;
  subscription?: any;
}> {
  const token = getToken();
  const isSubscribedLocally =
    localStorage.getItem('sbni_vendor_subscribed') === 'true' ||
    localStorage.getItem('sbni_subscribed') === 'true';

  if (!token) return { isActive: isSubscribedLocally };
  try {
    const data = await apiFetch('/subscriptions/status', {
      headers: authHeaders(token),
    });
    const isActive = Boolean(data.hasActiveSubscription || data.data?.isActive || isSubscribedLocally);
    if (isActive) {
      localStorage.setItem('sbni_subscribed', 'true');
      localStorage.setItem('sbni_vendor_subscribed', 'true');
      localStorage.setItem('sbni_lender_subscribed', 'true');
    }
    return { isActive, subscription: data.data };
  } catch {
    return { isActive: isSubscribedLocally };
  }
}

// ================================================================
// LOAN REQUESTS (Vendor → Lender)
// ================================================================

export async function submitLoanRequest(payload: {
  lenderId: string;
  amount: number;
  purpose: string;
  businessName?: string;
  monthlyIncome?: number;
  notes?: string;
}): Promise<{ success: boolean; request?: any; message?: string }> {
  try {
    const data = await apiFetch('/loans/request', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    return { success: data.success, request: data.data, message: data.message };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function fetchMyLoanRequests(): Promise<any[]> {
  try {
    const data = await apiFetch('/loans/my-requests', {
      headers: authHeaders(),
    });
    return data.data?.requests || data.data || [];
  } catch {
    return [];
  }
}

// ================================================================
// SUPPORT TICKETS
// ================================================================

export async function submitSupportTicket(payload: {
  subject: string;
  message: string;
  category?: string;
}): Promise<{ success: boolean; ticket?: any; message?: string }> {
  try {
    const data = await apiFetch('/support/tickets', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    return { success: data.success, ticket: data.data, message: data.message };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

// ================================================================
// CMS — Banners, FAQs, Testimonials
// ================================================================

export async function fetchBanners(): Promise<any[]> {
  try {
    const data = await apiFetch('/cms/banners');
    return data.data?.banners || data.data || [];
  } catch {
    return [];
  }
}

export async function fetchFAQs(): Promise<any[]> {
  try {
    const data = await apiFetch('/cms/faqs');
    return data.data?.faqs || data.data || [];
  } catch {
    return [];
  }
}

export async function fetchTestimonials(): Promise<any[]> {
  try {
    const data = await apiFetch('/cms/testimonials');
    return data.data?.testimonials || data.data || [];
  } catch {
    return [];
  }
}

// ================================================================
// ADMIN API
// ================================================================

export async function adminLoginApi(
  email: string,
  password: string
): Promise<{ success: boolean; token?: string; user?: any; message?: string }> {
  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.success) {
      const user = data.data.user;
      if (user.role !== 'SUPER_ADMIN') {
        return { success: false, message: 'Access denied: Admin credentials required.' };
      }
      localStorage.setItem('sbni_admin_token', data.data.accessToken);
      localStorage.setItem('sbni_admin_user', JSON.stringify(user));
      return { success: true, token: data.data.accessToken, user };
    }
    return { success: false, message: data.message || 'Invalid credentials' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Server connection failed' };
  }
}

async function adminFetch<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAdminToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('sbni_admin_token');
    localStorage.removeItem('sbni_admin_user');
    window.dispatchEvent(new Event('sbni_admin_auth_expired'));
    throw new Error('Admin session expired or unauthorized. Please log in again.');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `Admin API error: ${res.status}`);
  return data;
}

export async function adminFetchDashboardStats(): Promise<any> {
  try {
    const data = await adminFetch('/admin/dashboard-stats');
    return data.data || data;
  } catch (err: any) {
    console.error('adminFetchDashboardStats error:', err.message);
    return {};
  }
}

export async function adminFetchVendors(params?: { page?: number; limit?: number; status?: string }): Promise<{ vendors: any[]; total: number }> {
  try {
    const q = new URLSearchParams();
    if (params?.page) q.append('page', String(params.page));
    if (params?.limit) q.append('limit', String(params.limit));
    if (params?.status) q.append('status', params.status);
    const data = await adminFetch(`/admin/vendors?${q.toString()}`);
    const vendorsList = Array.isArray(data.data) ? data.data : (data.data?.vendors || []);
    return { vendors: vendorsList, total: data.count || data.data?.total || vendorsList.length };
  } catch (err: any) {
    console.error('adminFetchVendors error:', err.message);
    return { vendors: [], total: 0 };
  }
}

export async function adminUpdateVendorKYC(vendorId: string, status: 'APPROVED' | 'REJECTED' | 'PENDING', notes?: string): Promise<{ success: boolean; message?: string }> {
  try {
    const data = await adminFetch(`/admin/vendors/${vendorId}/kyc`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    });
    return { success: data.success, message: data.message };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function adminToggleVendorFraud(vendorId: string, isFraud: boolean): Promise<{ success: boolean; message?: string }> {
  try {
    const data = await adminFetch(`/admin/vendors/${vendorId}/fraud`, {
      method: 'PUT',
      body: JSON.stringify({ isFraud }),
    });
    return { success: data.success, message: data.message };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}


export async function adminDeleteUser(userId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const data = await adminFetch(`/admin/users/${userId}`, { method: 'DELETE' });
    return { success: data.success, message: data.message };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function adminDeleteVendor(vendorId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const data = await adminFetch(`/admin/vendors/${vendorId}`, { method: 'DELETE' });
    return { success: data.success, message: data.message };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function adminDeleteLender(lenderId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const data = await adminFetch(`/admin/lenders/${lenderId}`, { method: 'DELETE' });
    return { success: data.success, message: data.message };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function adminFetchLenders(params?: { page?: number; limit?: number; status?: string }): Promise<{ lenders: any[]; total: number }> {
  try {
    const q = new URLSearchParams();
    if (params?.page) q.append('page', String(params.page));
    if (params?.limit) q.append('limit', String(params.limit));
    if (params?.status) q.append('status', params.status);
    const data = await adminFetch(`/admin/lenders?${q.toString()}`);
    const lendersList = Array.isArray(data.data) ? data.data : (data.data?.lenders || []);
    return { lenders: lendersList, total: data.count || data.data?.total || lendersList.length };
  } catch (err: any) {
    console.error('adminFetchLenders error:', err.message);
    return { lenders: [], total: 0 };
  }
}

export async function adminUpdateLenderVerification(lenderId: string, status: 'VERIFIED' | 'REJECTED' | 'PENDING', notes?: string): Promise<{ success: boolean; message?: string }> {
  try {
    // Actual backend route: PUT /admin/lenders/:lenderId/verification
    const data = await adminFetch(`/admin/lenders/${lenderId}/verification`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    });
    return { success: data.success, message: data.message };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function adminGrantSubscription(userId: string, planCode: string, durationDays: number): Promise<{ success: boolean; message?: string }> {
  try {
    // Actual backend route: POST /admin/grant-subscription
    const data = await adminFetch('/admin/grant-subscription', {
      method: 'POST',
      body: JSON.stringify({ userId, planCode, durationDays }),
    });
    return { success: data.success, message: data.message };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function adminFetchSupportTickets(): Promise<any[]> {
  try {
    // Actual backend route: GET /admin/tickets
    const data = await adminFetch('/admin/tickets');
    return data.data?.tickets || data.data || [];
  } catch {
    return [];
  }
}

export async function adminUpdatePlatformSetting(key: string, value: string): Promise<{ success: boolean }> {
  try {
    // Actual backend route: POST /admin/settings
    const data = await adminFetch('/admin/settings', {
      method: 'POST',
      body: JSON.stringify({ key, value }),
    });
    return { success: data.success };
  } catch {
    return { success: false };
  }
}

export async function adminCreateSubscriptionPlan(payload: any): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const data = await adminFetch('/admin/subscription-plans', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return { success: data.success, data: data.data, message: data.message };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function adminUpdateSubscriptionPlan(planId: string, payload: any): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const data = await adminFetch(`/admin/subscription-plans/${planId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return { success: data.success, data: data.data, message: data.message };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function adminDeleteSubscriptionPlan(planId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const data = await adminFetch(`/admin/subscription-plans/${planId}`, {
      method: 'DELETE',
    });
    return { success: data.success, message: data.message };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function adminFetchPayments(): Promise<{ payments: any[] }> {
  try {
    const data = await adminFetch('/admin/payments');
    return { payments: data.data || [] };
  } catch (err: any) {
    return { payments: [] };
  }
}

// Legacy export alias kept for compatibility
export const mockLendersList: Lender[] = [];
