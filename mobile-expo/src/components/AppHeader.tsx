import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Wallet, User as UserIcon } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

interface AppHeaderProps {
  onOpenNotifications?: () => void;
  onOpenWallet?: () => void;
  onOpenProfile?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onOpenNotifications,
  onOpenWallet,
  onOpenProfile,
}) => {
  const insets = useSafeAreaInsets();
  const { user, role } = useAuth();
  const isVendor = role === 'VENDOR';

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) + 6 }]}>
      <View style={styles.contentRow}>
        {/* Logo & Title */}
        <View style={styles.brandContainer}>
          <Image
            source={require('../../assets/icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.brandTitle}>JustPaisa</Text>
            <Text style={styles.brandSub}>
              {isVendor ? 'Small Shop FinTech' : 'Money Financer Hub'}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {/* Wallet Balance Pill */}
          <TouchableOpacity
            style={styles.walletPill}
            onPress={onOpenWallet}
            activeOpacity={0.8}
          >
            <Wallet size={16} color="#10b981" />
            <Text style={styles.walletText}>₹{user?.walletBalance || 0}</Text>
          </TouchableOpacity>

          {/* Notifications Button */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onOpenNotifications}
            activeOpacity={0.8}
          >
            <Bell size={20} color="#ffffff" />
          </TouchableOpacity>

          {/* Profile Button */}
          <TouchableOpacity
            style={styles.profileButton}
            onPress={onOpenProfile}
            activeOpacity={0.8}
          >
            <UserIcon size={18} color="#003893" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#003893',
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoImage: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  brandSub: {
    fontSize: 10,
    color: '#93c5fd',
    fontWeight: '600',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walletPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  walletText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
