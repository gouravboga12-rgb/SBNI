import React, { useState } from 'react';
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
  ChevronRight,
  Gift,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { updateVendorProfileApi, uploadFileToEc2Api, fetchReferEarnStatusApi } from '../../services/api';
import { SubscriptionModal } from '../../components/SubscriptionModal';
import { ReferAndEarnModal } from '../../components/ReferAndEarnModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const VendorProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, isSubscribed, vendorProfile, logout, updateVendorProfileState } = useAuth();

  // Form State
  const [ownerName, setOwnerName] = useState(vendorProfile?.ownerName || user?.name || '');
  const [businessName, setBusinessName] = useState(vendorProfile?.businessName || '');
  const [category, setCategory] = useState(vendorProfile?.category || 'Small Shop Business');
  const [address, setAddress] = useState(vendorProfile?.address || '');
  const [city, setCity] = useState(vendorProfile?.city || '');
  const [state, setState] = useState(vendorProfile?.state || '');
  const [pincode, setPincode] = useState(vendorProfile?.pincode || '');

  // KYC Docs
  const [panUrl, setPanUrl] = useState(vendorProfile?.panFileUrl || '');
  const [aadhaarUrl, setAadhaarUrl] = useState(vendorProfile?.aadhaarFileUrl || '');
  const [shopPhotoUrl, setShopPhotoUrl] = useState(
    vendorProfile?.shopPhotoUrl || (vendorProfile?.shopPhotos ? vendorProfile.shopPhotos[0] : '')
  );

  const [saving, setSaving] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [subModalVisible, setSubModalVisible] = useState(false);
  const [isReferEarnEnabled, setIsReferEarnEnabled] = useState(false);
  const [referModalVisible, setReferModalVisible] = useState(false);

  React.useEffect(() => {
    fetchReferEarnStatusApi()
      .then((enabled) => setIsReferEarnEnabled(enabled))
      .catch(() => {});
  }, []);

  // Pick Image from Camera or Gallery and upload to AWS EC2
  const handlePickAndUpload = async (docType: 'PAN' | 'AADHAAR' | 'SHOP') => {
    Alert.alert(
      'Upload Document',
      'Select image source:',
      [
        {
          text: 'Take Photo (Camera)',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Denied', 'Camera access is required to take photos.');
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
              Alert.alert('Permission Denied', 'Gallery access is required to choose photos.');
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
      ]
    );
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

        Alert.alert('Upload Successful', `${docType} document uploaded securely.`);
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
      const payload = {
        ownerName: ownerName.trim(),
        businessName: businessName.trim(),
        category,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
        panFileUrl: panUrl || undefined,
        aadhaarFileUrl: aadhaarUrl || undefined,
        shopPhotoUrl: shopPhotoUrl || undefined,
        shopPhotos: shopPhotoUrl ? [shopPhotoUrl] : undefined,
      };

      const res = await updateVendorProfileApi(payload);
      if (res.success) {
        updateVendorProfileState(payload);
        Alert.alert('Profile Updated', 'Your shop details and documents have been saved successfully.');
      } else {
        Alert.alert('Update Failed', res.message || 'Could not save profile.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
    >
      {/* Top Profile Card */}
      <View style={styles.profileHeaderCard}>
        <View style={styles.avatarCircle}>
          <Store size={32} color="#003893" />
        </View>
        <Text style={styles.headerName}>{businessName || 'My Local Shop'}</Text>
        <Text style={styles.headerSub}>Owner: {ownerName || user?.phone}</Text>
        <View style={styles.badgeRow}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Small Shop Business</Text>
          </View>
          <View style={isSubscribed ? styles.subActiveBadge : styles.subInactiveBadge}>
            <Crown size={12} color={isSubscribed ? '#16a34a' : '#d97706'} />
            <Text style={isSubscribed ? styles.subActiveText : styles.subInactiveText}>
              {isSubscribed ? 'Subscribed VIP' : 'Free Account'}
            </Text>
          </View>
        </View>
      </View>

      {/* Subscription Upgrade Card */}
      <TouchableOpacity
        style={styles.membershipCard}
        onPress={() => setSubModalVisible(true)}
        activeOpacity={0.9}
      >
        <View style={styles.membershipLeft}>
          <Crown size={22} color="#f59e0b" />
          <View>
            <Text style={styles.membershipTitle}>
              {isSubscribed ? 'VIP Membership Active' : 'Upgrade to JustPaisa VIP'}
            </Text>
            <Text style={styles.membershipSub}>
              {isSubscribed
                ? 'All financer phone numbers & WhatsApp unlocked'
                : 'Unlock unlimited phone numbers & instant loans'}
            </Text>
          </View>
        </View>
        <ChevronRight size={18} color="#ffffff" />
      </TouchableOpacity>

      {/* Refer & Earn Banner (Only if enabled by admin) */}
      {isReferEarnEnabled && (
        <TouchableOpacity
          style={styles.referCard}
          onPress={() => setReferModalVisible(true)}
          activeOpacity={0.9}
        >
          <View style={styles.referIconBox}>
            <Gift size={22} color="#ffffff" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.referTitle}>Refer & Earn Rewards 🎁</Text>
              <Text style={styles.referBadge}>Cashback</Text>
            </View>
            <Text style={styles.referSub}>
              Earn ₹500 cashback for every business or financer you invite!
            </Text>
          </View>
          <ChevronRight size={18} color="#9333ea" />
        </TouchableOpacity>
      )}

      {/* Shop Details Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeading}>Shop Details</Text>

        <Text style={styles.inputLabel}>Business / Shop Name</Text>
        <View style={styles.inputBox}>
          <Store size={18} color="#94a3b8" />
          <TextInput
            style={styles.textInput}
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="Shop Name"
          />
        </View>

        <Text style={styles.inputLabel}>Owner Full Name</Text>
        <View style={styles.inputBox}>
          <User size={18} color="#94a3b8" />
          <TextInput
            style={styles.textInput}
            value={ownerName}
            onChangeText={setOwnerName}
            placeholder="Owner Name"
          />
        </View>

        <Text style={styles.inputLabel}>Registered Mobile</Text>
        <View style={[styles.inputBox, styles.readOnlyBox]}>
          <Phone size={18} color="#94a3b8" />
          <Text style={styles.readOnlyText}>+91 {user?.phone || '9876543210'}</Text>
        </View>

        <Text style={styles.inputLabel}>Shop Address</Text>
        <View style={styles.inputBox}>
          <MapPin size={18} color="#94a3b8" />
          <TextInput
            style={styles.textInput}
            value={address}
            onChangeText={setAddress}
            placeholder="Street, Landmark"
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
            />
          </View>
          <View style={{ flex: 1, marginHorizontal: 8 }}>
            <Text style={styles.inputLabel}>State</Text>
            <TextInput
              style={styles.gridInput}
              value={state}
              onChangeText={setState}
              placeholder="State"
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
            />
          </View>
        </View>
      </View>

      {/* KYC Documents Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeading}>KYC & Verification Documents</Text>
        <Text style={styles.sectionSub}>
          Verified shops get 3x faster loan approvals from financers
        </Text>

        {/* PAN Card Item */}
        <View style={styles.docItem}>
          <View style={{ flex: 1 }}>
            <Text style={styles.docTitle}>PAN Card Photo</Text>
            <Text style={styles.docStatus}>
              {panUrl ? 'Uploaded & Secured' : 'Not Uploaded'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.uploadDocBtn}
            onPress={() => handlePickAndUpload('PAN')}
            disabled={uploadingDoc === 'PAN'}
          >
            {uploadingDoc === 'PAN' ? (
              <ActivityIndicator size="small" color="#003893" />
            ) : (
              <>
                <Upload size={14} color="#003893" />
                <Text style={styles.uploadDocBtnText}>{panUrl ? 'Change' : 'Upload'}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Aadhaar Card Item */}
        <View style={styles.docItem}>
          <View style={{ flex: 1 }}>
            <Text style={styles.docTitle}>Aadhaar Card Photo</Text>
            <Text style={styles.docStatus}>
              {aadhaarUrl ? 'Uploaded & Secured' : 'Not Uploaded'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.uploadDocBtn}
            onPress={() => handlePickAndUpload('AADHAAR')}
            disabled={uploadingDoc === 'AADHAAR'}
          >
            {uploadingDoc === 'AADHAAR' ? (
              <ActivityIndicator size="small" color="#003893" />
            ) : (
              <>
                <Upload size={14} color="#003893" />
                <Text style={styles.uploadDocBtnText}>{aadhaarUrl ? 'Change' : 'Upload'}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Shop Front Photo Item */}
        <View style={styles.docItem}>
          <View style={{ flex: 1 }}>
            <Text style={styles.docTitle}>Shop Board / Front Photo</Text>
            <Text style={styles.docStatus}>
              {shopPhotoUrl ? 'Uploaded & Secured' : 'Not Uploaded'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.uploadDocBtn}
            onPress={() => handlePickAndUpload('SHOP')}
            disabled={uploadingDoc === 'SHOP'}
          >
            {uploadingDoc === 'SHOP' ? (
              <ActivityIndicator size="small" color="#003893" />
            ) : (
              <>
                <Camera size={14} color="#003893" />
                <Text style={styles.uploadDocBtnText}>{shopPhotoUrl ? 'Change' : 'Upload'}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={styles.saveBtn}
        onPress={handleSaveProfile}
        disabled={saving}
        activeOpacity={0.85}
      >
        {saving ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <>
            <Save size={18} color="#ffffff" />
            <Text style={styles.saveBtnText}>Save Profile & Documents</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Logout Action */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
        <LogOut size={18} color="#dc2626" />
        <Text style={styles.logoutBtnText}>Log Out Account</Text>
      </TouchableOpacity>

      <SubscriptionModal
        visible={subModalVisible}
        onClose={() => setSubModalVisible(false)}
      />

      <ReferAndEarnModal
        visible={referModalVisible}
        onClose={() => setReferModalVisible(false)}
        userRole="VENDOR"
        userName={vendorProfile?.ownerName || user?.name || 'Partner'}
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
    paddingBottom: 110,
  },
  referCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#faf5ff',
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#d8b4fe',
    gap: 12,
    shadowColor: '#9333ea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  referIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#9333ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
  referTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#581c87',
  },
  referBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7e22ce',
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  referSub: {
    fontSize: 11,
    color: '#7e22ce',
    marginTop: 2,
  },
  profileHeaderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#bfdbfe',
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
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  subActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  subActiveText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#16a34a',
  },
  subInactiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  subInactiveText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#d97706',
  },
  membershipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#003893',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  membershipLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  membershipTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  membershipSub: {
    fontSize: 11,
    color: '#93c5fd',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  textInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
  readOnlyBox: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
  },
  readOnlyText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '700',
  },
  gridRow: {
    flexDirection: 'row',
  },
  gridInput: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
  },
  docItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  docTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  docStatus: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  uploadDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  uploadDocBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#003893',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#003893',
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    paddingVertical: 12,
    borderRadius: 14,
  },
  logoutBtnText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '800',
  },
});
