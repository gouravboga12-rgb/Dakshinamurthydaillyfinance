# Session Persistence Implementation Plan (Stay Logged In)

## Overview
This document outlines the step-by-step implementation to ensure customer users remain **permanently logged in** to the **Dakshinamurthy Daily Ledger** mobile app until they explicitly click **"Sign Out of Account"** in their Profile.

---

## 1. Problem & Root Cause

### Symptoms
- When a user logs into the app on an Android/iOS device and minimizes the app, locks the phone, returns to the home screen, or reopens the app, they are immediately logged out.

### Technical Root Cause
- In `customer-mobile/src/store/authSlice.ts`, the app relies on `window.localStorage` (`typeof window !== 'undefined' && window.localStorage`).
- In React Native / mobile applications, `window.localStorage` **does not exist**.
- Consequently, the JWT token and user profile are stored **only in temporary device RAM (Redux state)**.
- Whenever Android backgrounds the app, frees memory, or the user exits and re-enters, the Redux store re-initializes with `token: null`.
- `AppNavigator.tsx` reads `token === null` and immediately navigates to `LoginScreen`.

---

## 2. Step-by-Step Implementation Guide

### Step 1: Install `@react-native-async-storage/async-storage`

Run in `customer-mobile/`:
```bash
npx expo install @react-native-async-storage/async-storage
```

---

### Step 2: Update `customer-mobile/src/store/authSlice.ts`

Add persistent storage helper methods using `AsyncStorage` (with fallback to `localStorage` for Web):

```typescript
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_TOKEN_KEY = '@customer_auth_token';
const STORAGE_USER_KEY = '@customer_auth_user';

// Async Thunk to load session on app startup
export const loadStoredSession = createAsyncThunk(
  'auth/loadStoredSession',
  async () => {
    try {
      let token: string | null = null;
      let userStr: string | null = null;

      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        token = localStorage.getItem('customer-token');
        userStr = localStorage.getItem('customer-user');
      } else {
        token = await AsyncStorage.getItem(STORAGE_TOKEN_KEY);
        userStr = await AsyncStorage.getItem(STORAGE_USER_KEY);
      }

      const user = userStr ? JSON.parse(userStr) : null;
      return { token, user };
    } catch (err) {
      console.error('Failed to load session from storage:', err);
      return { token: null, user: null };
    }
  }
);

// Async Thunk for explicit logout
export const performLogout = createAsyncThunk(
  'auth/performLogout',
  async () => {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('customer-token');
        localStorage.removeItem('customer-user');
      } else {
        await AsyncStorage.multiRemove([STORAGE_TOKEN_KEY, STORAGE_USER_KEY]);
      }
    } catch (err) {
      console.error('Failed to clear session storage:', err);
    }
  }
);

interface AuthState {
  token: string | null;
  user: any | null;
  loading: boolean;
  isRestoringSession: boolean;
  error: string | null;
}

const initialState: AuthState = {
  token: null,
  user: null,
  loading: false,
  isRestoringSession: true, // true until AsyncStorage check completes
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.loading = true;
      state.error = null;
    },
    loginSuccess(state, action: PayloadAction<{ token: string; user: any }>) {
      state.loading = false;
      state.token = action.payload.token;
      state.user = action.payload.user;

      // Save to persistent storage
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('customer-token', action.payload.token);
        localStorage.setItem('customer-user', JSON.stringify(action.payload.user));
      } else {
        AsyncStorage.setItem(STORAGE_TOKEN_KEY, action.payload.token).catch(console.error);
        AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(action.payload.user)).catch(console.error);
      }
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    updateProfile(state, action: PayloadAction<any>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('customer-user', JSON.stringify(state.user));
        } else {
          AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(state.user)).catch(console.error);
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadStoredSession.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isRestoringSession = false;
      })
      .addCase(loadStoredSession.rejected, (state) => {
        state.token = null;
        state.user = null;
        state.isRestoringSession = false;
      })
      .addCase(performLogout.fulfilled, (state) => {
        state.token = null;
        state.user = null;
        state.error = null;
      });
  }
});

export const { loginStart, loginSuccess, loginFailure, updateProfile } = authSlice.actions;
export default authSlice.reducer;
```

---

### Step 3: Rehydrate Session on App Start (`customer-mobile/App.tsx` or `AppNavigator.tsx`)

In `customer-mobile/src/navigation/AppNavigator.tsx`:
1. Dispatch `loadStoredSession()` when the app mounts.
2. While `isRestoringSession` is `true`, render a clean splash/loading indicator so the screen never blinks the login screen.

```typescript
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { loadStoredSession } from '../store/authSlice';

export default function AppNavigator() {
  const dispatch = useDispatch<AppDispatch>();
  const { token, isRestoringSession } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(loadStoredSession());
  }, [dispatch]);

  // Prevent UI flicker while reading AsyncStorage
  if (isRestoringSession) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#FFC800" />
      </View>
    );
  }

  return (
    <View style={styles.rootContainer}>
      <View style={styles.appContainer}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {token === null ? (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="MainTabs" component={TabNavigator} />
              {/* Other App Screens */}
            </>
          )}
        </Stack.Navigator>
      </View>
    </View>
  );
}
```

---

### Step 4: Update Logout Handler in `customer-mobile/src/screens/ProfileScreen.tsx`

Replace any direct `dispatch(logout())` with `dispatch(performLogout())`:

```typescript
import { performLogout } from '../store/authSlice';

const handleLogout = () => {
  Alert.alert(
    'Sign Out',
    'Are you sure you want to sign out of your ledger account?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          dispatch(performLogout());
        },
      },
    ]
  );
};
```

---

### Step 5: Add Android Back-Button Handling on Dashboard (`DashboardScreen.tsx`)

Prevent accidental exit when pressing the back button on the Home screen:

```typescript
import { BackHandler, ToastAndroid, Platform } from 'react-native';

useEffect(() => {
  if (Platform.OS !== 'android') return;

  let backPressCount = 0;
  const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
    if (backPressCount === 0) {
      backPressCount++;
      ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
      setTimeout(() => {
        backPressCount = 0;
      }, 2000);
      return true; // prevent default back exit
    }
    return false; // let Android exit the app
  });

  return () => backHandler.remove();
}, []);
```

---

## 3. Testing & Verification Checklist

- [ ] Log in with mobile number and password.
- [ ] Verify you land on the Dashboard.
- [ ] Force close / kill the app from Android Recent Apps.
- [ ] Re-open the app from the app launcher.
- [ ] **Expected result:** App opens directly to the Dashboard without prompting for login.
- [ ] Reboot the phone or minimize the app for >15 minutes.
- [ ] **Expected result:** User is still logged in.
- [ ] Go to Profile -> tap "Sign Out of Account".
- [ ] **Expected result:** User is logged out and returned to the Login screen.
