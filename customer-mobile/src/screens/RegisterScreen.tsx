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
} from 'react-native';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/authSlice';
import api from '../utils/api';
import COLORS, { COMMON_STYLES } from '../utils/theme';

export default function RegisterScreen({ navigation }: any) {
  const dispatch = useDispatch();

  const handleGuestAccess = () => {
    dispatch(loginSuccess({
      token: 'guest-mock-token-12345',
      user: {
        id: 'mock-customer-id-12345',
        full_name: fullName.trim() || 'Dakshinamurthy Customer',
        mobile_number: mobile.trim() || '7337401590',
        email: email.trim() || 'customer@gmail.com',
        role: 'customer',
        status: 'approved',
        occupation: occupation.trim() || 'Private employee',
        shop_name: shopName.trim() || 'Cognizant',
        address: address.trim() || 'Hyderabad'
      }
    }));
  };
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [occupation, setOccupation] = useState('');
  const [shopName, setShopName] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<any>(null);
  const [aadhaarFile, setAadhaarFile] = useState<{ uri: string; name: string; type: string; fileObj: any } | null>(null);

  const handleRegister = async () => {
    if (!fullName.trim() || !mobile.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Full Name, Mobile Number, and Password are required.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match. Please re-enter.');
      return;
    }
    if (mobile.length !== 10) {
      Alert.alert('Invalid Mobile', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!aadhaarFile) {
      Alert.alert('Missing Aadhaar', 'Please select and upload your Aadhaar Card document.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('full_name', fullName.trim());
      formData.append('mobile_number', mobile.trim());
      if (email.trim()) formData.append('email', email.trim());
      if (occupation.trim()) formData.append('occupation', occupation.trim());
      if (shopName.trim()) formData.append('shop_name', shopName.trim());
      if (address.trim()) formData.append('address', address.trim());
      formData.append('password', password.trim());
      formData.append('confirm_password', confirmPassword.trim());

      if (Platform.OS === 'web') {
        formData.append('aadhaar', aadhaarFile.fileObj);
      } else {
        formData.append('aadhaar', {
          uri: aadhaarFile.uri,
          name: aadhaarFile.name,
          type: aadhaarFile.type
        } as any);
      }

      await api.post('/auth/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert(
        'Registration Successful! 🎉',
        'Your account has been created successfully. You can now login with your mobile number and password.',
        [{ text: 'Login Now', onPress: () => navigation.navigate('Login') }]
      );
    } catch (err: any) {
      const message = err.response?.data?.error || 'Registration failed. Please try again.';
      Alert.alert('Registration Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: COLORS.primary }}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.headerContainer}>
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
          <Text style={COMMON_STYLES.label}>Email Address</Text>
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
            onPress={() => {
              if (Platform.OS === 'web') {
                fileInputRef.current?.click();
              } else {
                Alert.alert('Upload Document', 'Document picker is supported on web.');
              }
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.uploadButtonText}>
              {aadhaarFile ? `✓ Selected: ${aadhaarFile.name}` : '📁 Choose Aadhaar File'}
            </Text>
          </TouchableOpacity>
          {aadhaarFile && (
            <Text style={styles.uploadSuccessDetail}>
              Size: {Math.round(aadhaarFile.fileObj?.size ? (aadhaarFile.fileObj.size / 1024) : 0)} KB
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[COMMON_STYLES.button, loading && { opacity: 0.6 }]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={COMMON_STYLES.buttonText}>Submit Registration</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.guestButton}
          onPress={handleGuestAccess}
        >
          <Text style={styles.guestButtonText}>Explore as Guest (Skip Signup)</Text>
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
    shadowColor: '#000',
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
});
