import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Linking,
  ScrollView,
} from 'react-native';
import {
  Headphones,
  Phone,
  Mail,
  MessageSquare,
  X,
  Clock,
  ShieldCheck,
} from 'lucide-react-native';

interface SupportModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <Headphones size={22} color="#003893" />
              </View>
              <View>
                <Text style={styles.title}>Customer Support & Helpdesk</Text>
                <Text style={styles.subTitle}>
                  Available to assist your business financing inquiries
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>

            {/* Email Support */}
            <View style={styles.contactItem}>
              <View style={[styles.contactIconBox, { backgroundColor: '#eff6ff' }]}>
                <Mail size={20} color="#2563eb" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactLabel}>Official Email Desk</Text>
                <Text style={styles.contactValue}>srinivaspolepalli10@gmail.com</Text>
              </View>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#2563eb' }]}
                onPress={() => Linking.openURL('mailto:srinivaspolepalli10@gmail.com')}
              >
                <Text style={styles.actionBtnText}>Email Us</Text>
              </TouchableOpacity>
            </View>

            {/* Operating Hours Banner */}
            <View style={styles.hoursBanner}>
              <Clock size={16} color="#003893" />
              <View style={{ flex: 1 }}>
                <Text style={styles.hoursTitle}>Operating Hours</Text>
                <Text style={styles.hoursSub}>
                  Monday to Saturday: 9:00 AM – 7:30 PM (IST)
                </Text>
              </View>
            </View>

            <View style={styles.trustBanner}>
              <ShieldCheck size={16} color="#16a34a" />
              <Text style={styles.trustText}>
                100% Encrypted & Safe Partner Communication
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 16,
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
  },
  subTitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  body: {
    marginBottom: 10,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    gap: 12,
  },
  contactIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
  },
  contactValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 1,
  },
  actionBtn: {
    backgroundColor: '#003893',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  hoursBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 10,
  },
  hoursTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#003893',
  },
  hoursSub: {
    fontSize: 11,
    color: '#475569',
    marginTop: 1,
    fontWeight: '500',
  },
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  trustText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
  },
});
