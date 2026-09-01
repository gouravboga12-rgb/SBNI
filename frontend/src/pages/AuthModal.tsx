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
import { LocationPickerModal } from '../components/LocationPickerModal';
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
  Compass,
  Navigation,
  Edit3,
  LogOut,
  Loader2,
} from 'lucide-react';
import { getBrowserLocation, reverseGeocodeMapbox, searchPlacesMapbox } from '../services/mapboxService';
import { Role } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
  initialRole?: Role;
  initialRegister?: boolean;
  subscribeIntent?: boolean;
  currentUser?: any;
  onLogout?: (roleTarget?: 'VENDOR' | 'LENDER') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialRole = 'VENDOR',
  initialRegister = false,
  subscribeIntent = false,
  currentUser,
  onLogout,
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
  const [businessCategory, setBusinessCategory] = useState<'Small Shop Business' | 'Local Startup Business'>('Small Shop Business');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [annualIncome, setAnnualIncome] = useState('Under 2 Lakhs');

  // Address Mode Toggle (At Shop vs Enter Manually)
  const [addressMode, setAddressMode] = useState<'MANUAL' | 'MAPBOX'>('MANUAL');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [detectedLocationData, setDetectedLocationData] = useState<{
    latitude: number;
    longitude: number;
    place?: string;
    city?: string;
    state?: string;
    pincode?: string;
    fullAddress?: string;
  } | null>(null);

  const handleDetectShopLocation = async () => {
    setIsDetectingLocation(true);
    setFormError(null);
    try {
      const coords = await getBrowserLocation();
      const reverse = await reverseGeocodeMapbox(coords.latitude, coords.longitude);
      if (reverse) {
        setDetectedLocationData(reverse);
        setAddress(reverse.fullAddress || `${reverse.place}, ${reverse.city}, ${reverse.state} - ${reverse.pincode}`);
      } else {
        setDetectedLocationData({
          latitude: coords.latitude,
          longitude: coords.longitude,
          city: 'Hyderabad',
          state: 'Telangana',
        });
        setAddress(`Shop Location at GPS (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`);
      }
    } catch {
      setFormError('Could not auto-fetch GPS location. Please allow browser location access or select "Enter Manually".');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // File Uploads
  const [panFile, setPanFile] = useState<File | null>(null);
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [shopPhotoFile, setShopPhotoFile] = useState<File | null>(null);
  const [liveSelfieFile, setLiveSelfieFile] = useState<File | null>(null);

  // Live Camera Modal States for Passport Size Photo
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const directCameraInputRef = React.useRef<HTMLInputElement | null>(null);

  // Registration Passwords with Eye Toggles
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState('');

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

      try {
        const urlParams = new URLSearchParams(window.location.search);
        const ref = urlParams.get('ref') || urlParams.get('referral') || localStorage.getItem('sbni_referral_code');
        if (ref) {
          const cleanRef = ref.trim().toUpperCase();
          setReferralCodeInput(cleanRef);
          setIsRegister(true);
          setViewStep('FORM');
          try {
            localStorage.setItem('sbni_referral_code', cleanRef);
          } catch {}
        }
      } catch {}
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

  // ─── LIVE CAMERA HANDLERS (FOR PASSPORT SIZE PHOTO) ────────────────────────
  const openCameraModal = async () => {
    setIsCameraOpen(true);
    setCapturedPhotoUrl(null);
    setCameraError(null);
    await startCameraStream('user');
  };

  const startCameraStream = async (facing: 'user' | 'environment') => {
    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 720 },
          height: { ideal: 960 },
        },
        audio: false,
      });
      setCameraStream(stream);
      setCameraFacingMode(facing);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Camera access notice:', err);
      setCameraError('Direct camera stream not supported or permission denied. You can still use your device camera file picker.');
    }
  };

  const stopCameraStream = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    setIsCameraOpen(false);
    setCapturedPhotoUrl(null);
  };

  const toggleCameraFacing = async () => {
    const nextMode = cameraFacingMode === 'user' ? 'environment' : 'user';
    await startCameraStream(nextMode);
  };

  const handleTakeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Mirror the selfie snapshot if user facing mode
      if (cameraFacingMode === 'user') {
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setCapturedPhotoUrl(dataUrl);
    }
  };

  const handleConfirmSnapshot = () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `passport_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
          setPhotoFile(file);
          setFormError(null);
          stopCameraStream();
        }
      },
      'image/jpeg',
      0.92
    );
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

    // Small Shop Business requires all 6 KYC files & photos
    if (businessCategory === 'Small Shop Business') {
      if (!licenseFile) {
        setFormError('Please upload your Business License / GST document to proceed (compulsory for Small Shop Business).');
        return;
      }
      if (!shopPhotoFile) {
        setFormError('Please upload your Shop / Local Startup Business Photo to proceed (compulsory for Small Shop Business).');
        return;
      }
      if (!liveSelfieFile) {
        setFormError('Please upload your Live Photo in Front of Shop / Business to proceed (compulsory for Small Shop Business).');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // If manual address entered and GPS not fetched, forward geocode via Mapbox API!
      let resolvedLoc = detectedLocationData;
      if (!resolvedLoc && address.trim()) {
        try {
          const mapboxMatches = await searchPlacesMapbox(address.trim());
          if (mapboxMatches && mapboxMatches.length > 0) {
            resolvedLoc = mapboxMatches[0];
          }
        } catch (geoErr) {
          console.warn('Mapbox geocoding notice for vendor:', geoErr);
        }
      }

      // Send JustPaisa Sign Up OTP via SMTP
      const otpRes = await sendSignupOtpApi(email, 'VENDOR', fullName);
      if (otpRes.success) {
        setPendingVendorData({
          name: fullName,
          email,
          phone,
          password: regPassword,
          businessName,
          businessCategory,
          registrationType: businessCategory,
          category: businessCategory,
          address,
          annualIncome,
          latitude: resolvedLoc?.latitude || 17.3713,
          longitude: resolvedLoc?.longitude || 78.5320,
          city: resolvedLoc?.city || 'Hyderabad',
          state: resolvedLoc?.state || 'Telangana',
          pincode: resolvedLoc?.pincode || '500001',
          place: resolvedLoc?.place || 'Commercial Belt',
          photoFile,
          panFile,
          aadhaarFile,
          licenseFile,
          shopPhotoFile,
          liveSelfieFile,
          referralCode: referralCodeInput.trim().toUpperCase() || undefined,
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

        const effectiveReferralCode =
          pendingVendorData.referralCode ||
          referralCodeInput.trim().toUpperCase() ||
          localStorage.getItem('sbni_referral_code') ||
          undefined;

        const effectiveCategory = pendingVendorData.businessCategory || 'Small Shop Business';

        const result = await registerVendor({
          name: pendingVendorData.name,
          email: pendingVendorData.email,
          phone: pendingVendorData.phone,
          password: pendingVendorData.password,
          businessName: pendingVendorData.businessName,
          registrationType: effectiveCategory,
          category: effectiveCategory,
          businessType: effectiveCategory,
          address: pendingVendorData.address,
          city: pendingVendorData.city,
          state: pendingVendorData.state,
          pincode: pendingVendorData.pincode,
          place: pendingVendorData.place,
          latitude: pendingVendorData.latitude,
          longitude: pendingVendorData.longitude,
          otpCode: signupOtp.trim(),
          referralCode: effectiveReferralCode,
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
              registrationType: effectiveCategory,
              category: effectiveCategory,
              phone: pendingVendorData.phone,
              email: pendingVendorData.email,
              address: pendingVendorData.address,
              place: pendingVendorData.place || pendingVendorData.city || 'Commercial Belt',
              annualTurnover: pendingVendorData.annualIncome || 'Under 2 Lakhs',
              city: pendingVendorData.city || 'Hyderabad',
              state: pendingVendorData.state || 'Telangana',
              pincode: pendingVendorData.pincode || '500001',
              latitude: pendingVendorData.latitude,
              longitude: pendingVendorData.longitude,
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
            registrationType: effectiveCategory,
            category: effectiveCategory,
            businessType: effectiveCategory,
            address: pendingVendorData.address,
            place: pendingVendorData.place || pendingVendorData.city || 'Commercial Belt',
            city: pendingVendorData.city || 'Hyderabad',
            state: pendingVendorData.state || 'Telangana',
            pincode: pendingVendorData.pincode || '500001',
            latitude: pendingVendorData.latitude,
            longitude: pendingVendorData.longitude,
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
          try { localStorage.removeItem('sbni_referral_code'); } catch {}

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

        const effectiveReferralCode =
          pendingLenderData.referralCode ||
          referralCodeInput.trim().toUpperCase() ||
          localStorage.getItem('sbni_referral_code') ||
          undefined;

        const result = await registerLender({
          ...pendingLenderData,
          referralCode: effectiveReferralCode,
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
          try { localStorage.removeItem('sbni_referral_code'); } catch {}
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

            {/* Active Session Restriction Guard */}
            {currentUser && (
              <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 space-y-2.5 shadow-sm">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <div className="font-extrabold text-amber-900 text-sm">
                      Active {currentUser.role === 'VENDOR' ? 'Small Shop Business' : 'Business Financer'} Session Detected
                    </div>
                    <p className="text-amber-800 font-medium leading-relaxed">
                      You are currently signed in as <strong>{currentUser.name || currentUser.fullName || currentUser.email}</strong>. Once an account is active on this device, no other account can be accessed until you fully log out of your current session.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (onLogout) onLogout(currentUser.role);
                      onClose();
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer active:scale-95"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out Current Session</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Stay Logged In
                  </button>
                </div>
              </div>
            )}

            {/* Subscribe Intent Alert Banner */}
            {subscribeIntent && !currentUser && (
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

            {/* Active Session Restriction Guard in Form View */}
            {currentUser && (
              <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 space-y-2.5 shadow-sm">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <div className="font-extrabold text-amber-900 text-sm">
                      Active {currentUser.role === 'VENDOR' ? 'Small Shop Business' : 'Business Financer'} Session Detected
                    </div>
                    <p className="text-amber-800 font-medium leading-relaxed">
                      You are currently signed in as <strong>{currentUser.name || currentUser.fullName || currentUser.email}</strong>. Logging into or registering a new account requires logging out of your active account first.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (onLogout) onLogout(currentUser.role);
                      onClose();
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer active:scale-95"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out Active Account</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Stay Logged In
                  </button>
                </div>
              </div>
            )}

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
                {/* ── Business Category / Type Selection Dropdown (Option 1: Small Shop Business, Option 2: Local Startup Business) ── */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border-2 border-[#003893]/30 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black text-[#003893] uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-[#003893]" />
                      <span>Select Business Type / Category *</span>
                    </label>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#003893] text-white">
                      Required
                    </span>
                  </div>

                  <div className="relative">
                    <select
                      value={businessCategory}
                      onChange={(e) => setBusinessCategory(e.target.value as 'Small Shop Business' | 'Local Startup Business')}
                      className="w-full pl-3.5 pr-10 py-3 bg-white border-2 border-[#003893]/40 hover:border-[#003893] focus:border-[#003893] rounded-xl text-xs sm:text-sm font-bold text-slate-900 outline-none transition-all appearance-none cursor-pointer shadow-xs"
                    >
                      <option value="Small Shop Business">Small Shop Business</option>
                      <option value="Local Startup Business">Local Startup Business</option>
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Dynamic Info Alert */}
                  <div className={`p-2.5 rounded-xl text-xs font-semibold flex items-start gap-2 ${
                    businessCategory === 'Small Shop Business'
                      ? 'bg-blue-100/70 border border-blue-300 text-blue-950'
                      : 'bg-indigo-100/70 border border-indigo-300 text-indigo-950'
                  }`}>
                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-[#003893]" />
                    <span>
                      {businessCategory === 'Small Shop Business'
                        ? 'Small Shop Business: All 6 documents (Passport Photo, PAN Card, Aadhaar Card, Business License / GST, Shop Photo, Live Photo in Front of Shop) are compulsory.'
                        : 'Local Startup Business: Passport Size Photo, PAN Card and Aadhaar Card are mandatory. Business License / GST, Shop Photo and Live Photo are optional.'}
                    </span>
                  </div>
                </div>

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
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Shop / Business Address *</label>

                    {/* Mode Selection Toggle: "At Shop" vs "Enter Manually" */}
                    <div className="grid grid-cols-2 gap-2 mb-2.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => {
                          setAddressMode('MAPBOX');
                          if (!detectedLocationData) {
                            handleDetectShopLocation();
                          }
                        }}
                        className={`py-2 px-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          addressMode === 'MAPBOX'
                            ? 'bg-[#003893] text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>📍 At Shop (Mapbox GPS)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAddressMode('MANUAL')}
                        className={`py-2 px-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          addressMode === 'MANUAL'
                            ? 'bg-[#003893] text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>✍️ Enter Manually</span>
                      </button>
                    </div>

                    {addressMode === 'MAPBOX' ? (
                      /* Mapbox GPS Auto-Detect view */
                      <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-[#003893] flex items-center gap-1.5">
                            <Navigation className="w-4 h-4 text-blue-600" />
                            <span>Shop Location via Mapbox</span>
                          </span>
                          <button
                            type="button"
                            onClick={handleDetectShopLocation}
                            disabled={isDetectingLocation}
                            className="text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className={`w-3 h-3 ${isDetectingLocation ? 'animate-spin' : ''}`} />
                            <span>{isDetectingLocation ? 'Detecting...' : 'Re-Detect GPS'}</span>
                          </button>
                        </div>

                        {isDetectingLocation ? (
                          <div className="py-3 text-center text-xs font-bold text-blue-800 flex items-center justify-center gap-2 animate-pulse">
                            <Loader2 className="w-4 h-4 animate-spin text-[#003893]" />
                            <span>Fetching exact shop coordinates with Mapbox GPS...</span>
                          </div>
                        ) : detectedLocationData ? (
                          <div className="space-y-2">
                            <div className="p-2.5 bg-white rounded-xl border border-blue-200 text-xs font-semibold text-slate-900">
                              <div className="flex items-start gap-1.5">
                                <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                <span className="break-words">{address}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium px-1">
                              <span>Lat: {detectedLocationData.latitude.toFixed(4)}, Lng: {detectedLocationData.longitude.toFixed(4)}</span>
                              <span className="text-emerald-700 font-bold">✓ GPS Coordinates Verified</span>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={handleDetectShopLocation}
                            className="w-full py-2.5 rounded-xl bg-[#003893] hover:bg-[#002669] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
                          >
                            <Compass className="w-4 h-4" />
                            <span>Tap to Auto-Detect Shop GPS Location</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      /* Manual Textarea input */
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
                    )}
                  </div>

                  {/* Annual Income */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Annual Income *</label>
                    <div className="relative">
                      <select
                        value={annualIncome}
                        onChange={(e) => setAnnualIncome(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#003893] transition-colors appearance-none cursor-pointer"
                      >
                        <option value="Under 2 Lakhs">Under ₹2 Lakhs / year</option>
                        <option value="2-5 Lakhs">₹2 – 5 Lakhs / year</option>
                        <option value="5-10 Lakhs">₹5 – 10 Lakhs / year</option>
                        <option value="10-25 Lakhs">₹10 – 25 Lakhs / year</option>
                        <option value="25 Lakhs+">₹25 Lakhs+ / year</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Document Uploads */}
                <div className="space-y-3 pt-1">
                  <div className="text-xs font-extrabold text-[#003893] uppercase tracking-wider flex items-center justify-between border-b pb-1">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4" /> Photo & KYC Document Uploads
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {businessCategory === 'Small Shop Business' ? 'All 6 Documents Required' : '3 Required, 3 Optional'}
                    </span>
                  </div>

                  {/* 1. Passport Size Photo / Profile Photo (Always Required) */}
                  <div className="p-3.5 bg-gradient-to-br from-blue-50/70 to-indigo-50/50 rounded-2xl border-2 border-blue-200/90 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <Camera className="w-4 h-4 text-[#003893]" />
                        <span>Passport Size Photo / Profile Photo *</span>
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

                    {/* Hidden Native File and Camera Inputs */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e.target.files?.[0], setPhotoFile)}
                      className="hidden"
                    />
                    <input
                      ref={directCameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={(e) => handleFileSelect(e.target.files?.[0], setPhotoFile)}
                      className="hidden"
                    />

                    {photoFile ? (
                      /* Preview of Uploaded / Captured Photo */
                      <div className="p-3 bg-white rounded-xl border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
                        <div className="flex items-center gap-3">
                          <img
                            src={URL.createObjectURL(photoFile)}
                            alt="Passport Photo Preview"
                            className="w-14 h-14 rounded-full object-cover border-2 border-[#003893] shadow-md shrink-0"
                          />
                          <div className="text-left">
                            <div className="text-xs font-extrabold text-slate-900 truncate max-w-[180px] sm:max-w-[220px]">
                              {photoFile.name}
                            </div>
                            <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Photo ready for registration
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Change File</span>
                          </button>
                          <button
                            type="button"
                            onClick={openCameraModal}
                            className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-blue-100 hover:bg-blue-200 text-[#003893] font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Retake</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Dual Action Choice: Upload from Files OR Take with Camera */
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {/* Option 1: File Upload */}
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-3.5 rounded-xl border-2 border-dashed border-blue-300 hover:border-[#003893] bg-white hover:bg-blue-50/50 flex flex-col items-center justify-center text-center transition-all cursor-pointer group shadow-2xs active:scale-98"
                        >
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-[#003893] flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                            <Upload className="w-4 h-4" />
                          </div>
                          <div className="text-xs font-extrabold text-slate-800">
                            Upload from Files
                          </div>
                          <div className="text-[9px] text-slate-400 mt-0.5">
                            JPG, PNG, WEBP up to 5MB
                          </div>
                        </button>

                        {/* Option 2: Live Camera Capture */}
                        <button
                          type="button"
                          onClick={openCameraModal}
                          className="p-3.5 rounded-xl border-2 border-dashed border-indigo-300 hover:border-indigo-600 bg-white hover:bg-indigo-50/50 flex flex-col items-center justify-center text-center transition-all cursor-pointer group shadow-2xs active:scale-98"
                        >
                          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                            <Camera className="w-4 h-4" />
                          </div>
                          <div className="text-xs font-extrabold text-slate-800">
                            Open Camera / Take Photo
                          </div>
                          <div className="text-[9px] text-indigo-600 font-semibold mt-0.5">
                            Live Selfie & Passport Photo
                          </div>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* 2. PAN Card (Always Required) */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-extrabold text-slate-800">PAN Card *</span>
                        {panFile ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Uploaded
                          </span>
                        ) : (
                          <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            Required
                          </span>
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
                          {panFile ? panFile.name : 'Upload PAN Card *'}
                        </div>
                        <div className="text-[9px] text-slate-400">PDF, JPG, PNG up to 5MB</div>
                      </label>
                    </div>

                    {/* 3. Aadhaar Card (Always Required) */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-extrabold text-slate-800">Aadhaar Card *</span>
                        {aadhaarFile ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Uploaded
                          </span>
                        ) : (
                          <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            Required
                          </span>
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
                          {aadhaarFile ? aadhaarFile.name : 'Upload Aadhaar Card *'}
                        </div>
                        <div className="text-[9px] text-slate-400">PDF, JPG, PNG up to 5MB</div>
                      </label>
                    </div>
                  </div>

                  {/* 4. Business License / GST (Required for Small Shop Business, Optional for Local Startup) */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold text-slate-800">
                        Business License / GST {businessCategory === 'Small Shop Business' ? '*' : ''}
                      </span>
                      {licenseFile ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Uploaded
                        </span>
                      ) : businessCategory === 'Small Shop Business' ? (
                        <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          Required
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
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileSelect(e.target.files?.[0], setLicenseFile)}
                        className="hidden"
                      />
                      <Upload className="w-5 h-5 text-[#003893] mx-auto mb-1" />
                      <div className="text-[11px] font-bold text-slate-700 truncate">
                        {licenseFile
                          ? licenseFile.name
                          : businessCategory === 'Small Shop Business'
                          ? 'Upload Shop / Trade License / GST *'
                          : 'Upload Shop / Trade License / GST (Optional)'}
                      </div>
                      <div className="text-[9px] text-slate-400">PDF, JPG, PNG up to 5MB</div>
                    </label>
                  </div>

                  {/* 5. Shop / Local Startup Business Photo (Required for Small Shop Business, Optional for Local Startup) */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold text-slate-800">
                        Shop / Local Startup Business Photo {businessCategory === 'Small Shop Business' ? '*' : ''}
                      </span>
                      {shopPhotoFile ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Uploaded
                        </span>
                      ) : businessCategory === 'Small Shop Business' ? (
                        <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          Required
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
                        {shopPhotoFile
                          ? shopPhotoFile.name
                          : businessCategory === 'Small Shop Business'
                          ? 'Upload Shop / Business Photo *'
                          : 'Upload Shop / Business Photo (Optional)'}
                      </div>
                      <div className="text-[9px] text-slate-400">Shop / Business Exterior / Interior Photo (Max 5MB)</div>
                    </label>
                  </div>

                  {/* 6. Live Photo in Front of Shop / Business (Required for Small Shop Business, Optional for Local Startup) */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold text-slate-800">
                        Live Photo in Front of Shop / Business {businessCategory === 'Small Shop Business' ? '*' : ''}
                      </span>
                      {liveSelfieFile ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Uploaded
                        </span>
                      ) : businessCategory === 'Small Shop Business' ? (
                        <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          Required
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
                      <Camera className="w-5 h-5 text-[#003893] mx-auto mb-1" />
                      <div className="text-[11px] font-bold text-slate-700 truncate">
                        {liveSelfieFile
                          ? liveSelfieFile.name
                          : businessCategory === 'Small Shop Business'
                          ? 'Live Photo with Person in Front of Shop / Business *'
                          : 'Live Photo with Person in Front of Shop / Business (Optional)'}
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

                {/* Referral Code Input (Optional) */}
                <div className="space-y-1 pt-1">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Referral Code (Optional)</span>
                    <span className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> Earn Welcome Wallet Cashback
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. JPV-ABC12"
                      value={referralCodeInput}
                      onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-[#003893] uppercase tracking-wider transition-colors"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500">
                    If invited by a business partner, enter their code to earn instant wallet reward on plan activation.
                  </p>
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
                initialReferralCode={referralCodeInput}
                onFormReady={async (lenderData) => {
                  setFormError(null);
                  setIsSubmitting(true);
                  try {
                    const otpRes = await sendSignupOtpApi(lenderData.email, 'LENDER', lenderData.name);
                    if (otpRes.success) {
                      setPendingLenderData({
                        ...lenderData,
                        referralCode: lenderData.referralCode || referralCodeInput.trim().toUpperCase() || undefined,
                      });
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

      {/* ── LIVE CAMERA CAPTURE MODAL OVERLAY ───────────────────────────────── */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            {/* Camera Header */}
            <div className="p-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-black">Passport Photo Camera</span>
              </div>
              <button
                type="button"
                onClick={stopCameraStream}
                className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Viewport / Snapshot Preview */}
            <div className="relative aspect-[3/4] bg-black overflow-hidden flex items-center justify-center">
              {capturedPhotoUrl ? (
                <img
                  src={capturedPhotoUrl}
                  alt="Captured Snapshot"
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${cameraFacingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                  />
                  {/* Passport Oval Alignment Guide */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                    <div className="w-48 h-64 border-2 border-dashed border-white/70 rounded-[50%] shadow-[0_0_0_9999px_rgba(0,0,0,0.4)] flex items-center justify-center">
                      <span className="text-[11px] font-extrabold text-white/90 bg-black/50 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                        Position Face Here
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Hidden Canvas for rendering snapshot */}
              <canvas ref={canvasRef} className="hidden" />

              {cameraError && (
                <div className="absolute inset-0 bg-black/90 p-6 flex flex-col items-center justify-center text-center space-y-4">
                  <AlertCircle className="w-10 h-10 text-amber-400" />
                  <p className="text-xs text-slate-200 font-medium max-w-xs">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      stopCameraStream();
                      directCameraInputRef.current?.click();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold flex items-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Launch Device Camera</span>
                  </button>
                </div>
              )}
            </div>

            {/* Camera Controls Footer */}
            <div className="p-4 bg-slate-800/90 border-t border-slate-700 flex items-center justify-between gap-3">
              {capturedPhotoUrl ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setCapturedPhotoUrl(null);
                      if (videoRef.current && cameraStream) {
                        videoRef.current.play().catch(() => {});
                      }
                    }}
                    className="flex-1 py-3 rounded-2xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-black flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Retake</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmSnapshot}
                    className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Use This Photo</span>
                  </button>
                </>
              ) : (
                <>
                  {/* Flip Camera Button */}
                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    title="Flip Camera"
                    className="w-12 h-12 rounded-2xl bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>

                  {/* Shutter Button */}
                  <button
                    type="button"
                    onClick={handleTakeSnapshot}
                    className="w-16 h-16 rounded-full border-4 border-white bg-red-600 hover:bg-red-500 active:scale-95 flex items-center justify-center shadow-lg transition-all cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-full bg-white" />
                  </button>

                  {/* Cancel Button */}
                  <button
                    type="button"
                    onClick={stopCameraStream}
                    className="w-12 h-12 rounded-2xl bg-slate-700 hover:bg-slate-600 text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Lender Register Form (Sends Data to Parent for OTP Verification) ─────────
interface LenderRegisterFormProps {
  onFormReady: (data: any) => void;
  onError: (msg: string) => void;
  isSubmitting: boolean;
  initialReferralCode?: string;
}

const LenderRegisterForm: React.FC<LenderRegisterFormProps> = ({
  onFormReady,
  onError,
  isSubmitting,
  initialReferralCode = '',
}) => {
  const [lAvatarPreview, setLAvatarPreview] = useState<string | null>(null);
  const [lReferralCode, setLReferralCode] = useState(initialReferralCode || '');
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
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [lDetectedLocation, setLDetectedLocation] = useState<{
    latitude: number;
    longitude: number;
    place?: string;
    city?: string;
    state?: string;
    pincode?: string;
    fullAddress?: string;
  } | null>(null);
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

  const handleDetectLenderLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const coords = await getBrowserLocation();
      const reverse = await reverseGeocodeMapbox(coords.latitude, coords.longitude);
      if (reverse) {
        setLDetectedLocation(reverse);
        if (reverse.fullAddress) setLAddress(reverse.fullAddress);
        else if (reverse.place) setLAddress(reverse.place);
        if (reverse.city) setLCity(reverse.city);
        if (reverse.state) setLState(reverse.state);
        if (reverse.pincode) setLPincode(reverse.pincode);
      } else {
        setLDetectedLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          city: 'Hyderabad',
          state: 'Telangana',
        });
        setLAddress(`Office GPS (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`);
      }
    } catch {
      onError('Could not auto-fetch GPS location. You can enter your address manually.');
    } finally {
      setIsDetectingLocation(false);
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
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

    let lat = lDetectedLocation?.latitude || 17.3850;
    let lng = lDetectedLocation?.longitude || 78.4867;
    let placeName = lDetectedLocation?.place || lCity || 'Financial District';

    onFormReady({
      name: lName,
      email: lEmail,
      phone: lPhone,
      password: lPassword,
      institutionName: finalFinancerName,
      institutionType: lType || 'Money Financer',
      address: lAddress,
      place: placeName,
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
      referralCode: lReferralCode.trim().toUpperCase() || undefined,
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Profile Photo Upload */}
      <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200 flex items-center gap-3.5">
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-white border-2 border-emerald-300 overflow-hidden flex items-center justify-center shadow-xs">
            {lAvatarPreview ? (
              <img src={lAvatarPreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <User className="w-7 h-7 text-emerald-600" />
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
            {lAvatarPreview ? '✓ Photo Selected' : '+ Upload Photo'}
          </label>
          <p className="text-[10px] text-slate-500 font-medium mt-0.5">
            Professional photo for your profile
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
        {field('Official Email ID (For OTP)', 'financer@gmail.com', lEmail, setLEmail, 'email')}
      </div>

      {/* Office Address & Mapbox GPS Option */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700">Office / Business Address *</label>
          <button
            type="button"
            onClick={handleDetectLenderLocation}
            disabled={isDetectingLocation}
            className="text-[11px] font-extrabold text-[#007a33] hover:text-[#005e27] flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-all cursor-pointer active:scale-95"
          >
            {isDetectingLocation ? (
              <>
                <span className="w-3 h-3 border-2 border-[#007a33] border-t-transparent rounded-full animate-spin" />
                <span>Locating GPS...</span>
              </>
            ) : (
              <>
                <Navigation className="w-3.5 h-3.5 text-[#007a33]" />
                <span>Detect Office Location</span>
              </>
            )}
          </button>
        </div>
        <input
          type="text"
          placeholder="Building, Street, Road, Financial Belt"
          value={lAddress}
          onChange={(e) => setLAddress(e.target.value)}
          required
          className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#007a33] transition-colors"
        />

        <div className="grid grid-cols-3 gap-2 pt-1">
          <input
            type="text"
            placeholder="City"
            value={lCity}
            onChange={(e) => setLCity(e.target.value)}
            required
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#007a33]"
          />
          <input
            type="text"
            placeholder="State"
            value={lState}
            onChange={(e) => setLState(e.target.value)}
            required
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#007a33]"
          />
          <input
            type="text"
            placeholder="Pincode"
            value={lPincode}
            onChange={(e) => setLPincode(e.target.value)}
            required
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#007a33]"
          />
        </div>
      </div>

      {/* Lending Min / Max Range */}
      <div className="space-y-1 pt-1">
        <label className="block text-xs font-bold text-slate-700">Lending Loan Amount Range *</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="text-[10px] text-slate-500 font-semibold block mb-1">Minimum Amount</span>
            {!isCustomMin ? (
              <div className="relative">
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
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#007a33]"
                  required
                >
                  <option value="10000">₹10,000</option>
                  <option value="25000">₹25,000</option>
                  <option value="50000">₹50,000</option>
                  <option value="100000">₹1 Lakh</option>
                  <option value="200000">₹2 Lakh</option>
                  <option value="CUSTOM">✏️ Enter Custom Min Amount...</option>
                </select>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="number"
                  placeholder="e.g. 15000"
                  value={customMinInput}
                  onChange={(e) => {
                    setCustomMinInput(e.target.value);
                    setLMinLoan(e.target.value);
                  }}
                  className="w-full px-4 py-2.5 pr-16 bg-white border-2 border-[#007a33] rounded-xl text-xs font-bold text-slate-900 outline-none"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => { setIsCustomMin(false); setLMinLoan('10000'); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-[#007a33] hover:underline"
                >Presets</button>
              </div>
            )}
            <p className="text-[10px] text-slate-400 mt-0.5 pl-1">
              {isCustomMin ? 'Custom minimum amount' : 'Minimum amount'}
            </p>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 font-semibold block mb-1">Maximum Amount</span>
            {!isCustomMax ? (
              <div className="relative">
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
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#007a33]"
                  required
                >
                  <option value="50000">₹50,000</option>
                  <option value="100000">₹1 Lakh</option>
                  <option value="200000">₹2 Lakh</option>
                  <option value="500000">₹5 Lakh</option>
                  <option value="1000000">₹10 Lakh</option>
                  <option value="CUSTOM">✏️ Enter Custom Max Amount...</option>
                </select>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="number"
                  placeholder="e.g. 500000"
                  value={customMaxInput}
                  onChange={(e) => {
                    setCustomMaxInput(e.target.value);
                    setLMaxLoan(e.target.value);
                  }}
                  className="w-full px-4 py-2.5 pr-16 bg-white border-2 border-[#007a33] rounded-xl text-xs font-bold text-slate-900 outline-none"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => { setIsCustomMax(false); setLMaxLoan('100000'); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-extrabold text-[#007a33] hover:underline"
                >Presets</button>
              </div>
            )}
            <p className="text-[10px] text-slate-400 mt-0.5 pl-1">
              {isCustomMax ? 'Custom maximum amount' : 'Maximum amount'}
            </p>
          </div>
        </div>
      </div>

      {/* Referral Code (Optional) */}
      <div className="space-y-1 pt-1">
        <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
          <span>Referral Code (Optional)</span>
          <span className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> Earn Welcome Cashback
          </span>
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="e.g. JPL-ABC12"
            value={lReferralCode}
            onChange={(e) => setLReferralCode(e.target.value.toUpperCase())}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 placeholder-slate-400 outline-none focus:border-[#007a33] uppercase tracking-wider transition-colors"
          />
        </div>
        <p className="text-[10px] text-slate-500">
          If invited by a partner financer or shop, enter their referral code to earn reward cashback.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {field('Password', 'Create password', lPassword, setLPassword, 'password')}
        {field('Re-enter Password', 'Confirm password', lConfirmPassword, setLConfirmPassword, 'password')}
      </div>

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
