import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import {
  Store,
  User,
  Phone,
  Mail,
  MapPin,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  Crown,
  Wallet,
  LogOut,
  Save,
  FileText,
  ChevronDown,
  ChevronUp,
  Gift,
  Sparkles,
  ShieldCheck,
  Eye,
  Headphones,
  Scale,
  ChevronRight,
  Edit3,
  Bell,
  RefreshCw,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import {
  updateVendorProfileApi,
  uploadFileToEc2Api,
  fetchReferEarnStatusApi,
  cancelAutoPayApi,
} from '../../services/api';
import {
  triggerTestPushNotification,
  registerForPushNotificationsAsync,
} from '../../services/notificationService';
import { SubscriptionModal } from '../../components/SubscriptionModal';
import { ReferAndEarnModal } from '../../components/ReferAndEarnModal';
import { LocationPickerModal } from '../../components/LocationPickerModal';
import { PolicyModal, PolicyTab } from '../../components/PolicyModal';
import { SupportModal } from '../../components/SupportModal';
import { resolveDocumentUrl } from '../../utils/documentGenerators';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const VendorProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    user,
    isSubscribed,
    activeSubscription,
    daysRemaining,
    formattedEndDate,
    vendorProfile,
    logout,
    refreshUserData,
    updateVendorProfileState,
  } = useAuth();

  // Accordion open/close states - collapsed by default so user clicks to open
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    membership: false,
    basic: false,
    location: false,
    kyc: false,
    photos: false,
    notifications: false,
    policies: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [isEditing, setIsEditing] = useState(false);
  const [testingPush, setTestingPush] = useState(false);
  const [pushStatus, setPushStatus] = useState<string>('Checking...');

  useEffect(() => {
    AsyncStorage.getItem('sbni_push_token').then((t) => {
      setPushStatus(t ? 'Active & Registered' : 'Not Registered');
    });
  }, []);

  const handleTestPush = async () => {
    setTestingPush(true);
    try {
      const res = await triggerTestPushNotification();
      if (res.success) {
        Alert.alert('Push Notification Sent 🔔', res.message || 'Check your notification shade for the test alert!');
        setPushStatus('Active & Registered');
      } else {
        Alert.alert('Push Notice', res.message || 'Could not send test notification.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to send test push.');
    } finally {
      setTestingPush(false);
    }
  };

  const handleSyncPushToken = async () => {
    setTestingPush(true);
    try {
      const t = await registerForPushNotificationsAsync(true);
      if (t) {
        setPushStatus('Active & Registered');
        Alert.alert('Push Token Synced 🎉', 'Device registered successfully with JustPaisa notification server.');
      } else {
        Alert.alert('Permission Notice', 'Please ensure notifications are enabled in Android App Settings.');
      }
    } catch (e: any) {
      Alert.alert('Sync Error', e?.message || 'Failed to sync push token.');
    } finally {
      setTestingPush(false);
    }
  };

  // Form State
  const [ownerName, setOwnerName] = useState(vendorProfile?.ownerName || user?.name || '');
  const [businessName, setBusinessName] = useState(vendorProfile?.businessName || '');
  const [category, setCategory] = useState(vendorProfile?.category || 'Small Shop Business');
  const [turnover, setTurnover] = useState(vendorProfile?.annualTurnover || 'Under 2 Lakhs');
  const [address, setAddress] = useState(vendorProfile?.address || '');
  const [city, setCity] = useState(vendorProfile?.city || 'Hyderabad');
  const [state, setState] = useState(vendorProfile?.state || 'Telangana');
  const [pincode, setPincode] = useState(vendorProfile?.pincode || '');
  const [lat, setLat] = useState<number | undefined>(vendorProfile?.latitude);
  const [lng, setLng] = useState<number | undefined>(vendorProfile?.longitude);
  const [avatarUrl, setAvatarUrl] = useState<string>(() => {
    const raw = vendorProfile?.avatarUrl || '';
    return raw && !raw.includes('unsplash.com') ? raw : '';
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  // KYC Docs
  const [panUrl, setPanUrl] = useState(vendorProfile?.panFileUrl || '');
  const [aadhaarUrl, setAadhaarUrl] = useState(vendorProfile?.aadhaarFileUrl || '');
  const [shopPhotoUrl, setShopPhotoUrl] = useState(
    vendorProfile?.shopPhotoUrl || (vendorProfile?.shopPhotos ? vendorProfile.shopPhotos[0] : '')
  );
  const [photoLoadError, setPhotoLoadError] = useState(false);

  const [saving, setSaving] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [subModalVisible, setSubModalVisible] = useState(false);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [isReferEarnEnabled, setIsReferEarnEnabled] = useState(false);
  const [referModalVisible, setReferModalVisible] = useState(false);
  const [policyModalVisible, setPolicyModalVisible] = useState(false);
  const [policyTab, setPolicyTab] = useState<PolicyTab>('terms');
  const [supportModalVisible, setSupportModalVisible] = useState(false);

  // Sync form whenever vendorProfile or user updates
  useEffect(() => {
    if (vendorProfile) {
      if (vendorProfile.ownerName) setOwnerName(vendorProfile.ownerName);
      if (vendorProfile.businessName) setBusinessName(vendorProfile.businessName);
      if (vendorProfile.category) setCategory(vendorProfile.category);
      if (vendorProfile.annualTurnover) setTurnover(vendorProfile.annualTurnover);
      if (vendorProfile.address) setAddress(vendorProfile.address);
      if (vendorProfile.city) setCity(vendorProfile.city);
      if (vendorProfile.state) setState(vendorProfile.state);
      if (vendorProfile.pincode) setPincode(vendorProfile.pincode);
      if (vendorProfile.latitude !== undefined) setLat(vendorProfile.latitude);
      if (vendorProfile.longitude !== undefined) setLng(vendorProfile.longitude);
      if (vendorProfile.panFileUrl) setPanUrl(vendorProfile.panFileUrl);
      if (vendorProfile.aadhaarFileUrl) setAadhaarUrl(vendorProfile.aadhaarFileUrl);
      if (vendorProfile.shopPhotoUrl || vendorProfile.shopPhotos?.[0]) {
        setShopPhotoUrl(vendorProfile.shopPhotoUrl || vendorProfile.shopPhotos?.[0] || '');
      }
      const rawAvatar = vendorProfile.avatarUrl || '';
      if (rawAvatar && !rawAvatar.includes('unsplash.com')) {
        setAvatarUrl(rawAvatar);
        setAvatarLoadError(false);
      }
    } else if (user?.name) {
      setOwnerName(user.name);
    }
  }, [vendorProfile, user]);

  // Refresh user data from server on focus
  useFocusEffect(
    useCallback(() => {
      refreshUserData();
    }, [])
  );

  const handleOpenPolicy = (tab: PolicyTab) => {
    setPolicyTab(tab);
    setPolicyModalVisible(true);
  };

  const handleCancelAutoPay = () => {
    Alert.alert(
      'Cancel AutoPay Renewal',
      'Are you sure you want to cancel recurring plan AutoPay? Your currently active VIP validity will remain intact until expiry.',
      [
        { text: 'Keep AutoPay', style: 'cancel' },
        {
          text: 'Cancel AutoPay',
          style: 'destructive',
          onPress: async () => {
            const res = await cancelAutoPayApi();
            Alert.alert(res.success ? 'AutoPay Cancelled' : 'Notice', res.message || 'AutoPay status updated.');
          },
        },
      ]
    );
  };

  useEffect(() => {
    fetchReferEarnStatusApi()
      .then((enabled) => setIsReferEarnEnabled(enabled))
      .catch(() => {});
  }, []);

  const handlePickAvatar = () => {
    Alert.alert('Business Profile Photo', 'Select photo source to update your profile photo:', [
      {
        text: 'Take Photo (Camera)',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Camera permission required.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
            base64: true,
          });
          if (!result.canceled && result.assets && result.assets[0].base64) {
            uploadAvatar(result.assets[0].base64);
          }
        },
      },
      {
        text: 'Choose from Gallery',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Gallery permission required.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
            base64: true,
          });
          if (!result.canceled && result.assets && result.assets[0].base64) {
            uploadAvatar(result.assets[0].base64);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const uploadAvatar = async (base64: string) => {
    setUploadingAvatar(true);
    try {
      const fileName = `vendor_avatar_${Date.now()}.jpg`;
      const res = await uploadFileToEc2Api(base64, 'avatars', fileName, 'AVATAR');
      const uploadedUrl = res.fileUrl || res.fullUrl;
      if (res.success && uploadedUrl) {
        setAvatarUrl(uploadedUrl);
        setAvatarLoadError(false);

        const saveRes = await updateVendorProfileApi({
          avatarUrl: uploadedUrl,
          ownerName: ownerName.trim(),
          businessName: businessName.trim(),
        });
        if (saveRes.success) {
          updateVendorProfileState({
            avatarUrl: uploadedUrl,
          });
          Alert.alert('Photo Updated 🎉', 'Business profile photo updated successfully.');
        } else {
          Alert.alert('Photo Uploaded', 'Photo uploaded. Remember to save profile to sync.');
        }
      } else {
        Alert.alert('Upload Failed', res.message || 'Could not upload photo.');
      }
    } catch (e: any) {
      Alert.alert('Upload Error', e.message || 'Failed to upload photo.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePickAndUpload = async (docType: 'PAN' | 'AADHAAR' | 'SHOP') => {
    Alert.alert('Upload Document', 'Select photo source:', [
      {
        text: 'Take Photo (Camera)',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Camera permission required.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            base64: true,
          });
          if (!result.canceled && result.assets[0].base64) {
            uploadDoc(result.assets[0].base64, docType);
          }
        },
      },
      {
        text: 'Choose from Gallery',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Gallery permission required.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            base64: true,
          });
          if (!result.canceled && result.assets[0].base64) {
            uploadDoc(result.assets[0].base64, docType);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const uploadDoc = async (base64: string, docType: 'PAN' | 'AADHAAR' | 'SHOP') => {
    setUploadingDoc(docType);
    try {
      const folder = docType === 'SHOP' ? 'shops' : 'kyc';
      const fileName = `${docType.toLowerCase()}_${Date.now()}.jpg`;
      const res = await uploadFileToEc2Api(base64, folder, fileName, docType);

      if (res.success && res.fileUrl) {
        if (docType === 'PAN') setPanUrl(res.fileUrl);
        if (docType === 'AADHAAR') setAadhaarUrl(res.fileUrl);
        if (docType === 'SHOP') {
          setShopPhotoUrl(res.fileUrl);
          setPhotoLoadError(false);
        }
        Alert.alert('Upload Success', `${docType} uploaded successfully.`);
      } else {
        Alert.alert('Upload Failed', res.message || 'Could not upload image.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Upload error.');
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const payload: any = {
        ownerName: ownerName.trim(),
        businessName: businessName.trim(),
        category,
        annualTurnover: turnover,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        latitude: lat,
        longitude: lng,
        avatarUrl: avatarUrl || undefined,
        logoUrl: avatarUrl || undefined,
        panFileUrl: panUrl || undefined,
        aadhaarFileUrl: aadhaarUrl || undefined,
        shopPhotoUrl: shopPhotoUrl || undefined,
        shopPhotos: shopPhotoUrl ? [shopPhotoUrl] : undefined,
      };

      const res = await updateVendorProfileApi(payload);
      if (res.success) {
        updateVendorProfileState(payload);
        Alert.alert('Profile Saved 🎉', 'Your shop details and documents have been saved.');
      } else {
        Alert.alert('Save Failed', res.message || 'Could not save profile.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLocationFromPicker = (radius: number, pickedCity?: string, pickedLat?: number, pickedLng?: number) => {
    if (pickedCity) setCity(pickedCity);
    if (pickedLat) setLat(pickedLat);
    if (pickedLng) setLng(pickedLng);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
    >
      {/* Top Profile Header Card with Avatar, Edit Toggle & Save Action */}
      <View style={styles.profileHeaderCard}>
        <TouchableOpacity
          style={styles.avatarWrapper}
          onPress={handlePickAvatar}
          activeOpacity={0.8}
        >
          <View style={styles.avatarCircle}>
            {uploadingAvatar ? (
              <ActivityIndicator size="small" color="#003893" />
            ) : avatarUrl && !avatarLoadError ? (
              <Image
                source={{ uri: resolveDocumentUrl(avatarUrl) }}
                style={styles.avatarImage}
                onError={() => setAvatarLoadError(true)}
              />
            ) : (
              <Store size={32} color="#003893" />
            )}
          </View>
          <View style={styles.cameraBadge}>
            <Camera size={13} color="#ffffff" />
          </View>
        </TouchableOpacity>

        <Text style={styles.headerName}>{businessName || 'My Business Enterprise'}</Text>
        <Text style={styles.headerSub}>Owner: {ownerName || user?.name || user?.phone}</Text>

        <TouchableOpacity
          style={styles.editPhotoPrompt}
          onPress={handlePickAvatar}
          activeOpacity={0.7}
        >
          <Camera size={12} color="#003893" />
          <Text style={styles.editPhotoPromptText}>Edit Profile Photo</Text>
        </TouchableOpacity>

        <View style={styles.badgeRow}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Small Shop Business</Text>
          </View>
          <View style={isSubscribed ? styles.subActiveBadge : styles.subInactiveBadge}>
            <Crown size={12} color={isSubscribed ? '#16a34a' : '#d97706'} />
            <Text style={isSubscribed ? styles.subActiveText : styles.subInactiveText}>
              {isSubscribed ? `VIP Active (${daysRemaining} Days)` : 'Free Account'}
            </Text>
          </View>
        </View>

        {/* Top Header Edit Mode & Save Action Buttons */}
        <View style={styles.headerActionRow}>
          <TouchableOpacity
            style={isEditing ? styles.cancelEditBtn : styles.editProfileBtn}
            onPress={() => {
              if (!isEditing) {
                setIsEditing(true);
                setOpenSections((prev) => ({ ...prev, basic: true }));
              } else {
                setIsEditing(false);
              }
            }}
            activeOpacity={0.8}
          >
            <Edit3 size={14} color={isEditing ? '#dc2626' : '#003893'} />
            <Text style={isEditing ? styles.cancelEditBtnText : styles.editProfileBtnText}>
              {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </Text>
          </TouchableOpacity>

          {isEditing && (
            <TouchableOpacity
              style={[styles.topSaveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSaveProfile}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Save size={14} color="#ffffff" />
                  <Text style={styles.topSaveBtnText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── ACCORDION 1: MEMBERSHIP & BILLING (MIRRORS WEBSITE) ── */}
      <View style={styles.accordionCard}>
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => toggleSection('membership')}
          activeOpacity={0.8}
        >
          <View style={styles.accordionTitleRow}>
            <Crown size={18} color="#003893" />
            <Text style={styles.accordionTitle}>Membership & Validity Stacking</Text>
          </View>
          {openSections.membership ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
        </TouchableOpacity>

        {openSections.membership && (
          <View style={styles.accordionBody}>
            {isSubscribed ? (
              <View style={styles.vipActiveBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Crown size={18} color="#047857" />
                  <Text style={styles.vipActiveTitle}>
                    VIP Membership Active • {daysRemaining} Days Remaining
                  </Text>
                </View>
                <Text style={styles.vipActiveSub}>
                  Valid until {formattedEndDate || 'Active'}. Full contact directory unlocked with 0% broker commission.
                </Text>

                <View style={styles.stackingAlert}>
                  <Sparkles size={14} color="#d97706" />
                  <Text style={styles.stackingAlertText}>
                    Validity Stacking Active: Additional plans purchased will add days directly on top of your {daysRemaining} days!
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                  <TouchableOpacity
                    style={[styles.extendBtn, { flex: 1 }]}
                    onPress={() => setSubModalVisible(true)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.extendBtnText}>Extend Validity</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelAutoPayBtn}
                    onPress={handleCancelAutoPay}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelAutoPayBtnText}>Cancel AutoPay</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.vipInactiveBox}>
                <Text style={styles.inactiveTitle}>Standard Account</Text>
                <Text style={styles.inactiveSub}>
                  Upgrade to VIP to view direct phone numbers, WhatsApp chats, and pan-India financer discovery.
                </Text>
                <TouchableOpacity
                  style={styles.upgradeBtn}
                  onPress={() => setSubModalVisible(true)}
                  activeOpacity={0.85}
                >
                  <Crown size={16} color="#ffffff" />
                  <Text style={styles.upgradeBtnText}>Activate VIP Membership</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {/* ── ACCORDION 2: PERSONAL & BUSINESS INFORMATION ── */}
      <View style={styles.accordionCard}>
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => toggleSection('basic')}
          activeOpacity={0.8}
        >
          <View style={styles.accordionTitleRow}>
            <User size={18} color="#003893" />
            <Text style={styles.accordionTitle}>Personal & Business Information</Text>
          </View>
          {openSections.basic ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
        </TouchableOpacity>

        {openSections.basic && (
          <View style={styles.accordionBody}>
            <Text style={styles.inputLabel}>Business / Shop Name *</Text>
            <View style={styles.inputBox}>
              <Store size={16} color="#94a3b8" />
              <TextInput
                style={styles.textInput}
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="e.g. My General Store"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <Text style={styles.inputLabel}>Owner Full Name *</Text>
            <View style={styles.inputBox}>
              <User size={16} color="#94a3b8" />
              <TextInput
                style={styles.textInput}
                value={ownerName}
                onChangeText={setOwnerName}
                placeholder="Owner Full Name"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <Text style={styles.inputLabel}>Registered Mobile Phone</Text>
            <View style={[styles.inputBox, styles.readOnlyBox]}>
              <Phone size={16} color="#94a3b8" />
              <Text style={styles.readOnlyText}>+91 {user?.phone || '9876543210'}</Text>
            </View>

            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={[styles.inputBox, styles.readOnlyBox]}>
              <Mail size={16} color="#94a3b8" />
              <Text style={styles.readOnlyText}>{user?.email || 'vendor@justpaisa.in'}</Text>
            </View>

            <Text style={styles.inputLabel}>Shop Category</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.textInput}
                value={category}
                onChangeText={setCategory}
                placeholder="e.g. Retail, Kirana, Wholesale"
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* In-Accordion Profile Photo Upload Card */}
            <View style={styles.photoUploadBox}>
              <View style={{ flex: 1 }}>
                <Text style={styles.photoUploadTitle}>Business Profile Photo</Text>
                <Text style={styles.photoUploadSub}>
                  {avatarUrl ? 'Photo uploaded & active on marketplace' : 'Upload shop owner or storefront photo'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.photoUploadBtn}
                onPress={handlePickAvatar}
                activeOpacity={0.8}
              >
                <Camera size={14} color="#ffffff" />
                <Text style={styles.photoUploadBtnText}>{avatarUrl ? 'Change' : 'Upload'}</Text>
              </TouchableOpacity>
            </View>

            {/* In-Accordion Section Save Button */}
            <TouchableOpacity
              style={[styles.sectionSaveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSaveProfile}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Save size={14} color="#ffffff" />
                  <Text style={styles.sectionSaveBtnText}>Save Personal Details</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── ACCORDION 3: REGISTERED SHOP LOCATION (MAPBOX VERIFIED) ── */}
      <View style={styles.accordionCard}>
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => toggleSection('location')}
          activeOpacity={0.8}
        >
          <View style={styles.accordionTitleRow}>
            <MapPin size={18} color="#003893" />
            <Text style={styles.accordionTitle}>Registered Shop Location (Mapbox)</Text>
          </View>
          {openSections.location ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
        </TouchableOpacity>

        {openSections.location && (
          <View style={styles.accordionBody}>
            <TouchableOpacity
              style={styles.mapboxPickerTrigger}
              onPress={() => setLocationPickerVisible(true)}
              activeOpacity={0.85}
            >
              <MapPin size={18} color="#003893" />
              <View style={{ flex: 1 }}>
                <Text style={styles.mapboxPickerTitle}>Select on Mapbox Geocoding</Text>
                <Text style={styles.mapboxPickerSub}>
                  {city ? `${city}, ${state}` : 'Tap to search area and auto-detect coordinates'}
                </Text>
              </View>
              <Text style={styles.mapboxPickerBtnText}>Pick Area →</Text>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Shop Street Address</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.textInput}
                value={address}
                onChangeText={setAddress}
                placeholder="Street address, building number, landmark"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.gridRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>City</Text>
                <TextInput
                  style={styles.gridInput}
                  value={city}
                  onChangeText={setCity}
                  placeholder="City"
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <View style={{ flex: 1, marginHorizontal: 8 }}>
                <Text style={styles.inputLabel}>State</Text>
                <TextInput
                  style={styles.gridInput}
                  value={state}
                  onChangeText={setState}
                  placeholder="State"
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Pincode</Text>
                <TextInput
                  style={styles.gridInput}
                  value={pincode}
                  onChangeText={setPincode}
                  placeholder="Pincode"
                  keyboardType="number-pad"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            {/* In-Accordion Location Save Button */}
            <TouchableOpacity
              style={[styles.sectionSaveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSaveProfile}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Save size={14} color="#ffffff" />
                  <Text style={styles.sectionSaveBtnText}>Save Shop Location</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── ACCORDION 4: VERIFIED KYC DOCUMENTS ── */}
      <View style={styles.accordionCard}>
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => toggleSection('kyc')}
          activeOpacity={0.8}
        >
          <View style={styles.accordionTitleRow}>
            <ShieldCheck size={18} color="#003893" />
            <Text style={styles.accordionTitle}>Verified KYC Documents</Text>
          </View>
          {openSections.kyc ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
        </TouchableOpacity>

        {openSections.kyc && (
          <View style={styles.accordionBody}>
            {/* PAN Card */}
            <View style={styles.docItem}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.docTitle}>PAN Card Photo</Text>
                  {panUrl ? (
                    <View style={styles.verifiedPill}>
                      <Text style={styles.verifiedPillText}>✓ Uploaded</Text>
                    </View>
                  ) : (
                    <Text style={styles.pendingPillText}>Pending</Text>
                  )}
                </View>
                <Text style={styles.docSub}>Government issued identity proof</Text>
              </View>

              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={() => handlePickAndUpload('PAN')}
                disabled={uploadingDoc === 'PAN'}
              >
                {uploadingDoc === 'PAN' ? (
                  <ActivityIndicator size="small" color="#003893" />
                ) : (
                  <>
                    <Upload size={14} color="#003893" />
                    <Text style={styles.uploadBtnText}>{panUrl ? 'Change' : 'Upload'}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Aadhaar Card */}
            <View style={styles.docItem}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.docTitle}>Aadhaar Card Photo</Text>
                  {aadhaarUrl ? (
                    <View style={styles.verifiedPill}>
                      <Text style={styles.verifiedPillText}>✓ Uploaded</Text>
                    </View>
                  ) : (
                    <Text style={styles.pendingPillText}>Pending</Text>
                  )}
                </View>
                <Text style={styles.docSub}>Address and identity verification</Text>
              </View>

              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={() => handlePickAndUpload('AADHAAR')}
                disabled={uploadingDoc === 'AADHAAR'}
              >
                {uploadingDoc === 'AADHAAR' ? (
                  <ActivityIndicator size="small" color="#003893" />
                ) : (
                  <>
                    <Upload size={14} color="#003893" />
                    <Text style={styles.uploadBtnText}>{aadhaarUrl ? 'Change' : 'Upload'}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* ── ACCORDION 5: SHOP PHOTOS GALLERY ── */}
      <View style={styles.accordionCard}>
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => toggleSection('photos')}
          activeOpacity={0.8}
        >
          <View style={styles.accordionTitleRow}>
            <Camera size={18} color="#003893" />
            <Text style={styles.accordionTitle}>Store & Shop Photos Gallery</Text>
          </View>
          {openSections.photos ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
        </TouchableOpacity>

        {openSections.photos && (
          <View style={styles.accordionBody}>
            {shopPhotoUrl && !photoLoadError ? (
              <View style={styles.photoPreviewContainer}>
                <Image
                  source={{ uri: resolveDocumentUrl(shopPhotoUrl) }}
                  style={styles.photoPreview}
                  resizeMode="cover"
                  onError={() => setPhotoLoadError(true)}
                />
                <TouchableOpacity
                  style={styles.changePhotoBtn}
                  onPress={() => handlePickAndUpload('SHOP')}
                  disabled={uploadingDoc === 'SHOP'}
                  activeOpacity={0.85}
                >
                  <Camera size={14} color="#ffffff" />
                  <Text style={styles.changePhotoText}>
                    {uploadingDoc === 'SHOP' ? 'Uploading...' : 'Change Store Photo'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addPhotoBox}
                onPress={() => handlePickAndUpload('SHOP')}
                disabled={uploadingDoc === 'SHOP'}
                activeOpacity={0.85}
              >
                <Camera size={32} color="#003893" />
                <Text style={styles.addPhotoTitle}>Add Storefront / Counter Photo</Text>
                <Text style={styles.addPhotoSub}>Take photo from camera or choose from gallery</Text>
                <View style={styles.uploadBadgePill}>
                  <Upload size={12} color="#003893" />
                  <Text style={styles.uploadBadgePillText}>
                    {uploadingDoc === 'SHOP' ? 'Uploading Photo...' : 'Upload Store Photo'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* ── ACCORDION 6: PUSH NOTIFICATIONS & DEVICE ALERTS ── */}
      <View style={styles.accordionCard}>
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => toggleSection('notifications')}
          activeOpacity={0.8}
        >
          <View style={styles.accordionTitleRow}>
            <Bell size={18} color="#003893" />
            <Text style={styles.accordionTitle}>Push Notifications & Alerts</Text>
          </View>
          {openSections.notifications ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
        </TouchableOpacity>

        {openSections.notifications && (
          <View style={styles.accordionBody}>
            {/* Status Card */}
            <View style={styles.notifStatusCard}>
              <View style={styles.notifStatusRow}>
                <View style={[styles.notifStatusDot, pushStatus.includes('Active') ? styles.dotGreen : styles.dotOrange]} />
                <Text style={styles.notifStatusLabel}>Device Status:</Text>
                <Text style={[styles.notifStatusVal, pushStatus.includes('Active') ? styles.valGreen : styles.valOrange]}>
                  {pushStatus}
                </Text>
              </View>
              <Text style={styles.notifStatusHint}>
                Real-time Expo push notifications alert you when new financers join in your area, and when your loan requests update.
              </Text>
            </View>

            {/* Test Notification Button */}
            <TouchableOpacity
              style={[styles.testNotifBtn, testingPush && styles.saveBtnDisabled]}
              onPress={handleTestPush}
              disabled={testingPush}
              activeOpacity={0.85}
            >
              {testingPush ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Bell size={15} color="#ffffff" />
                  <Text style={styles.testNotifBtnText}>Send Test Notification 🔔</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Re-Sync Token Button */}
            <TouchableOpacity
              style={[styles.syncNotifBtn, testingPush && styles.saveBtnDisabled]}
              onPress={handleSyncPushToken}
              disabled={testingPush}
              activeOpacity={0.85}
            >
              <RefreshCw size={14} color="#003893" />
              <Text style={styles.syncNotifBtnText}>Re-Sync / Register Push Token</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── ACCORDION 7: LEGAL POLICIES & CUSTOMER SUPPORT ── */}
      <View style={styles.accordionCard}>
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => toggleSection('policies')}
          activeOpacity={0.8}
        >
          <View style={styles.accordionTitleRow}>
            <ShieldCheck size={18} color="#003893" />
            <Text style={styles.accordionTitle}>Legal Policies & Support</Text>
          </View>
          {openSections.policies ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
        </TouchableOpacity>

        {openSections.policies && (
          <View style={styles.accordionBody}>
            <TouchableOpacity
              style={styles.policyRow}
              onPress={() => handleOpenPolicy('terms')}
              activeOpacity={0.7}
            >
              <View style={styles.policyRowLeft}>
                <FileText size={16} color="#003893" />
                <Text style={styles.policyRowText}>Terms of Service & Usage</Text>
              </View>
              <ChevronRight size={16} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.policyRow}
              onPress={() => handleOpenPolicy('privacy')}
              activeOpacity={0.7}
            >
              <View style={styles.policyRowLeft}>
                <ShieldCheck size={16} color="#16a34a" />
                <Text style={styles.policyRowText}>Privacy & Data Protection Policy</Text>
              </View>
              <ChevronRight size={16} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.policyRow}
              onPress={() => handleOpenPolicy('refund')}
              activeOpacity={0.7}
            >
              <View style={styles.policyRowLeft}>
                <Scale size={16} color="#2563eb" />
                <Text style={styles.policyRowText}>Cancellation & Refund Policy</Text>
              </View>
              <ChevronRight size={16} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.policyRow}
              onPress={() => setSupportModalVisible(true)}
              activeOpacity={0.7}
            >
              <View style={styles.policyRowLeft}>
                <Headphones size={16} color="#7c3aed" />
                <Text style={styles.policyRowText}>24/7 Customer Helpdesk & Support</Text>
              </View>
              <ChevronRight size={16} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutRow}
              onPress={() => {
                Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Sign Out', style: 'destructive', onPress: logout },
                ]);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.policyRowLeft}>
                <LogOut size={16} color="#dc2626" />
                <Text style={styles.logoutRowText}>Sign Out of My Account</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Modals */}
      <SubscriptionModal
        visible={subModalVisible}
        onClose={() => setSubModalVisible(false)}
      />

      <LocationPickerModal
        visible={locationPickerVisible}
        currentRadius={50}
        currentCity={city}
        onClose={() => setLocationPickerVisible(false)}
        onApply={handleLocationFromPicker}
      />

      <PolicyModal
        visible={policyModalVisible}
        initialTab={policyTab}
        onClose={() => setPolicyModalVisible(false)}
      />

      <SupportModal
        visible={supportModalVisible}
        onClose={() => setSupportModalVisible(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
  },
  profileHeaderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#eff6ff',
    borderWidth: 2,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 38,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#003893',
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  editPhotoPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginTop: 8,
    marginBottom: 2,
  },
  editPhotoPromptText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#003893',
  },
  headerName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  roleBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  roleBadgeText: {
    fontSize: 11,
    color: '#003893',
    fontWeight: '800',
  },
  subActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  subActiveText: {
    fontSize: 11,
    color: '#047857',
    fontWeight: '800',
  },
  subInactiveBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  subInactiveText: {
    fontSize: 11,
    color: '#92400e',
    fontWeight: '700',
  },
  headerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 14,
    width: '100%',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 14,
    flex: 1,
  },
  editProfileBtnText: {
    color: '#003893',
    fontSize: 13,
    fontWeight: '800',
  },
  cancelEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 14,
    flex: 1,
  },
  cancelEditBtnText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '800',
  },
  topSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#003893',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 14,
    flex: 1,
    shadowColor: '#003893',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  topSaveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  photoUploadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    marginBottom: 4,
  },
  photoUploadTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#003893',
  },
  photoUploadSub: {
    fontSize: 11,
    color: '#2563eb',
    marginTop: 2,
  },
  photoUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#003893',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  photoUploadBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  sectionSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#003893',
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 14,
    shadowColor: '#003893',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionSaveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  accordionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
  },
  accordionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  accordionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  accordionBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  vipActiveBox: {
    backgroundColor: '#ecfdf5',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  vipActiveTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#065f46',
  },
  vipActiveSub: {
    fontSize: 11,
    color: '#047857',
    lineHeight: 16,
    marginBottom: 8,
  },
  stackingAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 10,
    marginBottom: 10,
  },
  stackingAlertText: {
    fontSize: 11,
    color: '#92400e',
    fontWeight: '700',
    flex: 1,
  },
  extendBtn: {
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  extendBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  vipInactiveBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  inactiveTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#003893',
  },
  inactiveSub: {
    fontSize: 11,
    color: '#3b82f6',
    marginTop: 2,
    marginBottom: 10,
  },
  upgradeBtn: {
    backgroundColor: '#003893',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
  },
  upgradeBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
    marginTop: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
  },
  readOnlyBox: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  readOnlyText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  gridRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  gridInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 44,
    fontSize: 13,
    color: '#0f172a',
  },
  mapboxPickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  mapboxPickerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#003893',
  },
  mapboxPickerSub: {
    fontSize: 11,
    color: '#3b82f6',
  },
  mapboxPickerBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#003893',
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  docTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  docSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  verifiedPill: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  verifiedPillText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '800',
  },
  pendingPillText: {
    fontSize: 10,
    color: '#e11d48',
    fontWeight: '700',
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  uploadBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#003893',
  },
  photoPreviewContainer: {
    alignItems: 'center',
    gap: 8,
  },
  photoPreview: {
    width: '100%',
    height: 180,
    borderRadius: 14,
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#003893',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  changePhotoText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  addPhotoBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
  },
  addPhotoTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#003893',
  },
  addPhotoSub: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 6,
  },
  uploadBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  uploadBadgePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#003893',
  },
  saveBtn: {
    backgroundColor: '#003893',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 20,
    shadowColor: '#003893',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  cancelAutoPayBtn: {
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelAutoPayBtnText: {
    color: '#e11d48',
    fontSize: 12,
    fontWeight: '800',
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  policyRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  policyRowText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    marginTop: 4,
  },
  logoutRowText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#dc2626',
  },
  notifStatusCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 12,
  },
  notifStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  notifStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotGreen: {
    backgroundColor: '#16a34a',
  },
  dotOrange: {
    backgroundColor: '#f59e0b',
  },
  notifStatusLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e3a8a',
  },
  notifStatusVal: {
    fontSize: 12,
    fontWeight: '800',
  },
  valGreen: {
    color: '#16a34a',
  },
  valOrange: {
    color: '#d97706',
  },
  notifStatusHint: {
    fontSize: 11,
    color: '#2563eb',
    lineHeight: 16,
  },
  testNotifBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#003893',
    paddingVertical: 11,
    borderRadius: 12,
    marginBottom: 8,
  },
  testNotifBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  syncNotifBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingVertical: 10,
    borderRadius: 12,
  },
  syncNotifBtnText: {
    color: '#003893',
    fontSize: 12,
    fontWeight: '800',
  },
});
