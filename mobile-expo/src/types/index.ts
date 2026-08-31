export type UserRole = 'VENDOR' | 'LENDER' | 'ADMIN';

export interface User {
  id: string;
  phone: string;
  email?: string;
  role: UserRole;
  name?: string;
  walletBalance: number;
  referralCode?: string;
  referredBy?: string;
  vendorProfile?: VendorProfile;
  lenderProfile?: LenderProfile;
  activeSubscription?: UserSubscription;
}

export interface VendorProfile {
  id: string;
  userId: string;
  businessName: string;
  ownerName: string;
  businessType: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  dailyTurnover?: number;
  monthlyRevenue?: number;
  loanRequirement?: number;
  kycStatus: 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
}

export interface LenderProfile {
  id: string;
  userId: string;
  institutionName: string;
  contactPersonName: string;
  loanTypesOffered: string[];
  minLoanAmount: number;
  maxLoanAmount: number;
  interestRateMin: number;
  interestRateMax: number;
  city: string;
  state: string;
  pincode: string;
  kycStatus: 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  isVerified?: boolean;
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  plan: {
    id: string;
    name: string;
    durationDays: number;
    price: number;
  };
}

export interface LoanRequestItem {
  id: string;
  vendorId: string;
  vendorName: string;
  shopName: string;
  amount: number;
  purpose: string;
  status: 'PENDING' | 'REVIEWING' | 'ACCEPTED' | 'REJECTED' | 'DISBURSED';
  createdAt: string;
  vendorPhone?: string;
}

export interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  price: number;
  originalPrice?: number;
  durationDays: number;
  roleTarget: 'VENDOR' | 'LENDER';
  features: string[];
  isPopular?: boolean;
  isBestValue?: boolean;
}
