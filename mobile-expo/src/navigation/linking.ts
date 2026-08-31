import * as Linking from 'expo-linking';

export const linking = {
  prefixes: [Linking.createURL('/'), 'justpaisa://', 'https://testcodtech.shop'],
  config: {
    screens: {
      Main: {
        screens: {
          Home: 'home',
          Financers: 'financers',
          Leads: 'leads',
          Refer: 'refer',
          Profile: 'profile',
        },
      },
      Subscription: 'subscription',
      Login: 'login',
    },
  },
};
