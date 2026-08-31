export type Role = 'VENDOR' | 'LENDER' | 'SUPER_ADMIN';

export interface User {
  id: string;
  email: string;
  phone: string;
  role: Role;
  isVerified: boolean;
  name: string;
  referralCode?: string;
  walletBalance?: number;
  hasActiveSubscription?: boolean;
}

export interface WalletTransactionItem {
  id: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  source: string;
  balanceAfter: number;
  description?: string;
  referenceId?: string;
  createdAt: string;
}

export interface ReferralRecordItem {
  id: string;
  refereeName: string;
  refereeRole: string;
  referralCode: string;
  status: string;
  planName: string;
  rewardAmount: number;
  joinedAt: string;
  rewardedAt?: string;
}

export interface ReferralInfoData {
  referralCode: string;
  walletBalance: number;
  totalEarned: number;
  totalRedeemed: number;
  totalInvited: number;
  completedConversions: number;
  referrals: ReferralRecordItem[];
  recentTransactions: WalletTransactionItem[];
}

export interface PlanReferralRule {
  id: string;
  name: string;
  code: string;
  roleTarget: string;
  price: number;
  durationDays: number;
  referrerReward: number;
  refereeReward: number;
  adminShare: number;
  referralEnabled: boolean;
  isActive: boolean;
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
  successRate?: string;
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
  gstNumber?: string;
  shopType?: string;
  yearsInBusiness?: string;
  shopImages?: string[];
  shopLicensePdf?: string;
  gstCertificatePdf?: string;
  businessLicenseUrl?: string;
  gstFileUrl?: string;
  requiredAmount?: string;
  monthlyIncome?: string;
  annualIncome?: string;
  annualTurnover?: string;
  lenderId?: string;
  lenderName?: string;
  bankAccountDetails?: string;
  avatarUrl?: string;
  panFileUrl?: string;
  aadhaarFileUrl?: string;
  shopPhotoUrl?: string;
  shopPhotos?: string[];
  liveSelfieUrl?: string;
}

export interface SubscriptionPlan {
  id: string;
  code:
    | 'WEEKLY'
    | 'MONTHLY'
    | 'QUARTERLY'
    | 'HALF_YEARLY'
    | 'YEARLY'
    | 'VENDOR_WEEKLY'
    | 'VENDOR_MONTHLY'
    | 'VENDOR_QUARTERLY'
    | 'VENDOR_YEARLY'
    | 'LENDER_WEEKLY'
    | 'LENDER_MONTHLY'
    | 'LENDER_QUARTERLY'
    | 'LENDER_ANNUAL'
    | string;
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
