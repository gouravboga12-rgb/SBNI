import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Linking, Alert } from 'react-native';
import { ShieldCheck, Phone, MessageSquare, X } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ConsentModalProps {
  visible: boolean;
  onClose: () => void;
  lender: {
    id: string;
    institutionName: string;
    phone: string;
  } | null;
  actionType: 'CALL' | 'WHATSAPP';
}

export const ConsentModal: React.FC<ConsentModalProps> = ({
  visible,
  onClose,
  lender,
  actionType,
}) => {
  if (!lender) return null;

  const handleContinue = async () => {
    try {
      // Store user consent for this lender
      await AsyncStorage.setItem(`consent_lender_${lender.id}`, 'true');

      const rawPhone = lender.phone.replace(/\D/g, '');
      const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;

      onClose();

      if (actionType === 'CALL') {
        Linking.openURL(`tel:${lender.phone}`);
      } else {
        const msg = encodeURIComponent(
          `Hello ${lender.institutionName}, I found your profile on JustPaisa. I am interested in discussing business financing / loan opportunities.`
        );
        Linking.openURL(`https://wa.me/${cleanPhone}?text=${msg}`);
      }
    } catch (e) {
      Alert.alert('Error', 'Unable to initiate connection.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.shieldIconContainer}>
              <ShieldCheck size={26} color="#003893" />
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Title & Message */}
          <Text style={styles.title}>Data Sharing & Contact Consent</Text>
          <Text style={styles.message}>
            Your verified shop details and enquiry requirements will be shared directly with{' '}
            <Text style={styles.boldText}>{lender.institutionName}</Text> to connect and process your loan application.
          </Text>

          <View style={styles.noticeBox}>
            <Text style={styles.noticeText}>
              🔒 JustPaisa operates with 0% middleman commission. All conversations and loan agreements remain strictly between you and the financer.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.continueButton,
                actionType === 'WHATSAPP' ? styles.whatsappBg : styles.callBg,
              ]}
              onPress={handleContinue}
              activeOpacity={0.8}
            >
              {actionType === 'CALL' ? (
                <>
                  <Phone size={18} color="#ffffff" />
                  <Text style={styles.continueText}>Continue & Call</Text>
                </>
              ) : (
                <>
                  <MessageSquare size={18} color="#ffffff" />
                  <Text style={styles.continueText}>Continue to WhatsApp</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  shieldIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  closeBtn: {
    padding: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10,
  },
  message: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 14,
  },
  boldText: {
    fontWeight: '800',
    color: '#003893',
  },
  noticeBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  noticeText: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  continueButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  callBg: {
    backgroundColor: '#003893',
  },
  whatsappBg: {
    backgroundColor: '#059669',
  },
  continueText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
});
