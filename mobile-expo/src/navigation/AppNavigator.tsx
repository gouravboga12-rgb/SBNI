import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  Home,
  Building2,
  Gift,
  User as UserIcon,
  Store,
  FileSpreadsheet,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { AppHeader } from '../components/AppHeader';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { VendorHomeScreen } from '../screens/vendor/VendorHomeScreen';
import { LenderHomeScreen } from '../screens/lender/LenderHomeScreen';
import { ReferEarnScreen } from '../screens/common/ReferEarnScreen';
import { ProfileScreen } from '../screens/common/ProfileScreen';
import { SubscriptionModal } from '../components/SubscriptionModal';
import { linking } from './linking';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function BottomTabs() {
  const { role } = useAuth();
  const isVendor = role === 'VENDOR';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: isVendor ? '#003893' : '#007a33',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={isVendor ? VendorHomeScreen : LenderHomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name={isVendor ? 'Financers' : 'Enquiries'}
        component={isVendor ? VendorHomeScreen : LenderHomeScreen}
        options={{
          tabBarLabel: isVendor ? 'Financers' : 'Enquiries',
          tabBarIcon: ({ color, size }) =>
            isVendor ? <Building2 size={size} color={color} /> : <FileSpreadsheet size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Refer"
        component={ReferEarnScreen}
        options={{
          tabBarLabel: 'Refer & Earn',
          tabBarIcon: ({ color, size }) => <Gift size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Account',
          tabBarIcon: ({ color, size }) => <UserIcon size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export const AppNavigator: React.FC = () => {
  const { token, isLoading } = useAuth();
  const [subModalVisible, setSubModalVisible] = useState(false);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#003893" />
      </View>
    );
  }

  if (!token) {
    return <LoginScreen />;
  }

  return (
    <NavigationContainer linking={linking as any}>
      <View style={styles.container}>
        <AppHeader
          onOpenWallet={() => setSubModalVisible(true)}
          onOpenProfile={() => {}}
        />
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={BottomTabs} />
        </Stack.Navigator>

        <SubscriptionModal
          visible={subModalVisible}
          onClose={() => setSubModalVisible(false)}
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
    backgroundColor: '#0f172a',
  },
});
