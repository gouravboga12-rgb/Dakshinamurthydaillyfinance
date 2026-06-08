import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
  Image,
} from 'react-native';
import { useDispatch } from 'react-redux';
import * as DocumentPicker from 'expo-document-picker';
import { loginSuccess } from '../store/authSlice';
import api from '../utils/api';
import COLORS, { COMMON_STYLES } from '../utils/theme';
import { fileUriToBase64 } from '../utils/file';

export default function RegisterScreen({ navigation }: any) {
  const dispatch = useDispatch();

  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [occupation, setOccupation] = useState('');
  const [shopName, setShopName] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP modal states
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const fileInputRef = useRef<any>(null);
  const [aadhaarFile, setAadhaarFile] = useState<{ uri: string; name: string; type: string; fileObj: any } | null>(null);

  // Step 1: Request OTP code
  const requestSignupOtp = async () => {
    if (!fullName.trim() || !mobile.trim() || !email.trim() || !password.trim()) {
      const msg = 'Full Name, Mobile Number, Email Address, and Password are required.';
      if (Platform.OS === 'web') {
        alert(`Missing Fields: ${msg}`);
      } else {
        Alert.alert('Missing Fields', msg);
      }
      return;
    }
    if (password !== confirmPassword) {
      const msg = 'Passwords do not match. Please re-enter.';
      if (Platform.OS === 'web') {
        alert(`Password Mismatch: ${msg}`);
      } else {
        Alert.alert('Password Mismatch', msg);
      }
      return;
    }
    if (mobile.length !== 10) {
      const msg = 'Please enter a valid 10-digit mobile number.';
      if (Platform.OS === 'web') {
        alert(`Invalid Mobile: ${msg}`);
      } else {
        Alert.alert('Invalid Mobile', msg);
      }
      return;
    }
    if (!aadhaarFile) {
      const msg = 'Please select and upload your Aadhaar Card document.';
      if (Platform.OS === 'web') {
        alert(`Missing Aadhaar: ${msg}`);
      } else {
        Alert.alert('Missing Aadhaar', msg);
      }
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/send-otp', { email: email.trim() });
      const msg = `A 6-digit verification code has been sent to ${email.trim()}.`;
      if (Platform.OS === 'web') {
        alert(`Verification Code Sent! ✉️\n\n${msg}`);
      } else {
        Alert.alert('Verification Code Sent! ✉️', msg);
      }
      setOtpModalVisible(true);
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to send verification code. Please try again.';
      if (Platform.OS === 'web') {
        alert(`Verification Failed: ${message}`);
      } else {
        Alert.alert('Verification Failed', message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and Register user
  const handleRegister = async () => {
    if (!otp.trim() || otp.trim().length !== 6) {
      const msg = 'Please enter the 6-digit verification code sent to your email.';
      if (Platform.OS === 'web') {
        alert(`Validation Error: ${msg}`);
      } else {
        Alert.alert('Validation Error', msg);
      }
      return;
    }

    if (!aadhaarFile) {
      const msg = 'Please select and upload your Aadhaar Card document.';
      if (Platform.OS === 'web') {
        alert(`Missing Aadhaar: ${msg}`);
      } else {
        Alert.alert('Missing Aadhaar', msg);
      }
      return;
    }

    setOtpLoading(true);
    try {
      const base64Data = await fileUriToBase64(aadhaarFile.uri);
      
      const payload = {
        full_name: fullName.trim(),
        mobile_number: mobile.trim(),
        email: email.trim(),
        occupation: occupation.trim(),
        shop_name: shopName.trim(),
        address: address.trim(),
        password: password.trim(),
        confirm_password: confirmPassword.trim(),
        otp: otp.trim(),
        aadhaar_base64: base64Data,
      };

      await api.post('/auth/register', payload);

      setOtpModalVisible(false);
      setOtp('');

      if (Platform.OS === 'web') {
        alert('Registration Successful! 🎉\n\nYour account has been created successfully. You can now login.');
        navigation.navigate('Login');
      } else {
        Alert.alert(
          'Registration Successful! 🎉',
          'Your account has been created successfully. You can now login with your email and password.',
          [{ text: 'Login Now', onPress: () => navigation.navigate('Login') }]
        );
      }
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || 'Registration failed. Please try again.';
      if (Platform.OS === 'web') {
        alert(`Registration Failed: ${message}`);
      } else {
        Alert.alert('Registration Failed', message);
      }
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: COLORS.primary }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>DAKSHINAMURTHY</Text>
          <Text style={styles.brandSub}>Daily Finance</Text>
          <Text style={styles.headerSubtitle}>New Customer Registration</Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Personal Details</Text>

          <View style={COMMON_STYLES.inputGroup}>
            <Text style={COMMON_STYLES.label}>Full Name *</Text>
            <TextInput
              style={COMMON_STYLES.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Enter your full name"
              placeholderTextColor={COLORS.placeholder}
            />
          </View>

          <View style={COMMON_STYLES.inputGroup}>
            <Text style={COMMON_STYLES.label}>Mobile Number *</Text>
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
            <Text style={COMMON_STYLES.label}>Email Address *</Text>
            <TextInput
              style={COMMON_STYLES.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="email@example.com"
              placeholderTextColor={COLORS.placeholder}
            />
          </View>

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Business Information</Text>

          <View style={COMMON_STYLES.inputGroup}>
            <Text style={COMMON_STYLES.label}>Occupation</Text>
            <TextInput
              style={COMMON_STYLES.input}
              value={occupation}
              onChangeText={setOccupation}
              placeholder="e.g. Merchant, Trader"
              placeholderTextColor={COLORS.placeholder}
            />
          </View>

          <View style={COMMON_STYLES.inputGroup}>
            <Text style={COMMON_STYLES.label}>Shop / Company Name</Text>
            <TextInput
              style={COMMON_STYLES.input}
              value={shopName}
              onChangeText={setShopName}
              placeholder="Shop or company name"
              placeholderTextColor={COLORS.placeholder}
            />
          </View>

          <View style={COMMON_STYLES.inputGroup}>
            <Text style={COMMON_STYLES.label}>Address</Text>
            <TextInput
              style={[COMMON_STYLES.input, styles.multilineInput]}
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={3}
              placeholder="Full address including city and pincode"
              placeholderTextColor={COLORS.placeholder}
            />
          </View>

          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Security Credentials</Text>

          <View style={COMMON_STYLES.inputGroup}>
            <Text style={COMMON_STYLES.label}>Password *</Text>
            <TextInput
              style={COMMON_STYLES.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Create a strong password"
              placeholderTextColor={COLORS.placeholder}
            />
          </View>

          <View style={COMMON_STYLES.inputGroup}>
            <Text style={COMMON_STYLES.label}>Confirm Password *</Text>
            <TextInput
              style={COMMON_STYLES.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="Re-enter password to confirm"
              placeholderTextColor={COLORS.placeholder}
            />
          </View>

          {Platform.OS === 'web' && (
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".png,.jpg,.jpeg,.pdf"
              onChange={(e: any) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 2.5 * 1024 * 1024) {
                    alert('File size exceeds the 2.5 MB limit. Please select a smaller document.');
                    return;
                  }
                  setAadhaarFile({
                    uri: URL.createObjectURL(file),
                    name: file.name,
                    type: file.type,
                    fileObj: file
                  });
                }
              }}
            />
          )}

          <View style={styles.uploadContainer}>
            <Text style={COMMON_STYLES.label}>Aadhaar Card Upload (PDF, PNG, JPG) *</Text>
            <TouchableOpacity
              style={[styles.uploadButton, aadhaarFile && styles.uploadButtonSuccess]}
              onPress={async () => {
                if (Platform.OS === 'web') {
                  fileInputRef.current?.click();
                } else {
                  try {
                    const result = await DocumentPicker.getDocumentAsync({
                      type: ['image/*', 'application/pdf'],
                      copyToCacheDirectory: true,
                    });
                    
                    if (!result.canceled && result.assets && result.assets.length > 0) {
                      const asset = result.assets[0];
                      if (asset.size && asset.size > 2.5 * 1024 * 1024) {
                        Alert.alert('File Too Large', 'Aadhaar document size exceeds the 2.5 MB limit. Please select a smaller document.');
                        return;
                      }
                      setAadhaarFile({
                        uri: asset.uri,
                        name: asset.name || 'aadhaar.jpg',
                        type: asset.mimeType || 'image/jpeg',
                        fileObj: null,
                        size: asset.size
                      } as any);
                    }
                  } catch (err) {
                    console.log('Error picking document:', err);
                    Alert.alert('Error', 'Failed to pick Aadhaar document.');
                  }
                }
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.uploadButtonText}>
                {aadhaarFile ? `✓ Selected: ${aadhaarFile.name}` : '📁 Choose Aadhaar File'}
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.uploadHelperText}>
              Max allowed file size: 2.5 MB (PDF, PNG, JPG)
            </Text>

            {aadhaarFile && (
              <Text style={styles.uploadSuccessDetail}>
                Size: {Math.round((aadhaarFile as any).size ? ((aadhaarFile as any).size / 1024) : (aadhaarFile.fileObj?.size ? (aadhaarFile.fileObj.size / 1024) : 0))} KB
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[COMMON_STYLES.button, loading && { opacity: 0.6 }]}
            onPress={requestSignupOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={COMMON_STYLES.buttonText}>Submit Registration</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginText}>
              Already have an account?{' '}
              <Text style={styles.loginLinkText}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* OTP Verification Modal */}
      <Modal
        visible={otpModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setOtpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Verify Email</Text>
              <TouchableOpacity onPress={() => setOtpModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalDivider} />

            <View style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>
                Please enter the 6-digit verification code sent to:{'\n'}
                <Text style={{ fontWeight: '800', color: COLORS.primary }}>{email.trim()}</Text>
              </Text>

              <View style={COMMON_STYLES.inputGroup}>
                <Text style={COMMON_STYLES.label}>Verification Code</Text>
                <TextInput
                  style={[COMMON_STYLES.input, styles.otpInput]}
                  value={otp}
                  onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="000000"
                  placeholderTextColor={COLORS.placeholder}
                />
              </View>

              <TouchableOpacity
                style={[COMMON_STYLES.button, { marginTop: 8 }, otpLoading && { opacity: 0.6 }]}
                onPress={handleRegister}
                disabled={otpLoading}
              >
                {otpLoading ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={COMMON_STYLES.buttonText}>Confirm & Register</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resendBtn}
                onPress={requestSignupOtp}
                disabled={otpLoading}
              >
                <Text style={styles.resendText}>Resend Verification Code</Text>
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
    padding: 24,
    paddingTop: 50,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoImage: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 3,
    borderColor: '#D4A017',
    backgroundColor: '#FFFFFF',
    marginBottom: 14,
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 14,
  },
  brandName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 3,
  },
  brandSub: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
    letterSpacing: 4,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    marginTop: 8,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#00',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  uploadContainer: {
    marginBottom: 20,
  },
  uploadHelperText: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  uploadButtonSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
    borderStyle: 'solid',
  },
  uploadButtonText: {
    color: COLORS.body,
    fontSize: 13,
    fontWeight: '700',
  },
  uploadSuccessDetail: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    paddingLeft: 4,
  },
  loginLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  loginText: {
    fontSize: 13,
    color: COLORS.muted,
  },
  loginLinkText: {
    color: COLORS.secondary,
    fontWeight: '700',
  },
  // Modal styling
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
});
