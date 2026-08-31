import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import {
  User as UserIcon,
  Store,
  Building2,
  ShieldCheck,
  FileText,
  Mail,
  LogOut,
  RefreshCw,
  ChevronRight,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

interface ProfileScreenProps {
  onOpenPolicies?: (tab: string) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onOpenPolicies }) => {
  const { user, role, switchRole, logout } = useAuth();
  const isVendor = role === 'VENDOR';

  const handleToggleRole = () => {
    const nextRole = isVendor ? 'LENDER' : 'VENDOR';
    switchRole(nextRole);
    Alert.alert('Account Switched', `Now operating as ${nextRole === 'VENDOR' ? 'Shop Vendor' : 'Business Money Financer'}.`);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out from JustPaisa?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Top Card */}
      <View style={styles.userCard}>
        <View style={styles.avatarCircle}>
          <UserIcon size={32} color="#003893" />
        </View>
        <Text style={styles.userName}>
          {user?.name || user?.vendorProfile?.ownerName || user?.lenderProfile?.contactPersonName || 'Business Partner'}
        </Text>
        <Text style={styles.userPhone}>+91 {user?.phone || '9553921237'}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>
            {isVendor ? 'Local Shop / Vendor' : 'Verified Money Financer'}
          </Text>
        </View>
      </View>

      {/* Account Mode Switcher */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Account Modes</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleToggleRole}
          activeOpacity={0.7}
        >
          <View style={styles.menuLeft}>
            <View style={styles.iconBgBlue}>
              <RefreshCw size={18} color="#003893" />
            </View>
            <View>
              <Text style={styles.menuTitle}>
                Switch to {isVendor ? 'Financer Hub' : 'Vendor Dashboard'}
              </Text>
              <Text style={styles.menuSub}>Toggle your marketplace active view</Text>
            </View>
          </View>
          <ChevronRight size={18} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* Legal & Policy Center */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Legal & Policies</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => onOpenPolicies && onOpenPolicies('terms')}
          activeOpacity={0.7}
        >
          <View style={styles.menuLeft}>
            <FileText size={18} color="#64748b" />
            <Text style={styles.menuTitle}>Terms & Conditions</Text>
          </View>
          <ChevronRight size={18} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => onOpenPolicies && onOpenPolicies('privacy')}
          activeOpacity={0.7}
        >
          <View style={styles.menuLeft}>
            <ShieldCheck size={18} color="#64748b" />
            <Text style={styles.menuTitle}>Privacy Policy</Text>
          </View>
          <ChevronRight size={18} color="#94a3b8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => onOpenPolicies && onOpenPolicies('refund')}
          activeOpacity={0.7}
        >
          <View style={styles.menuLeft}>
            <FileText size={18} color="#64748b" />
            <Text style={styles.menuTitle}>Refund & Cancellation Policy</Text>
          </View>
          <ChevronRight size={18} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* Official Help Desk & Support */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Official Support & Help Desk</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => Linking.openURL('mailto:srinivaspolepalli10@gmail.com')}
          activeOpacity={0.7}
        >
          <View style={styles.menuLeft}>
            <Mail size={18} color="#003893" />
            <View>
              <Text style={styles.menuTitle}>srinivaspolepalli10@gmail.com</Text>
              <Text style={styles.menuSub}>24/7 Priority Marketplace Desk</Text>
            </View>
          </View>
          <ChevronRight size={18} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      {/* Developer Credit & Logout */}
      <View style={styles.devCreditBox}>
        <Text style={styles.devCreditText}>
          Developed by{' '}
          <Text
            style={styles.devLink}
            onPress={() => Linking.openURL('https://www.codtechitsolutions.com/')}
          >
            CODTECH IT SOLUTIONS
          </Text>
        </Text>
      </View>

      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleLogout}
        activeOpacity={0.85}
      >
        <LogOut size={18} color="#dc2626" />
        <Text style={styles.logoutText}>Log Out of Account</Text>
      </TouchableOpacity>
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
    gap: 14,
  },
  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#bfdbfe',
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  userPhone: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: '#eff6ff',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#003893',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBgBlue: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  menuSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  devCreditBox: {
    alignItems: 'center',
    marginVertical: 4,
  },
  devCreditText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  devLink: {
    color: '#003893',
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
    marginBottom: 10,
  },
  logoutText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '800',
  },
});
