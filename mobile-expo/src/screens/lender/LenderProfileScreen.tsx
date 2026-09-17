import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
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
  ChevronRight,
  ShieldCheck,
  Gift,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { updateLenderProfileApi, fetchReferEarnStatusApi } from '../../services/api';
import { SubscriptionModal } from '../../components/SubscriptionModal';
import { ReferAndEarnModal } from '../../components/ReferAndEarnModal';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

const RADIUS_OPTIONS = [10, 25, 50, 70, 100];

export const LenderProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, isSubscribed, lenderProfile, logout, updateLenderProfileState } = useAuth();

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
  const [interestRate, setInterestRate] = useState(String(lenderProfile?.minInterestRate || 1.5));
  const [address, setAddress] = useState(lenderProfile?.address || '');
  const [city, setCity] = useState(lenderProfile?.city || '');
  const [state, setState] = useState(lenderProfile?.state || '');
  const [pincode, setPincode] = useState(lenderProfile?.pincode || '');

  const [saving, setSaving] = useState(false);
  const [subModalVisible, setSubModalVisible] = useState(false);
  const [isReferEarnEnabled, setIsReferEarnEnabled] = useState(false);
  const [referModalVisible, setReferModalVisible] = useState(false);

  useEffect(() => {
    fetchReferEarnStatusApi()
      .then((enabled) => setIsReferEarnEnabled(enabled))
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        institutionName: institutionName.trim(),
        contactPersonName: contactPerson.trim(),
        lendingRadiusKm,
        minLoanAmount: Number(minAmount) || 10000,
        maxLoanAmount: Number(maxAmount) || 500000,
        minInterestRate: Number(interestRate) || 1.5,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
      };

      const res = await updateLenderProfileApi(payload);
      if (res.success) {
        updateLenderProfileState(payload);
        Alert.alert('Profile Saved', 'Financer profile & lending limits updated successfully.');
      } else {
        Alert.alert('Notice', res.message || 'Could not update profile.');
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
      {/* Top Financer Profile Card */}
      <View style={styles.headerCard}>
        <View style={styles.instIcon}>
          <Building2 size={32} color="#007a33" />
        </View>
        <Text style={styles.instName}>{institutionName}</Text>
        <Text style={styles.contactPersonText}>Manager: {contactPerson}</Text>
        <View style={styles.badgeRow}>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Business Money Financer</Text>
          </View>
          <View style={isSubscribed ? styles.subActiveBadge : styles.subInactiveBadge}>
            <Crown size={12} color={isSubscribed ? '#16a34a' : '#d97706'} />
            <Text style={isSubscribed ? styles.subActiveText : styles.subInactiveText}>
              {isSubscribed ? 'Subscribed VIP' : 'Standard'}
            </Text>
          </View>
        </View>
      </View>

      {/* Plan Card */}
      <TouchableOpacity
        style={styles.membershipCard}
        onPress={() => setSubModalVisible(true)}
        activeOpacity={0.9}
      >
        <View style={styles.membershipLeft}>
          <Crown size={22} color="#f59e0b" />
          <View>
            <Text style={styles.membershipTitle}>
              {isSubscribed ? 'VIP Financer Membership Active' : 'Upgrade Financer Plan'}
            </Text>
            <Text style={styles.membershipSub}>
              {isSubscribed
                ? 'Unlimited verified shop leads across your radius'
                : 'Get featured badge and priority loan applications'}
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

      {/* Core Requirement: Active Lending Radius Area */}
      <View style={styles.sectionCard}>
        <View style={styles.radiusHeader}>
          <Compass size={18} color="#007a33" />
          <Text style={styles.sectionHeading}>Lending Radius Area</Text>
        </View>
        <Text style={styles.sectionSub}>
          Vendors within this radius will be notified upon your registration and can apply directly.
        </Text>
        <View style={styles.radiusRow}>
          {RADIUS_OPTIONS.map((km) => {
            const active = lendingRadiusKm === km;
            return (
              <TouchableOpacity
                key={km}
                style={[styles.radiusBtn, active && styles.radiusBtnActive]}
                onPress={() => setLendingRadiusKm(km)}
              >
                <Text style={[styles.radiusBtnText, active && styles.radiusBtnTextActive]}>
                  {km} km
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Loan Limits & Rates */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeading}>Loan Limits & Interest Rates</Text>

        <View style={styles.gridRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Min Loan Amount (₹)</Text>
            <TextInput
              style={styles.gridInput}
              keyboardType="number-pad"
              value={minAmount}
              onChangeText={setMinAmount}
            />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.inputLabel}>Max Loan Amount (₹)</Text>
            <TextInput
              style={styles.gridInput}
              keyboardType="number-pad"
              value={maxAmount}
              onChangeText={setMaxAmount}
            />
          </View>
        </View>

        <Text style={styles.inputLabel}>Monthly Interest Rate (%)</Text>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.textInput}
            keyboardType="decimal-pad"
            value={interestRate}
            onChangeText={setInterestRate}
            placeholder="e.g. 1.5"
          />
        </View>
      </View>

      {/* Institution Details */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeading}>Institution Details</Text>

        <Text style={styles.inputLabel}>Institution / Business Name</Text>
        <View style={styles.inputBox}>
          <Building2 size={18} color="#94a3b8" />
          <TextInput
            style={styles.textInput}
            value={institutionName}
            onChangeText={setInstitutionName}
          />
        </View>

        <Text style={styles.inputLabel}>Contact Person Name</Text>
        <View style={styles.inputBox}>
          <User size={18} color="#94a3b8" />
          <TextInput
            style={styles.textInput}
            value={contactPerson}
            onChangeText={setContactPerson}
          />
        </View>

        <Text style={styles.inputLabel}>Registered Mobile</Text>
        <View style={[styles.inputBox, styles.readOnlyBox]}>
          <Phone size={18} color="#94a3b8" />
          <Text style={styles.readOnlyText}>+91 {user?.phone || '9553921237'}</Text>
        </View>

        <Text style={styles.inputLabel}>Office Address</Text>
        <View style={styles.inputBox}>
          <MapPin size={18} color="#94a3b8" />
          <TextInput
            style={styles.textInput}
            value={address}
            onChangeText={setAddress}
            placeholder="Office Address"
          />
        </View>

        <View style={styles.gridRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>City</Text>
            <TextInput
              style={styles.gridInput}
              value={city}
              onChangeText={setCity}
            />
          </View>
          <View style={{ flex: 1, marginHorizontal: 8 }}>
            <Text style={styles.inputLabel}>State</Text>
            <TextInput
              style={styles.gridInput}
              value={state}
              onChangeText={setState}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Pincode</Text>
            <TextInput
              style={styles.gridInput}
              value={pincode}
              onChangeText={setPincode}
              keyboardType="number-pad"
            />
          </View>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={styles.saveBtn}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.85}
      >
        {saving ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <>
            <Save size={18} color="#ffffff" />
            <Text style={styles.saveBtnText}>Save Financer Settings</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Logout */}
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
        userRole="LENDER"
        userName={lenderProfile?.institutionName || user?.name || 'Financer'}
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
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  instIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#bbf7d0',
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
    backgroundColor: '#007a33',
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
    color: '#bbf7d0',
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
  radiusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
  },
  sectionSub: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 14,
    lineHeight: 16,
  },
  radiusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  radiusBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  radiusBtnActive: {
    backgroundColor: '#007a33',
    borderColor: '#007a33',
  },
  radiusBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  radiusBtnTextActive: {
    color: '#ffffff',
    fontWeight: '800',
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
    marginBottom: 12,
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
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#007a33',
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
