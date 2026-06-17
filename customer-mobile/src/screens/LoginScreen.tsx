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
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [otpSending, setOtpSending] = useState(false);

  // PWA Install State & Logic
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(true);

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
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    try {
      sessionStorage.setItem('install_prompt_dismissed', 'true');
    } catch (e) {}
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      if (Platform.OS === 'web') {
        alert('Missing Fields: Please enter your email or phone number and password.');
      } else {
        Alert.alert('Missing Fields', 'Please enter your email or phone number and password.');
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
      const message = err.response?.data?.error || err.message || 'Login failed. Please check your credentials.';
      dispatch(loginFailure(message));
      if (Platform.OS === 'web') {
        alert(`Login Failed: ${message}`);
      } else {
        Alert.alert('Login Failed', message);
      }
    }
  };

  const requestResetOtp = async () => {
    if (!forgotEmail.trim()) {
      const msg = 'Please enter your registered email address first.';
      if (Platform.OS === 'web') {
        alert(`Missing Field: ${msg}`);
      } else {
        Alert.alert('Missing Field', msg);
      }
      return;
    }

    setOtpSending(true);
    try {
      await api.post('/auth/send-otp', {
        email: forgotEmail.trim(),
        type: 'reset',
      });

      setForgotOtpSent(true);
      const msg = `A 6-digit verification code has been sent to ${forgotEmail.trim()}.`;
      if (Platform.OS === 'web') {
        alert(`Verification Code Sent! ✉️\n\n${msg}`);
      } else {
        Alert.alert('Verification Code Sent! ✉️', msg);
      }
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || 'Failed to send verification code. Please try again.';
      if (Platform.OS === 'web') {
        alert(`Request Failed: ${message}`);
      } else {
        Alert.alert('Request Failed', message);
      }
    } finally {
      setOtpSending(false);
    }
  };

  const handleResetPassword = async () => {
    if (!forgotEmail.trim() || !forgotOtp.trim() || !newPassword.trim() || !confirmNewPassword.trim()) {
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
        otp: forgotOtp.trim(),
      });

      const msg = 'Your password has been reset successfully. You can now login with your new password.';
      if (Platform.OS === 'web') {
        alert(`Password Reset Successful! 🎉\n\n${msg}`);
      } else {
        Alert.alert('Password Reset Successful! 🎉', msg);
      }

      setForgotModalVisible(false);
      setForgotEmail('');
      setForgotOtp('');
      setForgotOtpSent(false);
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || 'Failed to reset password. Please try again.';
      if (Platform.OS === 'web') {
        alert(`Reset Failed: ${message}`);
      } else {
        Alert.alert('Reset Failed', message);
      }
    } finally {
      setResetLoading(false);
    }
  };

  const openResetModal = () => {
    setForgotEmail('');
    setForgotOtp('');
    setForgotOtpSent(false);
    setNewPassword('');
    setConfirmNewPassword('');
    setForgotModalVisible(true);
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
              resizeMode="contain"
            />
            <Text style={styles.brandName}>DAKSHINAMURTHY</Text>
            <Text style={styles.brandSub}>Daily Ledger</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to view your ledger dashboard</Text>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={COMMON_STYLES.inputGroup}>
              <Text style={COMMON_STYLES.label}>Email ID or Phone Number</Text>
              <TextInput
                style={COMMON_STYLES.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                placeholder="Enter your registered email or phone number"
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
              onPress={openResetModal}
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

            {/* Inline PWA Install Box */}
            {Platform.OS === 'web' && showInstallBanner && (
              <View style={styles.installBox}>
                <View style={styles.installBoxHeader}>
                  <Text style={styles.installTitle}>📲 Download App</Text>
                  <TouchableOpacity onPress={handleDismiss} activeOpacity={0.7} style={styles.installCloseBtn}>
                    <Text style={styles.installCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.installBtnInline} onPress={handleInstall} activeOpacity={0.8}>
                  <Text style={styles.installBtnTextInline}>Download Now</Text>
                </TouchableOpacity>
              </View>
            )}
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
              {!forgotOtpSent ? (
                <View style={{ gap: 16 }}>
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

                  <TouchableOpacity
                    style={[COMMON_STYLES.button, otpSending && { opacity: 0.6 }]}
                    onPress={requestResetOtp}
                    disabled={otpSending}
                  >
                    {otpSending ? (
                      <ActivityIndicator color={COLORS.white} />
                    ) : (
                      <Text style={COMMON_STYLES.buttonText}>Send Verification Code</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView contentContainerStyle={{ gap: 14 }}>
                  <Text style={styles.modalSubtitle}>
                    Verification code sent to:{'\n'}
                    <Text style={{ fontWeight: '800', color: COLORS.primary }}>{forgotEmail.trim()}</Text>
                  </Text>

                  <View style={COMMON_STYLES.inputGroup}>
                    <Text style={COMMON_STYLES.label}>6-Digit OTP Code</Text>
                    <TextInput
                      style={[COMMON_STYLES.input, styles.otpInput]}
                      value={forgotOtp}
                      onChangeText={(text) => setForgotOtp(text.replace(/[^0-9]/g, ''))}
                      keyboardType="number-pad"
                      maxLength={6}
                      placeholder="000000"
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

                  <TouchableOpacity
                    style={styles.resendBtn}
                    onPress={requestResetOtp}
                    disabled={resetLoading}
                  >
                    <Text style={styles.resendText}>Resend Verification Code</Text>
                  </TouchableOpacity>
                </ScrollView>
              )}
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
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    borderColor: '#D4A017',
    backgroundColor: '#FFFFFF',
    marginBottom: 18,
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 14,
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
    maxHeight: '90%',
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
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.body,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  otpInput: {
    textAlign: 'center',
    fontSize: 22,
    letterSpacing: 8,
    fontWeight: '800',
    height: 50,
  },
  resendBtn: {
    marginTop: 12,
    alignItems: 'center',
    padding: 10,
  },
  resendText: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: '700',
  },
  installBox: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  installBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  installTitle: {
    fontWeight: '800',
    color: COLORS.primary,
    fontSize: 14,
  },
  installCloseBtn: {
    padding: 4,
  },
  installCloseText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  installDesc: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 6,
    marginBottom: 12,
    lineHeight: 16,
  },
  installBtnInline: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  installBtnTextInline: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
