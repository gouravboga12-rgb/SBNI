import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { VendorHomeScreen } from '../screens/vendor/VendorHomeScreen';
import { VendorFinancersScreen } from '../screens/vendor/VendorFinancersScreen';
import { VendorRequestsScreen } from '../screens/vendor/VendorRequestsScreen';
import { VendorProfileScreen } from '../screens/vendor/VendorProfileScreen';
import { LenderHomeScreen } from '../screens/lender/LenderHomeScreen';
import { LenderBusinessesScreen } from '../screens/lender/LenderBusinessesScreen';
import { LenderReportsScreen } from '../screens/lender/LenderReportsScreen';
import { LenderProfileScreen } from '../screens/lender/LenderProfileScreen';
import { CustomTabBar } from '../components/CustomTabBar';
import { SubscriptionModal } from '../components/SubscriptionModal';
import { NotificationModal } from '../components/NotificationModal';
import { PolicyModal, PolicyTab } from '../components/PolicyModal';
import { SupportModal } from '../components/SupportModal';
import { ReferAndEarnModal } from '../components/ReferAndEarnModal';
import { setupNotificationListeners } from '../services/notificationService';
import { linking } from './linking';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

interface RoleTabsProps {
  onOpenSubscription: () => void;
}

function VendorTabs({ onOpenSubscription }: RoleTabsProps) {
  return (
    <Tab.Navigator
      tabBar={(props) => (
        <CustomTabBar
          {...props}
          role="VENDOR"
          onOpenSubscription={onOpenSubscription}
        />
      )}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={VendorHomeScreen} />
      <Tab.Screen name="Financers" component={VendorFinancersScreen} />
      <Tab.Screen name="Requests" component={VendorRequestsScreen} />
      <Tab.Screen name="Profile" component={VendorProfileScreen} />
    </Tab.Navigator>
  );
}

function LenderTabs({ onOpenSubscription }: RoleTabsProps) {
  return (
    <Tab.Navigator
      tabBar={(props) => (
        <CustomTabBar
          {...props}
          role="LENDER"
          onOpenSubscription={onOpenSubscription}
        />
      )}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={LenderHomeScreen} />
      <Tab.Screen name="Businesses" component={LenderBusinessesScreen} />
      <Tab.Screen name="Reports" component={LenderReportsScreen} />
      <Tab.Screen name="Profile" component={LenderProfileScreen} />
    </Tab.Navigator>
  );
}

export const AppNavigator: React.FC = () => {
  const navigationRef = useNavigationContainerRef();
  const { user, token, role, isSubscribed, isLoading } = useAuth();
  const [subModalVisible, setSubModalVisible] = useState(false);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [policyModalVisible, setPolicyModalVisible] = useState(false);
  const [policyTab, setPolicyTab] = useState<PolicyTab>('terms');
  const [supportModalVisible, setSupportModalVisible] = useState(false);
  const [referModalVisible, setReferModalVisible] = useState(false);

  React.useEffect(() => {
    const unsubscribe = setupNotificationListeners(
      () => {},
      (response) => {
        try {
          const data = response?.notification?.request?.content?.data;
          if (data?.screen && navigationRef.isReady()) {
            navigationRef.navigate(data.screen as never);
          } else {
            setNotifModalVisible(true);
          }
        } catch {
          setNotifModalVisible(true);
        }
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#003893" />
      </View>
    );
  }

  // Initial Screen is Login when not authenticated
  if (!token) {
    return <LoginScreen />;
  }

  const handleNavigateHome = () => {
    if (navigationRef.isReady()) {
      navigationRef.navigate('Home' as never);
    }
  };

  const handleNavigateFinancers = () => {
    if (!isSubscribed) {
      setSubModalVisible(true);
      return;
    }
    if (navigationRef.isReady()) {
      navigationRef.navigate((role === 'VENDOR' ? 'Financers' : 'Businesses') as never);
    }
  };

  const handleOpenProfile = () => {
    if (navigationRef.isReady()) {
      navigationRef.navigate('Profile' as never);
    }
  };

  const handleOpenTerms = () => {
    setPolicyTab('terms');
    setPolicyModalVisible(true);
  };

  return (
    <NavigationContainer ref={navigationRef} linking={linking as any}>
      <View style={styles.container}>
        <AppHeader
          onNavigateHome={handleNavigateHome}
          onNavigateFinancers={handleNavigateFinancers}
          onOpenProfile={handleOpenProfile}
          onOpenWallet={() => setSubModalVisible(true)}
          onOpenTerms={handleOpenTerms}
          onOpenSupport={() => setSupportModalVisible(true)}
          onOpenRefer={() => setReferModalVisible(true)}
          onOpenNotifications={() => setNotifModalVisible(true)}
        />
        <Stack.Navigator key={`root-nav-${role}`} screenOptions={{ headerShown: false }}>
          {role === 'VENDOR' ? (
            <Stack.Screen name="VendorTabs">
              {() => <VendorTabs onOpenSubscription={() => setSubModalVisible(true)} />}
            </Stack.Screen>
          ) : (
            <Stack.Screen name="LenderTabs">
              {() => <LenderTabs onOpenSubscription={() => setSubModalVisible(true)} />}
            </Stack.Screen>
          )}
        </Stack.Navigator>

        <SubscriptionModal
          visible={subModalVisible}
          onClose={() => setSubModalVisible(false)}
        />

        <NotificationModal
          visible={notifModalVisible}
          onClose={() => setNotifModalVisible(false)}
        />

        <PolicyModal
          visible={policyModalVisible}
          initialTab={policyTab}
          onClose={() => setPolicyModalVisible(false)}
        />

        <SupportModal
          visible={supportModalVisible}
          onClose={() => setSupportModalVisible(false)}
        />

        <ReferAndEarnModal
          visible={referModalVisible}
          onClose={() => setReferModalVisible(false)}
          userRole={role === 'LENDER' ? 'LENDER' : 'VENDOR'}
          userName={user?.name || user?.fullName || 'Partner'}
        />
      </View>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
});
