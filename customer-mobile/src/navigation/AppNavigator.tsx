import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

// Import Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import LoanDetailsScreen from '../screens/LoanDetailsScreen';
import PaymentHistoryScreen from '../screens/PaymentHistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LenderDetailsScreen from '../screens/LenderDetailsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import PaymentHistoryDetailScreen from '../screens/PaymentHistoryDetailScreen';

// Custom tab icons mock since we don't install expo-vector-icons specifically, we can use simple Text or Styles!
import { Text, View, StyleSheet, TouchableOpacity, Linking, Platform, Alert } from 'react-native';
import { COLORS } from '../utils/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Custom premium vector-style outline icons using standard React Native Views
const HomeIcon = ({ focused }: { focused: boolean }) => (
  <View style={styles.premiumIconBox}>
    <View style={[styles.houseBody, { borderColor: focused ? COLORS.secondary : COLORS.muted, backgroundColor: focused ? 'rgba(255, 200, 0, 0.06)' : 'transparent' }]}>
      <View style={[styles.houseDoor, { borderColor: focused ? COLORS.secondary : COLORS.muted }]} />
    </View>
    <View style={[styles.houseRoof, { borderColor: focused ? COLORS.secondary : COLORS.muted }]} />
  </View>
);

const LedgerIcon = ({ focused }: { focused: boolean }) => (
  <View style={styles.premiumIconBoxHorizontal}>
    <View style={[styles.chartBar, { height: 8, backgroundColor: focused ? COLORS.secondary : COLORS.muted }]} />
    <View style={[styles.chartBar, { height: 14, backgroundColor: focused ? COLORS.secondary : COLORS.muted }]} />
    <View style={[styles.chartBar, { height: 10, backgroundColor: focused ? COLORS.secondary : COLORS.muted }]} />
  </View>
);

const SupportIcon = ({ focused }: { focused: boolean }) => (
  <View style={styles.premiumIconBox}>
    <View style={[styles.bubbleBody, { borderColor: focused ? COLORS.secondary : COLORS.muted, backgroundColor: focused ? 'rgba(255, 200, 0, 0.06)' : 'transparent' }]}>
      <View style={[styles.bubbleTail, { backgroundColor: focused ? COLORS.secondary : COLORS.muted }]} />
    </View>
  </View>
);

const ProfileIcon = ({ focused }: { focused: boolean }) => (
  <View style={styles.premiumIconBoxProfile}>
    <View style={[styles.userHead, { borderColor: focused ? COLORS.secondary : COLORS.muted, backgroundColor: focused ? 'rgba(255, 200, 0, 0.06)' : 'transparent' }]} />
    <View style={[styles.userShoulders, { borderColor: focused ? COLORS.secondary : COLORS.muted, backgroundColor: focused ? 'rgba(255, 200, 0, 0.06)' : 'transparent' }]} />
  </View>
);

const TabIcon = ({ name, focused }: { name: string; focused: boolean }) => {
  if (name === 'Home') return <HomeIcon focused={focused} />;
  if (name === 'Ledger') return <LedgerIcon focused={focused} />;
  if (name === 'Lender') return <SupportIcon focused={focused} />;
  return <ProfileIcon focused={focused} />;
};

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          let name = 'Home';
          if (route.name === 'Dashboard') name = 'Home';
          else if (route.name === 'History') name = 'Ledger';
          else if (route.name === 'Support') name = 'Lender';
          else if (route.name === 'Profile') name = 'Profile';
          return <TabIcon name={name} focused={focused} />;
        },
        tabBarLabelPosition: 'below-icon',
        tabBarActiveTintColor: COLORS.secondary,
        tabBarInactiveTintColor: COLORS.muted,
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerRight: () => (
          <TouchableOpacity 
            onPress={() => {
              if (Platform.OS === 'web' && typeof window !== 'undefined') {
                window.location.reload();
              } else {
                Alert.alert('Info', 'Pull down the screen to refresh data.');
              }
            }}
            style={{ marginRight: 16 }}
            activeOpacity={0.7}
          >
            <Text style={{ fontSize: 16 }}>🔄</Text>
          </TouchableOpacity>
        ),
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: -2,
          paddingBottom: 2,
        },
        tabBarStyle: {
          backgroundColor: COLORS.white,
          height: 72,
          paddingTop: 8,
          paddingBottom: 12,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
        }
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Daily Finance' }} />
      <Tab.Screen name="History" component={PaymentHistoryScreen} options={{ title: 'Repayment Log' }} />
      <Tab.Screen name="Support" component={LenderDetailsScreen} options={{ title: 'Lender Support' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
    </Tab.Navigator>
  );
}

const FloatingWhatsApp = () => {
  const handleOpenWhatsApp = () => {
    Linking.openURL('https://wa.me/917659934261?text=Hello%20Dakshinamurthy%20Finance,%20I%20have%20a%20query%20about%20my%20loan.').catch(() => {
      // Fallback silently
    });
  };

  return (
    <TouchableOpacity 
      style={styles.floatingWhatsapp} 
      onPress={handleOpenWhatsApp}
      activeOpacity={0.8}
    >
      <Text style={styles.whatsappEmoji}>💬</Text>
      <Text style={styles.whatsappText}>WhatsApp Support</Text>
    </TouchableOpacity>
  );
};

export default function AppNavigator() {
  const token = useSelector((state: RootState) => state.auth.token);

  return (
    <View style={styles.rootContainer}>
      <View style={styles.appContainer}>
        <Stack.Navigator screenOptions={{ 
          headerShown: false,
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => {
                if (Platform.OS === 'web' && typeof window !== 'undefined') {
                  window.location.reload();
                } else {
                  Alert.alert('Info', 'Pull down to refresh or go back to main screen.');
                }
              }}
              style={{ marginRight: 16 }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 16 }}>🔄</Text>
            </TouchableOpacity>
          )
        }}>
          {token === null ? (
            // Auth Stack
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          ) : (
            // App Stack
            <>
              <Stack.Screen name="MainTabs" component={TabNavigator} />
              <Stack.Screen 
                name="LoanDetails" 
                component={LoanDetailsScreen} 
                options={{ 
                  headerShown: true, 
                  title: 'Loan Disbursal Details',
                  headerStyle: { backgroundColor: COLORS.primary },
                  headerTintColor: COLORS.white 
                }} 
              />
              <Stack.Screen 
                name="Notifications" 
                component={NotificationsScreen} 
                options={{ 
                  headerShown: true, 
                  title: 'Alert Feed',
                  headerStyle: { backgroundColor: COLORS.primary },
                  headerTintColor: COLORS.white 
                }} 
              />
              <Stack.Screen 
                name="PaymentHistoryDetail" 
                component={PaymentHistoryDetailScreen} 
                options={{ 
                  headerShown: true, 
                  title: 'Transaction History',
                  headerStyle: { backgroundColor: COLORS.primary },
                  headerTintColor: COLORS.white 
                }} 
              />
            </>
          )}
        </Stack.Navigator>
        <FloatingWhatsApp />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  premiumIconBox: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  premiumIconBoxHorizontal: {
    width: 24,
    height: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 3,
    paddingBottom: 4,
  },
  premiumIconBoxProfile: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  houseBody: {
    width: 14,
    height: 11,
    borderWidth: 2,
    borderRadius: 2,
    position: 'relative',
    top: 2,
  },
  houseDoor: {
    width: 4,
    height: 5,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    position: 'absolute',
    bottom: -1.5,
    left: 3,
  },
  houseRoof: {
    width: 11,
    height: 11,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    transform: [{ rotate: '45deg' }],
    position: 'absolute',
    top: 2,
  },
  chartBar: {
    width: 3.5,
    borderRadius: 1,
  },
  bubbleBody: {
    width: 15,
    height: 12,
    borderWidth: 2,
    borderRadius: 3,
    position: 'relative',
    top: -1,
  },
  bubbleTail: {
    width: 4,
    height: 4,
    position: 'absolute',
    bottom: -3,
    left: 3,
    transform: [{ rotate: '45deg' }],
  },
  userHead: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    marginBottom: 2,
  },
  userShoulders: {
    width: 15,
    height: 7,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 2,
  },
  rootContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Premium page background canvas
    alignItems: 'center',
    justifyContent: 'center',
  },
  appContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 480, // Centered responsive mobile/tablet layout limit
    backgroundColor: '#F9FAFB',
    ...Platform.select({
      web: {
        shadowColor: '#111827',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#E5E7EB',
      },
    }),
  },
  floatingWhatsapp: {
    position: 'absolute',
    bottom: 92,
    right: 20,
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 99,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 9999,
  },
  whatsappEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  whatsappText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  }
});
