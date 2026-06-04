import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  token: string | null;
  user: {
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
  } | null;
  loading: boolean;
  error: string | null;
}

// Initial state reading from localStorage if on web
const getInitialToken = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem('customer-token');
  }
  return null;
};

const getInitialUser = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
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

const initialState: AuthState = {
  token: getInitialToken(),
  user: getInitialUser(),
  loading: false,
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
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('customer-token', action.payload.token);
        localStorage.setItem('customer-user', JSON.stringify(action.payload.user));
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
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('customer-token');
        localStorage.removeItem('customer-user');
      }
    },
    updateProfile(state, action: PayloadAction<any>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('customer-user', JSON.stringify(state.user));
        }
      }
    }
  }
});

export const { loginStart, loginSuccess, loginFailure, logout, updateProfile } = authSlice.actions;
export default authSlice.reducer;
