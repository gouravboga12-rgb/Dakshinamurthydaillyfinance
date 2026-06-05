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
  Modal,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure } from '../store/authSlice';
import { RootState } from '../store';
import api from '../utils/api';
import COLORS, { COMMON_STYLES } from '../utils/theme';

export default function LoginScreen({ navigation }: any) {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Forgot password states
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      if (Platform.OS === 'web') {
        alert('Missing Fields: Please enter your email address and password.');
      } else {
        Alert.alert('Missing Fields', 'Please enter your email address and password.');
      }
      return;
    }

    dispatch(loginStart());
    try {
      const response = await api.post('/auth/login', {
        mobile_number: email.trim(),
        password: password.trim(),
      });

      const { token, user } = response.data;

      if (user.role === 'admin') {
        dispatch(loginFailure('Admin users must use the Admin Panel web interface.'));
        if (Platform.OS === 'web') {
          alert('Admin Access Denied: Please use the admin dashboard at localhost:3000');
        } else {
          Alert.alert('Admin Access Denied', 'Please use the admin dashboard at localhost:3000');
        }
        return;
      }

      dispatch(loginSuccess({ token, user }));
    } catch (err: any) {
      const message = err.response?.data?.error || 'Login failed. Please check your credentials.';
      dispatch(loginFailure(message));
      if (Platform.OS === 'web') {
        alert(`Login Failed: ${message}`);
      } else {
        Alert.alert('Login Failed', message);
      }
    }
  };

  const handleResetPassword = async () => {
    if (!forgotEmail.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
      const msg = 'Please fill in all fields.';
      if (Platform.OS === 'web') {
        alert(`Missing Fields: ${msg}`);
      } else {
        Alert.alert('Missing Fields', msg);
      }
      return;
    }

    if (newPassword !== confirmNewPassword) {
      const msg = 'New password and confirmation password do not match.';
      if (Platform.OS === 'web') {
        alert(`Password Mismatch: ${msg}`);
      } else {
        Alert.alert('Password Mismatch', msg);
      }
      return;
    }

    if (newPassword.length < 6) {
      const msg = 'Password must be at least 6 characters long.';
      if (Platform.OS === 'web') {
        alert(`Weak Password: ${msg}`);
      } else {
        Alert.alert('Weak Password', msg);
      }
      return;
    }

    setResetLoading(true);
    try {
      await api.post('/auth/forgot-password', {
        mobile_number: forgotEmail.trim().toLowerCase(),
        new_password: newPassword.trim(),
      });

      const msg = 'Your password has been reset successfully. You can now login with your new password.';
      if (Platform.OS === 'web') {
        alert(`Password Reset Successful! 🎉\n\n${msg}`);
      } else {
        Alert.alert('Password Reset Successful! 🎉', msg);
      }

      setForgotModalVisible(false);
      setForgotEmail('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to reset password. Please try again.';
      if (Platform.OS === 'web') {
        alert(`Reset Failed: ${message}`);
      } else {
        Alert.alert('Reset Failed', message);
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
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
              resizeMode="cover"
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
              <Text style={COMMON_STYLES.label}>Email Address</Text>
              <TextInput
                style={COMMON_STYLES.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                placeholder="Enter your registered email"
                placeholderTextColor={COLORS.placeholder}
                autoCapitalize="none"
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

            {/* Forgot Password trigger link */}
            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={() => setForgotModalVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

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

      {/* Forgot Password Reset Modal */}
      <Modal
        visible={forgotModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setForgotModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reset Password</Text>
              <TouchableOpacity onPress={() => setForgotModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalDivider} />

            <View style={styles.modalBody}>
              <View style={COMMON_STYLES.inputGroup}>
                <Text style={COMMON_STYLES.label}>Registered Email Address</Text>
                <TextInput
                  style={COMMON_STYLES.input}
                  value={forgotEmail}
                  onChangeText={setForgotEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="email@example.com"
                  placeholderTextColor={COLORS.placeholder}
                />
              </View>

              <View style={COMMON_STYLES.inputGroup}>
                <Text style={COMMON_STYLES.label}>New Password</Text>
                <TextInput
                  style={COMMON_STYLES.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  placeholder="Minimum 6 characters"
                  placeholderTextColor={COLORS.placeholder}
                />
              </View>

              <View style={COMMON_STYLES.inputGroup}>
                <Text style={COMMON_STYLES.label}>Confirm New Password</Text>
                <TextInput
                  style={COMMON_STYLES.input}
                  value={confirmNewPassword}
                  onChangeText={setConfirmNewPassword}
                  secureTextEntry
                  placeholder="Confirm your new password"
                  placeholderTextColor={COLORS.placeholder}
                />
              </View>

              <TouchableOpacity
                style={[COMMON_STYLES.button, { marginTop: 8 }, resetLoading && { opacity: 0.6 }]}
                onPress={handleResetPassword}
                disabled={resetLoading}
              >
                {resetLoading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={COMMON_STYLES.buttonText}>Reset Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: '#10B981',
    backgroundColor: '#FFFFFF',
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
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: -8,
  },
  forgotPasswordText: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: '700',
  },
  // Modal overlay styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  closeBtn: {
    color: COLORS.muted,
    fontSize: 18,
    fontWeight: '700',
    padding: 4,
  },
  modalDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  modalBody: {
    gap: 16,
  },
});
