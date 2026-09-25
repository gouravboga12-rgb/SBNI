import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import {
  Scale,
  FileText,
  ShieldCheck,
  RefreshCcw,
  X,
  CheckCircle2,
} from 'lucide-react-native';

export type PolicyTab = 'terms' | 'privacy' | 'refund' | 'shipping';

interface PolicyModalProps {
  visible: boolean;
  onClose: () => void;
  initialTab?: PolicyTab;
  policyType?: PolicyTab;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({
  visible,
  onClose,
  initialTab = 'terms',
  policyType,
}) => {
  const effectiveTab = policyType || initialTab || 'terms';
  const [activeTab, setActiveTab] = useState<PolicyTab>(effectiveTab);
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  React.useEffect(() => {
    setActiveTab(policyType || initialTab || 'terms');
  }, [initialTab, policyType, visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalCard, isTablet && styles.modalCardTablet]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <Scale size={20} color="#003893" />
              </View>
              <View>
                <Text style={styles.title}>Legal & Compliance Center</Text>
                <Text style={styles.subTitle}>JustPaisa Business Policies • 2026</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Policy Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'terms' && styles.tabBtnActive]}
              onPress={() => setActiveTab('terms')}
            >
              <FileText size={14} color={activeTab === 'terms' ? '#003893' : '#64748b'} />
              <Text style={[styles.tabText, activeTab === 'terms' && styles.tabTextActive]}>
                Terms of Use
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'privacy' && styles.tabBtnActive]}
              onPress={() => setActiveTab('privacy')}
            >
              <ShieldCheck size={14} color={activeTab === 'privacy' ? '#003893' : '#64748b'} />
              <Text style={[styles.tabText, activeTab === 'privacy' && styles.tabTextActive]}>
                Privacy Policy
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'refund' && styles.tabBtnActive]}
              onPress={() => setActiveTab('refund')}
            >
              <RefreshCcw size={14} color={activeTab === 'refund' ? '#003893' : '#64748b'} />
              <Text style={[styles.tabText, activeTab === 'refund' && styles.tabTextActive]}>
                Refund Policy
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content Body */}
          <ScrollView style={styles.contentBody} showsVerticalScrollIndicator={false}>
            {activeTab === 'terms' && (
              <View style={styles.policySection}>
                <Text style={styles.sectionHeader}>Terms of Service & User Agreement</Text>
                <Text style={styles.paragraph}>
                  1. <Text style={styles.bold}>Platform Role:</Text> JustPaisa is a commercial B2B directory connecting local shop owners with verified commercial partners and business service facilitators.
                </Text>
                <Text style={styles.paragraph}>
                  2. <Text style={styles.bold}>Business Profiles:</Text> All shop owners and commercial partners agree that provided profile information, shop locations, and contact credentials are genuine representations of commercial entities.
                </Text>
                <Text style={styles.paragraph}>
                  3. <Text style={styles.bold}>Subscription Validity:</Text> Paid membership plans provide direct contact access and radius matching. Plan validity stacks continuously upon renewals and plan upgrades.
                </Text>
                <Text style={styles.paragraph}>
                  4. <Text style={styles.bold}>Direct Communication:</Text> All commercial discussions and mutual agreements are negotiated strictly and directly between registered businesses.
                </Text>
              </View>
            )}

            {activeTab === 'privacy' && (
              <View style={styles.policySection}>
                <Text style={styles.sectionHeader}>Privacy & Data Protection Policy</Text>
                <Text style={styles.paragraph}>
                  1. <Text style={styles.bold}>Non-Lending Declaration:</Text> JustPaisa is strictly a communication directory and does not provide loans or consumer credit.
                </Text>
                <Text style={styles.paragraph}>
                  2. <Text style={styles.bold}>Data Collection:</Text> We collect business profile information (shop name, location coordinates, contact phone number, and optional storefront photo) solely for directory discovery.
                </Text>
                <Text style={styles.paragraph}>
                  3. <Text style={styles.bold}>256-Bit Encryption:</Text> All user data, contact requests, and payment interactions are encrypted using industry-standard 256-bit SSL encryption.
                </Text>
                <Text style={styles.paragraph}>
                  4. <Text style={styles.bold}>Contact Privacy:</Text> Your contact details are only shared with a financer when you explicitly initiate an inquiry, phone call, or WhatsApp chat with consent.
                </Text>
                <Text style={styles.paragraph}>
                  5. <Text style={styles.bold}>Account Deletion:</Text> You can request full deletion of your account and personal data at any time from your Profile settings or by emailing srinivaspolepalli10@gmail.com.
                </Text>
              </View>
            )}

            {activeTab === 'refund' && (
              <View style={styles.policySection}>
                <Text style={styles.sectionHeader}>Cancellation & Refund Policy</Text>
                <Text style={styles.paragraph}>
                  1. <Text style={styles.bold}>Subscription Activation:</Text> Once a subscription plan is activated, full access to verified commercial directories is unlocked immediately.
                </Text>
                <Text style={styles.paragraph}>
                  2. <Text style={styles.bold}>AutoPay Cancellation:</Text> Users can cancel recurring AutoPay renewal at any time directly from the app. Upon cancellation, current active validity remains intact until expiry.
                </Text>
                <Text style={styles.paragraph}>
                  3. <Text style={styles.bold}>Refund Queries:</Text> For any technical billing disputes or duplicate payment deductions, please contact srinivaspolepalli10@gmail.com within 48 hours for immediate investigation and resolution.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer Close Button */}
          <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.doneBtnText}>I Understand</Text>
          </TouchableOpacity>
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
    maxHeight: '90%',
  },
  modalCardTablet: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
    borderRadius: 28,
    marginBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 14,
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  title: {
    fontSize: 16,
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
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#003893',
    fontWeight: '800',
  },
  contentBody: {
    maxHeight: 380,
    paddingHorizontal: 2,
  },
  policySection: {
    paddingBottom: 10,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 12,
  },
  bold: {
    fontWeight: '800',
    color: '#0f172a',
  },
  doneBtn: {
    backgroundColor: '#003893',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
