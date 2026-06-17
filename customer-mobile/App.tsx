import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { NavigationContainer } from '@react-navigation/native';
import { View, StyleSheet, Platform, useWindowDimensions, Text, TouchableOpacity } from 'react-native';
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
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = React.useState(true);

  React.useEffect(() => {
    if (Platform.OS !== 'web') return;

    try {
      const dismissed = sessionStorage.getItem('install_prompt_dismissed');
      if (dismissed === 'true') {
        setShowInstallBanner(false);
      }
    } catch (e) {}

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      try {
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setDeferredPrompt(null);
          setShowInstallBanner(false);
        }
      } catch (err) {
        console.error('PWA installation prompt error:', err);
      }
    } else {
      if (Platform.OS === 'web') {
        alert(
          "To install Dakshinamurthy Daily Ledger as an App:\n\n" +
          "• iOS Safari: Tap the Share button (square with up arrow) in the browser bottom menu, then scroll and tap 'Add to Home Screen'.\n\n" +
          "• Chrome / Android: Tap the three-dot menu icon in the top-right corner, then tap 'Install App' or 'Add to Home Screen'.\n\n" +
          "• Desktops (Chrome/Edge): Click the Install icon in the address bar at the top-right."
        );
      }
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    try {
      sessionStorage.setItem('install_prompt_dismissed', 'true');
    } catch (e) {}
  };

  const content = (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigator />
        <StatusBar style="light" />
      </NavigationContainer>
    </SafeAreaProvider>
  );

  const installBanner = (Platform.OS === 'web' && showInstallBanner) ? (
    <View style={[styles.installBanner, width > 1024 ? styles.installBannerDesktop : styles.installBannerMobile]}>
      <TouchableOpacity style={styles.installButton} onPress={handleInstall} activeOpacity={0.8}>
        <Text style={styles.installButtonText}>📲 Install App</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss} activeOpacity={0.7}>
        <Text style={styles.dismissButtonText}>✕</Text>
      </TouchableOpacity>
    </View>
  ) : null;

  // For Web compiles, only display inside the phone mock frame if on a desktop/wide screen viewport (>1024px).
  // On mobile and tablet viewports (<=1024px), let it take the full screen natively.
  if (Platform.OS === 'web' && width > 1024) {
    return (
      <Provider store={store}>
        <View style={styles.webOuter}>
          <View style={styles.webInner}>
            {content}
          </View>
          {installBanner}
        </View>
      </Provider>
    );
  }

  return (
    <Provider store={store}>
      {content}
      {installBanner}
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
  installBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 24,
    paddingLeft: 4,
    paddingRight: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  installBannerDesktop: {
    position: 'absolute',
    top: 24,
    right: 24,
    zIndex: 99999,
  },
  installBannerMobile: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 99999,
  },
  installButton: {
    backgroundColor: '#10B981',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
  },
  installButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  dismissButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissButtonText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
});
