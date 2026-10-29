import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_TOKEN_KEY = '@customer_auth_token';
const STORAGE_USER_KEY = '@customer_auth_user';

export interface CustomerUser {
  id: string;
  full_name: string;
  mobile_number: string;
  email: string | null;
  role: string;
  status: string;
  occupation?: string;
  shop_name?: string;
  address?: string;
  avatar_url?: string;
}

interface AuthState {
  token: string | null;
  user: CustomerUser | null;
  loading: boolean;
  isRestoringSession: boolean;
  error: string | null;
}

// Initial state reading synchronously from localStorage if on web as an instant fallback
const getInitialWebToken = (): string | null => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem('customer-token');
  }
  return null;
};

const getInitialWebUser = (): CustomerUser | null => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
    const u = localStorage.getItem('customer-user');
    if (u) {
      try {
        return JSON.parse(u);
      } catch (e) {
        return null;
      }
    }
  }
  return null;
};

const webToken = getInitialWebToken();
const webUser = getInitialWebUser();

const initialState: AuthState = {
  token: webToken,
  user: webUser,
  loading: false,
  // If we already resolved credentials synchronously on web, session is restored immediately
  isRestoringSession: Platform.OS === 'web' ? false : true,
  error: null,
};

// Async Thunk to load session from AsyncStorage on app startup
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

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart(state) {
      state.loading = true;
      state.error = null;
    },
    loginSuccess(state, action: PayloadAction<{ token: string; user: CustomerUser }>) {
      state.loading = false;
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.error = null;

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
    logout(state) {
      state.token = null;
      state.user = null;
      state.error = null;
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('customer-token');
        localStorage.removeItem('customer-user');
      } else {
        AsyncStorage.multiRemove([STORAGE_TOKEN_KEY, STORAGE_USER_KEY]).catch(console.error);
      }
    },
    updateProfile(state, action: PayloadAction<Partial<CustomerUser>>) {
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

export const { loginStart, loginSuccess, loginFailure, logout, updateProfile } = authSlice.actions;
export default authSlice.reducer;
