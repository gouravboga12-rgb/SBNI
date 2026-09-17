import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Store,
  Building2,
  Lock,
  Mail,
  Phone,
  User,
  MapPin,
  Compass,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  RotateCcw,
  Camera,
  Upload,
  FileText,
  CreditCard,
  Briefcase,
  Layers,
  ArrowLeft,
  Zap,
  Rocket,
  AlertCircle,
  Sparkles,
  UserPlus,
} from 'lucide-react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import {
  loginUser,
  registerVendor,
  registerLender,
  sendSignupOtpApi,
  verifySignupOtpApi,
  forgotPasswordRequestOtpApi,
  resetPasswordWithOtpApi,
  resendOtpApi,
  uploadFileToEc2Api,
  updateVendorProfileApi,
} from '../../services/api';
import { Role } from '../../types';

type ViewStep = 'SELECT' | 'VENDOR_TYPE_SELECT' | 'FORM' | 'OTP_VERIFY' | 'FORGOT_PASSWORD' | 'FORGOT_OTP';

interface FileAsset {
  uri: string;
  base64: string;
  name: string;
}

const TURNOVER_OPTIONS = [
  'Under 2 Lakhs',
  '2 - 5 Lakhs',
  '5 - 10 Lakhs',
  '10 - 25 Lakhs',
  'Above 25 Lakhs',
];

const RADIUS_OPTIONS = [10, 25, 50, 70, 100];

export const LoginScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  // Navigation State
  const [viewStep, setViewStep] = useState<ViewStep>('SELECT');
  const [role, setRole] = useState<Role>('VENDOR');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  // Common Login Fields
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Vendor Register Fields
  const [vendorCategory, setVendorCategory] = useState<'Small Shop Business' | 'Local Startup Business'>('Small Shop Business');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [annualTurnover, setAnnualTurnover] = useState(TURNOVER_OPTIONS[0]);
  const [addressMode, setAddressMode] = useState<'MANUAL' | 'GPS'>('GPS');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [detectedCoords, setDetectedCoords] = useState<{ lat?: number; lng?: number }>({});

  // 6 KYC Document Uploads
  const [photoFile, setPhotoFile] = useState<FileAsset | null>(null);
  const [panFile, setPanFile] = useState<FileAsset | null>(null);
  const [aadhaarFile, setAadhaarFile] = useState<FileAsset | null>(null);
  const [licenseFile, setLicenseFile] = useState<FileAsset | null>(null);
  const [shopPhotoFile, setShopPhotoFile] = useState<FileAsset | null>(null);
  const [liveSelfieFile, setLiveSelfieFile] = useState<FileAsset | null>(null);

  // Lender Register Fields
  const [institutionName, setInstitutionName] = useState('');
  const [institutionType, setInstitutionType] = useState('Money Financer');
  const [lendingRadiusKm, setLendingRadiusKm] = useState(50);
  const [minLoanAmount, setMinLoanAmount] = useState('10000');
  const [maxLoanAmount, setMaxLoanAmount] = useState('500000');

  // OTP Verification Fields
  const [otpCode, setOtpCode] = useState('');
  const [otpTargetEmail, setOtpTargetEmail] = useState('');
  const [otpTargetName, setOtpTargetName] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Forgot Password Fields
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotTargetEmail, setForgotTargetEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');

  const isVendor = role === 'VENDOR';
  const primaryColor = isVendor ? '#003893' : '#007a33';

  // Helper for camera or gallery upload
  const pickDocument = (
    title: string,
    setter: (asset: FileAsset) => void,
    defaultNamePrefix: string
  ) => {
    Alert.alert(
      `Upload ${title}`,
      'Choose image source:',
      [
        {
          text: 'Take Photo (Camera)',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Denied', 'Camera permission is required.');
              return;
            }
            const res = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.7,
              base64: true,
            });
            if (!res.canceled && res.assets && res.assets[0].base64) {
              setter({
                uri: res.assets[0].uri,
                base64: res.assets[0].base64,
                name: `${defaultNamePrefix}_${Date.now()}.jpg`,
              });
            }
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Denied', 'Gallery permission is required.');
              return;
            }
            const res = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.7,
              base64: true,
            });
            if (!res.canceled && res.assets && res.assets[0].base64) {
              setter({
                uri: res.assets[0].uri,
                base64: res.assets[0].base64,
                name: `${defaultNamePrefix}_${Date.now()}.jpg`,
              });
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // GPS Auto-detection
  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location permissions.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      setDetectedCoords({ lat, lng });

      const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (geocode && geocode.length > 0) {
        const item = geocode[0];
        const formattedCity = item.city || item.subregion || item.district || '';
        const formattedState = item.region || '';
        const formattedPin = item.postalCode || '';
        const formattedStreet = [item.name, item.street, item.subregion].filter(Boolean).join(', ');

        if (formattedStreet) setAddress(formattedStreet);
        if (formattedCity) setCity(formattedCity);
        if (formattedState) setState(formattedState);
        if (formattedPin) setPincode(formattedPin);

        Alert.alert('GPS Location Verified', `${formattedStreet ? formattedStreet + ', ' : ''}${formattedCity}, ${formattedState} ${formattedPin}`);
      }
    } catch (e: any) {
      Alert.alert('GPS Notice', 'Could not auto-fetch coordinates. Please enter manually.');
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Handle Login
  const handleLogin = async () => {
    if (!loginIdentifier.trim()) {
      Alert.alert('Missing Field', 'Please enter your registered Email or Mobile Number.');
      return;
    }
    if (!loginPassword) {
      Alert.alert('Missing Field', 'Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginUser(loginIdentifier.trim(), loginPassword, role);
      if (res.success && res.token && res.user) {
        await login(res.token, res.user);
      } else {
        Alert.alert('Login Failed', res.message || 'Invalid credentials.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Submit Registration to OTP
  const handleSubmitRegisterToOtp = async () => {
    if (isVendor) {
      if (!fullName.trim()) {
        Alert.alert('Missing Field', 'Please enter your full name.');
        return;
      }
      const cleanPhone = phone.trim().replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        Alert.alert('Missing Field', 'Please enter a valid 10-digit mobile number.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        Alert.alert('Missing Field', 'Please enter a valid email for OTP verification.');
        return;
      }
      if (!businessName.trim()) {
        Alert.alert('Missing Field', 'Please enter your Shop / Business Name.');
        return;
      }
      if (!address.trim()) {
        Alert.alert('Missing Field', 'Please provide your Shop / Business Address.');
        return;
      }
      // Mandatory documents
      if (!photoFile) {
        Alert.alert('Missing Document', 'Please upload Passport Photo / Profile Photo.');
        return;
      }
      if (!panFile) {
        Alert.alert('Missing Document', 'Please upload PAN Card Document.');
        return;
      }
      if (!aadhaarFile) {
        Alert.alert('Missing Document', 'Please upload Aadhaar Card Document.');
        return;
      }
      if (vendorCategory === 'Small Shop Business') {
        if (!licenseFile) {
          Alert.alert('Missing Document', 'Please upload Business License / GST for Small Shop Business.');
          return;
        }
        if (!shopPhotoFile) {
          Alert.alert('Missing Document', 'Please upload Shop / Business Photo.');
          return;
        }
        if (!liveSelfieFile) {
          Alert.alert('Missing Document', 'Please upload Live Photo in Front of Shop.');
          return;
        }
      }
      if (password.length < 6) {
        Alert.alert('Validation Error', 'Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Validation Error', 'Password and Confirm Password do not match.');
        return;
      }
    } else {
      if (!institutionName.trim()) {
        Alert.alert('Missing Field', 'Please enter Financer / Institution Name.');
        return;
      }
      if (!fullName.trim()) {
        Alert.alert('Missing Field', 'Please enter Contact Person Name.');
        return;
      }
      const cleanPhone = phone.trim().replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        Alert.alert('Missing Field', 'Please enter a valid 10-digit mobile number.');
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        Alert.alert('Missing Field', 'Please enter a valid email for OTP verification.');
        return;
      }
      if (password.length < 6) {
        Alert.alert('Validation Error', 'Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Validation Error', 'Passwords do not match.');
        return;
      }
    }

    setLoading(true);
    try {
      const targetEmail = email.trim().toLowerCase();
      setOtpTargetEmail(targetEmail);
      setOtpTargetName(fullName.trim());

      const res = await sendSignupOtpApi(targetEmail, role, fullName.trim());
      if (res.success) {
        setCountdown(60);
        setCanResend(false);
        setViewStep('OTP_VERIFY');
        Alert.alert('Verification Code Sent', `A 6-digit OTP code was sent to ${targetEmail}`);
      } else {
        Alert.alert('Notice', res.message || 'Failed to send verification code.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to send verification email.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Verify OTP and Complete Registration
  const handleVerifyOtpAndRegister = async () => {
    if (otpCode.trim().length < 4) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit OTP verification code.');
      return;
    }

    setLoading(true);
    try {
      const verifyRes = await verifySignupOtpApi(otpTargetEmail, otpCode.trim());
      if (!verifyRes.success) {
        Alert.alert('Invalid Code', verifyRes.message || 'The verification code entered is incorrect.');
        setLoading(false);
        return;
      }

      if (isVendor) {
        // Register Vendor
        const regRes = await registerVendor({
          name: fullName.trim(),
          email: otpTargetEmail,
          phone: phone.trim().replace(/\D/g, ''),
          password,
          businessName: businessName.trim(),
          category: vendorCategory,
          businessType: vendorCategory,
          address: address.trim(),
          city: city.trim() || 'Hyderabad',
          state: state.trim() || 'Telangana',
          pincode: pincode.trim() || '500001',
          place: city.trim() || 'Hyderabad',
          latitude: detectedCoords.lat,
          longitude: detectedCoords.lng,
          otpCode: otpCode.trim(),
          referralCode: referralCode.trim() || undefined,
        });

        if (!regRes.success || !regRes.token) {
          Alert.alert('Registration Failed', regRes.message || 'Failed to complete registration.');
          setLoading(false);
          return;
        }

        // Upload documents
        let avatarUrl: string | undefined;
        let panFileUrl: string | undefined;
        let aadhaarFileUrl: string | undefined;
        let licenseUrl: string | undefined;
        let shopPhotoUrl: string | undefined;
        let liveSelfieUrl: string | undefined;

        try {
          if (photoFile?.base64) {
            const up = await uploadFileToEc2Api(photoFile.base64, 'avatars', photoFile.name, 'AVATAR');
            if (up.success && up.fileUrl) avatarUrl = up.fileUrl;
          }
          if (panFile?.base64) {
            const up = await uploadFileToEc2Api(panFile.base64, 'documents', panFile.name, 'PAN');
            if (up.success && up.fileUrl) panFileUrl = up.fileUrl;
          }
          if (aadhaarFile?.base64) {
            const up = await uploadFileToEc2Api(aadhaarFile.base64, 'documents', aadhaarFile.name, 'AADHAAR');
            if (up.success && up.fileUrl) aadhaarFileUrl = up.fileUrl;
          }
          if (licenseFile?.base64) {
            const up = await uploadFileToEc2Api(licenseFile.base64, 'documents', licenseFile.name, 'LICENSE');
            if (up.success && up.fileUrl) licenseUrl = up.fileUrl;
          }
          if (shopPhotoFile?.base64) {
            const up = await uploadFileToEc2Api(shopPhotoFile.base64, 'shops', shopPhotoFile.name, 'SHOP');
            if (up.success && up.fileUrl) shopPhotoUrl = up.fileUrl;
          }
          if (liveSelfieFile?.base64) {
            const up = await uploadFileToEc2Api(liveSelfieFile.base64, 'avatars', liveSelfieFile.name, 'SELFIE');
            if (up.success && up.fileUrl) liveSelfieUrl = up.fileUrl;
          }
        } catch (e) {
          console.warn('Doc upload notice:', e);
        }

        // Sync vendor profile
        try {
          await updateVendorProfileApi({
            ownerName: fullName.trim(),
            businessName: businessName.trim(),
            category: vendorCategory,
            registrationType: vendorCategory,
            annualTurnover,
            address: address.trim(),
            city: city.trim() || 'Hyderabad',
            state: state.trim() || 'Telangana',
            pincode: pincode.trim() || '500001',
            avatarUrl: avatarUrl || liveSelfieUrl || shopPhotoUrl,
            panFileUrl,
            aadhaarFileUrl,
            businessLicenseUrl: licenseUrl,
            gstFileUrl: licenseUrl,
            shopPhotos: shopPhotoUrl ? [shopPhotoUrl] : undefined,
          });
        } catch (syncErr) {
          console.warn('Profile sync notice:', syncErr);
        }

        await login(regRes.token, regRes.user);
      } else {
        // Register Lender
        const regRes = await registerLender({
          name: fullName.trim(),
          email: otpTargetEmail,
          phone: phone.trim().replace(/\D/g, ''),
          password,
          institutionName: institutionName.trim(),
          institutionType,
          address: address.trim() || 'Financial District',
          city: city.trim() || 'Hyderabad',
          state: state.trim() || 'Telangana',
          pincode: pincode.trim() || '500001',
          place: city.trim() || 'Hyderabad',
          latitude: detectedCoords.lat,
          longitude: detectedCoords.lng,
          minLoanAmount: Number(minLoanAmount) || 10000,
          maxLoanAmount: Number(maxLoanAmount) || 500000,
          lendingRadiusKm,
          otpCode: otpCode.trim(),
          referralCode: referralCode.trim() || undefined,
        });

        if (regRes.success && regRes.token && regRes.user) {
          await login(regRes.token, regRes.user);
        } else {
          Alert.alert('Registration Failed', regRes.message || 'Lender registration failed.');
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Request
  const handleForgotRequest = async () => {
    if (!forgotIdentifier.trim()) {
      Alert.alert('Missing Field', 'Please enter your registered email or phone.');
      return;
    }
    setLoading(true);
    try {
      const res = await forgotPasswordRequestOtpApi(forgotIdentifier.trim(), role);
      if (res.success && res.email) {
        setForgotTargetEmail(res.email);
        setViewStep('FORGOT_OTP');
        Alert.alert('Reset Code Sent', `A reset OTP code has been sent to ${res.email}`);
      } else {
        Alert.alert('Notice', res.message || 'No registered account found.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to request reset OTP.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Reset
  const handleForgotReset = async () => {
    if (forgotOtp.trim().length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit OTP reset code.');
      return;
    }
    if (forgotNewPassword.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPasswordWithOtpApi(forgotTargetEmail, forgotOtp.trim(), forgotNewPassword);
      if (res.success) {
        Alert.alert('Password Reset Successful', 'You can now sign in with your new password.', [
          {
            text: 'Sign In Now',
            onPress: () => {
              setViewStep('FORM');
              setIsRegister(false);
            },
          },
        ]);
      } else {
        Alert.alert('Failed', res.message || 'Password reset failed.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f8fafc' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingTop: Math.max(insets.top, 20) + 10, paddingBottom: Math.max(insets.bottom, 20) + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================================ */}
        {/* STEP 1: SELECT ACCOUNT TYPE (Mirrors Website AuthModal)     */}
        {/* ============================================================ */}
        {viewStep === 'SELECT' && (
          <View style={styles.cardContainer}>
            {/* Top Brand Logo */}
            <View style={styles.brandHeader}>
              <Image
                source={require('../../../assets/sbni_logo.png')}
                style={styles.mainBrandLogo}
                resizeMode="contain"
              />
              <Text style={styles.brandSubText}>
                Enterprise Small Business Financing & Capital Network
              </Text>
            </View>

            {/* Card 1: Small Shop Business, Local Startup Business */}
            <View style={styles.selectCardVendor}>
              <View style={styles.selectCardHeader}>
                <View style={styles.selectIconBoxVendor}>
                  <Store size={26} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectCardTitleVendor}>
                    Small Shop Business, Local Startup Business
                  </Text>
                  <Text style={styles.selectCardDesc}>
                    Any small shop business or local startup business can login to check nearby business financers for money.
                  </Text>
                </View>
              </View>

              <View style={styles.selectBtnRow}>
                <TouchableOpacity
                  style={styles.selectLoginBtnVendor}
                  onPress={() => {
                    setRole('VENDOR');
                    setIsRegister(false);
                    setViewStep('FORM');
                  }}
                  activeOpacity={0.85}
                >
                  <User size={16} color="#ffffff" />
                  <Text style={styles.selectLoginBtnText}>Login as Shop Owner</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.selectSignUpBtnVendor}
                  onPress={() => {
                    setRole('VENDOR');
                    setIsRegister(true);
                    setViewStep('VENDOR_TYPE_SELECT');
                  }}
                  activeOpacity={0.85}
                >
                  <UserPlus size={16} color="#003893" />
                  <Text style={styles.selectSignUpBtnTextVendor}>Sign Up as Shop Owner</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Card 2: Business Money Financer */}
            <View style={styles.selectCardLender}>
              <View style={styles.selectCardHeader}>
                <View style={styles.selectIconBoxLender}>
                  <Building2 size={26} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectCardTitleLender}>
                    Business Money Financer
                  </Text>
                  <Text style={styles.selectCardDesc}>
                    Sign up or login as a Business Money Financer to provide Business Money directly to verified small shop and local startup businesses nearby.
                  </Text>
                </View>
              </View>

              <View style={styles.selectBtnRow}>
                <TouchableOpacity
                  style={styles.selectLoginBtnLender}
                  onPress={() => {
                    setRole('LENDER');
                    setIsRegister(false);
                    setViewStep('FORM');
                  }}
                  activeOpacity={0.85}
                >
                  <User size={16} color="#ffffff" />
                  <Text style={styles.selectLoginBtnText}>Login as Financer</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.selectSignUpBtnLender}
                  onPress={() => {
                    setRole('LENDER');
                    setIsRegister(true);
                    setViewStep('FORM');
                  }}
                  activeOpacity={0.85}
                >
                  <UserPlus size={16} color="#007a33" />
                  <Text style={styles.selectSignUpBtnTextLender}>Sign Up as Financer</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Trust Footer */}
            <View style={styles.trustBadgeRow}>
              <ShieldCheck size={14} color="#64748b" />
              <Text style={styles.trustBadgeText}>
                100% Verified FinTech Portal • Direct Financer Contact • 0% Commission
              </Text>
            </View>
          </View>
        )}

        {/* ============================================================ */}
        {/* STEP 1.5: VENDOR BUSINESS TYPE SELECT (Mirrors Website)      */}
        {/* ============================================================ */}
        {viewStep === 'VENDOR_TYPE_SELECT' && (
          <View style={styles.cardContainer}>
            {/* Top Navigation Bar */}
            <View style={styles.navHeaderRow}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => setViewStep('SELECT')}
                activeOpacity={0.7}
              >
                <ArrowLeft size={16} color="#475569" />
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
              <View style={styles.stepPill}>
                <Text style={styles.stepPillText}>Step 1 of 2: Select Business</Text>
              </View>
            </View>

            {/* Central Brand Logo */}
            <View style={styles.brandHeader}>
              <Image
                source={require('../../../assets/sbni_logo.png')}
                style={styles.mainBrandLogo}
                resizeMode="contain"
              />
              <Text style={styles.stepTitle}>Select Your Business Type</Text>
              <Text style={styles.stepSubtitle}>
                Please select whether you are signing up as a Small Shop Business or a Local Startup Business:
              </Text>
            </View>

            {/* Option 1: Small Shop Business */}
            <TouchableOpacity
              style={styles.typeChoiceCardBlue}
              onPress={() => {
                setVendorCategory('Small Shop Business');
                setViewStep('FORM');
              }}
              activeOpacity={0.85}
            >
              <View style={styles.typeChoiceHeader}>
                <View style={styles.typeIconBoxBlue}>
                  <Store size={22} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.typeTitleRow}>
                    <Text style={styles.typeChoiceTitleBlue}>1. Small Shop Business</Text>
                    <View style={styles.compulsoryBadge}>
                      <Text style={styles.compulsoryBadgeText}>All 6 KYC Compulsory</Text>
                    </View>
                  </View>
                  <Text style={styles.typeChoiceDesc}>
                    For Retail Stores, Kirana Shops, General Stores, Medical, Hardware & Commercial Outlets.
                  </Text>
                </View>
              </View>
              <View style={styles.typeInfoPillBlue}>
                <ShieldCheck size={14} color="#003893" />
                <Text style={styles.typeInfoTextBlue}>
                  Requires Passport Photo, PAN, Aadhaar, License/GST, Shop Photo & Live Selfie
                </Text>
              </View>
              <View style={styles.continueRowBlue}>
                <Text style={styles.continueTextBlue}>Continue as Small Shop Business</Text>
                <ArrowRight size={14} color="#003893" />
              </View>
            </TouchableOpacity>

            {/* Option 2: Local Startup Business */}
            <TouchableOpacity
              style={styles.typeChoiceCardIndigo}
              onPress={() => {
                setVendorCategory('Local Startup Business');
                setViewStep('FORM');
              }}
              activeOpacity={0.85}
            >
              <View style={styles.typeChoiceHeader}>
                <View style={styles.typeIconBoxIndigo}>
                  <Rocket size={22} color="#ffffff" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.typeTitleRow}>
                    <Text style={styles.typeChoiceTitleIndigo}>2. Local Startup Business</Text>
                    <View style={styles.optionalBadge}>
                      <Text style={styles.optionalBadgeText}>3 Mandatory • 3 Optional</Text>
                    </View>
                  </View>
                  <Text style={styles.typeChoiceDesc}>
                    For Early-stage Local Startups, Digital Ventures, Home Businesses & Service Enterprises.
                  </Text>
                </View>
              </View>
              <View style={styles.typeInfoPillIndigo}>
                <Zap size={14} color="#4338ca" />
                <Text style={styles.typeInfoTextIndigo}>
                  Mandatory: Photo, PAN & Aadhaar (License & Shop Photos are Optional)
                </Text>
              </View>
              <View style={styles.continueRowIndigo}>
                <Text style={styles.continueTextIndigo}>Continue as Local Startup Business</Text>
                <ArrowRight size={14} color="#4338ca" />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ============================================================ */}
        {/* STEP 2: DEDICATED FORM VIEW (LOGIN / REGISTER)               */}
        {/* ============================================================ */}
        {viewStep === 'FORM' && (
          <View style={styles.cardContainer}>
            {/* Top Navigation Bar */}
            <View style={styles.navHeaderRow}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => {
                  if (isRegister && isVendor) {
                    setViewStep('VENDOR_TYPE_SELECT');
                  } else {
                    setViewStep('SELECT');
                  }
                }}
                activeOpacity={0.7}
              >
                <ArrowLeft size={16} color="#475569" />
                <Text style={styles.backBtnText}>
                  {isRegister && isVendor ? 'Change Business Type' : 'Change Account'}
                </Text>
              </TouchableOpacity>
              <View
                style={[
                  styles.rolePill,
                  isVendor ? styles.rolePillVendor : styles.rolePillLender,
                ]}
              >
                <Text
                  style={[
                    styles.rolePillText,
                    isVendor ? { color: '#003893' } : { color: '#007a33' },
                  ]}
                >
                  {isVendor ? (isRegister ? vendorCategory : 'Shop / Startup') : 'Money Financer'}
                </Text>
              </View>
            </View>

            {/* Central Brand Logo */}
            <View style={styles.brandHeader}>
              <Image
                source={require('../../../assets/sbni_logo.png')}
                style={styles.mainBrandLogo}
                resizeMode="contain"
              />
              <Text style={[styles.formHeading, { color: primaryColor }]}>
                {isRegister
                  ? isVendor
                    ? `${vendorCategory} Sign Up`
                    : 'Business Money Financer Registration'
                  : isVendor
                  ? 'Small Shop / Local Startup Business Login'
                  : 'Business Money Financer Login'}
              </Text>
              <Text style={styles.formSub}>
                {isRegister
                  ? isVendor
                    ? vendorCategory === 'Small Shop Business'
                      ? 'Enter your shop details & all 6 required KYC verification documents.'
                      : 'Enter your startup details & KYC documents (3 required, 3 optional).'
                    : 'Sign up as a Business Money Financer. We will verify your official email with OTP.'
                  : isVendor
                  ? 'Login to discover and connect with verified nearby business financers'
                  : 'Login to provide business capital to verified local shops & startups'}
              </Text>
            </View>

            {/* ============================================================ */}
            {/* LOGIN FORM                                                   */}
            {/* ============================================================ */}
            {!isRegister && (
              <View style={styles.formBody}>
                <Text style={styles.inputLabel}>Enter Mobile Number / Email *</Text>
                <View style={styles.inputBox}>
                  <User size={18} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Mobile Number / Email Address"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="none"
                    value={loginIdentifier}
                    onChangeText={setLoginIdentifier}
                  />
                </View>

                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>Enter Password *</Text>
                  <TouchableOpacity onPress={() => setViewStep('FORGOT_PASSWORD')}>
                    <Text style={[styles.forgotLink, { color: primaryColor }]}>
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.inputBox}>
                  <Lock size={18} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter password"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showPassword}
                    value={loginPassword}
                    onChangeText={setLoginPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color="#64748b" />
                    ) : (
                      <Eye size={18} color="#64748b" />
                    )}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.primaryActionBtn, { backgroundColor: primaryColor }]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.actionBtnText}>
                      Login as {isVendor ? 'Shop / Startup' : 'Financer'}
                    </Text>
                  )}
                </TouchableOpacity>

                <View style={styles.toggleRow}>
                  <Text style={styles.togglePrompt}>Don't have an account?</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setIsRegister(true);
                      if (isVendor) setViewStep('VENDOR_TYPE_SELECT');
                    }}
                  >
                    <Text style={[styles.toggleAction, { color: primaryColor }]}>
                      {isVendor ? 'Sign Up as Shop' : 'Sign Up as Financer'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ============================================================ */}
            {/* VENDOR REGISTRATION FORM                                     */}
            {/* ============================================================ */}
            {isRegister && isVendor && (
              <View style={styles.formBody}>
                {/* Selected Type Banner */}
                <View style={styles.categoryActiveBanner}>
                  <View style={styles.categoryActiveLeft}>
                    {vendorCategory === 'Small Shop Business' ? (
                      <Store size={18} color="#003893" />
                    ) : (
                      <Rocket size={18} color="#4338ca" />
                    )}
                    <Text style={styles.categoryActiveTitle}>{vendorCategory}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setViewStep('VENDOR_TYPE_SELECT')}
                    style={styles.switchTypeBtn}
                  >
                    <RotateCcw size={12} color="#003893" />
                    <Text style={styles.switchTypeText}>Switch Type</Text>
                  </TouchableOpacity>
                </View>

                {/* Section: Personal & Contact */}
                <View style={styles.sectionHeader}>
                  <User size={16} color="#003893" />
                  <Text style={styles.sectionHeaderTitle}>Personal & Contact Details</Text>
                </View>

                <Text style={styles.inputLabel}>Full Name *</Text>
                <View style={styles.inputBox}>
                  <User size={18} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your full name"
                    placeholderTextColor="#94a3b8"
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>

                <Text style={styles.inputLabel}>Phone Number *</Text>
                <View style={styles.inputBox}>
                  <Phone size={18} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="10-digit mobile number"
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>

                <Text style={styles.inputLabel}>Email ID (For OTP Verification) *</Text>
                <View style={styles.inputBox}>
                  <Mail size={18} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="name@business.com"
                    placeholderTextColor="#94a3b8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                {/* Section: Shop / Business Details */}
                <View style={styles.sectionHeader}>
                  <Store size={16} color="#003893" />
                  <Text style={styles.sectionHeaderTitle}>Shop / Business Information</Text>
                </View>

                <Text style={styles.inputLabel}>Shop / Business Name *</Text>
                <View style={styles.inputBox}>
                  <Store size={18} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Kumar General Store"
                    placeholderTextColor="#94a3b8"
                    value={businessName}
                    onChangeText={setBusinessName}
                  />
                </View>

                {/* Address Mode Toggle */}
                <Text style={styles.inputLabel}>Shop / Business Address *</Text>
                <View style={styles.addressModeRow}>
                  <TouchableOpacity
                    style={[styles.addressModeBtn, addressMode === 'GPS' && styles.addressModeBtnActive]}
                    onPress={() => {
                      setAddressMode('GPS');
                      handleDetectLocation();
                    }}
                  >
                    <Compass size={14} color={addressMode === 'GPS' ? '#ffffff' : '#475569'} />
                    <Text style={[styles.addressModeText, addressMode === 'GPS' && styles.addressModeTextActive]}>
                      📍 At Shop (Auto GPS)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.addressModeBtn, addressMode === 'MANUAL' && styles.addressModeBtnActive]}
                    onPress={() => setAddressMode('MANUAL')}
                  >
                    <FileText size={14} color={addressMode === 'MANUAL' ? '#ffffff' : '#475569'} />
                    <Text style={[styles.addressModeText, addressMode === 'MANUAL' && styles.addressModeTextActive]}>
                      ✍️ Enter Manually
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputBox}>
                  <MapPin size={18} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Street, Landmark, Market Road"
                    placeholderTextColor="#94a3b8"
                    value={address}
                    onChangeText={setAddress}
                  />
                </View>

                <View style={styles.rowInputs}>
                  <TextInput
                    style={[styles.gridInput, { flex: 1 }]}
                    placeholder="City"
                    placeholderTextColor="#94a3b8"
                    value={city}
                    onChangeText={setCity}
                  />
                  <TextInput
                    style={[styles.gridInput, { flex: 1, marginHorizontal: 6 }]}
                    placeholder="State"
                    placeholderTextColor="#94a3b8"
                    value={state}
                    onChangeText={setState}
                  />
                  <TextInput
                    style={[styles.gridInput, { flex: 1 }]}
                    placeholder="Pincode"
                    placeholderTextColor="#94a3b8"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={pincode}
                    onChangeText={setPincode}
                  />
                </View>

                {/* Annual Income */}
                <Text style={styles.inputLabel}>Annual Income / Business Turnover *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.turnoverScroll}>
                  {TURNOVER_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.turnoverChip,
                        annualTurnover === opt && styles.turnoverChipActive,
                      ]}
                      onPress={() => setAnnualTurnover(opt)}
                    >
                      <Text
                        style={[
                          styles.turnoverChipText,
                          annualTurnover === opt && styles.turnoverChipTextActive,
                        ]}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Section: 6 KYC Document Uploads */}
                <View style={styles.sectionHeader}>
                  <Upload size={16} color="#003893" />
                  <Text style={styles.sectionHeaderTitle}>Photo & KYC Document Uploads</Text>
                </View>
                <Text style={styles.docHelpNotice}>
                  {vendorCategory === 'Small Shop Business'
                    ? 'All 6 documents are compulsory for Small Shop Business verification.'
                    : 'Photo, PAN & Aadhaar are mandatory. License & Shop photos are optional.'}
                </Text>

                {/* 1. Passport Photo */}
                <View style={styles.docCard}>
                  <View style={styles.docCardHead}>
                    <Text style={styles.docCardTitle}>1. Passport Size / Profile Photo *</Text>
                    <View style={photoFile ? styles.badgeUploaded : styles.badgeRequired}>
                      <Text style={photoFile ? styles.badgeUploadedText : styles.badgeRequiredText}>
                        {photoFile ? '✓ Uploaded' : 'Required'}
                      </Text>
                    </View>
                  </View>
                  {photoFile ? (
                    <View style={styles.previewRow}>
                      <Image source={{ uri: photoFile.uri }} style={styles.previewThumb} />
                      <Text style={styles.previewFileName} numberOfLines={1}>{photoFile.name}</Text>
                      <TouchableOpacity
                        style={styles.changeBtn}
                        onPress={() => pickDocument('Passport Photo', setPhotoFile, 'passport')}
                      >
                        <Text style={styles.changeBtnText}>Change</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.uploadPlaceholder}
                      onPress={() => pickDocument('Passport Photo', setPhotoFile, 'passport')}
                    >
                      <Camera size={20} color="#003893" />
                      <Text style={styles.uploadPlaceholderText}>Take Live Selfie or Upload Photo</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* 2. PAN Card */}
                <View style={styles.docCard}>
                  <View style={styles.docCardHead}>
                    <Text style={styles.docCardTitle}>2. PAN Card Document *</Text>
                    <View style={panFile ? styles.badgeUploaded : styles.badgeRequired}>
                      <Text style={panFile ? styles.badgeUploadedText : styles.badgeRequiredText}>
                        {panFile ? '✓ Uploaded' : 'Required'}
                      </Text>
                    </View>
                  </View>
                  {panFile ? (
                    <View style={styles.previewRow}>
                      <Image source={{ uri: panFile.uri }} style={styles.previewThumb} />
                      <Text style={styles.previewFileName} numberOfLines={1}>{panFile.name}</Text>
                      <TouchableOpacity
                        style={styles.changeBtn}
                        onPress={() => pickDocument('PAN Card', setPanFile, 'pan')}
                      >
                        <Text style={styles.changeBtnText}>Change</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.uploadPlaceholder}
                      onPress={() => pickDocument('PAN Card', setPanFile, 'pan')}
                    >
                      <Upload size={20} color="#003893" />
                      <Text style={styles.uploadPlaceholderText}>Upload PAN Card Photo</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* 3. Aadhaar Card */}
                <View style={styles.docCard}>
                  <View style={styles.docCardHead}>
                    <Text style={styles.docCardTitle}>3. Aadhaar Card Document *</Text>
                    <View style={aadhaarFile ? styles.badgeUploaded : styles.badgeRequired}>
                      <Text style={aadhaarFile ? styles.badgeUploadedText : styles.badgeRequiredText}>
                        {aadhaarFile ? '✓ Uploaded' : 'Required'}
                      </Text>
                    </View>
                  </View>
                  {aadhaarFile ? (
                    <View style={styles.previewRow}>
                      <Image source={{ uri: aadhaarFile.uri }} style={styles.previewThumb} />
                      <Text style={styles.previewFileName} numberOfLines={1}>{aadhaarFile.name}</Text>
                      <TouchableOpacity
                        style={styles.changeBtn}
                        onPress={() => pickDocument('Aadhaar Card', setAadhaarFile, 'aadhaar')}
                      >
                        <Text style={styles.changeBtnText}>Change</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.uploadPlaceholder}
                      onPress={() => pickDocument('Aadhaar Card', setAadhaarFile, 'aadhaar')}
                    >
                      <Upload size={20} color="#003893" />
                      <Text style={styles.uploadPlaceholderText}>Upload Aadhaar Card Photo</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* 4. Business License / GST */}
                <View style={styles.docCard}>
                  <View style={styles.docCardHead}>
                    <Text style={styles.docCardTitle}>
                      4. Business License / GST {vendorCategory === 'Small Shop Business' ? '*' : '(Optional)'}
                    </Text>
                    <View style={licenseFile ? styles.badgeUploaded : vendorCategory === 'Small Shop Business' ? styles.badgeRequired : styles.badgeOptional}>
                      <Text style={licenseFile ? styles.badgeUploadedText : vendorCategory === 'Small Shop Business' ? styles.badgeRequiredText : styles.badgeOptionalText}>
                        {licenseFile ? '✓ Uploaded' : vendorCategory === 'Small Shop Business' ? 'Required' : 'Optional'}
                      </Text>
                    </View>
                  </View>
                  {licenseFile ? (
                    <View style={styles.previewRow}>
                      <Image source={{ uri: licenseFile.uri }} style={styles.previewThumb} />
                      <Text style={styles.previewFileName} numberOfLines={1}>{licenseFile.name}</Text>
                      <TouchableOpacity
                        style={styles.changeBtn}
                        onPress={() => pickDocument('Business License', setLicenseFile, 'license')}
                      >
                        <Text style={styles.changeBtnText}>Change</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.uploadPlaceholder}
                      onPress={() => pickDocument('Business License', setLicenseFile, 'license')}
                    >
                      <Upload size={20} color="#003893" />
                      <Text style={styles.uploadPlaceholderText}>Upload Trade License / GST</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* 5. Shop / Business Photo */}
                <View style={styles.docCard}>
                  <View style={styles.docCardHead}>
                    <Text style={styles.docCardTitle}>
                      5. Shop / Business Photo {vendorCategory === 'Small Shop Business' ? '*' : '(Optional)'}
                    </Text>
                    <View style={shopPhotoFile ? styles.badgeUploaded : vendorCategory === 'Small Shop Business' ? styles.badgeRequired : styles.badgeOptional}>
                      <Text style={shopPhotoFile ? styles.badgeUploadedText : vendorCategory === 'Small Shop Business' ? styles.badgeRequiredText : styles.badgeOptionalText}>
                        {shopPhotoFile ? '✓ Uploaded' : vendorCategory === 'Small Shop Business' ? 'Required' : 'Optional'}
                      </Text>
                    </View>
                  </View>
                  {shopPhotoFile ? (
                    <View style={styles.previewRow}>
                      <Image source={{ uri: shopPhotoFile.uri }} style={styles.previewThumb} />
                      <Text style={styles.previewFileName} numberOfLines={1}>{shopPhotoFile.name}</Text>
                      <TouchableOpacity
                        style={styles.changeBtn}
                        onPress={() => pickDocument('Shop Photo', setShopPhotoFile, 'shop')}
                      >
                        <Text style={styles.changeBtnText}>Change</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.uploadPlaceholder}
                      onPress={() => pickDocument('Shop Photo', setShopPhotoFile, 'shop')}
                    >
                      <Camera size={20} color="#003893" />
                      <Text style={styles.uploadPlaceholderText}>Upload Shop Exterior / Interior Photo</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* 6. Live Photo in Front of Shop */}
                <View style={styles.docCard}>
                  <View style={styles.docCardHead}>
                    <Text style={styles.docCardTitle}>
                      6. Live Photo in Front of Shop {vendorCategory === 'Small Shop Business' ? '*' : '(Optional)'}
                    </Text>
                    <View style={liveSelfieFile ? styles.badgeUploaded : vendorCategory === 'Small Shop Business' ? styles.badgeRequired : styles.badgeOptional}>
                      <Text style={liveSelfieFile ? styles.badgeUploadedText : vendorCategory === 'Small Shop Business' ? styles.badgeRequiredText : styles.badgeOptionalText}>
                        {liveSelfieFile ? '✓ Uploaded' : vendorCategory === 'Small Shop Business' ? 'Required' : 'Optional'}
                      </Text>
                    </View>
                  </View>
                  {liveSelfieFile ? (
                    <View style={styles.previewRow}>
                      <Image source={{ uri: liveSelfieFile.uri }} style={styles.previewThumb} />
                      <Text style={styles.previewFileName} numberOfLines={1}>{liveSelfieFile.name}</Text>
                      <TouchableOpacity
                        style={styles.changeBtn}
                        onPress={() => pickDocument('Live Photo in Front of Shop', setLiveSelfieFile, 'shop_front')}
                      >
                        <Text style={styles.changeBtnText}>Change</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.uploadPlaceholder}
                      onPress={() => pickDocument('Live Photo in Front of Shop', setLiveSelfieFile, 'shop_front')}
                    >
                      <Camera size={20} color="#003893" />
                      <Text style={styles.uploadPlaceholderText}>Take Photo in Front of Shop</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Section: Account Security */}
                <View style={styles.sectionHeader}>
                  <Lock size={16} color="#003893" />
                  <Text style={styles.sectionHeaderTitle}>Account Security & Password</Text>
                </View>

                <Text style={styles.inputLabel}>Create Password * (min 6 characters)</Text>
                <View style={styles.inputBox}>
                  <Lock size={18} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Create a strong password"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color="#64748b" />
                    ) : (
                      <Eye size={18} color="#64748b" />
                    )}
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>Confirm Password *</Text>
                <View style={styles.inputBox}>
                  <Lock size={18} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Re-enter password"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeBtn}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} color="#64748b" />
                    ) : (
                      <Eye size={18} color="#64748b" />
                    )}
                  </TouchableOpacity>
                </View>

                {confirmPassword.length > 0 && (
                  <View style={styles.matchStatusRow}>
                    {password === confirmPassword ? (
                      <Text style={styles.matchSuccess}>✓ Passwords match</Text>
                    ) : (
                      <Text style={styles.matchError}>⚠ Passwords do not match yet</Text>
                    )}
                  </View>
                )}

                {/* Referral Code (Optional) */}
                <View style={styles.labelRow}>
                  <Text style={styles.inputLabel}>Referral Code (Optional)</Text>
                  <View style={styles.cashbackBadge}>
                    <Sparkles size={10} color="#059669" />
                    <Text style={styles.cashbackBadgeText}>Welcome Cashback</Text>
                  </View>
                </View>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter friend's referral code"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="characters"
                    value={referralCode}
                    onChangeText={(val) => setReferralCode(val.toUpperCase())}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryActionBtn, { backgroundColor: '#003893' }]}
                  onPress={handleSubmitRegisterToOtp}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <>
                      <Text style={styles.actionBtnText}>Verify Email & Create Account</Text>
                      <ArrowRight size={18} color="#ffffff" />
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.toggleRow}>
                  <Text style={styles.togglePrompt}>Already have an account?</Text>
                  <TouchableOpacity onPress={() => setIsRegister(false)}>
                    <Text style={[styles.toggleAction, { color: '#003893' }]}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* ============================================================ */}
            {/* LENDER REGISTRATION FORM                                     */}
            {/* ============================================================ */}
            {isRegister && !isVendor && (
              <View style={styles.formBody}>
                <View style={styles.sectionHeader}>
                  <Building2 size={16} color="#007a33" />
                  <Text style={[styles.sectionHeaderTitle, { color: '#007a33' }]}>Financer Profile</Text>
                </View>

                <Text style={styles.inputLabel}>Institution / Financer Name *</Text>
                <View style={styles.inputBox}>
                  <Building2 size={18} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Apex Financers"
                    placeholderTextColor="#94a3b8"
                    value={institutionName}
                    onChangeText={setInstitutionName}
                  />
                </View>

                <Text style={styles.inputLabel}>Contact Person Full Name *</Text>
                <View style={styles.inputBox}>
                  <User size={18} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Ramesh Reddy"
                    placeholderTextColor="#94a3b8"
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>

                <Text style={styles.inputLabel}>Official Mobile Number *</Text>
                <View style={styles.inputBox}>
                  <Phone size={18} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="10-digit mobile number"
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>

                <Text style={styles.inputLabel}>Official Email ID *</Text>
                <View style={styles.inputBox}>
                  <Mail size={18} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="contact@institution.com"
                    placeholderTextColor="#94a3b8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                {/* Service Radius */}
                <Text style={styles.inputLabel}>Lending Service Area Radius *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.turnoverScroll}>
                  {RADIUS_OPTIONS.map((rad) => (
                    <TouchableOpacity
                      key={rad}
                      style={[
                        styles.turnoverChip,
                        lendingRadiusKm === rad && { backgroundColor: '#007a33', borderColor: '#007a33' },
                      ]}
                      onPress={() => setLendingRadiusKm(rad)}
                    >
                      <Text
                        style={[
                          styles.turnoverChipText,
                          lendingRadiusKm === rad && { color: '#ffffff' },
                        ]}
                      >
                        {rad} KM
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Min & Max Loan Amounts */}
                <View style={styles.rowInputs}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Min Loan (₹) *</Text>
                    <TextInput
                      style={styles.gridInput}
                      placeholder="10000"
                      placeholderTextColor="#94a3b8"
                      keyboardType="number-pad"
                      value={minLoanAmount}
                      onChangeText={setMinLoanAmount}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.inputLabel}>Max Loan (₹) *</Text>
                    <TextInput
                      style={styles.gridInput}
                      placeholder="500000"
                      placeholderTextColor="#94a3b8"
                      keyboardType="number-pad"
                      value={maxLoanAmount}
                      onChangeText={setMaxLoanAmount}
                    />
                  </View>
                </View>

                {/* Password */}
                <Text style={styles.inputLabel}>Password *</Text>
                <View style={styles.inputBox}>
                  <Lock size={18} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Create Password"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>

                <Text style={styles.inputLabel}>Confirm Password *</Text>
                <View style={styles.inputBox}>
                  <Lock size={18} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Confirm Password"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryActionBtn, { backgroundColor: '#007a33' }]}
                  onPress={handleSubmitRegisterToOtp}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <>
                      <Text style={styles.actionBtnText}>Verify Email & Create Account</Text>
                      <ArrowRight size={18} color="#ffffff" />
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.toggleRow}>
                  <Text style={styles.togglePrompt}>Already have an account?</Text>
                  <TouchableOpacity onPress={() => setIsRegister(false)}>
                    <Text style={[styles.toggleAction, { color: '#007a33' }]}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ============================================================ */}
        {/* STEP 3: OTP VERIFICATION VIEW (Mirrors Website)              */}
        {/* ============================================================ */}
        {viewStep === 'OTP_VERIFY' && (
          <View style={styles.cardContainer}>
            <View style={styles.navHeaderRow}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => setViewStep('FORM')}
                activeOpacity={0.7}
              >
                <ArrowLeft size={16} color="#475569" />
                <Text style={styles.backBtnText}>Edit Details</Text>
              </TouchableOpacity>
              <View style={styles.rolePill}>
                <Text style={styles.rolePillText}>OTP Verification</Text>
              </View>
            </View>

            <View style={styles.brandHeader}>
              <View style={styles.otpIconCircle}>
                <Mail size={32} color="#003893" />
              </View>
              <Text style={styles.formHeading}>Verify Your Email Address</Text>
              <Text style={styles.formSub}>
                We sent a 6-digit verification OTP code to{' '}
                <Text style={{ fontWeight: '800', color: '#0f172a' }}>{otpTargetEmail}</Text>.
                Enter the code below to complete registration:
              </Text>
            </View>

            <View style={styles.formBody}>
              <Text style={styles.inputLabel}>6-Digit Verification Code</Text>
              <View style={styles.inputBox}>
                <KeyRound size={18} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { fontSize: 20, letterSpacing: 8, textAlign: 'center', fontWeight: '900' }]}
                  placeholder="------"
                  placeholderTextColor="#94a3b8"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otpCode}
                  onChangeText={setOtpCode}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: primaryColor }]}
                onPress={handleVerifyOtpAndRegister}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.actionBtnText}>Verify OTP & Complete Registration</Text>
                )}
              </TouchableOpacity>

              <View style={styles.resendRow}>
                <Text style={styles.resendPrompt}>Didn't receive the email code?</Text>
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      await resendOtpApi(otpTargetEmail, 'SIGNUP', role, otpTargetName);
                      Alert.alert('Sent', 'A fresh code was sent to your email.');
                    } catch {
                      Alert.alert('Notice', 'Failed to resend code.');
                    }
                  }}
                >
                  <Text style={[styles.resendAction, { color: primaryColor }]}>Resend OTP</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ============================================================ */}
        {/* STEP 4: FORGOT PASSWORD (Request Step)                       */}
        {/* ============================================================ */}
        {viewStep === 'FORGOT_PASSWORD' && (
          <View style={styles.cardContainer}>
            <View style={styles.navHeaderRow}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => setViewStep('FORM')}
                activeOpacity={0.7}
              >
                <ArrowLeft size={16} color="#475569" />
                <Text style={styles.backBtnText}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.brandHeader}>
              <View style={styles.otpIconCircle}>
                <Lock size={32} color="#003893" />
              </View>
              <Text style={styles.formHeading}>Reset Your Password</Text>
              <Text style={styles.formSub}>
                Enter your registered mobile number or email. We'll send you an OTP code to reset your password.
              </Text>
            </View>

            <View style={styles.formBody}>
              <Text style={styles.inputLabel}>Registered Mobile Number or Email</Text>
              <View style={styles.inputBox}>
                <Mail size={18} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Mobile / Email"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  value={forgotIdentifier}
                  onChangeText={setForgotIdentifier}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: primaryColor }]}
                onPress={handleForgotRequest}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.actionBtnText}>Send Reset Code</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ============================================================ */}
        {/* STEP 5: FORGOT PASSWORD (OTP & New Password Step)            */}
        {/* ============================================================ */}
        {viewStep === 'FORGOT_OTP' && (
          <View style={styles.cardContainer}>
            <View style={styles.navHeaderRow}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => setViewStep('FORGOT_PASSWORD')}
                activeOpacity={0.7}
              >
                <ArrowLeft size={16} color="#475569" />
                <Text style={styles.backBtnText}>Change Email</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.brandHeader}>
              <Text style={styles.formHeading}>Set New Password</Text>
              <Text style={styles.formSub}>
                Enter the 6-digit OTP sent to{' '}
                <Text style={{ fontWeight: '800' }}>{forgotTargetEmail}</Text> and your new password:
              </Text>
            </View>

            <View style={styles.formBody}>
              <Text style={styles.inputLabel}>6-Digit OTP Code *</Text>
              <View style={styles.inputBox}>
                <KeyRound size={18} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, { letterSpacing: 4, fontWeight: '800' }]}
                  placeholder="123456"
                  placeholderTextColor="#94a3b8"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={forgotOtp}
                  onChangeText={setForgotOtp}
                />
              </View>

              <Text style={styles.inputLabel}>New Password *</Text>
              <View style={styles.inputBox}>
                <Lock size={18} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="New password (min 6 chars)"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry
                  value={forgotNewPassword}
                  onChangeText={setForgotNewPassword}
                />
              </View>

              <Text style={styles.inputLabel}>Confirm New Password *</Text>
              <View style={styles.inputBox}>
                <Lock size={18} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Re-enter new password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry
                  value={forgotConfirmPassword}
                  onChangeText={setForgotConfirmPassword}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: primaryColor }]}
                onPress={handleForgotReset}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.actionBtnText}>Reset Password & Sign In</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  mainBrandLogo: {
    width: 170,
    height: 60,
    marginBottom: 6,
  },
  brandSubText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
  },
  navHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  stepPill: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  stepPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#003893',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    marginTop: 6,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  selectCardVendor: {
    backgroundColor: '#f8faff',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  selectCardLender: {
    backgroundColor: '#f6fdf9',
    borderWidth: 1.5,
    borderColor: '#a7f3d0',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  selectCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  selectIconBoxVendor: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#003893',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectIconBoxLender: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#007a33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectCardTitleVendor: {
    fontSize: 15,
    fontWeight: '800',
    color: '#003893',
    lineHeight: 20,
  },
  selectCardTitleLender: {
    fontSize: 15,
    fontWeight: '800',
    color: '#007a33',
    lineHeight: 20,
  },
  selectCardDesc: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
    marginTop: 3,
    lineHeight: 16,
  },
  selectBtnRow: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 6,
  },
  selectLoginBtnVendor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#003893',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    shadowColor: '#003893',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  selectSignUpBtnVendor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#003893',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  selectLoginBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  selectSignUpBtnTextVendor: {
    color: '#003893',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  selectLoginBtnLender: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#007a33',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    shadowColor: '#007a33',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  selectSignUpBtnLender: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#007a33',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  selectSignUpBtnTextLender: {
    color: '#007a33',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  trustBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 8,
  },
  trustBadgeText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  typeChoiceCardBlue: {
    backgroundColor: '#eff6ff',
    borderWidth: 2,
    borderColor: '#93c5fd',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  typeChoiceCardIndigo: {
    backgroundColor: '#eef2ff',
    borderWidth: 2,
    borderColor: '#a5b4fc',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
  },
  typeChoiceHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  typeIconBoxBlue: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#003893',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIconBoxIndigo: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#4338ca',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 4,
  },
  typeChoiceTitleBlue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#003893',
  },
  typeChoiceTitleIndigo: {
    fontSize: 15,
    fontWeight: '900',
    color: '#312e81',
  },
  compulsoryBadge: {
    backgroundColor: '#dbeafe',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  compulsoryBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#003893',
  },
  optionalBadge: {
    backgroundColor: '#e0e7ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  optionalBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#4338ca',
  },
  typeChoiceDesc: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
    marginTop: 4,
    lineHeight: 16,
  },
  typeInfoPillBlue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#dbeafe',
    borderRadius: 10,
    padding: 8,
    marginTop: 10,
  },
  typeInfoTextBlue: {
    fontSize: 10,
    color: '#003893',
    fontWeight: '700',
    flex: 1,
  },
  typeInfoPillIndigo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e0e7ff',
    borderRadius: 10,
    padding: 8,
    marginTop: 10,
  },
  typeInfoTextIndigo: {
    fontSize: 10,
    color: '#3730a3',
    fontWeight: '700',
    flex: 1,
  },
  continueRowBlue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  continueTextBlue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#003893',
  },
  continueRowIndigo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  continueTextIndigo: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4338ca',
  },
  rolePill: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  rolePillVendor: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  rolePillLender: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  rolePillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  formHeading: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 4,
  },
  formSub: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  formBody: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 5,
    marginTop: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 4,
    height: 44,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
  },
  eyeBtn: {
    padding: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  forgotLink: {
    fontSize: 11,
    fontWeight: '800',
  },
  primaryActionBtn: {
    height: 46,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
  },
  togglePrompt: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  toggleAction: {
    fontSize: 12,
    fontWeight: '800',
  },
  categoryActiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  categoryActiveLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryActiveTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#003893',
  },
  switchTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  switchTypeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#003893',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    marginBottom: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#003893',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addressModeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  addressModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    borderRadius: 10,
  },
  addressModeBtnActive: {
    backgroundColor: '#003893',
  },
  addressModeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  addressModeTextActive: {
    color: '#ffffff',
  },
  rowInputs: {
    flexDirection: 'row',
    marginTop: 6,
  },
  gridInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  turnoverScroll: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  turnoverChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    marginRight: 6,
  },
  turnoverChipActive: {
    backgroundColor: '#003893',
    borderColor: '#003893',
  },
  turnoverChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  turnoverChipTextActive: {
    color: '#ffffff',
  },
  docHelpNotice: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
    marginVertical: 4,
  },
  docCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 10,
    marginVertical: 4,
  },
  docCardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  docCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1e293b',
    flex: 1,
  },
  badgeUploaded: {
    backgroundColor: '#ecfdf5',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  badgeUploadedText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  badgeRequired: {
    backgroundColor: '#fff1f2',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  badgeRequiredText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#e11d48',
  },
  badgeOptional: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  badgeOptionalText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
  },
  uploadPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#94a3b8',
    borderRadius: 10,
    paddingVertical: 10,
  },
  uploadPlaceholderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#003893',
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    padding: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  previewThumb: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  previewFileName: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  changeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
  },
  changeBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  matchStatusRow: {
    paddingTop: 2,
  },
  matchSuccess: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  matchError: {
    fontSize: 11,
    fontWeight: '700',
    color: '#e11d48',
  },
  cashbackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ecfdf5',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  cashbackBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  otpIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#eff6ff',
    borderWidth: 2,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  resendPrompt: {
    fontSize: 11,
    color: '#64748b',
  },
  resendAction: {
    fontSize: 11,
    fontWeight: '800',
  },
});
