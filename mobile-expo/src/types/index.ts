export type Role = 'VENDOR' | 'LENDER' | 'SUPER_ADMIN';
export type UserRole = Role;

export interface User {
  id: string;
  email?: string;
  phone: string;
  role: Role;
  name?: string;
  fullName?: string;
  isVerified?: boolean;
  walletBalance?: number;
  referralCode?: string;
  referredBy?: string;
  hasActiveSubscription?: boolean;
  pushToken?: string;
  vendorProfile?: VendorProfile;
  lenderProfile?: LenderProfile;
  activeSubscription?: UserSubscription;
}

export interface VendorProfile {
  id: string;
  userId: string;
  businessName: string;
  ownerName: string;
  fullName?: string;
  category?: string;
  businessType?: string;
  registrationType?: string;
  address: string;
  place?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  dailyTurnover?: number;
  monthlyRevenue?: number;
  annualTurnover?: string;
  loanRequirement?: number;
  panNumber?: string;
  aadhaarNumber?: string;
  gstNumber?: string;
  panFileUrl?: string;
  aadhaarFileUrl?: string;
  businessLicenseUrl?: string;
  gstFileUrl?: string;
  shopPhotoUrl?: string;
  shopPhotos?: string[];
  liveSelfieUrl?: string;
  avatarUrl?: string;
  kycStatus?: 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'APPROVED' | 'REJECTED' | string;
}

export interface LenderProfile {
  id: string;
  userId: string;
  institutionName: string;
  institutionType?: string;
  contactPersonName: string;
  registrationNumber?: string;
  loanCategories?: string[];
  loanTypesOffered?: string[];
  minLoanAmount: number;
  maxLoanAmount: number;
  minInterestRate?: number;
  interestRateMin?: number;
  interestRateMax?: number;
  lendingRadiusKm?: number;
  address: string;
  place?: string;
  city: string;
  state: string;
  country?: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  rating?: number;
  reviewCount?: number;
  successRate?: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  logoUrl?: string;
  kycStatus?: 'NOT_SUBMITTED' | 'PENDING' | 'VERIFIED' | 'APPROVED' | 'REJECTED' | string;
  isVerified?: boolean;
}

export interface Lender {
  id: string;
  institutionName: string;
  institutionType: 'Bank' | 'NBFC' | 'Financial Institution' | 'Money Financer' | 'Commercial Partner' | string;
  logoUrl?: string;
  avatarUrl?: string;
  registrationNumber?: string;
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

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  plan?: {
    id: string;
    name: string;
    durationDays: number;
    price: number;
  };
}

export interface SubscriptionPlan {
  id: string;
  code: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  durationDays: number;
  durationLabel?: string;
  features: string[];
  isPopular?: boolean;
  isBestValue?: boolean;
  roleTarget: 'VENDOR' | 'LENDER' | 'BOTH';
}

export interface VendorLead {
  id: string;
  vendorId?: string;
  vendorName: string;
  shopName: string;
  shopAddress: string;
  place?: string;
  city: string;
  state: string;
  latitude?: number;
  longitude?: number;
  requestedDate: string;
  requestedTime?: string;
  status: 'Pending' | 'Verified' | 'Accepted' | 'Rejected' | string;
  inquiryType?: 'LOAN_APPLICATION' | 'PHONE_CALL' | 'WHATSAPP';
  inquiryMessage?: string;
  isFraud?: boolean;
  mobileNumber: string;
  emailId?: string;
  panNumber?: string;
  aadhaarNumber?: string;
  gstNumber?: string;
  shopType?: string;
  yearsInBusiness?: string;
  requiredAmount?: string | number;
  monthlyIncome?: string | number;
  annualIncome?: string;
  annualTurnover?: string;
  bankAccountDetails?: string;
  lenderId?: string;
  lenderName?: string;
  lenderPhone?: string;
  lender?: {
    id?: string;
    institutionName?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    latitude?: number;
    longitude?: number;
    user?: {
      phone?: string;
      email?: string;
    };
  };
  avatarUrl?: string;
  liveSelfieUrl?: string;
  panFileUrl?: string | null;
  aadhaarFileUrl?: string | null;
  shopLicensePdf?: string | null;
  gstCertificatePdf?: string | null;
  shopPhotoUrl?: string;
  shopPhotos?: string[];
  shopImages?: string[];
  createdAt?: string;
}

export interface DiscoveredBusiness {
  id: string;
  vendorName: string;
  shopName: string;
  shopAddress: string;
  city: string;
  state: string;
  place?: string;
  category?: string;
  annualTurnover?: string;
  monthlyIncome?: string;
  mobileNumber?: string;
  emailId?: string;
  dateOfBirth?: string;
  panNumber?: string;
  aadhaarNumber?: string;
  gstNumber?: string;
  isFraud?: boolean;
  avatarUrl?: string | null;
  liveSelfieUrl?: string | null;
  panFileUrl?: string | null;
  aadhaarFileUrl?: string | null;
  shopLicensePdf?: string | null;
  gstCertificatePdf?: string | null;
  shopPhotoUrl?: string | null;
  shopPhotos?: string[];
  distanceKm?: number;
  isWithinRadius?: boolean;
  latitude?: number;
  longitude?: number;
}

export interface WalletTransactionItem {
  id: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  source: string;
  balanceAfter: number;
  description?: string;
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

export interface FraudReportItem {
  id: string;
  vendorName?: string;
  shopName?: string;
  vendorPhone?: string;
  reason: string;
  evidenceUrl?: string;
  status?: string;
  reportedAt?: string;
  createdAt?: string;
}
