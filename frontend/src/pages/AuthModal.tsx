import React, { useState, useEffect } from 'react';
import { SBNILogo } from '../components/SBNILogo';
import {
  loginUser,
  registerVendor,
  registerLender,
  sendSignupOtpApi,
  verifySignupOtpApi,
  forgotPasswordRequestOtpApi,
  resetPasswordWithOtpApi,
  resendOtpApi,
  safeSetLocalStorage,
  uploadFileToEc2Api,
  updateVendorProfileApi,
  updateLenderProfileApi,
} from '../services/api';
import {
  X,
  User,
  Lock,
  Store,
  Building2,
  TrendingUp,
  ShieldCheck,
  Headphones,
  DollarSign,
  UserPlus,
  Eye,
  EyeOff,
  MapPin,
  Upload,
  FileText,
  CheckCircle2,
  Phone,
  Mail,
  AlertCircle,
  Camera,
  ArrowLeft,
  KeyRound,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { Role } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
  initialRole?: Role;
  initialRegister?: boolean;
  subscribeIntent?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialRole = 'VENDOR',
  initialRegister = false,
  subscribeIntent = false,
}) => {
  const [role, setRole] = useState<Role>(initialRole);
  const [isRegister, setIsRegister] = useState(initialRegister);
  const [viewStep, setViewStep] = useState<'SELECT' | 'FORM' | 'OTP_VERIFY' | 'FORGOT_PASSWORD'>('SELECT');

  // Form error & success states
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login Form States
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Vendor Registration Specific Form States
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');

  // File Uploads
  const [panFile, setPanFile] = useState<File | null>(null);
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [shopPhotoFile, setShopPhotoFile] = useState<File | null>(null);
  const [liveSelfieFile, setLiveSelfieFile] = useState<File | null>(null);

  // Registration Passwords with Eye Toggles
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP Verification States (for Vendor & Lender Sign Up)
  const [signupOtp, setSignupOtp] = useState('');
  const [otpTargetEmail, setOtpTargetEmail] = useState('');
  const [otpTargetName, setOtpTargetName] = useState('');
  const [pendingVendorData, setPendingVendorData] = useState<any>(null);
  const [pendingLenderData, setPendingLenderData] = useState<any>(null);
  const [otpCountdown, setOtpCountdown] = useState(60);
  const [canResendOtp, setCanResendOtp] = useState(false);

  // Forgot Password States
  const [forgotStep, setForgotStep] = useState<'REQUEST' | 'RESET' | 'SUCCESS'>('REQUEST');
  const [forgotEmailOrPhone, setForgotEmailOrPhone] = useState('');
  const [forgotTargetEmail, setForgotTargetEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPass, setShowForgotNewPass] = useState(false);
  const [showForgotConfirmPass, setShowForgotConfirmPass] = useState(false);
  const [forgotCountdown, setForgotCountdown] = useState(60);
  const [canResendForgotOtp, setCanResendForgotOtp] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRole(initialRole || 'VENDOR');
      setIsRegister(!!initialRegister);
      setViewStep(initialRegister ? 'FORM' : 'SELECT');
      setFormError(null);
      setFormSuccess(null);
      setSignupOtp('');
      setForgotOtp('');
      setForgotStep('REQUEST');
    }
  }, [isOpen, initialRole, initialRegister]);

  // Timer for Sign Up OTP Countdown
  useEffect(() => {
    let timer: any;
    if (viewStep === 'OTP_VERIFY' && otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown((prev) => {
          if (prev <= 1) {
            setCanResendOtp(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [viewStep, otpCountdown]);

  // Timer for Forgot Password OTP Countdown
  useEffect(() => {
    let timer: any;
    if (viewStep === 'FORGOT_PASSWORD' && forgotStep === 'RESET' && forgotCountdown > 0) {
      timer = setInterval(() => {
        setForgotCountdown((prev) => {
          if (prev <= 1) {
            setCanResendForgotOtp(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [viewStep, forgotStep, forgotCountdown]);

  if (!isOpen) return null;

  const isVendor = role === 'VENDOR';
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit

  const handleFileSelect = (file: File | undefined, setter: (f: File | null) => void) => {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setFormError(`File "${file.name}" exceeds the 5MB limit. Please select a photo or document under 5MB.`);
      return;
    }
    setFormError(null);
    setter(file);
  };

  // ─── LOGIN HANDLER ────────────────────────────────────────────────────────
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      const result = await loginUser(emailOrPhone, loginPassword, role);
      if (result.success && result.user) {
        if (result.user.role !== role && result.user.role !== 'ADMIN') {
          setFormError(
            `This account is registered as a ${
              result.user.role === 'VENDOR'
                ? 'Small Shop / Local Startup Business'
                : 'Business Money Financer'
            }. Please log in using the correct portal.`
          );
          setIsSubmitting(false);
          return;
        }
        onAuthSuccess(result.user);
        onClose();
      } else {
        setFormError(result.message || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      setFormError('Connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── VENDOR SIGNUP: STEP 1 (Validate & Dispatch JustPaisa OTP) ─────────────
  const handleVendorRegisterFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (regPassword !== confirmPassword) {
      setFormError('Passwords do not match. Please verify your re-entered password.');
      return;
    }
    if (!photoFile) {
      setFormError('Please upload your passport size photo / profile photo to proceed.');
      return;
    }
    if (!panFile) {
      setFormError('Please upload your PAN card document to proceed.');
      return;
    }
    if (!aadhaarFile) {
      setFormError('Please upload your Aadhaar card document to proceed.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Send JustPaisa Sign Up OTP via SMTP
      const otpRes = await sendSignupOtpApi(email, 'VENDOR', fullName);
      if (otpRes.success) {
        setPendingVendorData({
          name: fullName,
          email,
          phone,
          password: regPassword,
          businessName,
          address,
          photoFile,
          panFile,
          aadhaarFile,
          licenseFile,
          shopPhotoFile,
          liveSelfieFile,
        });
        setOtpTargetEmail(email);
        setOtpTargetName(fullName);
        setOtpCountdown(60);
        setCanResendOtp(false);
        setSignupOtp('');
        setViewStep('OTP_VERIFY');
      } else {
        setFormError(otpRes.message || 'Failed to send OTP code to your email. Please try again.');
      }
    } catch (err: any) {
      setFormError('Failed to send verification code. Please check your internet connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── COMPLETE SIGN UP WITH VERIFIED OTP ─────────────────────────────────────
  const handleVerifyOtpAndCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!signupOtp || signupOtp.trim().length !== 6) {
      setFormError('Please enter the 6-digit OTP code sent to your email.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (role === 'VENDOR') {
        if (!pendingVendorData) {
          setFormError('Registration session expired. Please refill the form.');
          setViewStep('FORM');
          return;
        }

        const result = await registerVendor({
          name: pendingVendorData.name,
          email: pendingVendorData.email,
          phone: pendingVendorData.phone,
          password: pendingVendorData.password,
          businessName: pendingVendorData.businessName,
          address: pendingVendorData.address,
          otpCode: signupOtp.trim(),
        });

        if (result.success && result.user) {
          const fullUser = { ...result.user, name: pendingVendorData.name, fullName: pendingVendorData.name };

          // 1. Upload all verification files & photos directly to AWS EC2 Server
          let avatarEc2Url: string | undefined = undefined;
          let panEc2Url: string | undefined = undefined;
          let aadhaarEc2Url: string | undefined = undefined;
          let licenseEc2Url: string | undefined = undefined;
          let shopPhotoEc2Url: string | undefined = undefined;
          let liveSelfieEc2Url: string | undefined = undefined;

          try {
            if (pendingVendorData.photoFile) {
              const res = await uploadFileToEc2Api(pendingVendorData.photoFile, 'avatars', pendingVendorData.photoFile.name);
              if (res.success && res.fileUrl) avatarEc2Url = res.fileUrl;
            }
            if (pendingVendorData.panFile) {
              const res = await uploadFileToEc2Api(pendingVendorData.panFile, 'documents', pendingVendorData.panFile.name, 'PAN');
              if (res.success && res.fileUrl) panEc2Url = res.fileUrl;
            }
            if (pendingVendorData.aadhaarFile) {
              const res = await uploadFileToEc2Api(pendingVendorData.aadhaarFile, 'documents', pendingVendorData.aadhaarFile.name, 'AADHAAR');
              if (res.success && res.fileUrl) aadhaarEc2Url = res.fileUrl;
            }
            if (pendingVendorData.licenseFile) {
              const res = await uploadFileToEc2Api(pendingVendorData.licenseFile, 'documents', pendingVendorData.licenseFile.name, 'LICENSE');
              if (res.success && res.fileUrl) licenseEc2Url = res.fileUrl;
            }
            if (pendingVendorData.shopPhotoFile) {
              const res = await uploadFileToEc2Api(pendingVendorData.shopPhotoFile, 'shops', pendingVendorData.shopPhotoFile.name);
              if (res.success && res.fileUrl) shopPhotoEc2Url = res.fileUrl;
            }
            if (pendingVendorData.liveSelfieFile) {
              const res = await uploadFileToEc2Api(pendingVendorData.liveSelfieFile, 'avatars', pendingVendorData.liveSelfieFile.name, 'SELFIE');
              if (res.success && res.fileUrl) liveSelfieEc2Url = res.fileUrl;
            }
          } catch (uploadErr) {
            console.warn('File upload to AWS EC2 notice:', uploadErr);
          }

          // 2. Persist hosted AWS URLs into RDS PostgreSQL
          try {
            await updateVendorProfileApi({
              ownerName: pendingVendorData.name,
              businessName: pendingVendorData.businessName,
              phone: pendingVendorData.phone,
              email: pendingVendorData.email,
              address: pendingVendorData.address,
              city: pendingVendorData.city || 'Hyderabad',
              state: pendingVendorData.state || 'Telangana',
              pincode: pendingVendorData.pincode || '500001',
              panNumber: pendingVendorData.panNumber || 'PAN Verified',
              aadhaarNumber: pendingVendorData.aadhaarNumber || 'Aadhaar Verified',
              gstNumber: pendingVendorData.gstNumber,
              avatarUrl: avatarEc2Url || liveSelfieEc2Url || shopPhotoEc2Url,
              panFileUrl: panEc2Url,
              aadhaarFileUrl: aadhaarEc2Url,
              businessLicenseUrl: licenseEc2Url,
              gstFileUrl: licenseEc2Url,
              shopPhotos: shopPhotoEc2Url ? [shopPhotoEc2Url] : undefined,
            });
          } catch (syncErr) {
            console.warn('Failed to sync vendor profile to RDS:', syncErr);
          }

          const cleanProfile = {
            fullName: pendingVendorData.name,
            ownerName: pendingVendorData.name,
            phone: pendingVendorData.phone,
            email: pendingVendorData.email,
            businessName: pendingVendorData.businessName,
            address: pendingVendorData.address,
            city: pendingVendorData.city || 'Hyderabad',
            state: pendingVendorData.state || 'Telangana',
            pincode: pendingVendorData.pincode || '500001',
            panFileName: pendingVendorData.panFile?.name || 'PAN_Card_Verified.pdf',
            panNumber: pendingVendorData.panNumber || 'PAN Verified',
            aadhaarFileName: pendingVendorData.aadhaarFile?.name || 'Aadhaar_Card_Verified.pdf',
            aadhaarNumber: pendingVendorData.aadhaarNumber || 'Aadhaar Verified',
            gstNumber: pendingVendorData.gstNumber || undefined,
            licenseFileName: pendingVendorData.licenseFile?.name || undefined,
            avatarUrl: avatarEc2Url || liveSelfieEc2Url || shopPhotoEc2Url || undefined,
            panFileUrl: panEc2Url || undefined,
            aadhaarFileUrl: aadhaarEc2Url || undefined,
            businessLicenseUrl: licenseEc2Url || undefined,
            gstFileUrl: licenseEc2Url || undefined,
            shopLicensePdf: licenseEc2Url || undefined,
            gstCertificatePdf: licenseEc2Url || undefined,
            shopPhotoUrl: shopPhotoEc2Url || undefined,
            shopPhotos: shopPhotoEc2Url ? [shopPhotoEc2Url] : [],
            liveSelfieUrl: liveSelfieEc2Url || undefined,
          };

          fullUser.vendorProfile = cleanProfile;
          safeSetLocalStorage('sbni_user', JSON.stringify(fullUser));
          safeSetLocalStorage('sbni_vendor_profile', JSON.stringify(cleanProfile));

          onAuthSuccess(fullUser);
          onClose();
        } else {
          setFormError(result.message || 'Registration failed. Please try again.');
        }
      } else {
        // LENDER Registration completion
        if (!pendingLenderData) {
          setFormError('Registration session expired. Please refill the form.');
          setViewStep('FORM');
          return;
        }

        const result = await registerLender({
          ...pendingLenderData,
          successRate: pendingLenderData.successRate || '80% - 90%',
          otpCode: signupOtp.trim(),
        });

        if (result.success && result.user) {
          let lenderAvatarEc2Url: string | undefined = undefined;
          if (pendingLenderData.avatarUrl && pendingLenderData.avatarUrl.startsWith('data:')) {
            try {
              const res = await uploadFileToEc2Api(pendingLenderData.avatarUrl, 'avatars', 'lender_avatar.png');
              if (res.success && res.fileUrl) lenderAvatarEc2Url = res.fileUrl;
            } catch (e) {}
          }

          const userWithProfile = {
            ...result.user,
            name: pendingLenderData.name,
            fullName: pendingLenderData.name,
            lenderProfile: result.user.lenderProfile || {
              institutionName: pendingLenderData.institutionName,
              contactPersonName: pendingLenderData.name,
              minLoanAmount: pendingLenderData.minLoanAmount,
              maxLoanAmount: pendingLenderData.maxLoanAmount,
              lendingRadiusKm: pendingLenderData.lendingRadiusKm,
              successRate: pendingLenderData.successRate || '80% - 90%',
              city: pendingLenderData.city,
              state: pendingLenderData.state,
              address: pendingLenderData.address,
              pincode: pendingLenderData.pincode,
              avatarUrl: lenderAvatarEc2Url,
            },
          };

          if (lenderAvatarEc2Url) {
            updateLenderProfileApi({
              avatarUrl: lenderAvatarEc2Url,
              logoUrl: lenderAvatarEc2Url,
              institutionName: pendingLenderData.institutionName,
            }).catch(() => {});
          }

          safeSetLocalStorage('sbni_user', JSON.stringify(userWithProfile));
          safeSetLocalStorage('sbni_lender_profile', JSON.stringify(userWithProfile.lenderProfile));
          onAuthSuccess(userWithProfile);
          onClose();
        } else {
          setFormError(result.message || 'Lender registration failed. Please try again.');
        }
      }
    } catch (err: any) {
      setFormError(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── RESEND SIGNUP OTP ──────────────────────────────────────────────────────
  const handleResendSignupOtp = async () => {
    if (!canResendOtp || !otpTargetEmail) return;
    setFormError(null);
    try {
      const res = await resendOtpApi(otpTargetEmail, 'SIGNUP', role, otpTargetName);
      if (res.success) {
        setOtpCountdown(60);
        setCanResendOtp(false);
        setFormSuccess(`A fresh verification code was sent to ${otpTargetEmail}`);
        setTimeout(() => setFormSuccess(null), 4000);
      } else {
        setFormError(res.message || 'Failed to resend code.');
      }
    } catch (err: any) {
      setFormError('Failed to resend code.');
    }
  };

  // ─── FORGOT PASSWORD: STEP 1 (Request Reset OTP) ───────────────────────────
  const handleForgotPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!forgotEmailOrPhone.trim()) {
      setFormError('Please enter your registered Email or Mobile number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await forgotPasswordRequestOtpApi(forgotEmailOrPhone.trim(), role);
      if (res.success && res.email) {
        setForgotTargetEmail(res.email);
        setForgotStep('RESET');
        setForgotCountdown(60);
        setCanResendForgotOtp(false);
        setForgotOtp('');
        setForgotNewPassword('');
        setForgotConfirmPassword('');
      } else {
        setFormError(res.message || 'No registered account found with those details.');
      }
    } catch (err: any) {
      setFormError('Error sending reset code. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── FORGOT PASSWORD: STEP 2 (Verify OTP & Reset Password) ───────────────────
  const handleForgotPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!forgotOtp || forgotOtp.trim().length !== 6) {
      setFormError('Please enter the 6-digit OTP code sent to your email.');
      return;
    }
    if (forgotNewPassword.length < 6) {
      setFormError('New password must be at least 6 characters.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setFormError('New passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await resetPasswordWithOtpApi(forgotTargetEmail, forgotOtp.trim(), forgotNewPassword);
      if (res.success) {
        setForgotStep('SUCCESS');
      } else {
        setFormError(res.message || 'Failed to reset password. Please check the code.');
      }
    } catch (err: any) {
      setFormError('Failed to reset password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── RESEND FORGOT PASSWORD OTP ───────────────────────────────────────────
  const handleResendForgotOtp = async () => {
    if (!canResendForgotOtp || !forgotTargetEmail) return;
    setFormError(null);
    try {
      const res = await resendOtpApi(forgotTargetEmail, 'FORGOT_PASSWORD', role);
      if (res.success) {
        setForgotCountdown(60);
        setCanResendForgotOtp(false);
        setFormSuccess(`A fresh reset OTP was sent to ${forgotTargetEmail}`);
        setTimeout(() => setFormSuccess(null), 4000);
      } else {
        setFormError(res.message || 'Failed to resend code.');
      }
    } catch (err: any) {
      setFormError('Failed to resend code.');
    }
  };

  const passwordsMatch = regPassword.length > 0 && confirmPassword.length > 0 && regPassword === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && regPassword !== confirmPassword;
  const forgotPasswordsMatch = forgotNewPassword.length > 0 && forgotConfirmPassword.length > 0 && forgotNewPassword === forgotConfirmPassword;
  const forgotPasswordsMismatch = forgotConfirmPassword.length > 0 && forgotNewPassword !== forgotConfirmPassword;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      {/* Modal Container */}
      <div
        className={`relative w-full ${
          isRegister && isVendor && viewStep === 'FORM' ? 'max-w-2xl' : 'max-w-md'
        } bg-white rounded-3xl shadow-2xl border border-slate-200 my-auto max-h-[92vh] flex flex-col overflow-y-auto overflow-x-hidden transition-all duration-300`}
      >
        {/* Top Decorative Swoosh Accent Wave */}
        <div
          className={`absolute top-0 left-0 w-36 h-36 rounded-br-full opacity-90 pointer-events-none transition-colors ${
            isVendor ? 'bg-gradient-to-br from-[#003893] to-[#002669]' : 'bg-gradient-to-br from-[#007a33] to-[#005724]'
          }`}
        />

        {/* Bottom Decorative Swoosh Accent Wave */}
        <div
          className={`absolute bottom-0 right-0 w-36 h-36 rounded-tl-full opacity-90 pointer-events-none transition-colors ${
            isVendor ? 'bg-gradient-to-br from-[#003893] to-[#001f54]' : 'bg-gradient-to-br from-[#007a33] to-[#00471d]'
          }`}
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-100/90 border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors shadow-sm"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ========================================================================= */}
        {/* STEP 1: LANDING ACCOUNT SELECTION VIEW                                   */}
        {/* ========================================================================= */}
        {viewStep === 'SELECT' && (
          <div className="p-6 sm:p-8 relative z-10 space-y-6">
            <div className="flex flex-col items-center justify-center text-center space-y-2 pt-2">
              <div className="flex justify-center">
                <SBNILogo imgClassName="h-16 sm:h-20 w-auto object-contain drop-shadow-sm" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold font-heading text-slate-900 tracking-tight">
                  Welcome to JustPaisa
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Choose your account type below to Login or Sign Up
                </p>
              </div>
            </div>

            {/* Subscribe Intent Alert Banner */}
            {subscribeIntent && (
              <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 flex items-start gap-3 shadow-xs animate-in fade-in duration-300">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 mt-0.5 shadow-xs">
                  <Zap className="w-4.5 h-4.5 fill-current" />
                </div>
                <div className="text-xs space-y-0.5">
                  <div className="font-extrabold text-slate-900 text-sm">
                    Please Login to Subscribe
                  </div>
                  <p className="text-slate-700 font-medium leading-relaxed">
                    To choose and pay for a subscription plan, please select whether you are logging in as a <span className="font-extrabold text-[#003893]">Small Shop Business, Local Startup Business (Customer/Vendor)</span> or a <span className="font-extrabold text-[#007a33]">Business Money Financer (Lender)</span>:
                  </p>
                </div>
              </div>
            )}

            {/* Small Shop Business, Local Startup Business */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-blue-50/90 via-slate-50 to-blue-50/40 border-2 border-blue-200/80 shadow-md space-y-4 hover:border-[#003893] transition-all">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#003893] text-white flex items-center justify-center shrink-0 shadow-md">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#003893] font-heading leading-snug">
                    Small Shop Business, Local Startup Business
                  </h3>
                  <p className="text-xs text-slate-600 font-medium mt-0.5 leading-relaxed">
                    Any small shop business or local startup business can login to check nearby business financers for money
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setRole('VENDOR');
                    setIsRegister(false);
                    setViewStep('FORM');
                    setFormError(null);
                  }}
                  className="py-3 px-3 rounded-xl bg-[#003893] hover:bg-[#002669] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-[0.98]"
                >
                  <User className="w-4 h-4 shrink-0" /> Login as Shop / Startup Owner
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRole('VENDOR');
                    setIsRegister(true);
                    setViewStep('FORM');
                    setFormError(null);
                  }}
                  className="py-3 px-3 rounded-xl bg-white hover:bg-blue-50 text-[#003893] border-2 border-[#003893] font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
                >
                  <UserPlus className="w-4 h-4 shrink-0" /> Sign Up as Shop / Startup Owner
                </button>
              </div>
            </div>

            {/* Business Money Financer */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-emerald-50/90 via-slate-50 to-emerald-50/40 border-2 border-emerald-200/80 shadow-md space-y-4 hover:border-[#007a33] transition-all">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#007a33] text-white flex items-center justify-center shrink-0 shadow-md">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-[#007a33] font-heading leading-snug">
                    Business Money Financer
                  </h3>
                  <p className="text-xs text-slate-600 font-medium mt-0.5 leading-relaxed">
                    Sign up or login as a Business Money Financer to provide Business Money directly to verified small shop and local startup businesses nearby.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setRole('LENDER');
                    setIsRegister(false);
                    setViewStep('FORM');
                    setFormError(null);
                  }}
                  className="py-3 px-3 rounded-xl bg-[#007a33] hover:bg-[#005e27] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
                >
                  <User className="w-4 h-4 shrink-0" /> Login as Financer
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRole('LENDER');
                    setIsRegister(true);
                    setViewStep('FORM');
                    setFormError(null);
                  }}
                  className="py-3 px-3 rounded-xl bg-white hover:bg-emerald-50 text-[#007a33] border-2 border-[#007a33] font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
                >
                  <UserPlus className="w-4 h-4 shrink-0" /> Sign Up as Financer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: DEDICATED FORM VIEW (LOGIN / REGISTER)                           */}
        {/* ========================================================================= */}
        {viewStep === 'FORM' && (
          <div className="p-6 sm:p-8 relative z-10 space-y-5">
            {/* Back Navigation Bar */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setViewStep('SELECT');
                  setFormError(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors active:scale-95"
              >
                <ArrowLeft className="w-4 h-4 text-slate-500" />
                <span>← Back to Choose Account</span>
              </button>

              <div
                className="text-[10px] sm:text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border shadow-xs"
                style={{
                  backgroundColor: isVendor ? '#eff6ff' : '#ecfdf5',
                  borderColor: isVendor ? '#bfdbfe' : '#a7f3d0',
                  color: isVendor ? '#003893' : '#007a33',
                }}
              >
                {isVendor ? 'Small Shop / Local Startup Business' : 'Business Money Financer'}
              </div>
            </div>

            {/* Central Brand Logo & Title */}
            <div className="flex flex-col items-center justify-center pt-1 text-center space-y-2">
              <div className="flex justify-center">
                <SBNILogo imgClassName="h-16 sm:h-20 w-auto object-contain drop-shadow-sm" />
              </div>

              <div>
                <h2
                  className={`text-2xl font-extrabold font-heading tracking-tight ${
                    isVendor ? 'text-[#003893]' : 'text-[#007a33]'
                  }`}
                >
                  {isRegister
                    ? isVendor
                      ? 'Small Shop / Local Startup Business Sign Up'
                      : 'Business Money Financer Registration'
                    : isVendor
                    ? 'Small Shop / Local Startup Business Login'
                    : 'Business Money Financer Login'}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {isRegister
                    ? isVendor
                      ? 'Enter your business details & verification documents. We will verify your email with OTP.'
                      : 'Sign up as a Business Money Financer. We will verify your official email with OTP.'
                    : isVendor
                    ? 'Login as small shop business or local startup business owner to check nearby business financers for money'
                    : 'Login as Business Money Financer to provide Business Money directly to verified small businesses'}
                </p>
              </div>
            </div>

            {/* Error Banner */}
            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Success Banner */}
            {formSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            {/* LOGIN FORM MODE */}
            {!isRegister && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Mobile / Email Input */}
                <div>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Enter Mobile Number / Email"
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      required
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-[#003893] transition-colors"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      placeholder="Enter Password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="w-full pl-11 pr-11 py-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-[#003893] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Checkbox & Forgot Password Link */}
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className={`rounded border-slate-300 focus:ring-0 ${
                        isVendor ? 'text-[#003893]' : 'text-[#007a33]'
                      }`}
                    />
                    <span>Remember me</span>
                  </label>

                  {/* Forgot Password Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmailOrPhone(emailOrPhone);
                      setForgotStep('REQUEST');
                      setViewStep('FORGOT_PASSWORD');
                      setFormError(null);
                      setFormSuccess(null);
                    }}
                    className={`font-bold hover:underline ${
                      isVendor ? 'text-[#003893]' : 'text-[#007a33]'
                    }`}
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Login Action Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3.5 rounded-xl text-white font-extrabold text-base shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                    isVendor
                      ? 'bg-[#003893] hover:bg-[#002669]'
                      : 'bg-[#007a33] hover:bg-[#005e27]'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{' '}
                      Logging in...
                    </>
                  ) : (
                    'Login'
                  )}
                </button>
              </form>
            )}

            {/* VENDOR REGISTER FORM MODE */}
            {isRegister && isVendor && (
              <form onSubmit={handleVendorRegisterFormSubmit} className="space-y-4">
                {/* Personal & Contact Details */}
                <div className="space-y-3">
                  <div className="text-xs font-extrabold text-[#003893] uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
                    <User className="w-4 h-4" /> Personal & Contact Details
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Enter your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-[#003893] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="tel"
                          placeholder="e.g. +91 9876543210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-[#003893] transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Email ID (For OTP Verification) *</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          placeholder="name@business.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-[#003893] transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shop / Business Information */}
                <div className="space-y-3 pt-1">
                  <div className="text-xs font-extrabold text-[#003893] uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
                    <Store className="w-4 h-4" /> Shop / Business Information
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Shop / Business Name *</label>
                    <div className="relative">
                      <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. Kumar General & Retail Store"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-[#003893] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Address *</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <textarea
                        placeholder="Enter complete shop/business address manually (Plot/Shop No., Street, Area, City, Pincode)"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                        rows={3}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-[#003893] transition-colors resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Document Uploads */}
                <div className="space-y-3 pt-1">
                  <div className="text-xs font-extrabold text-[#003893] uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
                    <FileText className="w-4 h-4" /> Photo & KYC Document Uploads
                  </div>

                  <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
                        <Camera className="w-4 h-4 text-[#003893]" />
                        Passport Size Photo / Profile Photo *
                      </span>
                      {photoFile ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Uploaded
                        </span>
                      ) : (
                        <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          Required
                        </span>
                      )}
                    </div>
                    <label className="border-2 border-dashed border-blue-300 hover:border-[#003893] rounded-xl p-3 text-center cursor-pointer block bg-white transition-colors shadow-inner">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e.target.files?.[0], setPhotoFile)}
                        className="hidden"
                      />
                      {photoFile ? (
                        <div className="flex items-center justify-center gap-3">
                          <img
                            src={URL.createObjectURL(photoFile)}
                            alt="Vendor Photo Preview"
                            className="w-12 h-12 rounded-full object-cover border-2 border-[#003893] shadow-md"
                          />
                          <div className="text-left">
                            <div className="text-xs font-bold text-slate-900 truncate max-w-[200px]">
                              {photoFile.name}
                            </div>
                            <div className="text-[10px] text-emerald-600 font-semibold">Click to change photo</div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <Camera className="w-6 h-6 text-[#003893] mx-auto mb-1" />
                          <div className="text-xs font-bold text-slate-800">
                            Upload Vendor Photo (Passport Size) *
                          </div>
                          <div className="text-[9px] text-slate-400">JPG, PNG, WEBP up to 5MB</div>
                        </div>
                      )}
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* PAN Card */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-extrabold text-slate-800">PAN Card *</span>
                        {panFile ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Uploaded
                          </span>
                        ) : (
                          <span className="text-[10px] text-rose-600 font-bold">Required</span>
                        )}
                      </div>
                      <label className="border-2 border-dashed border-slate-300 hover:border-[#003893] rounded-xl p-2.5 text-center cursor-pointer block bg-white transition-colors">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileSelect(e.target.files?.[0], setPanFile)}
                          className="hidden"
                        />
                        <Upload className="w-5 h-5 text-[#003893] mx-auto mb-1" />
                        <div className="text-[11px] font-bold text-slate-700 truncate">
                          {panFile ? panFile.name : 'Upload PAN Card'}
                        </div>
                        <div className="text-[9px] text-slate-400">PDF, JPG, PNG up to 5MB</div>
                      </label>
                    </div>

                    {/* Aadhaar Card */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-extrabold text-slate-800">Aadhaar Card *</span>
                        {aadhaarFile ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Uploaded
                          </span>
                        ) : (
                          <span className="text-[10px] text-rose-600 font-bold">Required</span>
                        )}
                      </div>
                      <label className="border-2 border-dashed border-slate-300 hover:border-[#003893] rounded-xl p-2.5 text-center cursor-pointer block bg-white transition-colors">
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => handleFileSelect(e.target.files?.[0], setAadhaarFile)}
                          className="hidden"
                        />
                        <Upload className="w-5 h-5 text-[#003893] mx-auto mb-1" />
                        <div className="text-[11px] font-bold text-slate-700 truncate">
                          {aadhaarFile ? aadhaarFile.name : 'Upload Aadhaar Card'}
                        </div>
                        <div className="text-[9px] text-slate-400">PDF, JPG, PNG up to 5MB</div>
                      </label>
                    </div>
                  </div>

                  {/* Business License */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold text-slate-800">Business License / GST</span>
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                        Optional
                      </span>
                    </div>
                    <label className="border-2 border-dashed border-slate-300 hover:border-[#003893] rounded-xl p-2.5 text-center cursor-pointer block bg-white transition-colors">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileSelect(e.target.files?.[0], setLicenseFile)}
                        className="hidden"
                      />
                      <Upload className="w-5 h-5 text-[#003893] mx-auto mb-1" />
                      <div className="text-[11px] font-bold text-slate-700 truncate">
                        {licenseFile ? licenseFile.name : 'Upload Shop License / Trade License (Optional)'}
                      </div>
                      <div className="text-[9px] text-slate-400">PDF, JPG, PNG up to 5MB</div>
                    </label>
                  </div>

                  {/* Shop Photo */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold text-slate-800">Shop / Local Startup Business Photo</span>
                      {shopPhotoFile ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Uploaded
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                          Optional
                        </span>
                      )}
                    </div>
                    <label className="border-2 border-dashed border-slate-300 hover:border-[#003893] rounded-xl p-2.5 text-center cursor-pointer block bg-white transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e.target.files?.[0], setShopPhotoFile)}
                        className="hidden"
                      />
                      <Camera className="w-5 h-5 text-[#003893] mx-auto mb-1" />
                      <div className="text-[11px] font-bold text-slate-700 truncate">
                        {shopPhotoFile ? shopPhotoFile.name : 'Upload Shop / Business Photo (Optional)'}
                      </div>
                      <div className="text-[9px] text-slate-400">Shop Exterior / Interior Photo (Max 5MB)</div>
                    </label>
                  </div>

                  {/* Live Photo */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold text-slate-800">Live Photo in Front of Shop / Business</span>
                      {liveSelfieFile ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Uploaded
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                          Optional
                        </span>
                      )}
                    </div>
                    <label className="border-2 border-dashed border-slate-300 hover:border-[#003893] rounded-xl p-2.5 text-center cursor-pointer block bg-white transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        capture="user"
                        onChange={(e) => handleFileSelect(e.target.files?.[0], setLiveSelfieFile)}
                        className="hidden"
                      />
                      <div className="text-[11px] font-bold text-slate-700 truncate">
                        {liveSelfieFile ? liveSelfieFile.name : 'Live Photo with Person in Front (Optional)'}
                      </div>
                      <div className="text-[9px] text-slate-400">Person Standing in Front of Shop / Business (Max 5MB)</div>
                    </label>
                  </div>
                </div>

                {/* Account Security & Password */}
                <div className="space-y-3 pt-1">
                  <div className="text-xs font-extrabold text-[#003893] uppercase tracking-wider flex items-center gap-1.5 border-b pb-1">
                    <Lock className="w-4 h-4" /> Account Security & Password
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          placeholder="Create Password"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          required
                          className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-[#003893] transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        >
                          {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Re-enter Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm Password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className={`w-full pl-10 pr-10 py-2.5 bg-white border rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 outline-none transition-colors ${
                            passwordsMismatch
                              ? 'border-rose-400 focus:border-rose-500'
                              : passwordsMatch
                              ? 'border-emerald-400 focus:border-emerald-500'
                              : 'border-slate-300 focus:border-[#003893]'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {confirmPassword.length > 0 && (
                    <div className="text-[11px] font-bold flex items-center gap-1.5 pt-0.5">
                      {passwordsMatch ? (
                        <span className="text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Password matches correctly!
                        </span>
                      ) : (
                        <span className="text-rose-600 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> Passwords do not match yet.
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Submit to Send OTP */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl text-white font-extrabold text-base shadow-md transition-all bg-[#003893] hover:bg-[#002669] mt-4 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{' '}
                      Sending Verification Code...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5" /> Continue to Email OTP Verification
                    </>
                  )}
                </button>
              </form>
            )}

            {/* LENDER REGISTER FORM MODE */}
            {isRegister && !isVendor && (
              <LenderRegisterForm
                onFormReady={async (lenderData) => {
                  setFormError(null);
                  setIsSubmitting(true);
                  try {
                    const otpRes = await sendSignupOtpApi(lenderData.email, 'LENDER', lenderData.name);
                    if (otpRes.success) {
                      setPendingLenderData(lenderData);
                      setOtpTargetEmail(lenderData.email);
                      setOtpTargetName(lenderData.name);
                      setOtpCountdown(60);
                      setCanResendOtp(false);
                      setSignupOtp('');
                      setViewStep('OTP_VERIFY');
                    } else {
                      setFormError(otpRes.message || 'Failed to send OTP code.');
                    }
                  } catch {
                    setFormError('Failed to send OTP verification email.');
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                onError={setFormError}
                isSubmitting={isSubmitting}
              />
            )}

            {/* Bottom Links */}
            <div className="pt-3 text-center border-t border-slate-200 space-y-2">
              {!isRegister ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-600 font-medium">
                    Don't have a {isVendor ? 'Small Business (Vendor)' : 'Business Financer'} account yet?
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(true);
                      setFormError(null);
                    }}
                    className={`py-2.5 px-4 rounded-xl border-2 font-extrabold text-xs inline-flex items-center justify-center gap-2 transition-all bg-white shadow-xs ${
                      isVendor
                        ? 'border-[#003893] text-[#003893] hover:bg-blue-50'
                        : 'border-[#007a33] text-[#007a33] hover:bg-emerald-50'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>
                      {isVendor ? 'Sign Up as Small Business (Vendor)' : 'Sign Up as Business Financer (Lender)'}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-slate-600 font-medium">Already registered?</p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(false);
                      setFormError(null);
                    }}
                    className={`py-2.5 px-4 rounded-xl border-2 font-extrabold text-xs inline-flex items-center justify-center gap-2 transition-all bg-white shadow-xs ${
                      isVendor
                        ? 'border-[#003893] text-[#003893] hover:bg-blue-50'
                        : 'border-[#007a33] text-[#007a33] hover:bg-emerald-50'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>
                      {isVendor ? 'Login as Small Business (Vendor)' : 'Login as Business Financer (Lender)'}
                    </span>
                  </button>
                </div>
              )}

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setRole(isVendor ? 'LENDER' : 'VENDOR');
                    setFormError(null);
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 underline"
                >
                  {isVendor
                    ? 'Are you a Business Financer (Lender)? Click here'
                    : 'Are you a Small Business (Vendor)? Click here'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: SIGN UP OTP VERIFICATION VIEW (JustPaisa SMTP)                    */}
        {/* ========================================================================= */}
        {viewStep === 'OTP_VERIFY' && (
          <div className="p-6 sm:p-8 relative z-10 space-y-5">
            {/* Header & Back Button */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setViewStep('FORM');
                  setFormError(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>← Edit Details</span>
              </button>

              <div
                className="text-[10px] sm:text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border shadow-xs"
                style={{
                  backgroundColor: isVendor ? '#eff6ff' : '#ecfdf5',
                  borderColor: isVendor ? '#bfdbfe' : '#a7f3d0',
                  color: isVendor ? '#003893' : '#007a33',
                }}
              >
                {isVendor ? 'Vendor Verification' : 'Lender Verification'}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center text-center space-y-2 pt-1">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border-2 border-blue-200 flex items-center justify-center text-[#003893] shadow-sm">
                <Mail className="w-7 h-7 text-[#003893]" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Verify Your Email Address
              </h2>
              <p className="text-xs text-slate-600 font-medium max-w-sm">
                We sent a 6-digit OTP code to <strong className="text-slate-900">{otpTargetEmail}</strong>. Enter the
                code below to complete your JustPaisa registration.
              </p>
            </div>

            {/* Error Banner */}
            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Success Banner */}
            {formSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtpAndCompleteSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 text-center mb-2">
                  Enter 6-Digit OTP Code
                </label>
                <div className="relative max-w-xs mx-auto">
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    placeholder="• • • • • •"
                    value={signupOtp}
                    onChange={(e) => setSignupOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    required
                    className="w-full text-center tracking-[12px] text-2xl font-mono font-black py-3 bg-slate-50 border-2 border-slate-300 rounded-2xl text-slate-900 outline-none focus:border-[#003893] focus:bg-white transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* Resend OTP info */}
              <div className="text-center text-xs font-medium text-slate-500 flex items-center justify-center gap-1.5">
                {canResendOtp ? (
                  <button
                    type="button"
                    onClick={handleResendSignupOtp}
                    className="font-bold text-[#003893] hover:underline inline-flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Resend Code
                  </button>
                ) : (
                  <span>
                    Resend code in <strong className="text-slate-800">00:{otpCountdown < 10 ? `0${otpCountdown}` : otpCountdown}</strong>
                  </span>
                )}
              </div>

              {/* Submit Verification */}
              <button
                type="submit"
                disabled={isSubmitting || signupOtp.length !== 6}
                className={`w-full py-3.5 rounded-xl text-white font-extrabold text-base shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  isVendor
                    ? 'bg-[#003893] hover:bg-[#002669]'
                    : 'bg-[#007a33] hover:bg-[#005e27]'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{' '}
                    Verifying & Creating Account...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" /> Verify & Complete Sign Up
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: FORGOT PASSWORD FLOW (Vendor & Lender)                           */}
        {/* ========================================================================= */}
        {viewStep === 'FORGOT_PASSWORD' && (
          <div className="p-6 sm:p-8 relative z-10 space-y-5">
            {/* Header & Back Button */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setViewStep('FORM');
                  setFormError(null);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>← Back to Login</span>
              </button>

              <div
                className="text-[10px] sm:text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border shadow-xs"
                style={{
                  backgroundColor: isVendor ? '#eff6ff' : '#ecfdf5',
                  borderColor: isVendor ? '#bfdbfe' : '#a7f3d0',
                  color: isVendor ? '#003893' : '#007a33',
                }}
              >
                {isVendor ? 'Small Shop / Startup Owner' : 'Financer'}
              </div>
            </div>

            {/* Sub-step 1: Enter Email / Phone */}
            {forgotStep === 'REQUEST' && (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center text-center space-y-2 pt-1">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-amber-600 shadow-sm">
                    <KeyRound className="w-7 h-7 text-amber-600" />
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    Reset Your Password
                  </h2>
                  <p className="text-xs text-slate-600 font-medium">
                    Enter your registered Email address or Mobile number. We will send a 6-digit OTP code to your email.
                  </p>
                </div>

                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Registered Email or Mobile Number *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. name@business.com or 9876543210"
                        value={forgotEmailOrPhone}
                        onChange={(e) => setForgotEmailOrPhone(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 outline-none focus:border-[#003893] transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-3.5 rounded-xl text-white font-extrabold text-base shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                      isVendor
                        ? 'bg-[#003893] hover:bg-[#002669]'
                        : 'bg-[#007a33] hover:bg-[#005e27]'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{' '}
                        Sending Reset Code...
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5" /> Send Password Reset Code
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Sub-step 2: Enter OTP & New Password */}
            {forgotStep === 'RESET' && (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center text-center space-y-2 pt-1">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 border-2 border-blue-200 flex items-center justify-center text-[#003893] shadow-sm">
                    <Lock className="w-7 h-7 text-[#003893]" />
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    Enter OTP & Set New Password
                  </h2>
                  <p className="text-xs text-slate-600 font-medium">
                    We sent a 6-digit code to <strong className="text-slate-900">{forgotTargetEmail}</strong>.
                  </p>
                </div>

                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {formSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{formSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleForgotPasswordReset} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      6-Digit Reset OTP Code *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-digit OTP"
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/[^0-9]/g, ''))}
                      required
                      className="w-full text-center tracking-[8px] text-lg font-mono font-bold py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 outline-none focus:border-[#003893]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">New Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showForgotNewPass ? 'text' : 'password'}
                        placeholder="Enter new password (min 6 chars)"
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        required
                        className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#003893]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotNewPass(!showForgotNewPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showForgotNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showForgotConfirmPass ? 'text' : 'password'}
                        placeholder="Re-enter new password"
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        required
                        className={`w-full pl-10 pr-10 py-2.5 bg-white border rounded-xl text-xs font-medium text-slate-900 outline-none ${
                          forgotPasswordsMismatch
                            ? 'border-rose-400'
                            : forgotPasswordsMatch
                            ? 'border-emerald-400'
                            : 'border-slate-300 focus:border-[#003893]'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotConfirmPass(!showForgotConfirmPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showForgotConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Resend OTP */}
                  <div className="text-center text-xs font-medium text-slate-500 py-1">
                    {canResendForgotOtp ? (
                      <button
                        type="button"
                        onClick={handleResendForgotOtp}
                        className="font-bold text-[#003893] hover:underline inline-flex items-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Resend Reset Code
                      </button>
                    ) : (
                      <span>
                        Resend code in <strong className="text-slate-800">00:{forgotCountdown < 10 ? `0${forgotCountdown}` : forgotCountdown}</strong>
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || forgotOtp.length !== 6}
                    className={`w-full py-3.5 rounded-xl text-white font-extrabold text-base shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                      isVendor
                        ? 'bg-[#003893] hover:bg-[#002669]'
                        : 'bg-[#007a33] hover:bg-[#005e27]'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{' '}
                        Updating Password...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" /> Reset Password & Go to Login
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Sub-step 3: Success Screen */}
            {forgotStep === 'SUCCESS' && (
              <div className="text-center space-y-4 py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-md">
                  <CheckCircle2 className="w-9 h-9 text-emerald-600" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Password Reset Successfully!
                </h2>
                <p className="text-xs text-slate-600 font-medium">
                  Your JustPaisa account password has been updated. You can now login with your new credentials.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setViewStep('FORM');
                    setIsRegister(false);
                    setEmailOrPhone(forgotTargetEmail);
                    setFormError(null);
                    setFormSuccess('Password reset successfully. Please enter your new password to login.');
                  }}
                  className={`w-full py-3.5 rounded-xl text-white font-extrabold text-base shadow-md transition-all ${
                    isVendor ? 'bg-[#003893] hover:bg-[#002669]' : 'bg-[#007a33] hover:bg-[#005e27]'
                  }`}
                >
                  Proceed to Login
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Lender Register Form (Sends Data to Parent for OTP Verification) ─────────
interface LenderRegisterFormProps {
  onFormReady: (data: any) => void;
  onError: (msg: string) => void;
  isSubmitting: boolean;
}

const LenderRegisterForm: React.FC<LenderRegisterFormProps> = ({
  onFormReady,
  onError,
  isSubmitting,
}) => {
  const [lAvatarPreview, setLAvatarPreview] = useState<string | null>(null);
  const [lName, setLName] = useState('');
  const [lInstitution, setLInstitution] = useState('');
  const [isCustomFinancerName, setIsCustomFinancerName] = useState(false);
  const [lType, setLType] = useState('Money Financer');
  const [lPhone, setLPhone] = useState('');
  const [lEmail, setLEmail] = useState('');
  const [lAddress, setLAddress] = useState('');
  const [lCity, setLCity] = useState('');
  const [lState, setLState] = useState('');
  const [lPincode, setLPincode] = useState('');
  const [lPassword, setLPassword] = useState('');
  const [lConfirmPassword, setLConfirmPassword] = useState('');
  const [lMinLoan, setLMinLoan] = useState('10000');
  const [isCustomMin, setIsCustomMin] = useState(false);
  const [customMinInput, setCustomMinInput] = useState('');
  const [lMaxLoan, setLMaxLoan] = useState('100000');
  const [isCustomMax, setIsCustomMax] = useState(false);
  const [customMaxInput, setCustomMaxInput] = useState('');
  const [lRadius, setLRadius] = useState('50');
  const [lSuccessRate, setLSuccessRate] = useState('80% - 90%');
  const [isCustomSuccessRate, setIsCustomSuccessRate] = useState(false);
  const [customSuccessInput, setCustomSuccessInput] = useState('');

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      onError('Photo size must be less than 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Auto-sync Contact Officer Name to "Name Money Financer" (e.g. Gourav -> Gourav Money Financer)
  const handleNameChange = (nameVal: string) => {
    setLName(nameVal);
    if (!isCustomFinancerName) {
      if (nameVal.trim().length > 0) {
        setLInstitution(`${nameVal.trim()} Money Financer`);
      } else {
        setLInstitution('');
      }
    }
  };

  const handleFinancerNameChange = (val: string) => {
    setIsCustomFinancerName(true);
    setLInstitution(val);
  };

  const handleFinancerNameBlur = () => {
    if (lInstitution.trim().length > 0 && !lInstitution.toLowerCase().includes('money financer')) {
      setLInstitution(`${lInstitution.trim()} Money Financer`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lPassword !== lConfirmPassword) {
      onError('Passwords do not match.');
      return;
    }

    let finalFinancerName = lInstitution.trim();
    if (finalFinancerName.length > 0 && !finalFinancerName.toLowerCase().includes('money financer')) {
      finalFinancerName = `${finalFinancerName} Money Financer`;
    }
    if (!finalFinancerName && lName.trim()) {
      finalFinancerName = `${lName.trim()} Money Financer`;
    }

    let lat = 17.3850;
    let lng = 78.4867;
    const combined = `${lAddress} ${lCity} ${lState}`.toLowerCase();
    if (combined.includes('mumbai')) { lat = 19.0760; lng = 72.8777; }
    else if (combined.includes('delhi')) { lat = 28.6139; lng = 77.2090; }
    else if (combined.includes('bangalore') || combined.includes('bengaluru')) { lat = 12.9716; lng = 77.5946; }
    else if (combined.includes('chennai')) { lat = 13.0827; lng = 80.2707; }
    else if (combined.includes('pune')) { lat = 18.5204; lng = 73.8567; }
    else if (combined.includes('hyderabad') || combined.includes('telangana') || combined.includes('kothapet') || combined.includes('chaitanyapuri')) { lat = 17.3713; lng = 78.5320; }

    onFormReady({
      name: lName,
      email: lEmail,
      phone: lPhone,
      password: lPassword,
      institutionName: finalFinancerName,
      institutionType: lType || 'Money Financer',
      address: lAddress,
      city: lCity,
      state: lState,
      pincode: lPincode,
      latitude: lat,
      longitude: lng,
      minLoanAmount: parseFloat(lMinLoan) || 10000,
      maxLoanAmount: parseFloat(lMaxLoan) || 100000,
      lendingRadiusKm: parseFloat(lRadius) || 50,
      successRate: isCustomSuccessRate ? (customSuccessInput || '80% - 90%') : lSuccessRate,
      avatarUrl: lAvatarPreview || undefined,
    });
  };

  const field = (
    label: string,
    placeholder: string,
    value: string,
    onChange: (v: string) => void,
    type = 'text',
    required = true,
    onBlur?: () => void
  ) => (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1">
        {label}
        {required && ' *'}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        required={required}
        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#007a33] transition-colors"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Profile Photo Upload */}
      <div className="flex items-center gap-4 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
        <div className="relative shrink-0">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-sm bg-white flex items-center justify-center">
            {lAvatarPreview ? (
              <img src={lAvatarPreview} alt="Profile Preview" className="w-full h-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-emerald-500" />
            )}
          </div>
          <label
            htmlFor="lender-avatar-file-input"
            className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-[#007a33] text-white hover:bg-[#005e27] cursor-pointer shadow-md transition-transform active:scale-95 flex items-center justify-center"
            title="Upload Profile Photo"
          >
            <Camera className="w-3.5 h-3.5" />
          </label>
          <input
            id="lender-avatar-file-input"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
        <div className="flex-1 min-w-0">
          <label
            htmlFor="lender-avatar-file-input"
            className="text-xs font-extrabold text-[#007a33] hover:underline cursor-pointer block truncate"
          >
            {lAvatarPreview ? '✓ Photo Selected (Change)' : '+ Upload Profile Photo'}
          </label>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
            Display your professional photo on your Money Financer profile
          </p>
        </div>
      </div>

      {field('Full Name / Contact Officer', 'Enter Contact Officer Name (e.g. Gourav)', lName, handleNameChange)}
      {field('Business Money Revenue', 'e.g. Gourav Money Financer', lInstitution, handleFinancerNameChange, 'text', true, handleFinancerNameBlur)}

      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Business Financer Type *</label>
        <select
          value={lType}
          onChange={(e) => setLType(e.target.value)}
          className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#007a33]"
        >
          <option value="Money Financer">Money Financer</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {field('Mobile Number', '+91 98200 11223', lPhone, setLPhone, 'tel')}
        {field('Official Email ID (For OTP Verification)', 'financer@gmail.com', lEmail, setLEmail, 'email')}
      </div>

      {field('Address', 'Plot/Office No., Street, Area', lAddress, setLAddress)}

      <div className="grid grid-cols-3 gap-3">
        {field('City', 'Mumbai', lCity, setLCity)}
        {field('State', 'Maharashtra', lState, setLState)}
        {field('Pincode', '400001', lPincode, setLPincode)}
      </div>

      {/* Loan Amount Range */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Lending Amount Range *</label>
        <div className="grid grid-cols-2 gap-2">
          {/* Min Loan Selector / Custom Input */}
          <div>
            {!isCustomMin ? (
              <select
                value={lMinLoan}
                onChange={(e) => {
                  if (e.target.value === 'CUSTOM') {
                    setIsCustomMin(true);
                    setCustomMinInput(lMinLoan);
                  } else {
                    setLMinLoan(e.target.value);
                  }
                }}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#007a33]"
                required
              >
                <option value="5000">Min: ₹5,000</option>
                <option value="10000">Min: ₹10,000</option>
                <option value="25000">Min: ₹25,000</option>
                <option value="50000">Min: ₹50,000</option>
                <option value="100000">Min: ₹1 Lakh</option>
                <option value="200000">Min: ₹2 Lakhs</option>
                <option value="500000">Min: ₹5 Lakhs</option>
                <option value="CUSTOM">✏️ Custom Min Amount...</option>
              </select>
            ) : (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">₹</span>
                <input
                  type="number"
                  placeholder="Min Amount"
                  value={customMinInput}
                  onChange={(e) => {
                    setCustomMinInput(e.target.value);
                    setLMinLoan(e.target.value);
                  }}
                  className="w-full pl-6 pr-14 py-2.5 bg-white border-2 border-[#007a33] rounded-xl text-xs font-bold text-slate-900 outline-none"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomMin(false);
                    setLMinLoan('10000');
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-[#007a33] hover:underline"
                  title="Switch to Presets"
                >
                  Presets
                </button>
              </div>
            )}
            <p className="text-[10px] text-slate-400 mt-0.5 pl-1">
              {isCustomMin ? 'Custom minimum amount' : 'Minimum amount'}
            </p>
          </div>

          {/* Max Loan Selector / Custom Input */}
          <div>
            {!isCustomMax ? (
              <select
                value={lMaxLoan}
                onChange={(e) => {
                  if (e.target.value === 'CUSTOM') {
                    setIsCustomMax(true);
                    setCustomMaxInput(lMaxLoan);
                  } else {
                    setLMaxLoan(e.target.value);
                  }
                }}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#007a33]"
                required
              >
                <option value="50000">Max: ₹50,000</option>
                <option value="100000">Max: ₹1 Lakh</option>
                <option value="200000">Max: ₹2 Lakhs</option>
                <option value="500000">Max: ₹5 Lakhs</option>
                <option value="1000000">Max: ₹10 Lakhs</option>
                <option value="2000000">Max: ₹20 Lakhs</option>
                <option value="5000000">Max: ₹50 Lakhs</option>
                <option value="10000000">Max: ₹1 Crore</option>
                <option value="CUSTOM">✏️ Custom Max Amount...</option>
              </select>
            ) : (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">₹</span>
                <input
                  type="number"
                  placeholder="Max Amount"
                  value={customMaxInput}
                  onChange={(e) => {
                    setCustomMaxInput(e.target.value);
                    setLMaxLoan(e.target.value);
                  }}
                  className="w-full pl-6 pr-14 py-2.5 bg-white border-2 border-[#007a33] rounded-xl text-xs font-bold text-slate-900 outline-none"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomMax(false);
                    setLMaxLoan('100000');
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-[#007a33] hover:underline"
                  title="Switch to Presets"
                >
                  Presets
                </button>
              </div>
            )}
            <p className="text-[10px] text-slate-400 mt-0.5 pl-1">
              {isCustomMax ? 'Custom maximum amount' : 'Maximum amount'}
            </p>
          </div>
        </div>
      </div>

      {/* Lending Radius */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Lending Service Radius *</label>
        <div className="grid grid-cols-4 gap-2">
          {['30', '50', '70', '100'].map((km) => (
            <button
              key={km}
              type="button"
              onClick={() => setLRadius(km)}
              className={`py-2.5 rounded-xl border text-xs font-extrabold transition-all ${
                lRadius === km
                  ? 'bg-[#007a33] text-white border-[#007a33] shadow-md'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-[#007a33] hover:text-[#007a33]'
              }`}
            >
              {km} km
            </button>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 mt-1 pl-0.5">Area you can actively lend to shop owners</p>
      </div>

      {/* Success Rate of Lending */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-1">Lending Approval Success Rate *</label>
        {!isCustomSuccessRate ? (
          <div className="relative">
            <select
              value={lSuccessRate}
              onChange={(e) => {
                if (e.target.value === 'CUSTOM') {
                  setIsCustomSuccessRate(true);
                  setCustomSuccessInput(lSuccessRate);
                } else {
                  setLSuccessRate(e.target.value);
                }
              }}
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#007a33]"
              required
            >
              <option value="80% - 90%">80% - 90% Success Rate (Recommended)</option>
              <option value="85% - 95%">85% - 95% Success Rate</option>
              <option value="90% - 98%">90% - 98% Success Rate</option>
              <option value="75% - 85%">75% - 85% Success Rate</option>
              <option value="95% - 100%">95% - 100% Success Rate</option>
              <option value="CUSTOM">✏️ Custom Success Rate Percentage...</option>
            </select>
          </div>
        ) : (
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. 80% - 90% or 88%"
              value={customSuccessInput}
              onChange={(e) => {
                setCustomSuccessInput(e.target.value);
                setLSuccessRate(e.target.value);
              }}
              className="w-full px-4 py-2.5 pr-16 bg-white border-2 border-[#007a33] rounded-xl text-xs font-bold text-slate-900 outline-none"
              required
              autoFocus
            />
            <button
              type="button"
              onClick={() => {
                setIsCustomSuccessRate(false);
                setLSuccessRate('80% - 90%');
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-[#007a33] hover:underline"
            >
              Presets
            </button>
          </div>
        )}
        <p className="text-[10px] text-slate-400 mt-1 pl-0.5">Displayed to small businesses on your financer card badge</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {field('Password', 'Create password', lPassword, setLPassword, 'password')}
        {field('Re-enter Password', 'Confirm password', lConfirmPassword, setLConfirmPassword, 'password')}
      </div>

      {lConfirmPassword.length > 0 && lPassword !== lConfirmPassword && (
        <p className="text-[11px] text-rose-600 font-bold">Passwords do not match.</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3.5 rounded-xl text-white font-extrabold text-base shadow-md transition-all bg-[#007a33] hover:bg-[#005e27] mt-2 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{' '}
            Sending Verification Code...
          </>
        ) : (
          <>
            <Mail className="w-5 h-5" /> Continue to Email OTP Verification
          </>
        )}
      </button>
    </form>
  );
};
