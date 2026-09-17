import React, { useState, useEffect } from 'react';
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
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import {
  updateVendorProfileApi,
  uploadFileToEc2Api,
  fetchReferEarnStatusApi,
} from '../../services/api';
import { SubscriptionModal } from '../../components/SubscriptionModal';
import { ReferAndEarnModal } from '../../components/ReferAndEarnModal';
import { LocationPickerModal } from '../../components/LocationPickerModal';
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
    updateVendorProfileState,
  } = useAuth();

  // Accordion open/close states
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    membership: true,
    basic: true,
    location: true,
    kyc: true,
    photos: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
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

  // KYC Docs
  const [panUrl, setPanUrl] = useState(vendorProfile?.panFileUrl || '');
  const [aadhaarUrl, setAadhaarUrl] = useState(vendorProfile?.aadhaarFileUrl || '');
  const [shopPhotoUrl, setShopPhotoUrl] = useState(
    vendorProfile?.shopPhotoUrl || (vendorProfile?.shopPhotos ? vendorProfile.shopPhotos[0] : '')
  );

  const [saving, setSaving] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [subModalVisible, setSubModalVisible] = useState(false);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const [isReferEarnEnabled, setIsReferEarnEnabled] = useState(false);
  const [referModalVisible, setReferModalVisible] = useState(false);

  useEffect(() => {
    fetchReferEarnStatusApi()
      .then((enabled) => setIsReferEarnEnabled(enabled))
      .catch(() => {});
  }, []);

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
        if (docType === 'SHOP') setShopPhotoUrl(res.fileUrl);
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
      {/* Top Profile Header Card */}
      <View style={styles.profileHeaderCard}>
        <View style={styles.avatarCircle}>
          <Store size={30} color="#003893" />
        </View>
        <Text style={styles.headerName}>{businessName || 'My Business Enterprise'}</Text>
        <Text style={styles.headerSub}>Owner: {ownerName || user?.name || user?.phone}</Text>
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

                <TouchableOpacity
                  style={styles.extendBtn}
                  onPress={() => setSubModalVisible(true)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.extendBtnText}>Extend Validity / Buy More Days</Text>
                </TouchableOpacity>
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
            {shopPhotoUrl ? (
              <View style={styles.photoPreviewContainer}>
                <Image source={{ uri: shopPhotoUrl }} style={styles.photoPreview} />
                <TouchableOpacity
                  style={styles.changePhotoBtn}
                  onPress={() => handlePickAndUpload('SHOP')}
                >
                  <Camera size={14} color="#ffffff" />
                  <Text style={styles.changePhotoText}>Change Store Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addPhotoBox}
                onPress={() => handlePickAndUpload('SHOP')}
                disabled={uploadingDoc === 'SHOP'}
              >
                <Camera size={28} color="#003893" />
                <Text style={styles.addPhotoTitle}>Add Storefront / Counter Photo</Text>
                <Text style={styles.addPhotoSub}>Take photo from camera or upload gallery</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Save Profile Floating Action Button */}
      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSaveProfile}
        disabled={saving}
        activeOpacity={0.85}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <>
            <Save size={18} color="#ffffff" />
            <Text style={styles.saveBtnText}>Save All Changes</Text>
          </>
        )}
      </TouchableOpacity>

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
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
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
});
