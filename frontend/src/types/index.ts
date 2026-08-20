export type Role = 'VENDOR' | 'LENDER' | 'SUPER_ADMIN';

export interface User {
  id: string;
  email: string;
  phone: string;
  role: Role;
  isVerified: boolean;
  name: string;
  hasActiveSubscription?: boolean;
}

export interface Lender {
  id: string;
  institutionName: string;
  institutionType: 'Bank' | 'NBFC' | 'Financial Institution' | string;
  logoUrl?: string;
  registrationNumber: string;
  loanCategories: string[];
  minLoanAmount: number;
  maxLoanAmount: number;
  minInterestRate: number;
  address: string;
  place?: string;
  city: string;
  state: string;
  country?: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  lendingRadiusKm?: number;
  distanceKm: number;
  rating: number;
  reviewCount: number;
  contactPersonName: string;
  contactUnlocked: boolean;
  phone: string;
  email?: string;
  whatsAppUrl?: string | null;
}

export interface VendorVerificationRequest {
  id: string;
  vendorName: string;
  shopName: string;
  shopAddress: string;
  place?: string;
  city: string;
  state: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  lenderLatitude?: number;
  lenderLongitude?: number;
  requestedDate: string;
  requestedTime: string;
  status: 'Pending' | 'Verified' | 'Accepted' | 'Rejected' | string;
  inquiryType?: 'LOAN_APPLICATION' | 'PHONE_CALL' | 'WHATSAPP';
  inquiryMessage?: string;
  isFraud?: boolean;
  mobileNumber: string;
  emailId: string;
  dateOfBirth?: string;
  panNumber: string;
  aadhaarNumber: string;
  shopType?: string;
  yearsInBusiness?: string;
  shopImages?: string[];
  shopLicensePdf?: string;
  gstCertificatePdf?: string;
  requiredAmount?: string;
  monthlyIncome?: string;
  lenderId?: string;
  lenderName?: string;
  bankAccountDetails?: string;
  avatarUrl?: string;
  panFileUrl?: string;
  aadhaarFileUrl?: string;
  shopPhotoUrl?: string;
  liveSelfieUrl?: string;
}

export interface SubscriptionPlan {
  id: string;
  code: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY';
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  durationDays: number;
  durationLabel: string;
  features: string[];
  isPopular?: boolean;
  isBestValue?: boolean;
  roleTarget: 'VENDOR' | 'LENDER' | 'BOTH';
}

export interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export interface TestimonialItem {
  id: string;
  authorName: string;
  authorRole: string;
  companyName: string;
  avatarUrl: string;
  rating: number;
  quote: string;
}
