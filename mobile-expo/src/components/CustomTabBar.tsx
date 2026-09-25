import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Home,
  FileText,
  User,
  Users,
  Phone,
  Plus,
  Lock,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

interface CustomTabBarProps extends BottomTabBarProps {
  role: 'VENDOR' | 'LENDER';
  onOpenSubscription?: () => void;
}

export const CustomTabBar: React.FC<CustomTabBarProps> = ({
  state,
  descriptors,
  navigation,
  role,
  onOpenSubscription,
}) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTablet = width >= 768;
  const { isSubscribed } = useAuth();

  const isVendor = role === 'VENDOR';
  const activeColor = isVendor ? '#003893' : '#059669';
  const activeBg = isVendor ? '#eff6ff' : '#ecfdf5';

  const leftRoutes = state.routes.slice(0, 2);
  const rightRoutes = state.routes.slice(2, 4);

  const renderTab = (route: typeof state.routes[0], index: number) => {
    const isFocused = state.index === index;

    const onPress = () => {
      // Gate: Commercial Partners directory requires active subscription for vendors (mirrors website)
      if (role === 'VENDOR' && route.name === 'Financers' && !isSubscribed) {
        if (onOpenSubscription) {
          onOpenSubscription();
        }
        return;
      }

      // Gate: Businesses directory requires active subscription for commercial partners (mirrors website)
      if (role === 'LENDER' && route.name === 'Businesses' && !isSubscribed) {
        if (onOpenSubscription) {
          onOpenSubscription();
        }
        return;
      }

      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    let IconComponent = Home;
    let label = 'Home';

    if (route.name === 'Home') {
      IconComponent = Home;
      label = 'Home';
    } else if (route.name === 'Financers') {
      IconComponent = Users;
      label = isVendor && !isSubscribed ? 'Partners 🔒' : 'Partners';
    } else if (route.name === 'Businesses') {
      IconComponent = Users;
      label = !isVendor && !isSubscribed ? 'Businesses 🔒' : 'Businesses';
    } else if (route.name === 'Requests') {
      IconComponent = FileText;
      label = 'Requests';
    } else if (route.name === 'Reports') {
      IconComponent = FileText;
      label = 'Reports';
    } else if (route.name === 'Profile') {
      IconComponent = User;
      label = 'Profile';
    }

    return (
      <TouchableOpacity
        key={route.key}
        style={[
          styles.tabItem,
          isFocused && { backgroundColor: activeBg },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <IconComponent
          size={isTablet ? 22 : 19}
          color={isFocused ? activeColor : '#64748b'}
        />
        <Text
          style={[
            styles.tabLabel,
            {
              color: isFocused ? activeColor : '#64748b',
              fontWeight: isFocused ? '800' : '600',
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.containerWrapper,
        isTablet ? styles.tabletWrapper : null,
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.dockBar,
          isTablet ? styles.tabletDock : styles.phoneDock,
          {
            paddingBottom: Math.max(insets.bottom, 8),
            paddingTop: 8,
          },
        ]}
      >
        {/* Left 2 Tabs */}
        {leftRoutes.map((route, i) => renderTab(route, i))}

        {/* Center Floating Action Button (Matches Website Exactly: Phone for Vendor, Plus for Lender) */}
        <TouchableOpacity
          style={styles.floatingCenterBtn}
          onPress={() => {
            if (onOpenSubscription) {
              onOpenSubscription();
            }
          }}
          activeOpacity={0.88}
        >
          {isVendor ? (
            <Phone size={21} color="#ffffff" fill="#ffffff" />
          ) : (
            <Plus size={26} color="#ffffff" />
          )}
        </TouchableOpacity>

        {/* Right 2 Tabs */}
        {rightRoutes.map((route, i) => renderTab(route, i + 2))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  containerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
  tabletWrapper: {
    paddingBottom: 12,
  },
  dockBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 10,
    paddingHorizontal: 8,
  },
  phoneDock: {
    width: '100%',
  },
  tabletDock: {
    width: '85%',
    maxWidth: 620,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 12,
    gap: 3,
  },
  tabLabel: {
    fontSize: 11,
  },
  floatingCenterBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -24,
    borderWidth: 3.5,
    borderColor: '#ffffff',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 12,
    marginHorizontal: 4,
  },
});
