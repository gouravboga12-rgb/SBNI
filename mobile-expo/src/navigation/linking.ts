import * as Linking from 'expo-linking';

export const linking = {
  prefixes: [Linking.createURL('/'), 'justpaisa://', 'https://justpaisa.in'],
  config: {
    screens: {
      Main: {
        screens: {
          Home: 'home',
          Financers: 'financers',
          Inquiries: 'requests',
          Leads: 'leads',
          FraudRisk: 'fraud',
          Refer: 'refer',
          Profile: 'profile',
        },
      },
      Subscription: 'subscription',
      Login: 'login',
    },
  },
};
