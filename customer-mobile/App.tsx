import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { NavigationContainer } from '@react-navigation/native';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import * as Notifications from 'expo-notifications';

// Configure foreground notifications handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const { width } = useWindowDimensions();

  const content = (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigator />
        <StatusBar style="light" />
      </NavigationContainer>
    </SafeAreaProvider>
  );

  // For Web compiles, only display inside the phone mock frame if on a desktop/wide screen viewport (>1024px).
  // On mobile and tablet viewports (<=1024px), let it take the full screen natively.
  if (Platform.OS === 'web' && width > 1024) {
    return (
      <Provider store={store}>
        <View style={styles.webOuter}>
          <View style={styles.webInner}>
            {content}
          </View>
        </View>
      </Provider>
    );
  }

  return (
    <Provider store={store}>
      {content}
    </Provider>
  );
}

const styles = StyleSheet.create({
  webOuter: {
    flex: 1,
    backgroundColor: '#0F172A', // Slate background to frame the phone frame
    alignItems: 'center',
    justifyContent: 'center',
  },
  webInner: {
    width: '100%',
    maxWidth: 450, // Standard phone width limit
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#334155', // Slate dark border
    ...Platform.select({
      web: {
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
      },
    }),
  },
});
