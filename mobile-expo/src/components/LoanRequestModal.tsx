import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  X,
  Send,
  User as UserIcon,
  Phone,
  Mail,
  Wallet,
  CheckCircle2,
  Shield,
  FileCheck,
  Building2,
  Camera,
  Image as ImageIcon,
  CreditCard,
  Hash,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'react-native';
import { submitLoanRequest } from '../services/api';
import { Lender } from '../types';
import { useAuth } from '../context/AuthContext';

interface LoanRequestModalProps {
  visible: boolean;
  lender: Lender | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const ANNUAL_INCOME_OPTIONS = [
  'Under 2 Lakhs',
  '2-5 Lakhs',
  '5-10 Lakhs',
  '10-25 Lakhs',
  '25 Lakhs+',
];

export const LoanRequestModal: React.FC<LoanRequestModalProps> = ({
  visible,
  lender,
  onClose,
  onSuccess,
}) => {
  const { user, vendorProfile } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [annualIncome, setAnnualIncome] = useState(ANNUAL_INCOME_OPTIONS[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [shopPhotoUri, setShopPhotoUri] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [panUri, setPanUri] = useState<string | null>(null);
  const [aadhaarUri, setAadhaarUri] = useState<string | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');

  useEffect(() => {
    if (visible && user) {
      setFullName(user.name || user.fullName || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
      if (vendorProfile?.annualTurnover) {
        setAnnualIncome(vendorProfile.annualTurnover);
      }
      // Pre-fill documents from profile
      setPanUri(vendorProfile?.panFileUrl || null);
      setAadhaarUri(vendorProfile?.aadhaarFileUrl || null);
      setShopPhotoUri(vendorProfile?.shopPhotoUrl || vendorProfile?.shopPhotos?.[0] || null);
      setSelfieUri(vendorProfile?.liveSelfieUrl || vendorProfile?.avatarUrl || null);
      setAccountNumber('');
      setIfsc('');
      setSubmitted(false);
    }
  }, [visible, user, vendorProfile]);

  if (!lender) return null;

  const pickImage = async (
    setter: (uri: string) => void,
    useCamera: boolean = false
  ) => {
    try {
      let result: ImagePicker.ImagePickerResult;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera permission is needed to take a photo.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.85,
          allowsEditing: true,
          aspect: [4, 3],
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Gallery permission is needed to select a photo.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.85,
          allowsEditing: true,
          aspect: [4, 3],
        });
      }
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setter(result.assets[0].uri);
      }
    } catch (e: any) {
      Alert.alert('Error', 'Could not open picker: ' + e.message);
    }
  };

  const handleSubmit = async () => {
    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      Alert.alert('Missing Fields', 'Please ensure your Full Name, Phone, and Email are filled.');
      return;
    }

    setLoading(true);
    try {
      const res = await submitLoanRequest({
        lenderId: lender.id,
        amount: 50000,
        purpose: 'Business Enquiry',
        businessName: vendorProfile?.businessName || undefined,
        monthlyIncome: undefined,
        notes: `Enquiry from ${fullName.trim()} (${email.trim()}). Annual Income: ${annualIncome}. ${notes.trim()}`,
        vendorSnapshot: {
          vendorName: fullName.trim(),
          shopName: vendorProfile?.businessName || fullName.trim(),
          phone: phone.trim(),
          emailId: email.trim(),
          annualTurnover: annualIncome,
          panCardUrl: panUri || vendorProfile?.panFileUrl || undefined,
          aadhaarUrl: aadhaarUri || vendorProfile?.aadhaarFileUrl || undefined,
          shopPhotoUrl: shopPhotoUri || undefined,
          liveSelfieUrl: selfieUri || undefined,
          bankAccountNumber: accountNumber.trim() || undefined,
          ifscCode: ifsc.trim() || undefined,
        },
      });

      if (res.success) {
        setSubmitted(true);
        if (onSuccess) onSuccess();
      } else {
        Alert.alert('Submission Error', res.message || 'Could not submit enquiry. Please try again.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit enquiry.');
    } finally {
      setLoading(false);
    }
  };

  const resolveDocUrl = (uri: string | null | undefined): string | null => {
    if (!uri) return null;
    if (
      uri.startsWith('http://') ||
      uri.startsWith('https://') ||
      uri.startsWith('file://') ||
      uri.startsWith('content://') ||
      uri.startsWith('data:')
    ) {
      return uri;
    }
    const clean = uri.startsWith('/') ? uri.slice(1) : uri;
    return `https://justpaisa.in/${clean}`;
  };

  const isPanUpdated = Boolean(panUri && (panUri.startsWith('file://') || panUri.startsWith('content://') || panUri !== vendorProfile?.panFileUrl));
  const isAadhaarUpdated = Boolean(aadhaarUri && (aadhaarUri.startsWith('file://') || aadhaarUri.startsWith('content://') || aadhaarUri !== vendorProfile?.aadhaarFileUrl));
  const isShopUpdated = Boolean(shopPhotoUri && (shopPhotoUri.startsWith('file://') || shopPhotoUri.startsWith('content://') || shopPhotoUri !== (vendorProfile?.shopPhotoUrl || vendorProfile?.shopPhotos?.[0])));
  const isSelfieUpdated = Boolean(selfieUri && (selfieUri.startsWith('file://') || selfieUri.startsWith('content://') || selfieUri !== (vendorProfile?.liveSelfieUrl || vendorProfile?.avatarUrl)));

  const resolvedPan = resolveDocUrl(panUri || vendorProfile?.panFileUrl);
  const resolvedAadhaar = resolveDocUrl(aadhaarUri || vendorProfile?.aadhaarFileUrl);
  const resolvedShopPhoto = resolveDocUrl(shopPhotoUri || vendorProfile?.shopPhotoUrl || vendorProfile?.shopPhotos?.[0]);
  const resolvedSelfie = resolveDocUrl(selfieUri || vendorProfile?.liveSelfieUrl || vendorProfile?.avatarUrl);

  const hasPan = Boolean(resolvedPan);
  const hasAadhaar = Boolean(resolvedAadhaar);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Enquire Form</Text>
              <Text style={styles.headerSub} numberOfLines={1}>
                Forwarding to {lender.institutionName || 'Financer'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {submitted ? (
              <View style={styles.successContainer}>
                <View style={styles.successIconCircle}>
                  <CheckCircle2 size={44} color="#059669" />
                </View>
                <Text style={styles.successTitle}>Enquiry Submitted Successfully!</Text>
                <Text style={styles.successSub}>
                  Your enquiry has been dispatched directly to <Text style={{ fontWeight: '800', color: '#0f172a' }}>{lender.institutionName}</Text>. The financer will verify your details and connect with you.
                </Text>

                <View style={styles.successCard}>
                  <Text style={styles.successCardRow}>
                    Status: <Text style={{ color: '#d97706', fontWeight: '800' }}>Pending Verification</Text>
                  </Text>
                  <Text style={styles.successCardRow}>
                    Annual Income: <Text style={{ color: '#0f172a', fontWeight: '800' }}>{annualIncome}</Text>
                  </Text>
                  <Text style={styles.successCardRow}>
                    Financer Phone: <Text style={{ color: '#003893', fontWeight: '800' }}>{lender.phone || 'Available in Directory'}</Text>
                  </Text>
                </View>

                <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
                  <Text style={styles.doneBtnText}>Done / Back to Directory</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Auto-fill indicator */}
                <View style={styles.autoFillBadge}>
                  <CheckCircle2 size={15} color="#059669" />
                  <Text style={styles.autoFillText}>
                    Auto-filled from your registered profile. Edit or change if needed.
                  </Text>
                </View>

                {/* Full Name */}
                <Text style={styles.inputLabel}>Full Name *</Text>
                <View style={styles.inputBox}>
                  <UserIcon size={16} color="#94a3b8" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your full name"
                    placeholderTextColor="#94a3b8"
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>

                {/* Phone Number */}
                <Text style={styles.inputLabel}>Phone Number / Mobile *</Text>
                <View style={styles.inputBox}>
                  <Phone size={16} color="#94a3b8" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. +91 9876543210"
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>

                {/* Email Address */}
                <Text style={styles.inputLabel}>Gmail / Email ID *</Text>
                <View style={styles.inputBox}>
                  <Mail size={16} color="#94a3b8" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="name@gmail.com"
                    placeholderTextColor="#94a3b8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                {/* Annual Income Selection */}
                <Text style={styles.inputLabel}>Annual Income / Turnover *</Text>
                <View style={styles.pillsContainer}>
                  {ANNUAL_INCOME_OPTIONS.map((item) => (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.incomePill,
                        annualIncome === item && styles.incomePillActive,
                      ]}
                      onPress={() => setAnnualIncome(item)}
                    >
                      <Text
                        style={[
                          styles.incomePillText,
                          annualIncome === item && styles.incomePillTextActive,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* KYC Documents — 2x2 Grid */}
                <Text style={styles.inputLabel}>KYC Documents Attached</Text>
                <View style={styles.docsGrid}>
                  {/* PAN Card */}
                  <View style={[styles.docCard, hasPan && styles.docCardActive]}>
                    <View style={styles.docCardHeader}>
                      <FileCheck size={15} color={hasPan ? '#059669' : '#94a3b8'} />
                      <Text style={[styles.docCardTitle, hasPan && styles.docCardTitleActive]}>
                        PAN Card
                      </Text>
                    </View>
                    {resolvedPan ? (
                      <View style={styles.thumbWrapper}>
                        <Image
                          source={{ uri: resolvedPan }}
                          style={styles.docThumb}
                          resizeMode="cover"
                        />
                        <View style={[styles.thumbBadge, isPanUpdated ? styles.thumbBadgeUpdated : styles.thumbBadgeAuto]}>
                          <Text style={styles.thumbBadgeText}>{isPanUpdated ? 'Updated ✓' : 'Auto-Attached ✓'}</Text>
                        </View>
                      </View>
                    ) : (
                      <Text style={[styles.docCardStatus, hasPan && styles.docCardStatusActive]}>
                        {hasPan ? '✓ Auto-Attached' : 'Pending'}
                      </Text>
                    )}
                    <View style={styles.docBtnRow}>
                      <TouchableOpacity
                        style={styles.docMiniBtn}
                        onPress={() => pickImage(setPanUri, true)}
                      >
                        <Camera size={12} color="#003893" />
                        <Text style={styles.docMiniBtnText}>Camera</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.docMiniBtn}
                        onPress={() => pickImage(setPanUri, false)}
                      >
                        <ImageIcon size={12} color="#003893" />
                        <Text style={styles.docMiniBtnText}>Gallery</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Aadhaar Card */}
                  <View style={[styles.docCard, hasAadhaar && styles.docCardActive]}>
                    <View style={styles.docCardHeader}>
                      <Shield size={15} color={hasAadhaar ? '#059669' : '#94a3b8'} />
                      <Text style={[styles.docCardTitle, hasAadhaar && styles.docCardTitleActive]}>
                        Aadhaar
                      </Text>
                    </View>
                    {resolvedAadhaar ? (
                      <View style={styles.thumbWrapper}>
                        <Image
                          source={{ uri: resolvedAadhaar }}
                          style={styles.docThumb}
                          resizeMode="cover"
                        />
                        <View style={[styles.thumbBadge, isAadhaarUpdated ? styles.thumbBadgeUpdated : styles.thumbBadgeAuto]}>
                          <Text style={styles.thumbBadgeText}>{isAadhaarUpdated ? 'Updated ✓' : 'Auto-Attached ✓'}</Text>
                        </View>
                      </View>
                    ) : (
                      <Text style={[styles.docCardStatus, hasAadhaar && styles.docCardStatusActive]}>
                        {hasAadhaar ? '✓ Auto-Attached' : 'Pending'}
                      </Text>
                    )}
                    <View style={styles.docBtnRow}>
                      <TouchableOpacity
                        style={styles.docMiniBtn}
                        onPress={() => pickImage(setAadhaarUri, true)}
                      >
                        <Camera size={12} color="#003893" />
                        <Text style={styles.docMiniBtnText}>Camera</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.docMiniBtn}
                        onPress={() => pickImage(setAadhaarUri, false)}
                      >
                        <ImageIcon size={12} color="#003893" />
                        <Text style={styles.docMiniBtnText}>Gallery</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Shop / Business Photo */}
                  <View style={styles.docCard}>
                    <View style={styles.docCardHeader}>
                      <Building2 size={15} color={resolvedShopPhoto ? '#059669' : '#94a3b8'} />
                      <Text style={[styles.docCardTitle, resolvedShopPhoto ? styles.docCardTitleActive : null]}>
                        Shop Photo
                      </Text>
                    </View>
                    {resolvedShopPhoto ? (
                      <View style={styles.thumbWrapper}>
                        <Image
                          source={{ uri: resolvedShopPhoto }}
                          style={styles.docThumb}
                          resizeMode="cover"
                        />
                        <View style={[styles.thumbBadge, isShopUpdated ? styles.thumbBadgeUpdated : styles.thumbBadgeAuto]}>
                          <Text style={styles.thumbBadgeText}>{isShopUpdated ? 'Updated ✓' : 'Auto-Attached ✓'}</Text>
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.docCardStatus}>Not uploaded</Text>
                    )}
                    <View style={styles.docBtnRow}>
                      <TouchableOpacity
                        style={styles.docMiniBtn}
                        onPress={() => pickImage(setShopPhotoUri, true)}
                      >
                        <Camera size={12} color="#003893" />
                        <Text style={styles.docMiniBtnText}>Camera</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.docMiniBtn}
                        onPress={() => pickImage(setShopPhotoUri, false)}
                      >
                        <ImageIcon size={12} color="#003893" />
                        <Text style={styles.docMiniBtnText}>Gallery</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Live Selfie / Owner Photo */}
                  <View style={styles.docCard}>
                    <View style={styles.docCardHeader}>
                      <UserIcon size={15} color={resolvedSelfie ? '#059669' : '#94a3b8'} />
                      <Text style={[styles.docCardTitle, resolvedSelfie ? styles.docCardTitleActive : null]}>
                        Live Selfie
                      </Text>
                    </View>
                    {resolvedSelfie ? (
                      <View style={styles.thumbWrapper}>
                        <Image
                          source={{ uri: resolvedSelfie }}
                          style={styles.docThumb}
                          resizeMode="cover"
                        />
                        <View style={[styles.thumbBadge, isSelfieUpdated ? styles.thumbBadgeUpdated : styles.thumbBadgeAuto]}>
                          <Text style={styles.thumbBadgeText}>{isSelfieUpdated ? 'Updated ✓' : 'Auto-Attached ✓'}</Text>
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.docCardStatus}>Not uploaded</Text>
                    )}
                    <View style={styles.docBtnRow}>
                      <TouchableOpacity
                        style={styles.docMiniBtn}
                        onPress={() => pickImage(setSelfieUri, true)}
                      >
                        <Camera size={12} color="#003893" />
                        <Text style={styles.docMiniBtnText}>Selfie</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.docMiniBtn}
                        onPress={() => pickImage(setSelfieUri, false)}
                      >
                        <ImageIcon size={12} color="#003893" />
                        <Text style={styles.docMiniBtnText}>Gallery</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Bank Account Details (Optional) */}
                <Text style={styles.inputLabel}>Bank Account Details (Optional)</Text>
                <View style={styles.inputBox}>
                  <CreditCard size={16} color="#94a3b8" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Account Number"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={accountNumber}
                    onChangeText={setAccountNumber}
                  />
                </View>
                <View style={[styles.inputBox, { marginTop: 6 }]}>
                  <Hash size={16} color="#94a3b8" />
                  <TextInput
                    style={styles.textInput}
                    placeholder="IFSC Code (e.g. SBIN0001234)"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="characters"
                    value={ifsc}
                    onChangeText={setIfsc}
                  />
                </View>

                {/* Optional Message / Notes */}
                <Text style={styles.inputLabel}>Message / Business Need (Optional)</Text>
                <View style={[styles.inputBox, { height: 75, alignItems: 'flex-start', paddingTop: 8 }]}>
                  <TextInput
                    style={[styles.textInput, { height: 60 }]}
                    placeholder="Briefly describe your requirements or shop details..."
                    placeholderTextColor="#94a3b8"
                    multiline
                    value={notes}
                    onChangeText={setNotes}
                  />
                </View>

                {/* Action Button */}
                <TouchableOpacity
                  style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Send size={16} color="#ffffff" />
                      <Text style={styles.submitBtnText}>Submit Enquiry</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  formScroll: {
    marginBottom: 10,
  },
  autoFillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ecfdf5',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    marginBottom: 14,
  },
  autoFillText: {
    fontSize: 11,
    color: '#065f46',
    fontWeight: '700',
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 6,
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
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  incomePill: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  incomePillActive: {
    backgroundColor: '#003893',
    borderColor: '#003893',
  },
  incomePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  incomePillTextActive: {
    color: '#ffffff',
  },
  docsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
    marginBottom: 4,
  },
  docCard: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  docCardActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  docCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  docCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  docCardTitleActive: {
    color: '#065f46',
  },
  docCardStatus: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  docCardStatusActive: {
    color: '#059669',
    fontWeight: '700',
  },
  thumbWrapper: {
    position: 'relative',
    width: '100%',
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#e2e8f0',
  },
  docThumb: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e2e8f0',
  },
  thumbBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  thumbBadgeUpdated: {
    backgroundColor: 'rgba(5, 150, 105, 0.92)',
  },
  thumbBadgeAuto: {
    backgroundColor: 'rgba(2, 132, 199, 0.92)',
  },
  thumbBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '800',
  },
  docBtnRow: {
    flexDirection: 'row',
    gap: 4,
  },
  docMiniBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 6,
    paddingVertical: 4,
  },
  docMiniBtnText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#003893',
  },
  submitBtn: {
    backgroundColor: '#003893',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 18,
    marginBottom: 10,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  successContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    textAlign: 'center',
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ecfdf5',
    borderWidth: 2,
    borderColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
  },
  successSub: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  successCard: {
    width: '100%',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginTop: 16,
    gap: 4,
  },
  successCardRow: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  doneBtn: {
    width: '100%',
    backgroundColor: '#003893',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
