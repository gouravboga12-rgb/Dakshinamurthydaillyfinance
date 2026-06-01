import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/authSlice';
import COLORS, { COMMON_STYLES } from '../utils/theme';

export default function ProfileScreen() {
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            dispatch(logout());
            // On web, React Navigation doesn't fully remount on Redux state change,
            // so we force a page reload to get back to the Login screen cleanly.
            if (Platform.OS === 'web') {
              setTimeout(() => {
                (window as any).location.href = '/';
              }, 100);
            }
          },
        },
      ]
    );
  };

  const avatarUri = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&h=256&q=80';

  const personalFields = [
    { label: 'Full Name', value: user?.full_name || 'Customer', icon: '👤' },
    { label: 'Mobile Number', value: user?.mobile_number || '—', icon: '📱' },
    { label: 'Email Address', value: user?.email || 'Not Provided', icon: '✉️' },
    {
      label: 'Account Status',
      value: user?.status?.toUpperCase() || 'APPROVED',
      icon: '✅',
      isStatus: true,
    },
  ];

  const businessFields = [
    { label: 'Occupation', value: user?.occupation || 'Not Provided', icon: '💼' },
    { label: 'Shop / Company Name', value: user?.shop_name || 'Not Provided', icon: '🏢' },
    { label: 'Registered Address', value: user?.address || 'Not Provided', icon: '📍' },
  ];

  return (
    <ScrollView style={COMMON_STYLES.container} contentContainerStyle={styles.content}>
      {/* Premium Dark Profile Banner */}
      <View style={styles.header}>
        <View style={styles.avatarWrapper}>
          <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
        </View>
        <Text style={styles.headerName}>{user?.full_name || 'Customer'}</Text>
        <Text style={styles.headerMobile}>{user?.mobile_number || ''}</Text>
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>✓ Verified Customer</Text>
        </View>
      </View>

      {/* Personal Info Card */}
      <View style={[COMMON_STYLES.card, styles.infoCard, { marginTop: -16 }]}>
        <Text style={styles.sectionTitle}>👤 Personal Details</Text>

        {personalFields.map((field, idx) => (
          <View
            key={idx}
            style={[
              styles.fieldRow,
              idx < personalFields.length - 1 && styles.fieldBorder,
            ]}
          >
            <View style={styles.fieldLeft}>
              <View style={styles.fieldIconCircle}>
                <Text style={styles.fieldIcon}>{field.icon}</Text>
              </View>
              <View>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <Text
                  style={[
                    styles.fieldValue,
                    field.isStatus && { color: COLORS.accent, fontWeight: '900' },
                  ]}
                >
                  {field.value}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Business Info Card */}
      <View style={[COMMON_STYLES.card, styles.infoCard, { marginTop: 16 }]}>
        <Text style={styles.sectionTitle}>🏢 Business & Address Details</Text>

        {businessFields.map((field, idx) => (
          <View
            key={idx}
            style={[
              styles.fieldRow,
              idx < businessFields.length - 1 && styles.fieldBorder,
            ]}
          >
            <View style={styles.fieldLeft}>
              <View style={styles.fieldIconCircle}>
                <Text style={styles.fieldIcon}>{field.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <Text style={styles.fieldValue} numberOfLines={field.label === 'Registered Address' ? undefined : 1}>
                  {field.value}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Premium Security Information */}
      <View style={styles.securityCard}>
        <Text style={styles.securityTitle}>🔒 Security & Access</Text>
        <Text style={styles.securityText}>
          Your account is secured with encrypted credentials and JWT sessions. Please contact your administrator if you need to modify your registration details.
        </Text>
      </View>

      {/* Modern styled Sign Out Button */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Text style={styles.logoutText}>Sign Out of Account</Text>
      </TouchableOpacity>

      <Text style={styles.footerBrand}>Dakshinamurthy Daily Finance v1.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 40 },

  header: {
    backgroundColor: '#0F172A',
    paddingTop: 36,
    paddingBottom: 44,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
      },
    }),
  },
  avatarWrapper: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: COLORS.secondary,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    backgroundColor: '#FFFFFF',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  headerName: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', marginBottom: 4 },
  headerMobile: { color: 'rgba(255,255,255,0.45)', fontSize: 13, marginBottom: 14, fontWeight: '500' },
  verifiedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 99,
  },
  verifiedText: { color: '#10B981', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },

  infoCard: {
    marginHorizontal: 24,
    padding: 22,
  },

  fieldRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14 },
  fieldBorder: { borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  fieldLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  fieldIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldIcon: { fontSize: 16 },
  fieldLabel: {
    color: COLORS.body,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  fieldValue: { color: COLORS.heading, fontSize: 14, fontWeight: '800' },

  securityCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 24,
    marginTop: 18,
    ...Platform.select({
      web: {
        backgroundImage: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
      },
    }),
  },
  securityTitle: { color: '#1E40AF', fontSize: 14, fontWeight: '800', marginBottom: 8 },
  securityText: { color: '#1E40AF', fontSize: 13, lineHeight: 18, fontWeight: '600', opacity: 0.8 },

  logoutButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 24,
    marginTop: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: { color: '#EF4444', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },

  footerBrand: {
    textAlign: 'center',
    color: COLORS.placeholder,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 32,
  },
});
