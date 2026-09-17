import React, { useState } from 'react';
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
import { X, Send, DollarSign, FileText, CheckCircle2, Shield } from 'lucide-react-native';
import { submitLoanRequest } from '../services/api';
import { Lender } from '../types';

interface LoanRequestModalProps {
  visible: boolean;
  lender: Lender | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const LOAN_PURPOSES = [
  'Working Capital & Inventory',
  'Shop Expansion & Renovation',
  'Machinery / Equipment Purchase',
  'Festival Season Stock',
  'Emergency Cash Flow',
  'Other Business Need',
];

export const LoanRequestModal: React.FC<LoanRequestModalProps> = ({
  visible,
  lender,
  onClose,
  onSuccess,
}) => {
  const [amount, setAmount] = useState('50000');
  const [purpose, setPurpose] = useState(LOAN_PURPOSES[0]);
  const [businessName, setBusinessName] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!lender) return null;

  const handleSubmit = async () => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid loan requirement amount.');
      return;
    }

    setLoading(true);
    try {
      const res = await submitLoanRequest({
        lenderId: lender.id,
        amount: numAmount,
        purpose,
        businessName: businessName.trim() || undefined,
        monthlyIncome: monthlyIncome ? Number(monthlyIncome) : undefined,
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        Alert.alert(
          'Enquiry Submitted! 🎉',
          `Your loan application has been dispatched directly to ${lender.institutionName}. The financer will review and contact you shortly.`,
          [
            {
              text: 'OK',
              onPress: () => {
                onClose();
                if (onSuccess) onSuccess();
              },
            },
          ]
        );
      } else {
        Alert.alert('Submission Error', res.message || 'Could not submit loan enquiry.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit enquiry.');
    } finally {
      setLoading(false);
    }
  };

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
            <View>
              <Text style={styles.headerTitle}>Apply for Business Loan</Text>
              <Text style={styles.headerSub}>Financer: {lender.institutionName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Financer Limits Summary Card */}
            <View style={styles.financerBadge}>
              <Shield size={16} color="#003893" />
              <Text style={styles.badgeText}>
                Lending Limits: ₹{lender.minLoanAmount?.toLocaleString('en-IN')} - ₹{lender.maxLoanAmount?.toLocaleString('en-IN')} • {lender.minInterestRate}% interest
              </Text>
            </View>

            {/* Loan Amount Input */}
            <Text style={styles.inputLabel}>Required Loan Amount (₹) *</Text>
            <View style={styles.inputBox}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="number-pad"
                placeholder="50000"
                placeholderTextColor="#94a3b8"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            {/* Purpose Chips */}
            <Text style={styles.inputLabel}>Loan Purpose *</Text>
            <View style={styles.purposePills}>
              {LOAN_PURPOSES.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.purposeChip,
                    purpose === item && styles.purposeChipActive,
                  ]}
                  onPress={() => setPurpose(item)}
                >
                  <Text
                    style={[
                      styles.purposeChipText,
                      purpose === item && styles.purposeChipTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Shop Name */}
            <Text style={styles.inputLabel}>Shop / Business Name (Optional)</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.textInputRegular}
                placeholder="e.g. My General Store"
                placeholderTextColor="#94a3b8"
                value={businessName}
                onChangeText={setBusinessName}
              />
            </View>

            {/* Monthly Income */}
            <Text style={styles.inputLabel}>Estimated Monthly Turnover / Revenue (₹)</Text>
            <View style={styles.inputBox}>
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="number-pad"
                placeholder="e.g. 75000"
                placeholderTextColor="#94a3b8"
                value={monthlyIncome}
                onChangeText={setMonthlyIncome}
              />
            </View>

            {/* Additional Notes */}
            <Text style={styles.inputLabel}>Notes for Financer (Optional)</Text>
            <View style={[styles.inputBox, { height: 80, alignItems: 'flex-start' }]}>
              <TextInput
                style={[styles.textInputRegular, { height: 70, textAlignVertical: 'top' }]}
                placeholder="Any specific requirement or timeline..."
                placeholderTextColor="#94a3b8"
                multiline
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Send size={18} color="#ffffff" />
                  <Text style={styles.submitBtnText}>Submit Loan Application</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  formScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  financerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  badgeText: {
    fontSize: 12,
    color: '#1e40af',
    fontWeight: '700',
    flex: 1,
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
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    marginBottom: 14,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '900',
    color: '#003893',
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  textInputRegular: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  purposePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  purposeChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  purposeChipActive: {
    borderColor: '#003893',
    backgroundColor: '#eff6ff',
  },
  purposeChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  purposeChipTextActive: {
    color: '#003893',
    fontWeight: '800',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#003893',
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 6,
    marginBottom: 20,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
