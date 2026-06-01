import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../store/authSlice';
import { RootState } from '../store';
import api from '../utils/api';
import COLORS, { COMMON_STYLES } from '../utils/theme';

export default function LoginScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');

  const handleGuestAccess = () => {
    dispatch(loginSuccess({
      token: 'guest-mock-token-12345',
      user: {
        id: 'mock-customer-id-12345',
        full_name: 'Dakshinamurthy Customer',
        mobile_number: '7337401590',
        email: 'customer@gmail.com',
        role: 'customer',
        status: 'approved',
        occupation: 'Private Employee',
        shop_name: 'Cognizant',
        address: 'Hyderabad'
      }
    }));
  };

  const handleLogin = async () => {
    if (!mobile.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter your mobile number and password.');
      return;
    }

    dispatch(loginStart());
    try {
      const response = await api.post('/auth/login', {
        mobile_number: mobile.trim(),
        password: password.trim(),
      });

      const { token, user } = response.data;

      if (user.role === 'admin') {
        dispatch(loginFailure('Admin users must use the Admin Panel web interface.'));
        Alert.alert('Admin Access Denied', 'Please use the admin dashboard at localhost:3000');
        return;
      }

      dispatch(loginSuccess({ token, user }));
    } catch (err: any) {
      const message = err.response?.data?.error || 'Login failed. Please check your credentials.';
      dispatch(loginFailure(message));
      Alert.alert('Login Failed', message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.primary }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.headerContainer}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>DAKSHINAMURTHY</Text>
          <Text style={styles.brandSub}>Daily Finance</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to view your loan dashboard</Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={COMMON_STYLES.inputGroup}>
            <Text style={COMMON_STYLES.label}>Mobile Number</Text>
            <TextInput
              style={COMMON_STYLES.input}
              value={mobile}
              onChangeText={setMobile}
              keyboardType="phone-pad"
              placeholder="10-digit mobile number"
              placeholderTextColor={COLORS.placeholder}
              maxLength={10}
            />
          </View>

          <View style={COMMON_STYLES.inputGroup}>
            <Text style={COMMON_STYLES.label}>Password</Text>
            <TextInput
              style={COMMON_STYLES.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Enter your password"
              placeholderTextColor={COLORS.placeholder}
            />
          </View>

          <TouchableOpacity
            style={[COMMON_STYLES.button, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={COMMON_STYLES.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.guestButton}
            onPress={handleGuestAccess}
          >
            <Text style={styles.guestButtonText}>Explore as Guest (Skip Login)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerLink}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.registerText}>
              New customer?{' '}
              <Text style={styles.registerLinkText}>Register Here</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info Note */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Account registration is automatic. You can login immediately once registered.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 20,
    marginBottom: 16,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 3,
  },
  brandSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 4,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginBottom: 24,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.6,
  },
  registerLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  registerText: {
    fontSize: 13,
    color: COLORS.muted,
  },
  registerLinkText: {
    color: COLORS.secondary,
    fontWeight: '700',
  },
  guestButton: {
    borderWidth: 1,
    borderColor: COLORS.secondary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  guestButtonText: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: '700',
  },
  infoBox: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  infoText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
