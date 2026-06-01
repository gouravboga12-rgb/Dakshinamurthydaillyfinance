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
  } | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  token: null,
  user: null,
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
    },
    loginFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    logout(state) {
      state.token = null;
      state.user = null;
      state.error = null;
    },
    updateProfile(state, action: PayloadAction<any>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    }
  }
});

export const { loginStart, loginSuccess, loginFailure, logout, updateProfile } = authSlice.actions;
export default authSlice.reducer;
