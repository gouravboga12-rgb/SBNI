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
  institutionType: 'Bank' | 'NBFC' | 'Financial Institution';
  logoUrl?: string;
  registrationNumber: string;
  loanCategories: string[];
  minLoanAmount: number;
  maxLoanAmount: number;
  minInterestRate: number;
  address: string;
  city: string;
  state: string;
  pincode: string;
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
  city: string;
  state: string;
  requestedDate: string;
  requestedTime: string;
  status: 'Pending' | 'Verified' | 'Rejected';
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
