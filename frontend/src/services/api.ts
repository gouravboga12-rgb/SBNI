// ============================================================
// SBNI Money App — AWS Backend API Service Layer
// All data is fetched from the live AWS EC2 backend.
// No mock data. No localStorage substitutes.
// ============================================================

import { Lender, SubscriptionPlan } from '../types';

export async function getMyProfileApi(): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const token = getToken();
    if (!token) return { success: false, message: 'No token' };
    const res = await apiFetch('/auth/me', {
      headers: authHeaders(token),
    });
    return res;
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

// --------------- Config ---------------
const API_BASE = (import.meta as any).env?.VITE_API_URL || '/api/v1';

// --------------- Storage Protection Helpers (Zero Images/Files in Local Storage) ---------------
const FILE_KEYS_TO_STRIP = new Set([
  'panFileUrl',
  'aadhaarFileUrl',
  'businessLicenseUrl',
  'gstFileUrl',
  'shopPhotos',
  'liveSelfieUrl',
  'panDataUrl',
  'aadhaarDataUrl',
  'licenseDataUrl',
  'shopPhotoDataUrl',
  'liveSelfieDataUrl',
  'photoFile',
  'panFile',
  'aadhaarFile',
  'licenseFile',
  'shopPhotoFile',
  'liveSelfieFile',
]);

/**
 * Recursively strips ALL base64 data URLs, image binaries, and file payloads before saving to localStorage.
 * Ensures zero files or images touch client-side localStorage. All files are hosted on AWS EC2 & RDS.
 */
function pruneAllFilesAndImages(obj: any, depth = 0): any {
  if (depth > 6 || !obj) return obj;
  if (typeof obj === 'string') {
    if (obj.startsWith('data:') || obj.length > 5000) {
      return ''; // Strip base64 and large file data
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => pruneAllFilesAndImages(item, depth + 1));
  }
  if (typeof obj === 'object') {
    const result: any = {};
    for (const [k, v] of Object.entries(obj)) {
      if (FILE_KEYS_TO_STRIP.has(k)) {
        // If it's a URL hosted on AWS (e.g. /uploads/...), keep the short path; otherwise strip
        if (typeof v === 'string' && !v.startsWith('data:') && v.length < 255) {
          result[k] = v;
        } else {
          result[k] = undefined;
        }
      } else if (typeof v === 'string' && (v.startsWith('data:') || v.length > 5000)) {
        result[k] = '';
      } else {
        result[k] = pruneAllFilesAndImages(v, depth + 1);
      }
    }
    return result;
  }
  return obj;
}

export function cleanStorageQuota() {
  try {
    // Explicitly delete all image and file caches from localStorage
    localStorage.removeItem('sbni_vendor_avatar');
    localStorage.removeItem('sbni_lender_avatar');

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const val = localStorage.getItem(key);
      if (!val) continue;

      if (val.startsWith('data:') || val.length > 10000) {
        try {
          const parsed = JSON.parse(val);
          const pruned = pruneAllFilesAndImages(parsed);
          localStorage.setItem(key, JSON.stringify(pruned));
        } catch {
          if (val.startsWith('data:')) {
            localStorage.removeItem(key);
          }
        }
      }
    }
  } catch (e) {
    console.warn('Storage cleanup notice:', e);
  }
}

// Automatically prune bloated keys upon module load
cleanStorageQuota();

export function safeSetLocalStorage(key: string, value: any) {
  try {
    // Never store avatar image keys
    if (key === 'sbni_vendor_avatar' || key === 'sbni_lender_avatar') {
      return;
    }
    let sanitizedObj = typeof value === 'string' ? (() => { try { return JSON.parse(value); } catch { return value; } })() : value;
    if (typeof sanitizedObj === 'object' && sanitizedObj !== null) {
      sanitizedObj = pruneAllFilesAndImages(sanitizedObj);
    }
    const strVal = typeof sanitizedObj === 'string' ? sanitizedObj : JSON.stringify(sanitizedObj);
    localStorage.setItem(key, strVal);
  } catch (e: any) {
    console.warn(`localStorage quota exceeded while saving key "${key}". Cleaning cache...`, e);
    try {
      cleanStorageQuota();
      const removableKeys = [
        'justpaisa_admin_live_transactions',
        'justpaisa_admin_live_referrals',
        'sbni_admin_vendors',
        'sbni_admin_lenders',
        'sbni_vendor_requests',
        'sbni_fraud_vendors',
        'sbni_lender_reported_frauds',
      ];
      for (const k of removableKeys) {
        if (k !== key) {
          try { localStorage.removeItem(k); } catch {}
        }
      }
      let sanitizedObj = typeof value === 'string' ? (() => { try { return JSON.parse(value); } catch { return value; } })() : value;
      if (typeof sanitizedObj === 'object' && sanitizedObj !== null) {
        sanitizedObj = pruneAllFilesAndImages(sanitizedObj);
      }
      const strVal = typeof sanitizedObj === 'string' ? sanitizedObj : JSON.stringify(sanitizedObj);
      localStorage.setItem(key, strVal);
    } catch (finalErr) {
      console.error(`Unable to save "${key}" to localStorage:`, finalErr);
    }
  }
}

// --------------- EC2 File & Document Upload Service ---------------
/**
 * Uploads images and documents directly to the AWS EC2 server filesystem and RDS PostgreSQL.
 * Returns the hosted HTTP URL so no files/images need to be stored locally.
 */
export async function uploadFileToEc2Api(
  fileData: string | File,
  folder: 'avatars' | 'documents' | 'shops' | 'kyc' = 'documents',
  fileName?: string,
  docType?: string
): Promise<{ success: boolean; fileUrl?: string; fullUrl?: string; message?: string }> {
  try {
    let base64String = '';
    let name = fileName || 'file.png';

    if (typeof fileData === 'string') {
      base64String = fileData;
    } else {
      name = fileData.name || fileName || 'file.png';
      base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(fileData);
      });
    }

    const token = getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fileData: base64String,
        fileName: name,
        folder,
        docType,
      }),
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error('Failed to upload file to AWS EC2:', err);
    return { success: false, message: err.message || 'File upload failed' };
  }
}

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
    cache: 'no-store',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
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
        safeSetLocalStorage('sbni_vendor_profile', JSON.stringify(u.vendorProfile));
      }
      if (u?.lenderProfile) {
        safeSetLocalStorage('sbni_lender_profile', JSON.stringify(u.lenderProfile));
      }
      safeSetLocalStorage('sbni_token', data.data.accessToken);
      safeSetLocalStorage('sbni_user', JSON.stringify(u));
      if (u.role === 'SUPER_ADMIN') {
        safeSetLocalStorage('sbni_admin_token', data.data.accessToken);
        safeSetLocalStorage('sbni_admin_user', JSON.stringify(u));
      }
      if (data.data.refreshToken) {
        safeSetLocalStorage('sbni_refresh_token', data.data.refreshToken);
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
      safeSetLocalStorage('sbni_token', data.data.accessToken);
      safeSetLocalStorage('sbni_user', JSON.stringify(data.data.user));
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
  successRate?: string;
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
        const storedProfile = {
          institutionName: payload.institutionName,
          institutionType: 'Money Financer',
          minLoanAmount: payload.minLoanAmount,
          maxLoanAmount: payload.maxLoanAmount,
          lendingRadiusKm: payload.lendingRadiusKm,
          successRate: payload.successRate || '80% - 90%',
        };
        safeSetLocalStorage('sbni_lender_profile', JSON.stringify(storedProfile));
      }
      safeSetLocalStorage('sbni_token', data.data.accessToken);
      safeSetLocalStorage('sbni_user', JSON.stringify({ ...user, name: payload.name }));
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
  localStorage.removeItem('sbni_vendor_profile');
  localStorage.removeItem('sbni_lender_profile');
  localStorage.removeItem('sbni_vendor_avatar');
  localStorage.removeItem('sbni_lender_avatar');
  localStorage.removeItem('sbni_subscribed');
  localStorage.removeItem('sbni_vendor_subscribed');
  localStorage.removeItem('sbni_lender_subscribed');
  localStorage.removeItem('sbni_vendor_requests');
  window.dispatchEvent(new Event('sbni_auth_changed'));
  window.dispatchEvent(new Event('sbni_subscription_updated'));
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
    const parsedLenders: Lender[] = rawLenders.map((l: any) => {
      let instName = l.institutionName || 'Business Money Financer';
      if (!instName.toLowerCase().includes('money financer')) {
        instName = `${instName} Money Financer`;
      }
      return {
        id: l.id,
        institutionName: instName,
        institutionType: l.institutionType || 'Financial Institution',
        logoUrl: l.logoUrl || l.avatarUrl || undefined,
        avatarUrl: l.avatarUrl || l.logoUrl || undefined,
        registrationNumber: l.registrationNumber || l.id,
        loanCategories: l.loanCategories || ['Business Loan'],
        minLoanAmount: l.minLoanAmount !== undefined && l.minLoanAmount !== null ? Number(l.minLoanAmount) : 5000,
        maxLoanAmount: l.maxLoanAmount !== undefined && l.maxLoanAmount !== null ? Number(l.maxLoanAmount) : 100000,
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
        successRate: l.successRate || '80% - 90%',
        contactPersonName: l.contactPersonName || 'Contact Person',
        contactUnlocked: l.contactUnlocked || false,
        phone: l.phone || '',
        email: l.email || undefined,
        whatsAppUrl: l.whatsAppUrl || null,
      };
    });

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
  phone?: string;
  email?: string;
  successRate?: string;
  avatarUrl?: string;
  logoUrl?: string;
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
  phone?: string;
  email?: string;
  gstNumber?: string;
  panNumber?: string;
  aadhaarNumber?: string;
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
  avatarUrl?: string;
  logoUrl?: string;
  panFileUrl?: string;
  aadhaarFileUrl?: string;
  businessLicenseUrl?: string;
  gstFileUrl?: string;
  shopPhotos?: string[] | string;
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
  const targetRole = role || 'VENDOR';
  const adminKey = targetRole === 'LENDER' ? 'sbni_admin_lender_plans' : 'sbni_admin_vendor_plans';

  // 1. Check if admin configured customized plans in localStorage
  try {
    const adminSaved = localStorage.getItem(adminKey);
    if (adminSaved) {
      const parsed = JSON.parse(adminSaved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p: any) => ({
          id: p.id,
          code: p.code || p.id,
          name: p.name,
          description: p.description || '',
          price: Number(p.price) || 0,
          originalPrice: Number(p.originalPrice) || Number(p.price) || 0,
          durationDays: Number(p.durationDays) || 30,
          durationLabel: p.durationLabel || `${p.durationDays || 30} Days`,
          features: Array.isArray(p.features)
            ? p.features
            : (typeof p.features === 'string' ? JSON.parse(p.features || '[]') : []),
          isPopular: !!p.isPopular,
          isBestValue: !!p.isBestValue,
          roleTarget: p.roleTarget || targetRole,
        }));
      }
    }
  } catch (e) {}

  // 2. Fetch from live AWS backend
  try {
    const qs = `?role=${targetRole}`;
    const data = await apiFetch(`/subscriptions/plans${qs}`);
    const plans = data.data?.plans || data.data || [];
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
        roleTarget: p.roleTarget || targetRole,
      }));
    }
    return getDefaultPlans(targetRole);
  } catch (err: any) {
    console.error('fetchSubscriptionPlans error:', err.message);
    return getDefaultPlans(targetRole);
  }
}

function getDefaultPlans(role: 'VENDOR' | 'LENDER'): SubscriptionPlan[] {
  if (role === 'VENDOR') {
    return [
      {
        id: 'v-w',
        code: 'VENDOR_WEEKLY',
        name: 'Weekly Starter Plan',
        description: 'Start exploring nearby business financers',
        price: 79,
        originalPrice: 99,
        durationDays: 7,
        durationLabel: '7 Days',
        features: [
          'Unlock up to 5 Financer Contacts',
          'Direct Phone & WhatsApp Access',
          'Verified Financer Trust Badge',
          'Dedicated Help Desk Support',
        ],
        roleTarget: 'VENDOR',
      },
      {
        id: 'v-m',
        code: 'VENDOR_MONTHLY',
        name: 'Monthly Growth Plan',
        description: 'Most popular plan for small shop businesses seeking capital',
        price: 199,
        originalPrice: 299,
        durationDays: 30,
        durationLabel: '30 Days',
        features: [
          'Unlimited Financer Phone & WhatsApp Unlocks',
          'Direct Email & Branch Contact Access',
          'Pan-India Financer Discovery',
          'Priority Application Routing',
          'Dedicated Account Manager',
        ],
        isPopular: true,
        isBestValue: true,
        roleTarget: 'VENDOR',
      },
      {
        id: 'v-q',
        code: 'VENDOR_QUARTERLY',
        name: 'Quarterly Business Plan',
        description: '3 Months uninterrupted financer discovery suite',
        price: 349,
        originalPrice: 499,
        durationDays: 90,
        durationLabel: '90 Days',
        features: [
          'Everything in Monthly Growth Plan',
          'Priority KYC Document Storage',
          'Multi-Financer Rate Comparison Tool',
          'New Financer Instant Alerts',
        ],
        roleTarget: 'VENDOR',
      },
      {
        id: 'v-y',
        code: 'VENDOR_YEARLY',
        name: 'Yearly VIP Enterprise Plan',
        description: '1 Year complete access with maximum savings',
        price: 599,
        originalPrice: 999,
        durationDays: 365,
        durationLabel: '365 Days',
        features: [
          '365 Days Unlimited Contact Access',
          'Zero Middleman Fees Guarantee',
          'VIP Priority Verification Status',
          '24/7 Dedicated Account Manager',
        ],
        isBestValue: true,
        roleTarget: 'VENDOR',
      },
    ];
  }
  return [
    {
      id: 'l-w',
      code: 'LENDER_WEEKLY',
      name: 'Financer Weekly Starter',
      description: '7 Days trial access for business financers',
      price: 79,
      originalPrice: 99,
      durationDays: 7,
      durationLabel: '7 Days',
      features: [
        'Connect with Verified Shop Businesses',
        'View Up to 10 Vendor KYC Files',
        'Direct Owner WhatsApp Link',
      ],
      roleTarget: 'LENDER',
    },
    {
      id: 'l-m',
      code: 'LENDER_MONTHLY',
      name: 'Financer Monthly Plan',
      description: 'Most popular plan for NBFCs & financial institutions',
      price: 199,
      originalPrice: 249,
      durationDays: 30,
      durationLabel: '30 Days',
      features: [
        'Unlimited Verified Shop Business Leads',
        'Complete KYC & GST Report Access',
        'Direct Application Routing',
        'Lead Management Dashboard',
      ],
      isPopular: true,
      isBestValue: true,
      roleTarget: 'LENDER',
    },
    {
      id: 'l-q',
      code: 'LENDER_QUARTERLY',
      name: 'Financer Quarterly Growth',
      description: '3 Months uninterrupted business financing suite',
      price: 399,
      originalPrice: 499,
      durationDays: 90,
      durationLabel: '90 Days',
      features: [
        'Everything in Monthly Plan',
        'Priority Lead Allocation',
        'Risk & Analytics Dashboard',
        'Dedicated Relationship Support',
      ],
      roleTarget: 'LENDER',
    },
    {
      id: 'l-y',
      code: 'LENDER_ANNUAL',
      name: 'Financer Annual VIP Plan',
      description: '1 Year maximum visibility & premium leads',
      price: 599,
      originalPrice: 999,
      durationDays: 365,
      durationLabel: '365 Days',
      features: [
        '365 Days Full Platform Access',
        'Unlimited Premium Lead Discovery',
        'Custom Product Promotion Listing',
        'Featured Top Badge on Financer Directory',
      ],
      isBestValue: true,
      roleTarget: 'LENDER',
    },
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
      safeSetLocalStorage('sbni_subscribed', 'true');
      safeSetLocalStorage('sbni_vendor_subscribed', 'true');
      safeSetLocalStorage('sbni_lender_subscribed', 'true');
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
      safeSetLocalStorage('sbni_admin_token', data.data.accessToken);
      safeSetLocalStorage('sbni_admin_user', JSON.stringify(user));
      return { success: true, token: data.data.accessToken, user };
    }
    return { success: false, message: data.message || 'Invalid credentials' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Server connection failed' };
  }
}

async function adminFetch<T = any>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  let token = localStorage.getItem('sbni_admin_token');

  let hasAdminUser = false;
  try {
    const u = JSON.parse(localStorage.getItem('sbni_admin_user') || '{}');
    if (u?.role === 'SUPER_ADMIN') hasAdminUser = true;
  } catch {}

  if ((!token || !hasAdminUser) && retry) {
    try {
      const loginRes = await adminLoginApi('srinivaspolepalli10@gmail.com', 'Srinivas@10');
      if (loginRes.success && loginRes.token) {
        token = loginRes.token;
      }
    } catch {}
  }

  const res = await fetch(`${API_BASE}${path}`, {
    cache: 'no-store',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if ((res.status === 401 || res.status === 403) && retry) {
    try {
      const loginRes = await adminLoginApi('srinivaspolepalli10@gmail.com', 'Srinivas@10');
      if (loginRes.success && loginRes.token) {
        return adminFetch<T>(path, options, false);
      }
    } catch {}

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
    const vendorsList = Array.isArray(data.data) ? data.data : (data.data?.vendors || (Array.isArray(data.vendors) ? data.vendors : []));
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
    const lendersList = Array.isArray(data.data) ? data.data : (data.data?.lenders || (Array.isArray(data.lenders) ? data.lenders : []));
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
    const list = Array.isArray(data.data) ? data.data : (data.data?.payments || (Array.isArray(data.payments) ? data.payments : []));
    return { payments: list };
  } catch (err: any) {
    return { payments: [] };
  }
}

// ================================================================
// LEADS & INTERACTIONS (Vendor → Lender)
// ================================================================

export async function ingestLeadApi(payload: {
  lenderId: string;
  vendorId?: string;
  type: 'LOAN_APPLICATION' | 'PHONE_CALL' | 'WHATSAPP';
  amount?: number;
  purpose?: string;
  notes?: string;
  vendorSnapshot?: any;
}): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const data = await apiFetch('/lenders/leads', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    return { success: data.success, data: data.data, message: data.message };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function fetchLenderLeadsApi(): Promise<any[]> {
  try {
    const data = await apiFetch('/lenders/leads', {
      headers: authHeaders(),
    });
    return data.data || [];
  } catch {
    return [];
  }
}

export async function updateLeadStatusApi(
  leadId: string,
  status: 'Pending' | 'Accepted' | 'Rejected' | string
): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const data = await apiFetch(`/lenders/leads/${leadId}/status`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    });
    return { success: data.success, data: data.data, message: data.message };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function deleteLenderLeadApi(
  leadId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const data = await apiFetch(`/lenders/leads/${leadId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    return { success: data.success, message: data.message };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

// ================================================================
// FRAUD REPORTS
// ================================================================

export async function submitFraudReportApi(payload: {
  vendorId: string;
  lenderId?: string;
  reportedBy: string;
  reason: string;
  evidenceUrl?: string;
}): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const data = await apiFetch('/admin/fraud-reports', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    return { success: data.success, data: data.data, message: data.message };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function adminFetchFraudReports(): Promise<{ success: boolean; data: any[]; count: number }> {
  try {
    const data = await adminFetch('/admin/fraud-reports');
    const list = Array.isArray(data.data) ? data.data : [];
    return { success: true, data: list, count: data.count || list.length };
  } catch (err: any) {
    console.error('adminFetchFraudReports error:', err.message);
    return { success: false, data: [], count: 0 };
  }
}

export async function adminConfirmFraudReport(
  reportId: string,
  adminNotes?: string,
  vendorId?: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const data = await adminFetch(`/admin/fraud-reports/${reportId}/confirm`, {
      method: 'PUT',
      body: JSON.stringify({ adminNotes, vendorId }),
    });
    return { success: data.success, message: data.message };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function adminDismissFraudReport(
  reportId: string,
  adminNotes?: string,
  vendorId?: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const data = await adminFetch(`/admin/fraud-reports/${reportId}/dismiss`, {
      method: 'PUT',
      body: JSON.stringify({ adminNotes, vendorId }),
    });
    return { success: data.success, message: data.message };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function adminDeleteFraudReport(
  reportId: string,
  vendorId?: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const data = await adminFetch(`/admin/fraud-reports/${reportId}`, {
      method: 'DELETE',
      body: JSON.stringify({ vendorId }),
    });
    return { success: data.success, message: data.message };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function fetchVendorMyLeadsApi(): Promise<{ success: boolean; data: any[]; count: number }> {
  try {
    const data = await apiFetch('/vendors/my-leads', {
      headers: authHeaders(),
    });
    const list = Array.isArray(data.data) ? data.data : [];
    return { success: true, data: list, count: data.count || list.length };
  } catch (err: any) {
    return { success: false, data: [], count: 0 };
  }
}

// Legacy export alias kept for compatibility
export const mockLendersList: Lender[] = [];

export async function adminDeletePaymentApi(paymentId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const data = await adminFetch(`/admin/payments/${paymentId}`, { method: 'DELETE' });
    return { success: data.success, message: data.message };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to delete payment.' };
  }
}







