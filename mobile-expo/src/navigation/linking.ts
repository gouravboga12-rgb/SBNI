import * as Linking from 'expo-linking';

export const linking = {
  prefixes: [Linking.createURL('/'), 'justpaisa://', 'https://justpaisa.in'],
  config: {
    screens: {
      VendorTabs: {
        screens: {
          Home: 'home',
          Financers: 'financers',
          Requests: 'requests',
          Profile: 'profile',
        },
      },
      LenderTabs: {
        screens: {
          Home: 'lender-home',
          Businesses: 'businesses',
          Reports: 'reports',
          Profile: 'lender-profile',
        },
      },
      Subscription: 'subscription',
      Login: 'login',
    },
  },
};
