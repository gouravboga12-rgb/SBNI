import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Menu,
  Bell,
  Zap,
  Store,
  Building2,
  X,
  Home,
  FileText,
  Gift,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Headphones,
  User,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

interface AppHeaderProps {
  onOpenNotifications?: () => void;
  onOpenWallet?: () => void;
  onOpenProfile?: () => void;
  onNavigateHome?: () => void;
  onNavigateFinancers?: () => void;
  onOpenTerms?: () => void;
  onOpenSupport?: () => void;
  onOpenRefer?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onOpenNotifications,
  onOpenWallet,
  onOpenProfile,
  onNavigateHome,
  onNavigateFinancers,
  onOpenTerms,
  onOpenSupport,
  onOpenRefer,
}) => {
  const insets = useSafeAreaInsets();
  const { user, role, isSubscribed, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isVendor = role === 'VENDOR';
  const displayName = user?.name || user?.fullName || (isVendor ? 'Shop Owner' : 'Financer');
  const initial = displayName.charAt(0).toUpperCase();

  const handleMenuClick = (action?: () => void) => {
    setDrawerOpen(false);
    if (action) action();
  };

  return (
    <>
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 10) + 4 }]}>
        <View style={styles.headerRow}>
          {/* Left: Hamburger Menu + JustPaisa Logo */}
          <View style={styles.leftGroup}>
            <TouchableOpacity
              style={styles.hamburgerBtn}
              onPress={() => setDrawerOpen(true)}
              activeOpacity={0.7}
            >
              <Menu size={22} color="#1e293b" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleMenuClick(onNavigateHome)}
              activeOpacity={0.8}
              style={styles.logoWrapper}
            >
              <Image
                source={require('../../assets/sbni_logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>

          {/* Right: Role Pill, Subscription Button, Bell, Avatar */}
          <View style={styles.rightGroup}>
            {/* Role Badge (Hidden on very narrow screens) */}
            <View
              style={[
                styles.roleBadge,
                isVendor ? styles.roleBadgeVendor : styles.roleBadgeLender,
              ]}
            >
              {isVendor ? (
                <Store size={12} color="#003893" />
              ) : (
                <Building2 size={12} color="#047857" />
              )}
              <Text
                style={[
                  styles.roleBadgeText,
                  isVendor ? { color: '#003893' } : { color: '#047857' },
                ]}
                numberOfLines={1}
              >
                {isVendor ? 'Shop' : 'Financer'}
              </Text>
            </View>

            {/* Subscription Upgrade / Status Trigger Button */}
            <TouchableOpacity
              style={[
                styles.subButton,
                isSubscribed ? styles.subButtonActive : styles.subButtonPay,
              ]}
              onPress={onOpenWallet}
              activeOpacity={0.85}
            >
              <Zap size={12} color={isSubscribed ? '#047857' : '#ffffff'} fill={isSubscribed ? '#047857' : '#ffffff'} />
              <Text
                style={[
                  styles.subButtonText,
                  isSubscribed ? { color: '#047857' } : { color: '#ffffff' },
                ]}
              >
                {isSubscribed ? 'Active' : 'Pay Sub'}
              </Text>
            </TouchableOpacity>

            {/* Notification Bell with Badge */}
            <TouchableOpacity
              style={styles.bellButton}
              onPress={onOpenNotifications}
              activeOpacity={0.7}
            >
              <Bell size={20} color="#334155" />
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>3</Text>
              </View>
            </TouchableOpacity>

            {/* User Profile Avatar */}
            <TouchableOpacity
              style={styles.avatarButton}
              onPress={onOpenProfile}
              activeOpacity={0.8}
            >
              <Text style={styles.avatarText}>{initial}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Slide-out Navigation Drawer Menu Modal */}
      <Modal
        visible={drawerOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setDrawerOpen(false)}
      >
        <View style={styles.drawerOverlay}>
          <TouchableOpacity
            style={styles.drawerBackdrop}
            activeOpacity={1}
            onPress={() => setDrawerOpen(false)}
          />

          <View style={[styles.drawerContent, { paddingTop: Math.max(insets.top, 20) }]}>
            {/* Drawer Header */}
            <View style={styles.drawerHeader}>
              <View style={styles.drawerUserRow}>
                <View style={styles.drawerAvatar}>
                  <Text style={styles.drawerAvatarText}>{initial}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.drawerUserName} numberOfLines={1}>
                    {displayName}
                  </Text>
                  <Text style={styles.drawerUserRole}>
                    {isVendor ? '🏪 Small Shop / Startup Account' : '🏦 Money Financer Account'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setDrawerOpen(false)}
                style={styles.drawerCloseBtn}
              >
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Drawer Links */}
            <ScrollView style={styles.drawerBody} showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => handleMenuClick(onNavigateHome)}
              >
                <View style={styles.drawerItemLeft}>
                  <Home size={18} color="#003893" />
                  <Text style={styles.drawerItemLabel}>Home Dashboard</Text>
                </View>
                <ChevronRight size={16} color="#94a3b8" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => handleMenuClick(onNavigateFinancers)}
              >
                <View style={styles.drawerItemLeft}>
                  {isVendor ? (
                    <Building2 size={18} color="#059669" />
                  ) : (
                    <Store size={18} color="#059669" />
                  )}
                  <Text style={styles.drawerItemLabel}>
                    {isVendor ? 'Discover Financers' : 'Shop / Startup Requests'}
                  </Text>
                </View>
                <ChevronRight size={16} color="#94a3b8" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => handleMenuClick(onOpenWallet)}
              >
                <View style={styles.drawerItemLeft}>
                  <Zap size={18} color="#d97706" />
                  <Text style={styles.drawerItemLabel}>Pay Subscription Plan</Text>
                </View>
                <ChevronRight size={16} color="#94a3b8" />
              </TouchableOpacity>

              {onOpenRefer && (
                <TouchableOpacity
                  style={styles.drawerItem}
                  onPress={() => handleMenuClick(onOpenRefer)}
                >
                  <View style={styles.drawerItemLeft}>
                    <Gift size={18} color="#7c3aed" />
                    <Text style={styles.drawerItemLabel}>Refer & Earn Rewards</Text>
                  </View>
                  <ChevronRight size={16} color="#94a3b8" />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => handleMenuClick(onOpenProfile)}
              >
                <View style={styles.drawerItemLeft}>
                  <User size={18} color="#0284c7" />
                  <Text style={styles.drawerItemLabel}>Account Profile & KYC</Text>
                </View>
                <ChevronRight size={16} color="#94a3b8" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => handleMenuClick(onOpenTerms)}
              >
                <View style={styles.drawerItemLeft}>
                  <FileText size={18} color="#64748b" />
                  <Text style={styles.drawerItemLabel}>Terms & Privacy Policy</Text>
                </View>
                <ChevronRight size={16} color="#94a3b8" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.drawerItem}
                onPress={() => handleMenuClick(onOpenSupport)}
              >
                <View style={styles.drawerItemLeft}>
                  <Headphones size={18} color="#64748b" />
                  <Text style={styles.drawerItemLabel}>Help & Support</Text>
                </View>
                <ChevronRight size={16} color="#94a3b8" />
              </TouchableOpacity>
            </ScrollView>

            {/* Drawer Footer */}
            <View style={styles.drawerFooter}>
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={() => {
                  setDrawerOpen(false);
                  logout();
                }}
              >
                <LogOut size={16} color="#e11d48" />
                <Text style={styles.logoutText}>Log Out Account</Text>
              </TouchableOpacity>

              <Text style={styles.versionText}>
                Just Paisa App v1.0 • Enterprise FinTech Platform
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 8,
    paddingHorizontal: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  hamburgerBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  logoWrapper: {
    justifyContent: 'center',
  },
  logoImage: {
    width: 110,
    height: 38,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
    paddingHorizontal: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  roleBadgeVendor: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  roleBadgeLender: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  subButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  subButtonPay: {
    backgroundColor: '#f59e0b',
    borderColor: '#fbbf24',
  },
  subButtonActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  subButtonText: {
    fontSize: 10,
    fontWeight: '800',
  },
  bellButton: {
    position: 'relative',
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
  },
  bellBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#059669',
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  bellBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
  },
  avatarButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#003893',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  drawerContent: {
    width: '80%',
    maxWidth: 320,
    backgroundColor: '#ffffff',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 16,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  drawerUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  drawerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#003893',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerAvatarText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 16,
  },
  drawerUserName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  drawerUserRole: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 1,
  },
  drawerCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  drawerBody: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
    backgroundColor: '#f8fafc',
  },
  drawerItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  drawerItemLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
  },
  drawerFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 12,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    paddingVertical: 10,
    borderRadius: 12,
  },
  logoutText: {
    color: '#e11d48',
    fontWeight: '800',
    fontSize: 13,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
});
