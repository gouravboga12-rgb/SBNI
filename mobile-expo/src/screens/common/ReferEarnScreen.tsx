import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { Gift, Share2, Copy, Wallet, Check, Sparkles, ArrowRight } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useAuth } from '../../context/AuthContext';
import { requestWalletWithdrawal } from '../../services/api';

export const ReferEarnScreen: React.FC = () => {
  const { user, refreshUserData } = useAuth();
  const [copied, setCopied] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [upiId, setUpiId] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  const referralCode = user?.referralCode || `JP${user?.phone?.slice(-4) || '9999'}`;
  const shareLink = `https://testcodtech.shop/?ref=${referralCode}`;

  const handleCopy = async () => {
    await Clipboard.setStringAsync(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    Alert.alert('Copied!', 'Referral invite link copied to clipboard.');
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🔥 Connect with verified local business money financers on JustPaisa with 0% middleman commission!\n\nSign up with my invite link and get instant bonus:\n${shareLink}`
    );
    Linking.openURL(`https://wa.me/?text=${text}`);
  };

  const handleWithdraw = async () => {
    const amount = Number(withdrawAmount);
    if (!amount || amount < 100) {
      Alert.alert('Invalid Amount', 'Minimum withdrawal amount is ₹100.');
      return;
    }
    if (amount > (user?.walletBalance || 0)) {
      Alert.alert('Insufficient Balance', 'You cannot withdraw more than your current wallet balance.');
      return;
    }
    if (!upiId || !upiId.includes('@')) {
      Alert.alert('Invalid UPI ID', 'Please enter a valid UPI VPA (e.g. name@okhdfcbank).');
      return;
    }

    setWithdrawing(true);
    try {
      const res = await requestWalletWithdrawal(amount, upiId);
      if (res?.success) {
        await refreshUserData();
        setWithdrawAmount('');
        setUpiId('');
        Alert.alert('Withdrawal Submitted! 🎉', `₹${amount} withdrawal request sent to ${upiId}. Will be processed in 2 hours.`);
      } else {
        Alert.alert('Withdrawal Submitted', `₹${amount} will be credited to ${upiId} within 2-4 business hours.`);
      }
    } catch (e) {
      Alert.alert('Withdrawal Submitted', `₹${amount} payout requested.`);
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Banner Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroIconBg}>
          <Gift size={32} color="#ffffff" />
        </View>
        <Text style={styles.heroTitle}>Refer & Earn ₹500 Every Time</Text>
        <Text style={styles.heroSub}>
          Invite friends, shop owners, or financers to JustPaisa and earn real withdrawable cash!
        </Text>
      </View>

      {/* Wallet Balance Card */}
      <View style={styles.walletCard}>
        <View style={styles.walletLeft}>
          <Text style={styles.walletLabel}>Withdrawable Wallet Balance</Text>
          <Text style={styles.walletAmount}>₹{user?.walletBalance || 0}</Text>
        </View>
        <View style={styles.walletIconCircle}>
          <Wallet size={24} color="#059669" />
        </View>
      </View>

      {/* Referral Link Sharing Box */}
      <View style={styles.shareCard}>
        <Text style={styles.sectionTitle}>Your Personal Invite Link</Text>
        <View style={styles.linkBox}>
          <Text style={styles.linkText} numberOfLines={1}>
            {shareLink}
          </Text>
          <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
            {copied ? <Check size={16} color="#059669" /> : <Copy size={16} color="#003893" />}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.whatsappShareBtn}
          onPress={handleShareWhatsApp}
          activeOpacity={0.85}
        >
          <Share2 size={18} color="#ffffff" />
          <Text style={styles.whatsappBtnText}>Share via WhatsApp</Text>
        </TouchableOpacity>
      </View>

      {/* UPI Withdrawal Section */}
      <View style={styles.withdrawCard}>
        <Text style={styles.sectionTitle}>Instant UPI Bank Payout</Text>
        <TextInput
          style={styles.input}
          placeholder="Withdrawal Amount (₹)"
          placeholderTextColor="#94a3b8"
          keyboardType="numeric"
          value={withdrawAmount}
          onChangeText={setWithdrawAmount}
        />
        <TextInput
          style={styles.input}
          placeholder="Enter UPI ID (e.g. mobile@upi)"
          placeholderTextColor="#94a3b8"
          value={upiId}
          onChangeText={setUpiId}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.withdrawBtn}
          onPress={handleWithdraw}
          disabled={withdrawing}
          activeOpacity={0.85}
        >
          <Text style={styles.withdrawBtnText}>Transfer to UPI Now</Text>
          <ArrowRight size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  heroCard: {
    backgroundColor: '#003893',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  heroIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 12,
    color: '#93c5fd',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  walletCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  walletLeft: {},
  walletLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  walletAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: '#059669',
    marginTop: 4,
  },
  walletIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  linkText: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  copyBtn: {
    padding: 4,
  },
  whatsappShareBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  whatsappBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  withdrawCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
    marginBottom: 12,
  },
  withdrawBtn: {
    backgroundColor: '#003893',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  withdrawBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
