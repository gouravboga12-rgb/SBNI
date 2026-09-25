import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import {
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Save,
  LogOut,
  Crown,
  Compass,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Gift,
  Sparkles,
  Headphones,
  Scale,
  FileText,
  ChevronRight,
  Camera,
  Edit3,
  Bell,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import {
  updateLenderProfileApi,
  uploadFileToEc2Api,
  fetchReferEarnStatusApi,
  cancelAutoPayApi,
  deleteMyAccountApi,
} from '../../services/api';
import {
  triggerTestPushNotification,
  registerForPushNotificationsAsync,
} from '../../services/notificationService';
import { SubscriptionModal } from '../../components/SubscriptionModal';
import { LocationPickerModal } from '../../components/LocationPickerModal';
import { PolicyModal } from '../../components/PolicyModal';
import { SupportModal } from '../../components/SupportModal';
import { resolveDocumentUrl } from '../../utils/documentGenerators';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const RADIUS_OPTIONS = [10, 25, 50, 70, 100];

export const LenderProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    user,
    isSubscribed,
    activeSubscription,
    daysRemaining,
    formattedEndDate,
    lenderProfile,
    logout,
    refreshUserData,
    updateLenderProfileState,
  } = useAuth();

  // Accordion open/close state - collapsed by default so user clicks to open
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    membership: false,
    basic: false,
    location: false,
    criteria: false,
    notifications: false,
    policies: false,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Commercial Partner Account Permanently',
      'Are you sure you want to permanently delete your Just Paisa commercial partner account? All your institutional details, service radius settings, active leads, and associated records will be permanently erased. This action CANNOT be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeletingAccount(true);
              const res = await deleteMyAccountApi();
              setIsDeletingAccount(false);
              if (res.success) {
                Alert.alert(
                  'Account Deleted',
                  'Your commercial partner account and all associated data have been permanently deleted from Just Paisa.',
                  [{ text: 'OK', onPress: logout }]
                );
              } else {
                Alert.alert('Deletion Error', res.message || 'Failed to delete account. Please try again or contact support.');
              }
            } catch (err: any) {
              setIsDeletingAccount(false);
              Alert.alert('Deletion Error', err.message || 'Failed to delete account.');
            }
          },
        },
      ]
    );
  };
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

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [supportModalVisible, setSupportModalVisible] = useState(false);
  const [policyModalVisible, setPolicyModalVisible] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<'terms' | 'privacy' | 'refund' | 'shipping'>('terms');
  const [cancellingAutoPay, setCancellingAutoPay] = useState(false);

  const handleOpenPolicy = (type: 'terms' | 'privacy' | 'refund' | 'shipping') => {
    setSelectedPolicy(type);
    setPolicyModalVisible(true);
  };

  const handleCancelAutoPay = () => {
    Alert.alert(
      'Cancel AutoPay Subscription',
      'Are you sure you want to cancel automatic subscription renewals? Your current VIP Financer access will remain active until the end of your billing cycle.',
      [
        { text: 'Keep AutoPay', style: 'cancel' },
        {
          text: 'Cancel AutoPay',
          style: 'destructive',
          onPress: async () => {
            setCancellingAutoPay(true);
            try {
              const res = await cancelAutoPayApi();
              if (res.success) {
                Alert.alert(
                  'AutoPay Cancelled',
                  res.message || 'Auto-renewal has been cancelled. No further deductions will occur.'
                );
              } else {
                Alert.alert('Notice', res.message || 'AutoPay was not active or already cancelled.');
              }
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Could not cancel AutoPay.');
            } finally {
              setCancellingAutoPay(false);
            }
          },
        },
      ]
    );
  };

  const [institutionName, setInstitutionName] = useState(
    lenderProfile?.institutionName || user?.name || 'Financing Partner'
  );
  const [contactPerson, setContactPerson] = useState(
    lenderProfile?.contactPersonName || user?.name || ''
  );
  const [lendingRadiusKm, setLendingRadiusKm] = useState(
    lenderProfile?.lendingRadiusKm || 50
  );
  const [minAmount, setMinAmount] = useState(String(lenderProfile?.minLoanAmount || 10000));
  const [maxAmount, setMaxAmount] = useState(String(lenderProfile?.maxLoanAmount || 500000));
  const [address, setAddress] = useState(lenderProfile?.address || '');
  const [city, setCity] = useState(lenderProfile?.city || 'Hyderabad');
  const [state, setState] = useState(lenderProfile?.state || 'Telangana');
  const [pincode, setPincode] = useState(lenderProfile?.pincode || '');
  const [lat, setLat] = useState<number | undefined>(lenderProfile?.latitude);
  const [lng, setLng] = useState<number | undefined>(lenderProfile?.longitude);
  const [avatarUrl, setAvatarUrl] = useState<string>(() => {
    const raw = lenderProfile?.avatarUrl || lenderProfile?.logoUrl || '';
    return raw && !raw.includes('unsplash.com') ? raw : '';
  });
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarLoadError, setAvatarLoadError] = useState(false);

  const [saving, setSaving] = useState(false);
  const [subModalVisible, setSubModalVisible] = useState(false);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);

  // Sync form whenever lenderProfile or user updates
  useEffect(() => {
    if (lenderProfile) {
      if (lenderProfile.institutionName) setInstitutionName(lenderProfile.institutionName);
      if (lenderProfile.contactPersonName) setContactPerson(lenderProfile.contactPersonName);
      if (lenderProfile.lendingRadiusKm) setLendingRadiusKm(lenderProfile.lendingRadiusKm);
      if (lenderProfile.minLoanAmount !== undefined) setMinAmount(String(lenderProfile.minLoanAmount));
      if (lenderProfile.maxLoanAmount !== undefined) setMaxAmount(String(lenderProfile.maxLoanAmount));
      if (lenderProfile.address) setAddress(lenderProfile.address);
      if (lenderProfile.city) setCity(lenderProfile.city);
      if (lenderProfile.state) setState(lenderProfile.state);
      if (lenderProfile.pincode) setPincode(lenderProfile.pincode);
      if (lenderProfile.latitude !== undefined) setLat(lenderProfile.latitude);
      if (lenderProfile.longitude !== undefined) setLng(lenderProfile.longitude);
      const rawAvatar = lenderProfile.avatarUrl || lenderProfile.logoUrl || '';
      if (rawAvatar && !rawAvatar.includes('unsplash.com')) {
        setAvatarUrl(rawAvatar);
        setAvatarLoadError(false);
      }
    } else if (user?.name) {
      setContactPerson(user.name);
    }
  }, [lenderProfile, user]);

  // Refresh user data from server on focus
  useFocusEffect(
    useCallback(() => {
      refreshUserData();
    }, [])
  );

  const handlePickAvatar = () => {
    Alert.alert('Partner Profile Photo', 'Select photo source to update your profile photo:', [
      {
        text: 'Take Photo (Camera)',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Camera permission is required to take photo.');
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
            Alert.alert('Permission Denied', 'Gallery permission is required to pick photo.');
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
      const fileName = `partner_avatar_${Date.now()}.jpg`;
      const res = await uploadFileToEc2Api(base64, 'avatars', fileName, 'AVATAR');
      const uploadedUrl = res.fileUrl || res.fullUrl;
      if (res.success && uploadedUrl) {
        setAvatarUrl(uploadedUrl);
        setAvatarLoadError(false);

        // Instantly save to database as well
        const saveRes = await updateLenderProfileApi({
          avatarUrl: uploadedUrl,
          logoUrl: uploadedUrl,
          institutionName: institutionName.trim(),
          contactPersonName: contactPerson.trim(),
        });
        if (saveRes.success) {
          updateLenderProfileState({
            avatarUrl: uploadedUrl,
            logoUrl: uploadedUrl,
          });
          Alert.alert('Photo Updated 🎉', 'Partner profile photo updated successfully.');
        } else {
          Alert.alert('Photo Uploaded', 'Photo uploaded. Tap Save Profile at the bottom to sync all changes.');
        }
      } else {
        Alert.alert('Upload Failed', res.message || 'Could not upload photo. Please try again.');
      }
    } catch (e: any) {
      Alert.alert('Upload Error', e.message || 'Failed to upload photo.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {
        institutionName: institutionName.trim(),
        contactPersonName: contactPerson.trim(),
        lendingRadiusKm,
        minLoanAmount: Number(minAmount) || 10000,
        maxLoanAmount: Number(maxAmount) || 500000,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        latitude: lat,
        longitude: lng,
        avatarUrl: avatarUrl || undefined,
        logoUrl: avatarUrl || undefined,
      };

      const res = await updateLenderProfileApi(payload);
      if (res.success) {
        updateLenderProfileState(payload);
        Alert.alert('Profile Saved 🎉', 'Partner profile & operating radius updated successfully.');
      } else {
        Alert.alert('Notice', res.message || 'Could not update profile.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLocationFromPicker = (radius: number, pickedCity?: string, pickedLat?: number, pickedLng?: number) => {
    setLendingRadiusKm(radius);
    if (pickedCity) setCity(pickedCity);
    if (pickedLat) setLat(pickedLat);
    if (pickedLng) setLng(pickedLng);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
    >
      {/* Top Partner Profile Header Card with Avatar & Camera Edit */}
      <View style={styles.headerCard}>
        <TouchableOpacity
          style={styles.avatarWrapper}
          onPress={handlePickAvatar}
          activeOpacity={0.8}
          accessibilityLabel="Edit partner profile photo"
        >
          <View style={styles.avatarCircle}>
            {uploadingAvatar ? (
              <ActivityIndicator size="small" color="#007a33" />
            ) : avatarUrl && !avatarLoadError ? (
              <Image
                source={{ uri: resolveDocumentUrl(avatarUrl) }}
                style={styles.avatarImage}
                onError={() => setAvatarLoadError(true)}
              />
            ) : (
              <Building2 size={34} color="#007a33" />
            )}
          </View>
          <View style={styles.cameraBadge}>
            <Camera size={13} color="#ffffff" />
          </View>
        </TouchableOpacity>

        <Text style={styles.instName}>{institutionName}</Text>
        <Text style={styles.contactPersonText}>Manager: {contactPerson || user?.name}</Text>
        
        <TouchableOpacity
          style={styles.editPhotoPrompt}
          onPress={handlePickAvatar}
          activeOpacity={0.7}
        >
          <Camera size={12} color="#007a33" />
          <Text style={styles.editPhotoPromptText}>Edit Profile Photo</Text>
        </TouchableOpacity>

        <View style={styles.badgeRow}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Commercial Partner Hub</Text>
          </View>
          <View style={isSubscribed ? styles.subActiveBadge : styles.subInactiveBadge}>
            <Crown size={12} color={isSubscribed ? '#16a34a' : '#d97706'} />
            <Text style={isSubscribed ? styles.subActiveText : styles.subInactiveText}>
              {isSubscribed ? `VIP Partner (${daysRemaining} Days)` : 'Standard'}
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
              onPress={handleSave}
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

      {/* ── ACCORDION 1: MEMBERSHIP & BILLING DETAILS ── */}
      <View style={styles.accordionCard}>
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => toggleSection('membership')}
          activeOpacity={0.8}
        >
          <View style={styles.accordionTitleRow}>
            <Crown size={18} color="#007a33" />
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
                    VIP Partner Active • {daysRemaining} Days Remaining
                  </Text>
                </View>
                <Text style={styles.vipActiveSub}>
                  Valid until {formattedEndDate || 'Active'}. Full applicant directory unlocked with verified shop KYC documents.
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
                    disabled={cancellingAutoPay}
                  >
                    <Text style={styles.cancelAutoPayBtnText}>Cancel AutoPay</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.vipInactiveBox}>
                <Text style={styles.inactiveTitle}>Standard Partner Account</Text>
                <Text style={styles.inactiveSub}>
                  Upgrade to VIP Partner for unlimited applicant leads, direct calling, and priority discovery across your radius.
                </Text>
                <TouchableOpacity
                  style={styles.upgradeBtn}
                  onPress={() => setSubModalVisible(true)}
                  activeOpacity={0.85}
                >
                  <Crown size={16} color="#ffffff" />
                  <Text style={styles.upgradeBtnText}>Upgrade to VIP Partner</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {/* ── ACCORDION 2: COMMERCIAL PARTNER COMPANY & CONTACT INFO ── */}}
      <View style={styles.accordionCard}>
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => toggleSection('basic')}
          activeOpacity={0.8}
        >
          <View style={styles.accordionTitleRow}>
            <Building2 size={18} color="#007a33" />
            <Text style={styles.accordionTitle}>Partner Entity & Contact</Text>
          </View>
          {openSections.basic ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
        </TouchableOpacity>

        {openSections.basic && (
          <View style={styles.accordionBody}>
            <Text style={styles.inputLabel}>Company / Institution Name *</Text>
            <View style={styles.inputBox}>
              <Building2 size={16} color="#94a3b8" />
              <TextInput
                style={styles.textInput}
                value={institutionName}
                onChangeText={setInstitutionName}
                placeholder="e.g. Hyderabad Capital Financers"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <Text style={styles.inputLabel}>Contact Person / Branch Manager *</Text>
            <View style={styles.inputBox}>
              <User size={16} color="#94a3b8" />
              <TextInput
                style={styles.textInput}
                value={contactPerson}
                onChangeText={setContactPerson}
                placeholder="Manager Name"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <Text style={styles.inputLabel}>Registered Mobile</Text>
            <View style={[styles.inputBox, styles.readOnlyBox]}>
              <Phone size={16} color="#94a3b8" />
              <Text style={styles.readOnlyText}>+91 {user?.phone || '9876543210'}</Text>
            </View>

            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={[styles.inputBox, styles.readOnlyBox]}>
              <Mail size={16} color="#94a3b8" />
              <Text style={styles.readOnlyText}>{user?.email || 'lender@justpaisa.in'}</Text>
            </View>

            {/* In-Accordion Profile Photo Upload Card */}
            <View style={styles.photoUploadBox}>
              <View style={{ flex: 1 }}>
                <Text style={styles.photoUploadTitle}>Partner Profile Photo</Text>
                <Text style={styles.photoUploadSub}>
                  {avatarUrl ? 'Photo uploaded & active on marketplace' : 'Upload official logo or owner photo'}
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
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Save size={14} color="#ffffff" />
                  <Text style={styles.sectionSaveBtnText}>Save Entity Details</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── ACCORDION 3: OPERATING LOCATION & MAPBOX SELECTOR ── */}
      <View style={styles.accordionCard}>
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => toggleSection('location')}
          activeOpacity={0.8}
        >
          <View style={styles.accordionTitleRow}>
            <MapPin size={18} color="#007a33" />
            <Text style={styles.accordionTitle}>Operating Location (Mapbox)</Text>
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
              <Compass size={18} color="#007a33" />
              <View style={{ flex: 1 }}>
                <Text style={styles.mapboxPickerTitle}>Select Office Area on Mapbox</Text>
                <Text style={styles.mapboxPickerSub}>
                  {city ? `${city}, ${state}` : 'Tap to search area and auto-detect coordinates'}
                </Text>
              </View>
              <Text style={styles.mapboxPickerBtnText}>Pick Area →</Text>
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Office Address</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.textInput}
                value={address}
                onChangeText={setAddress}
                placeholder="Office street address, building, floor"
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
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Save size={14} color="#ffffff" />
                  <Text style={styles.sectionSaveBtnText}>Save Operating Location</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── ACCORDION 4: FINANCING CRITERIA & RADIUS ── */}
      <View style={styles.accordionCard}>
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => toggleSection('criteria')}
          activeOpacity={0.8}
        >
          <View style={styles.accordionTitleRow}>
            <Compass size={18} color="#007a33" />
            <Text style={styles.accordionTitle}>Financing Criteria & Radius</Text>
          </View>
          {openSections.criteria ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
        </TouchableOpacity>

        {openSections.criteria && (
          <View style={styles.accordionBody}>
            <Text style={styles.inputLabel}>
              Operating Distance Radius: <Text style={{ color: '#007a33', fontWeight: '900' }}>{lendingRadiusKm} KM</Text>
            </Text>
            <View style={styles.radiusPillsRow}>
              {RADIUS_OPTIONS.map((km) => (
                <TouchableOpacity
                  key={km}
                  style={[styles.radiusChip, lendingRadiusKm === km && styles.radiusChipActive]}
                  onPress={() => setLendingRadiusKm(km)}
                >
                  <Text style={[styles.radiusChipText, lendingRadiusKm === km && styles.radiusChipTextActive]}>
                    {km} KM
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.gridRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.inputLabel}>Min Amount (₹)</Text>
                <TextInput
                  style={styles.gridInput}
                  value={minAmount}
                  onChangeText={setMinAmount}
                  keyboardType="number-pad"
                  placeholder="10000"
                  placeholderTextColor="#94a3b8"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Max Amount (₹)</Text>
                <TextInput
                  style={styles.gridInput}
                  value={maxAmount}
                  onChangeText={setMaxAmount}
                  keyboardType="number-pad"
                  placeholder="500000"
                  placeholderTextColor="#94a3b8"
                />
              </View>
            </View>

            {/* In-Accordion Criteria Save Button */}
            <TouchableOpacity
              style={[styles.sectionSaveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Save size={14} color="#ffffff" />
                  <Text style={styles.sectionSaveBtnText}>Save Financing Criteria</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── ACCORDION 5: LEGAL POLICIES & CUSTOMER SUPPORT ── */}
      <View style={styles.accordionCard}>
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => toggleSection('policies')}
          activeOpacity={0.8}
        >
          <View style={styles.accordionTitleRow}>
            <ShieldCheck size={18} color="#007a33" />
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
                Alert.alert('Sign Out', 'Are you sure you want to sign out of your Partner Account?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Sign Out', style: 'destructive', onPress: logout },
                ]);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.policyRowLeft}>
                <LogOut size={16} color="#64748b" />
                <Text style={[styles.logoutRowText, { color: '#64748b' }]}>Sign Out of Partner Account</Text>
              </View>
            </TouchableOpacity>

            {/* Permanent Account Deletion Option */}
            <TouchableOpacity
              style={[styles.deleteAccountRow, isDeletingAccount && styles.saveBtnDisabled]}
              onPress={handleDeleteAccount}
              disabled={isDeletingAccount}
              activeOpacity={0.7}
            >
              <View style={styles.policyRowLeft}>
                {isDeletingAccount ? (
                  <ActivityIndicator size="small" color="#dc2626" />
                ) : (
                  <Trash2 size={16} color="#dc2626" />
                )}
                <Text style={styles.deleteAccountRowText}>
                  {isDeletingAccount ? 'Deleting Account...' : 'Delete Partner Account Permanently'}
                </Text>
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
        currentRadius={lendingRadiusKm}
        currentCity={city}
        onClose={() => setLocationPickerVisible(false)}
        onApply={handleLocationFromPicker}
      />

      <PolicyModal
        visible={policyModalVisible}
        onClose={() => setPolicyModalVisible(false)}
        policyType={selectedPolicy}
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
  headerCard: {
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
    backgroundColor: '#ecfdf5',
    borderWidth: 2,
    borderColor: '#a7f3d0',
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
    backgroundColor: '#007a33',
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
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginTop: 8,
    marginBottom: 2,
  },
  editPhotoPromptText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#007a33',
  },
  instIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  instName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  contactPersonText: {
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
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  roleBadgeText: {
    fontSize: 11,
    color: '#007a33',
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
    backgroundColor: '#007a33',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 14,
    flex: 1,
    shadowColor: '#007a33',
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
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    marginBottom: 4,
  },
  photoUploadTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#007a33',
  },
  photoUploadSub: {
    fontSize: 11,
    color: '#059669',
    marginTop: 2,
  },
  photoUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#007a33',
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
    backgroundColor: '#007a33',
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 14,
    shadowColor: '#007a33',
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
    backgroundColor: '#007a33',
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
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  mapboxPickerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#007a33',
  },
  mapboxPickerSub: {
    fontSize: 11,
    color: '#059669',
  },
  mapboxPickerBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#007a33',
  },
  radiusPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    marginBottom: 4,
  },
  radiusChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  radiusChipActive: {
    backgroundColor: '#007a33',
    borderColor: '#007a33',
  },
  radiusChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  radiusChipTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  saveBtn: {
    backgroundColor: '#007a33',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 20,
    shadowColor: '#007a33',
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
    paddingVertical: 12,
    marginTop: 6,
  },
  logoutRowText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#dc2626',
  },
  deleteAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#fee2e2',
    marginTop: 4,
  },
  deleteAccountRowText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#dc2626',
  },
  notifStatusCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    color: '#475569',
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
    color: '#64748b',
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
